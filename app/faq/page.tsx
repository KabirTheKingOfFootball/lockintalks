import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { FAQAssistant } from "@/components/faq-assistant";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about LockInTalks competitions, registration, payments, and certificates."
};

const faqs = [
  ["Who can participate?", "Kids and teenagers can join based on the age group listed for each competition."],
  ["Are competitions online?", "Yes. Registration, payment, live rounds, results, and certificate updates are handled online."],
  ["How do payments work?", "Payments use Razorpay Checkout. Registration is confirmed only after server-side verification."],
  ["Do competitions include cash prizes?", "Yes. Every competition includes cash prize opportunities. Exact prize details appear on the competition page when published."],
  ["Is age verification required?", "Yes. Accepted participants may be asked by email to submit proof of age before the competition begins."],
  ["Do students get certificates?", "Certificates are planned for completed competitions and will appear in the dashboard."],
  ["Can beginners join?", "Yes. LockInTalks is built to help first-time speakers practice with structure and confidence."]
];

export default function FAQPage() {
  return (
    <MotionShell className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">FAQ</p>
      <h1 className="text-4xl font-black sm:text-6xl">Questions Before the Spotlight</h1>
      <div className="mt-10">
        <FAQAssistant />
      </div>
      <div className="mt-10 grid gap-4">
        {faqs.map(([question, answer]) => (
          <Card key={question}>
            <div className="flex gap-3">
              <HelpCircle className="mt-1 shrink-0 text-[#d4af37]" />
              <div>
                <h2 className="text-xl font-black">{question}</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">{answer}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MotionShell>
  );
}
