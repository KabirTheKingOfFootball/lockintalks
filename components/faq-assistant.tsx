"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { faqCorpus, findFAQAnswer, normalizeFAQText } from "@/lib/faq/knowledge";

const suggestions = [
  "My child is 7. Can they join?",
  "I am shy. Is this okay?",
  "How do online competitions work?",
  "How are winners chosen?",
  "Do competitions have cash prizes?",
  "Is age proof required?",
  "What if payment is pending?",
  "What details are required?",
  "Do students get certificates?",
  "Who should I contact for help?"
];

export function FAQAssistant() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState(() => ({
    title: "Ask Before You Register",
    answer: "Ask me about age groups, registration, prizes, judging, payments, safety, or dashboard basics.",
    followUps: suggestions.slice(0, 4),
    isFallback: false
  }));
  const normalizedQuestion = useMemo(() => normalizeFAQText(question), [question]);

  function answerQuestion(value: string) {
    const result = findFAQAnswer(value);
    setReply(result);
    safeTrack("faq_question_submitted", { fallback: result.isFallback, title: result.title });
    safeTrack(result.isFallback ? "faq_fallback_served" : "faq_answer_served", { title: result.title });
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
          <p className="mt-2 text-sm leading-6 text-white/62">
            This assistant helps answer common questions using public LockInTalks information. It is not a human support agent. For payment, registration, or competition support, contact lockintalks@gmail.com.
          </p>
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
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]"><Sparkles size={14} /> {reply.title}</div>
            <div className="space-y-3">
              {reply.answer.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {(reply.answer.includes("lockintalks@gmail.com") || normalizedQuestion.includes("contact")) && (
              <a className="mt-3 inline-flex font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">Email lockintalks@gmail.com</a>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested follow-up questions">
            {reply.followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => handleSuggestion(followUp)}
                className="focus-ring rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-2 text-xs font-bold text-[#f7dc83] transition hover:border-[#d4af37]/55"
              >
                {followUp}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/45">
            Knowledge base: {faqCorpus.length} reviewed LockInTalks topics. No paid AI API is used for this assistant.
          </p>
        </div>
      </div>
    </Card>
  );
}

function safeTrack(event: string, properties: Record<string, string | boolean>) {
  try {
    track(event, properties);
  } catch {
    // Analytics should never break the FAQ assistant.
  }
}
