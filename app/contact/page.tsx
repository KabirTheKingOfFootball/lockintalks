import type { Metadata } from "next";
import { CreditCard, Mail, MessageCircleQuestion, PlayCircle, ShieldCheck, Trophy } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact LockInTalks for competition support, partnership inquiries, and student speaking questions."
};

export default function ContactPage() {
  return (
    <MotionShell className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8">
      <ContactForm />
      <div className="grid gap-5">
        <Card><Mail className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Support Email</h2><p className="mt-2 text-white/62">For support, questions, or competition help, contact <a className="font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a>.</p></Card>
        <Card><ShieldCheck className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Parent and Guardian Help</h2><p className="mt-2 text-white/62">Guardians can contact support for minor-related questions, age verification, privacy requests, account corrections, or competition safety concerns.</p></Card>
        <Card><CreditCard className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Payment and Refund Help</h2><p className="mt-2 text-white/62">Email us for payment status, duplicate payment, failed payment, refund, or Razorpay checkout questions.</p></Card>
        <Card><Trophy className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Competition Support</h2><p className="mt-2 text-white/62">Ask about registration, event timing, judging criteria, certificates, feedback, rewards, or dashboard status.</p></Card>
        <Card><PlayCircle className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">YouTube</h2><p className="mt-2 text-white/62">LockInTalks</p></Card>
        <Card><MessageCircleQuestion className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">FAQ Quick Links</h2><p className="mt-2 text-white/62">Competition rules, payment support, online round setup, parent guidance, age verification, and certificates.</p></Card>
      </div>
    </MotionShell>
  );
}
