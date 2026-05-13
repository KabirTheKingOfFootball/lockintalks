import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, CalendarDays, Gavel, Mic2, Trophy, Users } from "lucide-react";
import { competitions, getCompetition } from "@/data/competitions";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";

export function generateStaticParams() {
  return competitions.map((competition) => ({ slug: competition.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = getCompetition(slug);
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
  const competition = getCompetition(slug);
  if (!competition) notFound();

  return (
    <MotionShell>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.42fr] lg:px-8">
        <div>
          <div className={`mb-8 rounded-[8px] bg-gradient-to-br ${competition.accent} p-8 text-[#071b3b]`}>
            <Mic2 size={42} />
            <p className="mt-10 text-sm font-black uppercase tracking-[0.3em]">{competition.category}</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">{competition.name}</h1>
          </div>
          <p className="text-xl leading-9 text-white/74">{competition.description}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Info title="Rules" icon={<Gavel />} items={competition.rules} />
            <Info title="Schedule" icon={<CalendarDays />} items={competition.schedule} />
            <Info title="Prize Information" icon={<Trophy />} items={competition.prizes} />
            <Info title="Judges" icon={<Users />} items={competition.judges} />
          </div>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <Award className="mb-5 text-[#d4af37]" size={34} />
            <h2 className="text-2xl font-black">Registration</h2>
            <div className="mt-5 grid gap-3 text-sm text-white/68">
              <p><span className="font-bold text-white">Age group:</span> {competition.ageGroup}</p>
              <p><span className="font-bold text-white">Date:</span> {competition.date}</p>
              <p><span className="font-bold text-white">Entry fee:</span> {competition.fee}</p>
            </div>
            <ButtonLink href={`/register/${competition.slug}`} className="mt-7 w-full">Register for this competition</ButtonLink>
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
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </Card>
  );
}
