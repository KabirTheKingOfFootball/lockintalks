"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicCompetition } from "@/lib/competitions";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type RegistrationStep = "idle" | "creating" | "opening" | "verifying" | "success" | "failed";
type CheckoutErrorCode =
  | "AUTH_MISSING"
  | "REGISTRATION_CREATE_FAILED"
  | "ORDER_CREATE_FAILED"
  | "RAZORPAY_SCRIPT_FAILED"
  | "RAZORPAY_KEY_MISSING"
  | "RAZORPAY_OPEN_FAILED"
  | "VERIFY_FAILED";

type RegistrationCheckoutResponse = {
  ok?: boolean;
  errorCode?: CheckoutErrorCode | null;
  registrationId?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  originalAmount?: number;
  currency?: string;
  name?: string;
  description?: string;
  competitionName?: string;
  participantName?: string;
  entryFee?: string;
  paymentStatus?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  alreadyPaid?: boolean;
  redirectTo?: string;
  error?: string;
  loginTo?: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpaySuccessResponse) => void;
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailureResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

type CheckoutDebugState = {
  lastErrorCode: string | null;
  createCheckoutStatus: number | null;
  registrationIdExists: boolean;
  orderIdExists: boolean;
  amount: number | null;
  currency: string | null;
  keyIdConfigured: boolean;
  razorpayScriptLoaded: boolean;
  razorpayObjectExists: boolean;
  checkoutAttempted: boolean;
};

const initialDebugState: CheckoutDebugState = {
  lastErrorCode: null,
  createCheckoutStatus: null,
  registrationIdExists: false,
  orderIdExists: false,
  amount: null,
  currency: null,
  keyIdConfigured: false,
  razorpayScriptLoaded: false,
  razorpayObjectExists: false,
  checkoutAttempted: false
};

export function RegisterForm({
  competition,
  debug = false,
  authenticated = true
}: {
  competition: PublicCompetition;
  debug?: boolean;
  authenticated?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<CheckoutErrorCode | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("idle");
  const [form, setForm] = useState({ student: "", age: "", guardian: "", email: "", city: "", country: "" });
  const [debugState, setDebugState] = useState<CheckoutDebugState>(initialDebugState);

  useEffect(() => {
    let cancelled = false;

    loadRazorpayScript()
      .then(() => {
        if (cancelled) return;
        setDebugState((current) => ({
          ...current,
          razorpayScriptLoaded: true,
          razorpayObjectExists: Boolean(window.Razorpay)
        }));
        logCheckout("script_preload_complete", {
          slug: competition.slug,
          razorpayScriptLoaded: true,
          razorpayObjectExists: Boolean(window.Razorpay)
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDebugState((current) => ({
          ...current,
          razorpayScriptLoaded: false,
          razorpayObjectExists: Boolean(window.Razorpay)
        }));
        logCheckout("script_preload_failed", {
          slug: competition.slug,
          razorpayScriptLoaded: false,
          razorpayObjectExists: Boolean(window.Razorpay)
        });
      });

    return () => {
      cancelled = true;
    };
  }, [competition.slug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setErrorCode("");
    setMessage("");
    updateDebug({
      lastErrorCode: null,
      createCheckoutStatus: null,
      registrationIdExists: false,
      orderIdExists: false,
      amount: null,
      currency: null,
      keyIdConfigured: false,
      checkoutAttempted: false
    });

    const age = Number(form.age);
    if (!form.student.trim() || !form.guardian.trim() || !form.city.trim() || !form.country.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (!Number.isFinite(age) || age < 6 || age > 19) {
      setError("Student age must be between 6 and 19.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid guardian email.");
      return;
    }
    try {
      setIsSubmitting(true);
      setStep("creating");
      setMessage("Creating your registration...");
      track("registration_started", { competition: competition.slug });
      logCheckout("submit_started", {
        slug: competition.slug,
        authenticated
      });
      const response = await fetch("/api/registrations/create-checkout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionSlug: competition.slug,
          studentName: form.student.trim(),
          studentAge: age,
          guardianName: form.guardian.trim(),
          guardianEmail: form.email.trim(),
          city: form.city.trim(),
          country: form.country.trim()
        })
      });
      const result = await readJsonResponse<RegistrationCheckoutResponse>(response);
      updateDebug({
        createCheckoutStatus: response.status,
        registrationIdExists: Boolean(result.registrationId),
        orderIdExists: Boolean(result.orderId),
        amount: typeof result.amount === "number" ? result.amount : null,
        currency: result.currency || null,
        keyIdConfigured: Boolean(result.keyId)
      });
      logCheckout("create_checkout_response", {
        slug: competition.slug,
        authenticated,
        status: response.status,
        registrationIdExists: Boolean(result.registrationId),
        orderIdExists: Boolean(result.orderId),
        amount: result.amount || null,
        currency: result.currency || null,
        keyIdConfigured: Boolean(result.keyId)
      });

      if (response.status === 401) {
        track("register_clicked_logged_out", { competition: competition.slug });
        showError("AUTH_MISSING", result.error || "Please Log In or Create an Account Before Registering for a Competition.");
        router.push(result.loginTo || `/login?next=${encodeURIComponent(`/register/${competition.slug}`)}`);
        return;
      }

      if (response.status === 409 && result.redirectTo) {
        setMessage(result.error || "You already have a paid registration. Opening your dashboard...");
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      if (!response.ok || result.error || !result.registrationId) {
        const code = result.errorCode || (response.status >= 500 ? "ORDER_CREATE_FAILED" : "REGISTRATION_CREATE_FAILED");
        console.warn(`[LockInTalks registration checkout] Checkout creation failed. code=${code} status=${response.status} slug=${competition.slug}`);
        showError(code, result.error || "Registration could not be saved. Please try again.");
        setStep("failed");
        return;
      }

      if (!result.keyId || !result.orderId || !result.amount || !result.currency) {
        const code = !result.keyId ? "RAZORPAY_KEY_MISSING" : "ORDER_CREATE_FAILED";
        console.warn(`[LockInTalks registration checkout] Checkout payload incomplete. code=${code} slug=${competition.slug} registrationIdExists=${Boolean(result.registrationId)} orderIdExists=${Boolean(result.orderId)} amount=${result.amount || "missing"} currency=${result.currency || "missing"} keyIdConfigured=${Boolean(result.keyId)}`);
        showError(code, "Registration was saved, but secure payment could not open right now. Please use your dashboard to continue payment later.");
        setStep("failed");
        return;
      }

      track("registration_submitted", { competition: competition.slug });
      setStep("opening");
      setMessage("Opening secure payment...");
      try {
        await loadRazorpayScript();
      } catch {
        updateDebug({
          razorpayScriptLoaded: false,
          razorpayObjectExists: Boolean(window.Razorpay)
        });
        console.warn(`[LockInTalks registration checkout] Razorpay script failed. slug=${competition.slug}`);
        showError("RAZORPAY_SCRIPT_FAILED", "Razorpay Checkout could not load. Please refresh and try again.");
        setStep("failed");
        return;
      }

      updateDebug({
        razorpayScriptLoaded: true,
        razorpayObjectExists: Boolean(window.Razorpay)
      });
      logCheckout("script_loaded_before_open", {
        slug: competition.slug,
        razorpayScriptLoaded: true,
        razorpayObjectExists: Boolean(window.Razorpay)
      });

      if (!window.Razorpay) {
        console.warn(`[LockInTalks registration checkout] Razorpay object missing after script load. slug=${competition.slug}`);
        showError("RAZORPAY_OPEN_FAILED", "Razorpay Checkout did not open. Please refresh and try again.");
        setStep("failed");
        return;
      }

      let checkout: RazorpayCheckout;
      try {
        checkout = new window.Razorpay({
          key: result.keyId,
          amount: result.amount,
          currency: result.currency,
          name: result.name || "LockInTalks",
          description: result.description || result.competitionName || competition.name,
          order_id: result.orderId,
          prefill: result.prefill,
          theme: {
            color: "#D4AF37"
          },
          modal: {
            ondismiss: async () => {
              setStep("failed");
              setMessage("");
              setErrorCode("");
              setError("Payment was cancelled. Your seat is not confirmed yet. You can continue payment from your dashboard.");
              logCheckout("checkout_cancelled", {
                slug: competition.slug,
                registrationIdExists: true,
                orderIdExists: true
              });
              track("payment_failed", { provider: "razorpay", reason: "cancelled", source: "registration" });
              await markPaymentFailed(result.registrationId as string, "cancelled");
            }
          },
          handler: async (paymentResponse) => {
            logCheckout("checkout_success_returned", {
              slug: competition.slug,
              registrationIdExists: true,
              orderIdExists: Boolean(paymentResponse.razorpay_order_id)
            });
            await verifyPayment(result.registrationId as string, paymentResponse);
          }
        });
      } catch {
        console.warn(`[LockInTalks registration checkout] Razorpay constructor failed. slug=${competition.slug}`);
        showError("RAZORPAY_OPEN_FAILED", "Razorpay Checkout did not open. Please refresh and try again.");
        setStep("failed");
        return;
      }

      checkout.on("payment.failed", async (paymentResponse) => {
        console.warn(`[LockInTalks registration checkout] Payment failed. slug=${competition.slug} reason=${paymentResponse.error?.reason || "checkout_failed"}`);
        setStep("failed");
        setMessage("");
        setErrorCode("");
        setError(paymentResponse.error?.description || "Payment was not completed. Your registration is saved, but your seat is not confirmed yet. You can continue payment from your dashboard.");
        track("payment_failed", { provider: "razorpay", reason: paymentResponse.error?.reason || "checkout_failed", source: "registration" });
        await markPaymentFailed(result.registrationId as string, "failed");
      });

      track("payment_checkout_opened", { provider: "razorpay", source: "registration", currency: result.currency });
      try {
        updateDebug({ checkoutAttempted: true });
        logCheckout("checkout_open_attempted", {
          slug: competition.slug,
          registrationIdExists: true,
          orderIdExists: true,
          amount: result.amount,
          currency: result.currency,
          keyIdConfigured: true
        });
        checkout.open();
      } catch {
        console.warn(`[LockInTalks registration checkout] Razorpay open failed. slug=${competition.slug}`);
        showError("RAZORPAY_OPEN_FAILED", "Razorpay Checkout did not open. Please refresh and try again.");
        setStep("failed");
      }
    } catch (submitError) {
      console.warn(`[LockInTalks registration checkout] Unexpected registration error. slug=${competition.slug}`);
      showError("ORDER_CREATE_FAILED", getReadableError(submitError, "Registration is temporarily unavailable. Please try again."));
      setStep("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyPayment(registrationId: string, response: RazorpaySuccessResponse) {
    try {
      setStep("verifying");
      setMessage("Payment received. We are securely verifying your transaction...");
      setError("");
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      });
      const result = await readJsonResponse<{ ok?: boolean; status?: string; pending?: boolean; error?: string }>(verifyResponse);

      if (!verifyResponse.ok || !result.ok) {
        throw new Error(result.error || "Payment verification failed.");
      }

      track("payment_verified", { provider: "razorpay", source: "registration", status: result.status || "verified" });

      if (result.pending) {
        setStep("success");
        setMessage("Your payment is being confirmed securely. Please do not pay again. Your dashboard will update shortly.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setStep("success");
      setMessage("Registration confirmed. Your payment was verified successfully.");
      router.push("/payment/success");
      router.refresh();
    } catch (verifyError) {
      console.warn(`[LockInTalks registration checkout] Payment verification failed. slug=${competition.slug}`);
      setStep("failed");
      setMessage("");
      showError("VERIFY_FAILED", getReadableError(verifyError, "Payment verification failed. Your registration is saved, but your seat is not confirmed yet."));
      track("payment_failed", { provider: "razorpay", reason: "verification_failed", source: "registration" });
    }
  }

  const isBusy = isSubmitting || step === "creating" || step === "opening" || step === "verifying";

  function showError(code: CheckoutErrorCode, text: string) {
    setErrorCode(code);
    setError(text);
    updateDebug({ lastErrorCode: code });
  }

  function updateDebug(patch: Partial<CheckoutDebugState>) {
    setDebugState((current) => ({ ...current, ...patch }));
  }

  return (
    <form onSubmit={submit} className="glass rounded-[8px] p-6 sm:p-8">
      <h1 className="text-3xl font-black">Register for <span className="gold-text">{competition.name}</span></h1>
      <p className="mt-3 text-sm leading-6 text-white/62">Fill in the speaker details, then continue to the secure payment step. Top performers compete for cash awards, recognition, and confidence-building stage experience.</p>
      <div className="mt-5 rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 p-4 text-sm leading-6 text-[#f7dc83]">
        Participants below 18 should register with parent or guardian awareness or consent. Please enter accurate age and guardian details. Age proof may be requested before participation to keep categories fair. For help, contact{" "}
        <a className="font-bold text-white" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a>.
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white/80">Student Name<Input value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Age<Input inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian Name<Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian Email<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">City<Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Country / Nation<Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
      </div>
      {message && <p className="mt-4 rounded-[8px] border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-sm text-[#f7dc83]">{message}</p>}
      {error && (
        <div className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
          {errorCode && <p className="mb-1 font-black text-white">Error Code: {errorCode}</p>}
          <p>{error}</p>
        </div>
      )}
      {debug && <RegisterCheckoutDebugPanel slug={competition.slug} authenticated={authenticated} state={debugState} />}
      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={isBusy}>
        {step === "creating" && "Creating Registration..."}
        {step === "opening" && "Opening Secure Payment..."}
        {step === "verifying" && "Verifying Payment..."}
        {(step === "idle" || step === "failed" || step === "success") && "Register and Pay Securely"}
      </Button>
    </form>
  );
}

function RegisterCheckoutDebugPanel({
  slug,
  authenticated,
  state
}: {
  slug: string;
  authenticated: boolean;
  state: CheckoutDebugState;
}) {
  const rows: Array<[string, string]> = [
    ["slug", slug],
    ["authenticated", yesNo(authenticated)],
    ["last error code", state.lastErrorCode || "none"],
    ["create-checkout status", state.createCheckoutStatus === null ? "not called" : String(state.createCheckoutStatus)],
    ["registration id exists", yesNo(state.registrationIdExists)],
    ["order id exists", yesNo(state.orderIdExists)],
    ["amount", state.amount === null ? "none" : String(state.amount)],
    ["currency", state.currency || "none"],
    ["key id configured", yesNo(state.keyIdConfigured)],
    ["Razorpay script loaded", yesNo(state.razorpayScriptLoaded)],
    ["Razorpay object exists", yesNo(state.razorpayObjectExists)],
    ["checkout attempted", yesNo(state.checkoutAttempted)]
  ];

  return (
    <div className="mt-5 rounded-[8px] border border-white/15 bg-black/35 p-4 text-xs leading-6 text-white/70">
      <p className="mb-2 font-black uppercase tracking-[0.2em] text-[#d4af37]">Checkout Debug</p>
      <div className="grid gap-1 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <p key={label}>
            <span className="font-bold text-white/90">{label}:</span> {value}
          </p>
        ))}
      </div>
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

function logCheckout(stage: string, details: Record<string, string | number | boolean | null>) {
  console.info(`[LockInTalks registration checkout] ${stage}`, details);
}

async function loadRazorpayScript() {
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      return waitForRazorpayScript(existingScript, resolve, reject);
    }

    const script = document.createElement("script");
    script.dataset.lockintalksRazorpay = "loading";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      script.dataset.lockintalksRazorpay = "loaded";
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay Checkout script loaded without Razorpay object."));
    };
    script.onerror = () => {
      script.dataset.lockintalksRazorpay = "failed";
      reject(new Error("Could not load Razorpay Checkout."));
    };
    document.body.appendChild(script);
  });
}

function waitForRazorpayScript(script: HTMLScriptElement, resolve: () => void, reject: (error: Error) => void) {
  if (window.Razorpay) {
    script.dataset.lockintalksRazorpay = "loaded";
    resolve();
    return;
  }

  if (script.dataset.lockintalksRazorpay === "failed") {
    reject(new Error("Could not load Razorpay Checkout."));
    return;
  }

  const timeout = window.setTimeout(() => {
    reject(new Error("Timed out while loading Razorpay Checkout."));
  }, 15000);

  script.addEventListener(
    "load",
    () => {
      window.clearTimeout(timeout);
      script.dataset.lockintalksRazorpay = "loaded";
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay Checkout script loaded without Razorpay object."));
    },
    { once: true }
  );
  script.addEventListener(
    "error",
    () => {
      window.clearTimeout(timeout);
      script.dataset.lockintalksRazorpay = "failed";
      reject(new Error("Could not load Razorpay Checkout."));
    },
    { once: true }
  );
}

async function markPaymentFailed(registrationId: string, status: "failed" | "cancelled") {
  try {
    await fetch("/api/payments/failed", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, status })
    });
  } catch (error) {
    console.warn("[LockInTalks registration checkout] Could not record failed payment status:", error);
  }
}
