import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your LockInTalks registration payment was verified and captured successfully."
};

export default function PaymentSuccessPage() {
  return (
    <MotionShell className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="glass rounded-[8px] p-8 sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37] shadow-[0_0_42px_rgba(212,175,55,0.28)]">
          <CheckCircle2 size={46} />
        </div>
        <p className="mb-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]"><Sparkles size={16} /> Locked in</p>
        <h1 className="text-4xl font-black sm:text-6xl">Registration Confirmed</h1>
        <p className="mx-auto mt-5 max-w-xl text-white/66">Your payment was verified successfully and your seat is now secured. Event details, room links, and preparation instructions will be shared by email.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/dashboard">Go to Dashboard</ButtonLink>
          <ButtonLink href="/competitions" variant="glass">Explore More</ButtonLink>
        </div>
      </div>
    </MotionShell>
  );
}
