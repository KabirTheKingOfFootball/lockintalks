"use client";

import { useMemo, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const fallback = "I Can't Help With That Yet. Please Contact LockInTalks For More Assistance.";

const answers = [
  {
    keys: ["lockintalks", "platform"],
    answer: "LockInTalks is an online public speaking competition platform for kids and teenagers. Students build confidence, communication skills, and stage readiness through structured speaking events."
  },
  {
    keys: ["competition", "event", "public"],
    answer: "Public competitions are created by LockInTalks admins and appear on the website when they are live. Each event includes age group, date, time, entry fee, rules, judging criteria, and cash prize details."
  },
  {
    keys: ["register", "registration"],
    answer: "To register, students should log in or create an account, choose a live competition, fill in participant details, and continue to secure payment."
  },
  {
    keys: ["login", "signup", "account"],
    answer: "Students need a LockInTalks account so registrations, payments, dashboard updates, and certificates stay connected to the correct participant."
  },
  {
    keys: ["dashboard"],
    answer: "The dashboard shows registered competitions, payment history, upcoming event guidance, and certificate placeholders after login."
  },
  {
    keys: ["cash", "prize", "reward", "award"],
    answer: "Every competition includes cash prize opportunities. Exact cash prize details are shown on the competition page when entered by the LockInTalks admin team."
  },
  {
    keys: ["age", "proof", "verification"],
    answer: "Age verification may be required before participation. Accepted participants may be asked through email to submit proof of age so competition categories stay fair."
  },
  {
    keys: ["city", "country", "nation"],
    answer: "Registration asks for the participant's city and country or nation. This helps organize participant records and keep event information clear."
  },
  {
    keys: ["judge", "judging", "criteria", "score"],
    answer: "Judging criteria can include confidence, clarity, creativity, speech structure, stage presence, and time management. Each competition page shows its own criteria."
  },
  {
    keys: ["date", "time", "timezone", "ist"],
    answer: "Each competition page shows the competition date, time, and timezone. IST is used by default when no other timezone is listed."
  },
  {
    keys: ["payment", "pay", "razorpay", "upi", "card"],
    answer: "Payments use Razorpay Checkout. Registration payment is confirmed only after server-side verification, not just the browser success screen."
  },
  {
    keys: ["contact", "support", "help", "email"],
    answer: "For support, questions, or competition help, contact lockintalks@gmail.com."
  },
  {
    keys: ["safe", "safety", "trust", "parent"],
    answer: "LockInTalks is designed to be structured and parent-friendly, with clear rules, age groups, secure account sessions, and official email communication for important participation steps."
  }
];

export function FAQAssistant() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("Ask about competitions, registration, cash prizes, age verification, payment, or support.");
  const normalizedQuestion = useMemo(() => question.toLowerCase().trim(), [question]);

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answer = answers.find((item) => item.keys.some((key) => normalizedQuestion.includes(key)))?.answer;
    setReply(answer || fallback);
  }

  return (
    <Card className="mt-10">
      <div className="flex items-start gap-3">
        <Bot className="mt-1 shrink-0 text-[#d4af37]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">LockInTalks AI Assistant</p>
          <h2 className="mt-2 text-2xl font-black">Ask a Quick Question</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">This is a local FAQ helper, not a human support agent.</p>
          <form onSubmit={ask} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about registration, prizes, payment, or age proof" />
            <Button type="submit" className="gap-2"><Send size={16} /> Ask</Button>
          </form>
          <p className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/72">{reply}</p>
        </div>
      </div>
    </Card>
  );
}
