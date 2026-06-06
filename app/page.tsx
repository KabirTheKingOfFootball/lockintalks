import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Crown, Globe2, Mic2, ShieldCheck, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell, Reveal } from "@/components/motion-shell";
import { Section } from "@/components/section";
import { PosterBackdrop, PosterHeroArt, PrizePoolPill, RedHatMark } from "@/components/brand-visuals";
import { getLiveCompetitions } from "@/lib/competitions";
import { formatPrizePoolBadge } from "@/lib/rewards/prize-pool";

const reasons = [
  { icon: ShieldCheck, title: "Improve Confidence", text: "Practice structured speaking in a supportive, high-standard environment." },
  { icon: Globe2, title: "Join Online Events", text: "Take part in organized speaking formats designed for students." },
  { icon: Mic2, title: "Build Communication Skills", text: "Learn clarity, persuasion, storytelling, and live delivery." },
  { icon: Award, title: "Compete for Rewards", text: "Every competition includes cash prize opportunities along with recognition and feedback when available." }
];

const categories = ["Debate Battles", "Storytelling", "Motivational Speaking", "Extempore", "Speech Challenges", "Team Speaking"];
const steps = ["Sign Up", "Choose Competition", "Pay Registration Fee", "Compete Online", "Get Results & Certificates"];
const faqs = [
  ["Who can join LockInTalks?", "Kids and teenagers can join age-grouped online competitions from anywhere with a stable internet connection."],
  ["Are competitions fully online?", "Yes. Registration, payment, live rounds, judging, and certificate updates are handled online."],
  ["Do students receive feedback?", "Some events include judge notes or a scorecard so students can keep improving after the event."],
  ["How are payments handled?", "Payments are processed through a secure checkout flow and verified on the server before registration is confirmed."]
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { competitions } = await getLiveCompetitions(4);

  return (
    <MotionShell>
      <section className="relative overflow-hidden">
        <PosterBackdrop />
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#071b3b]/15 bg-white/80 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#071b3b] shadow-[0_14px_35px_rgba(7,27,59,0.14)] sm:text-xs sm:tracking-[0.22em]">
              <Trophy size={16} className="shrink-0 text-[#d49a22]" />
              <span className="min-w-0 truncate"><span className="hidden sm:inline">Global </span>Youth Speaking Competitions</span>
              <RedHatMark className="hidden scale-50 sm:inline-block" />
            </div>
            <h1 className="poster-title max-w-4xl text-[clamp(2.65rem,11vw,7rem)] font-black leading-[0.9] sm:text-8xl lg:text-9xl">
              LockInTalks
            </h1>
            <p className="mt-4 max-w-2xl text-2xl font-black leading-8 text-[#071b3b]">
              Speak. Perform. Inspire.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#071b3b]/78">
              Online speaking competitions for kids and teens to build confidence, creativity, communication, and stage presence.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/competitions" className="gap-2">Explore Competitions <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/signup" variant="glass">Register Now</ButtonLink>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-4">
              {["Cash Prizes", "Online Events", "Certificates", "Feedback"].map((item) => (
                <div key={item} className="poster-panel rounded-[8px] p-3 text-center text-sm font-black">{item}</div>
              ))}
            </div>
          </div>
          <div className="relative z-10">
            <PosterHeroArt />
          </div>
        </div>
      </section>

      <Section eyebrow="What Is LockInTalks?" title={<>A Premium Online Arena for Young Voices</>}>
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass rounded-[8px] p-8">
              <p className="text-xl leading-9 text-white/76">
                LockInTalks combines the focus of a competition with the care of a learning environment. Students join age-appropriate events, speak online, and develop clarity, confidence, and communication habits they can use beyond the stage.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {["Live Online Rounds", "Clear Event Guidelines", "Certificates & Recognition"].map((item) => (
                <div key={item} className="rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 p-5 font-bold text-[#f7dc83]">{item}</div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section eyebrow="Why Join?" title={<>Confidence, Skill, and Recognition in One Structured Platform</>}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <Reveal key={reason.title}>
              <Card className="h-full">
                <reason.icon className="mb-5 text-[#d4af37]" size={30} />
                <h3 className="mb-3 text-lg font-black">{reason.title}</h3>
                <p className="text-sm leading-6 text-white/62">{reason.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Why LockInTalks?" title="Built for First-Time Speakers and Growing Communicators">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ["Beginner-Friendly", "Students get a clear path from sign-up to stage, with simple steps and supportive guidance."],
            ["Meaningful Recognition", "Certificates and event milestones help students see progress over time."],
            ["Structured Energy", "Events feel exciting without becoming chaotic, with rules, schedules, and judging criteria upfront."]
          ].map(([title, text]) => (
            <Card key={title}>
              <BadgeCheck className="mb-4 text-[#d4af37]" />
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Competition Categories" title="Pick Your Stage. Build Your Edge.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Reveal key={category}>
              <Link href="/competitions" className="glass group flex min-h-28 items-center justify-between rounded-[8px] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/45">
                <span className="text-lg font-black">{category}</span>
                <span className="rounded-full border border-[#d4af37]/35 p-3 text-[#d4af37] transition group-hover:translate-x-1"><ArrowRight size={18} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="How It Works" title="From Sign-Up to Stage in Five Clear Steps">
        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <Reveal key={step}>
              <div className="h-full rounded-[8px] border border-white/10 bg-white/[0.055] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/40">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1a8] to-[#d4af37] font-black text-[#071b3b]">{index + 1}</div>
                <p className="font-black">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Featured Competitions" title="Current Speaking Events">
        {competitions.length === 0 ? (
          <Card className="text-center">
            <Mic2 className="mx-auto mb-4 text-[#d4af37]" />
            <h3 className="text-2xl font-black">Live Competitions Coming Soon</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/62">Published competitions will appear here automatically from the admin panel.</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {competitions.map((competition) => (
              <Card key={competition.slug}>
                <div className={`relative mb-5 h-28 overflow-hidden rounded-[8px] bg-gradient-to-br ${competition.accent} p-4 text-[#071b3b]`}>
                  {competition.imageUrl && (
                    <>
                      <Image src={competition.imageUrl} alt={`${competition.name} competition banner`} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071b3b]/85 via-[#071b3b]/35 to-black/10" aria-hidden="true" />
                    </>
                  )}
                  <div className={competition.imageUrl ? "relative z-10 text-white" : "relative z-10"}>
                  <Mic2 size={28} />
                  <p className="mt-5 text-lg font-black">{competition.category}</p>
                  </div>
                </div>
                <h3 className="text-lg font-black">{competition.name}</h3>
                <p className="mt-2 text-sm text-white/58">{competition.ageGroup} | {competition.fee} | Cash Prizes</p>
                {competition.prizePool.showBadge && (
                  <PrizePoolPill className="mt-3 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]">
                    {formatPrizePoolBadge(competition.prizePool.amount)}
                  </PrizePoolPill>
                )}
                <ButtonLink href={`/competitions/${competition.slug}`} variant="glass" className="mt-5 w-full">View Details</ButtonLink>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="Why Students Join LockInTalks" title="Growth That Goes Beyond One Event">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Speak With Structure", "Students learn to organize ideas before they speak."],
            ["Grow Under Pressure", "Timed rounds help students stay calm and focused."],
            ["Build Stage Confidence", "A guided online format makes performance practice feel achievable."]
          ].map(([title, text]) => (
            <Card key={title} className="text-center">
              <Crown className="mx-auto mb-4 text-[#d4af37]" />
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Student Development" title="A Competitive but Encouraging Environment">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Clear Expectations", "Rules, schedules, and judging criteria help students and parents understand each event."],
            ["Useful Practice", "Students prepare, speak, and reflect with a clear goal instead of vague stage practice."],
            ["Parent-Friendly Flow", "Registration, payment, event details, and results are organized in one place."]
          ].map(([title, text]) => (
            <Card key={title}>
              <BadgeCheck className="mb-4 text-[#d4af37]" />
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Quick Answers Before You Step On Stage">
        <div className="grid gap-4">
          {faqs.map(([question, answer]) => (
            <details key={question} className="glass rounded-[8px] p-5">
              <summary className="cursor-pointer text-lg font-black">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-white/65">{answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </MotionShell>
  );
}
