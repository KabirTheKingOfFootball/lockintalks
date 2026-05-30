import type { Metadata } from "next";
import { Mic2, CalendarDays, Users, Wallet, Clock3, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { Countdown } from "@/components/countdown";
import { getLiveCompetitions } from "@/lib/competitions";
import { formatInr, formatPrizePoolBadge } from "@/lib/rewards/prize-pool";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Explore LockInTalks online public speaking competitions for kids and teenagers."
};

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const { competitions, error } = await getLiveCompetitions();

  return (
    <MotionShell className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_0.38fr] lg:items-end">
        <div className="max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Competitions</p>
        <h1 className="text-4xl font-black sm:text-6xl">Choose Your Speaking Event</h1>
        <p className="mt-5 text-lg leading-8 text-white/65">Age-grouped online events built for confidence, clarity, meaningful stage practice, and exciting cash prize opportunities.</p>
        </div>
        <div className="glass rounded-[8px] p-4 text-sm leading-6 text-white/65">
          <p className="font-bold text-white">New Here?</p>
          <p>Pick an event, register, pay securely, then join the live online stage from your dashboard.</p>
        </div>
      </div>
      {error && <p className="mb-6 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}
      {competitions.length === 0 ? (
        <Card className="text-center">
          <Mic2 className="mx-auto mb-4 text-[#d4af37]" size={34} />
          <h2 className="text-2xl font-black">No Live Competitions Yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/62">New speaking events will appear here as soon as an admin publishes them.</p>
        </Card>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => (
          <Card key={competition.slug} className="overflow-hidden p-0">
            <div className={`relative h-44 bg-gradient-to-br ${competition.accent} p-6 text-[#071b3b]`}>
              <div className="flex items-center justify-between">
                <Mic2 size={34} />
                <span className="rounded-full border border-[#071b3b]/20 bg-[#071b3b]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#071b3b]">{competition.displayStatus}</span>
              </div>
              <p className="mt-7 text-2xl font-black">{competition.category}</p>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-black">{competition.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">{competition.summary}</p>
              <div className="mt-5 grid gap-3 text-sm text-white/68">
                <span className="flex items-center gap-2"><Users size={16} className="text-[#d4af37]" /> {competition.ageGroup}</span>
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#d4af37]" /> {competition.date} | {competition.time} {competition.timezone}</span>
                <span className="flex items-center gap-2"><Wallet size={16} className="text-[#d4af37]" /> Entry Fee {competition.fee}</span>
                <span className="flex items-center gap-2"><Clock3 size={16} className="text-[#d4af37]" /> Maximum Participants: {competition.maxParticipants}</span>
                <span className="flex items-center gap-2"><Trophy size={16} className="text-[#d4af37]" /> Every Competition Includes Cash Prizes</span>
              </div>
              {competition.prizePool.showBadge && (
                <div className="mt-5 rounded-[8px] border border-[#d4af37]/50 bg-[#d4af37]/15 p-3 text-sm font-black uppercase tracking-[0.14em] text-[#f7dc83] shadow-[0_0_28px_rgba(212,175,55,0.18)]">
                  {formatPrizePoolBadge(competition.prizePool.amount)}
                </div>
              )}
              {competition.prizePool.enabled && (
                <p className="mt-3 text-xs leading-5 text-white/45">
                  Prize pool increases by {formatInr(competition.prizePool.perPaidParticipant * 5)} for every 5 successfully paid participants.
                </p>
              )}
              <div className="mt-5"><Countdown targetIso={competition.dateIso} /></div>
              <ButtonLink href={`/competitions/${competition.slug}`} className="mt-6 w-full">View Details</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
      )}
    </MotionShell>
  );
}
