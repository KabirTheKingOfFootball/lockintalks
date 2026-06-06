"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicCompetition } from "@/lib/competitions";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type RegistrationStep = "idle" | "creating" | "opening" | "verifying" | "success" | "failed";

type RegistrationCheckoutResponse = {
  ok?: boolean;
  registrationId?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  originalAmount?: number;
  currency?: string;
  name?: string;
  description?: string;
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

export function RegisterForm({ competition }: { competition: PublicCompetition }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("idle");
  const [form, setForm] = useState({ student: "", age: "", guardian: "", email: "", city: "", country: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

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

      if (response.status === 401) {
        track("register_clicked_logged_out", { competition: competition.slug });
        setError(result.error || "Please Log In or Create an Account Before Registering for a Competition.");
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
        console.error(`[LockInTalks registration] Save failed: ${result.error || response.statusText}`);
        setError(result.error || "Registration could not be saved. Please try again.");
        setStep("failed");
        return;
      }

      if (!result.keyId || !result.orderId || !result.amount || !result.currency) {
        setError("Registration was saved, but secure payment could not open right now. Please use your dashboard to continue payment later.");
        setStep("failed");
        return;
      }

      track("registration_submitted", { competition: competition.slug });
      setStep("opening");
      setMessage("Opening secure payment...");
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load. Please refresh and try again.");
      }

      const checkout = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        name: result.name || "LockInTalks",
        description: result.description || competition.name,
        order_id: result.orderId,
        prefill: result.prefill,
        theme: {
          color: "#D4AF37"
        },
        modal: {
          ondismiss: async () => {
            setStep("failed");
            setMessage("");
            setError("Payment was not completed. Your registration is saved, but your seat is not confirmed yet. You can continue payment from your dashboard.");
            track("payment_failed", { provider: "razorpay", reason: "cancelled", source: "registration" });
            await markPaymentFailed(result.registrationId as string, "cancelled");
          }
        },
        handler: async (paymentResponse) => {
          await verifyPayment(result.registrationId as string, paymentResponse);
        }
      });

      checkout.on("payment.failed", async (paymentResponse) => {
        console.warn(`[LockInTalks registration checkout] Payment failed: ${paymentResponse.error?.reason || paymentResponse.error?.description || "Unknown reason"}`);
        setStep("failed");
        setMessage("");
        setError(paymentResponse.error?.description || "Payment was not completed. Your registration is saved, but your seat is not confirmed yet. You can continue payment from your dashboard.");
        track("payment_failed", { provider: "razorpay", reason: paymentResponse.error?.reason || "checkout_failed", source: "registration" });
        await markPaymentFailed(result.registrationId as string, "failed");
      });

      track("payment_checkout_opened", { provider: "razorpay", source: "registration", currency: result.currency });
      checkout.open();
    } catch (submitError) {
      console.error("[LockInTalks registration] Unexpected registration error:", submitError);
      setError(getReadableError(submitError, "Registration is temporarily unavailable. Please try again."));
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
      console.error("[LockInTalks registration checkout] Payment verification failed:", verifyError);
      setStep("failed");
      setMessage("");
      setError(getReadableError(verifyError, "Payment verification failed. Your registration is saved, but your seat is not confirmed yet."));
      track("payment_failed", { provider: "razorpay", reason: "verification_failed", source: "registration" });
    }
  }

  const isBusy = isSubmitting || step === "creating" || step === "opening" || step === "verifying";

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
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={isBusy}>
        {step === "creating" && "Creating Registration..."}
        {step === "opening" && "Opening Secure Payment..."}
        {step === "verifying" && "Verifying Payment..."}
        {(step === "idle" || step === "failed" || step === "success") && "Register and Pay Securely"}
      </Button>
    </form>
  );
}

async function loadRazorpayScript() {
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });
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
