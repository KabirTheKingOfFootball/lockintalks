import type { Metadata } from "next";
import { Mic2, CalendarDays, Users, Wallet, Clock3 } from "lucide-react";
import { competitions } from "@/data/competitions";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { Countdown } from "@/components/countdown";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Explore LockInTalks online public speaking competitions for kids and teenagers."
};

export default function CompetitionsPage() {
  return (
    <MotionShell className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_0.38fr] lg:items-end">
        <div className="max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Competitions</p>
        <h1 className="text-4xl font-black sm:text-6xl">Choose your championship track.</h1>
        <p className="mt-5 text-lg leading-8 text-white/65">Age-grouped online events built for confidence, clarity, and unforgettable stage moments.</p>
        </div>
        <div className="glass rounded-[8px] p-4 text-sm leading-6 text-white/65">
          <p className="font-bold text-white">New here?</p>
          <p>Pick an event, register, pay securely, then join the live online stage from your dashboard.</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => (
          <Card key={competition.slug} className="overflow-hidden p-0">
            <div className={`relative h-44 bg-gradient-to-br ${competition.accent} p-6 text-[#071b3b]`}>
              <div className="flex items-center justify-between">
                <Mic2 size={34} />
                <StatusBadge status={competition.status} className="border-[#071b3b]/20 bg-[#071b3b]/10 text-[#071b3b]" />
              </div>
              <p className="mt-7 text-2xl font-black">{competition.category}</p>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-black">{competition.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">{competition.summary}</p>
              <div className="mt-5 grid gap-3 text-sm text-white/68">
                <span className="flex items-center gap-2"><Users size={16} className="text-[#d4af37]" /> {competition.ageGroup}</span>
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#d4af37]" /> {competition.date}</span>
                <span className="flex items-center gap-2"><Wallet size={16} className="text-[#d4af37]" /> Entry fee {competition.fee}</span>
                <span className="flex items-center gap-2"><Clock3 size={16} className="text-[#d4af37]" /> {competition.slotsRemaining} slots remaining</span>
              </div>
              <div className="mt-5"><Countdown targetIso={competition.dateIso} /></div>
              <ButtonLink href={`/competitions/${competition.slug}`} className="mt-6 w-full">View Details</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </MotionShell>
  );
}
