import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, CalendarDays, Gavel, Mic2, Trophy, Users, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { Countdown } from "@/components/countdown";
import { getLiveCompetitionBySlug, getLiveCompetitions } from "@/lib/competitions";
import { formatInr, formatPrizePoolBadge } from "@/lib/rewards/prize-pool";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { competitions } = await getLiveCompetitions();
  return competitions.map((competition) => ({ slug: competition.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { competition } = await getLiveCompetitionBySlug(slug);
  if (!competition) return {};
  return {
    title: competition.name,
    description: competition.summary,
    openGraph: {
      title: `${competition.name} | LockInTalks`,
      description: competition.summary,
      images: ["/lockintalks-logo.png"]
    }
  };
}

export default async function CompetitionDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { competition } = await getLiveCompetitionBySlug(slug);
  if (!competition) notFound();

  return (
    <MotionShell>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.42fr] lg:px-8">
        <div>
          <div className={`mb-8 rounded-[8px] bg-gradient-to-br ${competition.accent} p-8 text-[#071b3b]`}>
            <div className="flex items-start justify-between gap-4">
              <Mic2 size={42} />
              <span className="rounded-full border border-[#071b3b]/20 bg-[#071b3b]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#071b3b]">{competition.displayStatus}</span>
            </div>
            <p className="mt-10 text-sm font-black uppercase tracking-[0.3em]">{competition.category}</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">{competition.name}</h1>
          </div>
          <p className="text-xl leading-9 text-white/74">{competition.description}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Info title="Rules" icon={<Gavel />} items={competition.rules} />
            <Info title="How Participants Will Be Judged" icon={<ClipboardCheck />} items={competition.criteria} />
            <Info title="Schedule" icon={<CalendarDays />} items={competition.schedule} />
            <Info title="Cash Prize Details" icon={<Trophy />} items={competition.prizes.length ? competition.prizes : ["Every competition includes cash prizes. Exact award details will be shared by LockInTalks before the event."]} />
            <Info title="Judges" icon={<Users />} items={competition.judges} />
          </div>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <Award className="mb-5 text-[#d4af37]" size={34} />
            <h2 className="text-2xl font-black">Registration</h2>
            <div className="mt-5 grid gap-3 text-sm text-white/68">
              <p><span className="font-bold text-white">Age Group:</span> {competition.ageGroup}</p>
              <p><span className="font-bold text-white">Date:</span> {competition.date}</p>
              <p><span className="font-bold text-white">Time:</span> {competition.time} {competition.timezone}</p>
              {competition.registrationDeadline && <p><span className="font-bold text-white">Registration Deadline:</span> {competition.registrationDeadline}</p>}
              <p><span className="font-bold text-white">Entry Fee:</span> {competition.fee}</p>
              <p className="flex items-center gap-2"><Clock3 size={16} className="text-[#d4af37]" /> Maximum Participants: {competition.maxParticipants}</p>
              <p className="flex items-center gap-2"><Trophy size={16} className="text-[#d4af37]" /> Top Performers Win Cash Awards</p>
            </div>
            {competition.prizePool.showBadge && (
              <div className="mt-5 rounded-[8px] border border-[#d4af37]/50 bg-[#d4af37]/15 p-3 text-sm font-black uppercase tracking-[0.14em] text-[#f7dc83] shadow-[0_0_28px_rgba(212,175,55,0.18)]">
                {formatPrizePoolBadge(competition.prizePool.amount)}
              </div>
            )}
            {competition.prizePool.enabled && (
              <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.045] p-4 text-xs leading-6 text-white/62">
                <p>The prize pool increases by {formatInr(competition.prizePool.perPaidParticipant * 5)} for every 5 successfully paid participants.</p>
                <p>Only successfully verified payments count toward the prize pool.</p>
                <p>1st Place: 45%, 2nd Place: 30%, 3rd Place: 25%. Prizes may be given as cash or Amazon gift cards.</p>
              </div>
            )}
            <div className="mt-5"><Countdown targetIso={competition.dateIso} /></div>
            <ButtonLink href={`/register/${competition.slug}`} className="mt-7 w-full">Register for This Competition</ButtonLink>
          </Card>
          <Card className="mt-5">
            <ShieldCheck className="mb-4 text-[#d4af37]" />
            <h2 className="text-xl font-black">Age Verification Is Required Before Participation</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Accepted participants may be asked to submit proof of age through email before the competition begins. Please use a valid email address. Age proof helps keep competition categories fair and trusted for students, parents, and schools.
            </p>
          </Card>
        </aside>
      </section>
    </MotionShell>
  );
}

function Info({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3 text-[#d4af37]">
        {icon}
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      <ul className="grid gap-3 text-sm leading-6 text-white/65">
        {items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" aria-hidden="true" /><span>{item}</span></li>)}
      </ul>
    </Card>
  );
}
