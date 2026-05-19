"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Landmark, Smartphone, WalletCards, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";
import { getCompetitionBySlug } from "@/lib/registrations";

type PaymentStep = "idle" | "creating" | "checkout" | "verifying" | "success" | "failed";

type CreateOrderResponse = {
  error?: string;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  registrationId: string;
  prefill?: {
    name?: string;
    email?: string;
  };
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

const paymentMethods: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Smartphone, label: "UPI" },
  { icon: CreditCard, label: "Cards" },
  { icon: Landmark, label: "Netbanking" },
  { icon: WalletCards, label: "Wallets" }
];

export function PaymentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const competition = getCompetitionBySlug(params.get("competition"));
  const registrationId = params.get("registration");
  const [error, setError] = useState("");
  const [step, setStep] = useState<PaymentStep>("idle");

  async function startPayment() {
    setError("");

    if (!registrationId) {
      setError("Missing registration id. Please register for a competition before paying.");
      return;
    }

    try {
      setStep("creating");
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load. Please refresh and try again.");
      }

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId })
      });
      const order = await readJsonResponse<CreateOrderResponse>(orderResponse);

      if (!orderResponse.ok || order.error) {
        throw new Error(order.error || "Could not create payment order.");
      }

      setStep("checkout");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: {
          color: "#D4AF37"
        },
        modal: {
          ondismiss: async () => {
            setStep("failed");
            setError("Payment was cancelled. You can try again when ready.");
            await markPaymentFailed(registrationId, "cancelled");
          }
        },
        handler: async (response) => {
          await verifyPayment(order.registrationId, response);
        }
      });

      checkout.on("payment.failed", async (response) => {
        console.warn(`[LockInTalks Razorpay Checkout] Payment failed: ${response.error?.reason || response.error?.description || "Unknown reason"}`);
        setStep("failed");
        setError(response.error?.description || "Payment failed. Please try again.");
        await markPaymentFailed(registrationId, "failed");
      });

      checkout.open();
    } catch (paymentError) {
      console.error("[LockInTalks Razorpay Checkout] Could not start payment:", paymentError);
      setStep("failed");
      setError(getReadableError(paymentError, "Could not start Razorpay payment."));
    }
  }

  async function verifyPayment(currentRegistrationId: string, response: RazorpaySuccessResponse) {
    try {
      setStep("verifying");
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: currentRegistrationId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      });
      const result = await readJsonResponse<{ ok?: boolean; error?: string }>(verifyResponse);

      if (!verifyResponse.ok || !result.ok) {
        throw new Error(result.error || "Payment verification failed.");
      }

      setStep("success");
      router.push("/payment/success");
      router.refresh();
    } catch (verifyError) {
      console.error("[LockInTalks Razorpay Checkout] Payment verification failed:", verifyError);
      setStep("failed");
      setError(getReadableError(verifyError, "Payment verification failed."));
    }
  }

  const isBusy = step === "creating" || step === "checkout" || step === "verifying";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.55fr]">
      <div className="glass rounded-[8px] p-6 sm:p-8">
        <h1 className="text-3xl font-black">Secure Payment</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Razorpay Checkout supports UPI, cards, netbanking, and wallets. LockInTalks confirms your registration only after server-side signature verification.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {paymentMethods.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-[8px] border border-white/12 bg-white/[0.05] p-4 text-center">
              <Icon className="mx-auto mb-3 text-[#d4af37]" />
              <span className="text-sm font-bold">{label}</span>
            </div>
          ))}
        </div>
        {step !== "idle" && (
          <p className="mt-5 rounded-[8px] border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-sm text-[#f7dc83]">
            {step === "creating" && "Creating secure Razorpay order..."}
            {step === "checkout" && "Razorpay Checkout is open. Complete payment in the secure popup."}
            {step === "verifying" && "Verifying payment securely on the server..."}
            {step === "success" && "Payment verified successfully."}
            {step === "failed" && "Payment was not completed."}
          </p>
        )}
        {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        <Button type="button" onClick={startPayment} className="mt-6 w-full" disabled={isBusy}>
          {isBusy ? "Processing..." : `Pay ${competition.fee}`}
        </Button>
      </div>
      <aside className="glass rounded-[8px] p-6">
        <CheckCircle2 className="mb-5 text-[#d4af37]" size={34} />
        <h2 className="text-2xl font-black">Order Summary</h2>
        <div className="mt-6 grid gap-4 text-sm text-white/68">
          <p><span className="font-bold text-white">Competition:</span> {competition.name}</p>
          <p><span className="font-bold text-white">Date:</span> {competition.date}</p>
          <p><span className="font-bold text-white">Entry fee:</span> {competition.fee}</p>
          <p><span className="font-bold text-white">Gateway:</span> Razorpay Checkout</p>
        </div>
      </aside>
    </div>
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, status })
    });
  } catch (error) {
    console.warn("[LockInTalks Razorpay Checkout] Could not record failed payment status:", error);
  }
}
