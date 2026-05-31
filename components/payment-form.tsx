"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { CheckCircle2, CreditCard, Landmark, Smartphone, WalletCards, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type PaymentStep = "idle" | "creating" | "checkout" | "verifying" | "pending" | "success" | "failed";

type PaymentSummary = {
  competitionName: string;
  competitionDate: string;
  entryFee: string;
  feeAmount: number;
  availablePoints: number;
  maxUsablePoints: number;
  previouslyAppliedPoints: number;
};

type PaymentConfig = {
  checkoutReady: boolean;
  webhookReady: boolean;
  keyMode: string;
};

type CreateOrderResponse = {
  error?: string;
  keyId: string;
  orderId: string;
  amount: number;
  originalAmount?: number;
  currency: string;
  lockInPoints?: {
    availablePoints: number;
    maxUsablePoints: number;
    appliedPoints: number;
    discountAmountPaise: number;
    payableAmountPaise: number;
  };
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

export function PaymentForm({ registrationId, summary, paymentConfig }: { registrationId: string | null; summary: PaymentSummary | null; paymentConfig: PaymentConfig }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<PaymentStep>("idle");
  const [pointsToApply, setPointsToApply] = useState(summary?.previouslyAppliedPoints || 0);
  const availablePoints = Math.max(0, Math.floor(Number(summary?.availablePoints || 0)));
  const maxUsablePoints = Math.min(availablePoints, Math.max(0, Math.floor(Number(summary?.maxUsablePoints || 0))));
  const appliedPointsPreview = Math.min(Math.max(0, Math.floor(Number(pointsToApply) || 0)), maxUsablePoints);
  const discountPreview = appliedPointsPreview * 100;
  const finalAmountPreview = Math.max(0, Number(summary?.feeAmount || 0) - discountPreview);
  const paymentUnavailable = !paymentConfig.checkoutReady;

  async function startPayment() {
    setError("");
    setMessage("");

    if (paymentUnavailable) {
      setError("Payments are not fully configured yet. Please contact lockintalks@gmail.com or try again later.");
      return;
    }

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

      track("payment_order_create_started", { provider: "razorpay" });
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, lockInPointsToApply: appliedPointsPreview })
      });
      const order = await readJsonResponse<CreateOrderResponse>(orderResponse);

      if (!orderResponse.ok || order.error) {
        throw new Error(order.error || "Could not create payment order.");
      }

      track("payment_order_created", { provider: "razorpay", currency: order.currency });
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
            setError("Payment was not completed. No registration seat has been confirmed yet. You can try again safely.");
            track("payment_failed", { provider: "razorpay", reason: "cancelled" });
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
        setError(response.error?.description || "Payment was not completed. No registration seat has been confirmed yet. You can try again safely.");
        track("payment_failed", { provider: "razorpay", reason: response.error?.reason || "checkout_failed" });
        await markPaymentFailed(registrationId, "failed");
      });

      track("payment_checkout_opened", { provider: "razorpay" });
      checkout.open();
    } catch (paymentError) {
      console.error("[LockInTalks Razorpay Checkout] Could not start payment:", paymentError);
      setStep("failed");
      setError(getReadableError(paymentError, "Could not start Razorpay payment."));
      track("payment_failed", { provider: "razorpay", reason: "order_start_failed" });
    }
  }

  async function verifyPayment(currentRegistrationId: string, response: RazorpaySuccessResponse) {
    try {
      setStep("verifying");
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: currentRegistrationId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      });
      const result = await readJsonResponse<{ ok?: boolean; status?: string; pending?: boolean; error?: string }>(verifyResponse);

      if (!verifyResponse.ok || !result.ok) {
        throw new Error(result.error || "Payment verification failed.");
      }

      track("payment_verified", { provider: "razorpay", status: result.status || "verified" });

      if (result.pending) {
        setStep("pending");
        setMessage("Your payment is still being confirmed. Please do not pay again right now. If this does not update shortly, contact lockintalks@gmail.com.");
        return;
      }

      setStep("success");
      track("payment_captured", { provider: "razorpay" });
      router.push("/payment/success");
      router.refresh();
    } catch (verifyError) {
      console.error("[LockInTalks Razorpay Checkout] Payment verification failed:", verifyError);
      setStep("failed");
      setError(getReadableError(verifyError, "Payment verification failed."));
      track("payment_failed", { provider: "razorpay", reason: "verification_failed" });
    }
  }

  const isBusy = step === "creating" || step === "checkout" || step === "verifying";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.55fr]">
      <div className="glass rounded-[8px] p-6 sm:p-8">
        <h1 className="text-3xl font-black">Secure Payment</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Razorpay Checkout supports UPI, cards, netbanking, and wallets. Your registration seat is reserved temporarily while payment is completed securely.
        </p>
        {paymentUnavailable && (
          <p className="mt-5 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm leading-6 text-red-100">
            Payments are not fully configured yet. Please contact <a className="font-bold text-white" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a> or try again later.
          </p>
        )}
        {paymentConfig.checkoutReady && !paymentConfig.webhookReady && (
          <p className="mt-5 rounded-[8px] border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-sm leading-6 text-[#f7dc83]">
            Payments can open, but final confirmation may take longer while webhook setup is being completed.
          </p>
        )}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {paymentMethods.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-[8px] border border-white/12 bg-white/[0.05] p-4 text-center">
              <Icon className="mx-auto mb-3 text-[#d4af37]" />
              <span className="text-sm font-bold">{label}</span>
            </div>
          ))}
        </div>
        {summary && (
          <div className="mt-6 rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#f7dc83]">Lock-in Points</p>
                <p className="mt-1 text-xs leading-5 text-white/58">
                  Available: {availablePoints} points. You can use up to {maxUsablePoints} points on this checkout. 1 point = INR 1 discount.
                </p>
              </div>
              <label className="grid gap-2 text-xs font-bold text-white/72 sm:w-44">
                Points To Apply
                <Input
                  min={0}
                  max={maxUsablePoints}
                  type="number"
                  value={pointsToApply}
                  onChange={(event) => setPointsToApply(Number(event.target.value))}
                  disabled={isBusy || maxUsablePoints === 0}
                />
              </label>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-white/68 sm:grid-cols-3">
              <p><span className="font-bold text-white">Discount:</span> {formatPaise(discountPreview)}</p>
              <p><span className="font-bold text-white">Applied:</span> {appliedPointsPreview} points</p>
              <p><span className="font-bold text-white">Final Payable:</span> {formatPaise(finalAmountPreview)}</p>
            </div>
          </div>
        )}
        {step !== "idle" && (
          <p className="mt-5 rounded-[8px] border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-sm text-[#f7dc83]">
            {step === "creating" && "Creating secure Razorpay order..."}
            {step === "checkout" && "Razorpay Checkout is open. Complete payment in the secure popup."}
            {step === "verifying" && "Payment received. We are securely verifying your transaction. This usually takes a few seconds."}
            {step === "pending" && "Your payment is still being confirmed. Please do not pay again right now."}
            {step === "success" && "Registration confirmed. Your payment was verified successfully and your seat is now secured."}
            {step === "failed" && "Payment was not completed. No registration seat has been confirmed yet."}
          </p>
        )}
        {message && <p className="mt-4 rounded-[8px] border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-sm text-[#f7dc83]">{message}</p>}
        {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        <Button type="button" onClick={startPayment} className="mt-6 w-full" disabled={isBusy || paymentUnavailable}>
          {isBusy ? "Processing..." : `Pay ${summary ? formatPaise(finalAmountPreview) : "now"}`}
        </Button>
      </div>
      <aside className="glass rounded-[8px] p-6">
        <CheckCircle2 className="mb-5 text-[#d4af37]" size={34} />
        <h2 className="text-2xl font-black">Order Summary</h2>
        <div className="mt-6 grid gap-4 text-sm text-white/68">
          <p><span className="font-bold text-white">Competition:</span> {summary?.competitionName || "Registration selected"}</p>
          <p><span className="font-bold text-white">Date:</span> {summary?.competitionDate || "See competition details"}</p>
          <p><span className="font-bold text-white">Entry Fee:</span> {summary?.entryFee || "Calculated at Checkout"}</p>
          {summary && <p><span className="font-bold text-white">Lock-in Points Discount:</span> {formatPaise(discountPreview)}</p>}
          {summary && <p><span className="font-bold text-white">Final Payable:</span> {formatPaise(finalAmountPreview)}</p>}
          <p><span className="font-bold text-white">Gateway:</span> Razorpay Checkout</p>
        </div>
      </aside>
    </div>
  );
}

function formatPaise(amountPaise: number) {
  return `INR ${(Math.max(0, Math.floor(Number(amountPaise) || 0)) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
    console.warn("[LockInTalks Razorpay Checkout] Could not record failed payment status:", error);
  }
}
