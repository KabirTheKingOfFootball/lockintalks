import type { Metadata } from "next";
import Image from "next/image";
import { Mic2, CalendarDays, Users, Wallet, Clock3, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { Countdown } from "@/components/countdown";
import { PosterBackdrop, PrizePoolPill } from "@/components/brand-visuals";
import { getLiveCompetitions } from "@/lib/competitions";
import { formatPrizePoolBadge } from "@/lib/rewards/prize-pool";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Explore LockInTalks online public speaking competitions for kids and teenagers."
};

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const { competitions, error } = await getLiveCompetitions();

  return (
    <MotionShell className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <PosterBackdrop compact />
      <div className="relative z-10 mx-auto max-w-7xl">
      <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_0.38fr] lg:items-end">
        <div className="max-w-3xl">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#071b3b]">Competitions</p>
        <h1 className="poster-title text-5xl font-black sm:text-7xl">Choose Your Speaking Event</h1>
        <p className="mt-5 text-lg leading-8 text-[#071b3b]/75">Age-grouped online events built for confidence, clarity, meaningful stage practice, and exciting cash prize opportunities.</p>
        </div>
        <div className="poster-panel rounded-[8px] p-4 text-sm leading-6">
          <p className="font-black text-[#071b3b]">New Here?</p>
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
            <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${competition.accent} p-6 text-[#071b3b]`}>
              {competition.imageUrl && (
                <>
                  <Image src={competition.imageUrl} alt={`${competition.name} competition banner`} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071b3b]/85 via-[#071b3b]/35 to-black/10" aria-hidden="true" />
                </>
              )}
              <div className={competition.imageUrl ? "relative z-10 text-white" : "relative z-10"}>
              <div className="flex items-center justify-between">
                <Mic2 size={34} />
                <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${competition.imageUrl ? "border-white/25 bg-black/30 text-white" : "border-[#071b3b]/20 bg-[#071b3b]/10 text-[#071b3b]"}`}>{competition.displayStatus}</span>
              </div>
              <p className="mt-7 text-2xl font-black">{competition.category}</p>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-black">{competition.name}</h2>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[#d4af37]">{competition.publicOfferLabel}</p>
              <p className="mt-3 text-sm leading-6 text-white/62">{competition.summary}</p>
              <div className="mt-5 grid gap-3 text-sm text-white/68">
                <span className="flex items-center gap-2"><Users size={16} className="text-[#d4af37]" /> {competition.ageGroup}</span>
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#d4af37]" /> {competition.date} | {competition.time} {competition.timezone}</span>
                <span className="flex items-center gap-2"><Wallet size={16} className="text-[#d4af37]" /> Entry Fee: {competition.fee}</span>
                <span className="flex items-center gap-2"><Clock3 size={16} className="text-[#d4af37]" /> Slots Remaining: {competition.slotsRemaining} / {competition.maxParticipants}</span>
                <span className="flex items-center gap-2"><Trophy size={16} className="text-[#d4af37]" /> Every Competition Includes Cash Prizes</span>
                <span className="flex items-center gap-2"><Trophy size={16} className="text-[#d4af37]" /> More participants = bigger prize pool</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/45">
                {competition.prizePoolContributionCopy}
              </p>
              {competition.prizePool.showBadge && (
                <PrizePoolPill className="mt-5 px-3 py-3 text-sm font-black uppercase tracking-[0.12em]">
                  {formatPrizePoolBadge(competition.prizePool.amount)}
                </PrizePoolPill>
              )}
              <div className="mt-5"><Countdown targetIso={competition.dateIso} /></div>
              <ButtonLink href={`/competitions/${competition.slug}`} className="mt-6 w-full">View Details</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
      )}
      </div>
    </MotionShell>
  );
}
