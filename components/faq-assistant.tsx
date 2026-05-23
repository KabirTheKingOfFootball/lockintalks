"use client";

import { useMemo, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const fallback = "I Can't Help With That Yet. Please Contact LockInTalks For More Assistance.";

const suggestions = [
  "Is LockInTalks good for a 7-year-old?",
  "Can shy students join?",
  "How do online competitions work?",
  "How are winners chosen?",
  "Do competitions have cash prizes?",
  "Is age proof required?",
  "How do payments work?",
  "Who should I contact for help?"
];

const knowledge = [
  {
    label: "What LockInTalks Is",
    terms: ["what is lockintalks", "lockintalks", "platform", "about"],
    answer: "LockInTalks is an online public speaking competition platform for young students and teens. It helps students practise speaking, build confidence, join structured competitions, and compete for recognition and cash prize opportunities."
  },
  {
    label: "Who It Is For",
    terms: ["who is it for", "who can join", "kids", "teen", "teenager", "student", "children"],
    answer: "LockInTalks is designed for young students and teenagers. Each competition has its own age group, so families should check the competition details before registering."
  },
  {
    label: "Younger Kids",
    priority: 8,
    terms: ["7", "seven", "young", "younger", "little kid", "small child", "age suitable", "age suitability"],
    answer: "LockInTalks is designed mainly for young students and teens. Younger children may be able to participate depending on the specific competition age group, with parent or guardian guidance. Please check the competition details or contact lockintalks@gmail.com."
  },
  {
    label: "Beginners",
    priority: 6,
    terms: ["beginner", "first time", "new speaker", "never spoken", "shy", "nervous", "confidence"],
    answer: "Yes. Beginners and shy students can join if the competition age group fits them. LockInTalks is built to make speaking practice structured, encouraging, and easier to approach."
  },
  {
    label: "Competitions",
    terms: ["competition", "event", "round", "public speaking", "speech", "debate", "storytelling"],
    answer: "Competitions are online speaking events with clear rules, age groups, date and time details, judging criteria, and registration steps. Public competitions appear on the website when the LockInTalks admin team marks them live."
  },
  {
    label: "Registration",
    terms: ["register", "registration", "sign up for competition", "join competition", "participant details"],
    answer: "To register, log in or create an account, choose a live competition, enter the participant details, and continue to payment. Registration asks for age, city, country or nation, and guardian contact details."
  },
  {
    label: "Login And Dashboard",
    terms: ["login", "log in", "signup", "sign up", "account", "dashboard"],
    answer: "Students use an account so registrations, payment status, event details, and certificates stay connected to the correct profile. After login, normal users go to the dashboard and admins go to the admin panel."
  },
  {
    label: "Cash Prizes",
    terms: ["cash", "prize", "reward", "award", "money", "winner prize"],
    answer: "Every LockInTalks competition includes cash prize opportunities. Exact prize details are shown on the competition page when published by the admin team."
  },
  {
    label: "Age Verification",
    terms: ["age proof", "age verification", "proof of age", "birth certificate", "verify age"],
    answer: "Age verification may be required before participation. Accepted participants may be asked through email to submit proof of age so age categories stay fair and trusted."
  },
  {
    label: "Date And Time",
    terms: ["date", "time", "timezone", "ist", "when", "schedule", "deadline"],
    answer: "Each competition page shows the competition date, time, timezone, countdown, and registration deadline when available. IST is used by default unless another timezone is listed."
  },
  {
    label: "Judging",
    terms: ["judge", "judging", "criteria", "score", "winner", "chosen", "how winners"],
    answer: "Winners are chosen using the judging criteria listed on the competition page. Criteria may include confidence, clarity, creativity, speech structure, stage presence, and time management."
  },
  {
    label: "Payment",
    terms: ["payment", "pay", "razorpay", "upi", "card", "wallet", "netbanking"],
    answer: "Payments use Razorpay Checkout. A registration is treated as confirmed only after server-side payment verification, which helps protect students and parents from false payment status."
  },
  {
    label: "Refunds",
    terms: ["refund", "cancel", "cancellation", "money back"],
    answer: "A public refund policy is not listed yet. For refund or cancellation questions, contact lockintalks@gmail.com with the participant name and competition details."
  },
  {
    label: "Certificates",
    terms: ["certificate", "certificates", "recognition", "proof of participation"],
    answer: "Certificates are planned for completed competitions and appear as a dashboard section. Availability can depend on the event and results process."
  },
  {
    label: "Safety And Trust",
    terms: ["safe", "safety", "trust", "parent", "guardian", "school", "secure"],
    answer: "LockInTalks is designed to feel structured and parent-friendly, with clear event information, guardian email details, age verification when needed, secure sessions, and server-verified payments."
  },
  {
    label: "Contact",
    terms: ["contact", "support", "help", "email", "problem", "question"],
    answer: "For support, questions, or competition help, contact lockintalks@gmail.com."
  }
];

export function FAQAssistant() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("Ask me about age groups, registration, prizes, judging, payments, safety, or dashboard basics.");
  const normalizedQuestion = useMemo(() => normalize(question), [question]);

  function answerQuestion(value: string) {
    const normalized = normalize(value);
    if (!normalized) {
      setReply("Ask a LockInTalks question and I will try to help.");
      return;
    }

    setReply(findAnswer(normalized));
  }

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    answerQuestion(question);
  }

  function handleSuggestion(value: string) {
    setQuestion(value);
    answerQuestion(value);
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" aria-hidden="true" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 text-[#d4af37]">
          <Bot />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">LockInTalks AI Assistant</p>
          <h2 className="mt-2 text-3xl font-black">Ask Before You Register</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">This is a fast local FAQ assistant, not a human support agent. It uses public LockInTalks information only.</p>
          <form onSubmit={ask} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Is LockInTalks friendly for a 7-year-old?" />
            <Button type="submit" className="gap-2"><Send size={16} /> Ask</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="focus-ring rounded-full border border-white/12 bg-white/[0.055] px-3 py-2 text-xs font-bold text-white/72 transition hover:border-[#d4af37]/45 hover:text-[#f7dc83]"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-[8px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-7 text-white/74">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]"><Sparkles size={14} /> Answer</div>
            <p>{reply}</p>
            {(reply.includes("lockintalks@gmail.com") || normalizedQuestion.includes("contact")) && (
              <a className="mt-3 inline-flex font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">Email lockintalks@gmail.com</a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function findAnswer(normalizedQuestion: string) {
  const unrelated = ["weather", "movie", "song", "game cheat", "hack", "password", "crypto", "stock"];
  if (unrelated.some((term) => normalizedQuestion.includes(term))) return fallback;

  let best = { score: 0, answer: fallback };

  for (const item of knowledge) {
    const termScore = item.terms.reduce((total, term) => {
      if (normalizedQuestion.includes(term)) return total + term.split(" ").length + 1;
      return total;
    }, 0);
    const score = termScore > 0 ? termScore + (item.priority || 0) : 0;

    if (score > best.score) {
      best = { score, answer: item.answer };
    }
  }

  return best.score > 0 ? best.answer : fallback;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
