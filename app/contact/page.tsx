import type { Metadata } from "next";
import { Camera, Mail, MessageCircleQuestion } from "lucide-react";
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
        <Card><Mail className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Email</h2><p className="mt-2 text-white/62">hello@lockintalks.com</p></Card>
        <Card><Camera className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">Instagram</h2><p className="mt-2 text-white/62">@lockintalks</p></Card>
        <Card><MessageCircleQuestion className="mb-4 text-[#d4af37]" /><h2 className="text-xl font-black">FAQ Quick Links</h2><p className="mt-2 text-white/62">Competition rules, payment support, online round setup, certificates.</p></Card>
      </div>
    </MotionShell>
  );
}
