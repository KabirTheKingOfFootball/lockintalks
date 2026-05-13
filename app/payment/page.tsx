import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentForm } from "@/components/payment-form";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your LockInTalks competition registration payment."
};

export default function PaymentPage() {
  return (
    <MotionShell className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="glass rounded-[8px] p-8">Loading checkout...</div>}>
        <PaymentForm />
      </Suspense>
    </MotionShell>
  );
}
