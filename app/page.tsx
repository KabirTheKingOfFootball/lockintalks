import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Crown, Globe2, Mic2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell, Reveal } from "@/components/motion-shell";
import { Section } from "@/components/section";
import { getLiveCompetitions } from "@/lib/competitions";

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
        <div className="mesh-bg animated-grid absolute inset-0" aria-hidden="true" />
        <div className="stage-light absolute inset-0" aria-hidden="true" />
        <div className="energy-line absolute left-0 top-32 hidden h-px w-1/3 lg:block" aria-hidden="true" />
        <div className="energy-line absolute bottom-24 right-0 hidden h-px w-1/4 lg:block" aria-hidden="true" />
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f7dc83]">
              <Trophy size={16} /> Global Youth Speaking Competitions
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] text-white sm:text-7xl lg:text-8xl">
              Speak. <span className="gold-text">Inspire.</span> Lead.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">
              LockInTalks gives students a structured online stage to practise public speaking, build confidence, earn recognition, and compete for exciting cash prizes in a supportive environment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/competitions" className="gap-2">Explore Competitions <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/signup" variant="glass">Register Now</ButtonLink>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {["Speaking Practice", "Live Online Events", "Confidence Building"].map((item) => (
                <div key={item} className="rounded-[8px] border border-white/10 bg-white/[0.05] p-3 text-center text-sm font-bold text-white/75">{item}</div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-x-6 top-10 h-3/4 bg-[#d4af37]/18 blur-3xl" aria-hidden="true" />
            <Image
              src="/lockintalks-logo.png"
              alt="LockInTalks logo"
              width={720}
              height={720}
              priority
              className="relative rounded-full drop-shadow-[0_0_55px_rgba(212,175,55,0.45)]"
            />
            <div className="glass absolute -bottom-4 left-2 flex items-center gap-3 rounded-[8px] p-4">
              <Sparkles className="text-[#d4af37]" size={22} />
              <span className="text-sm font-bold">Confidence, Recognition, and Cash Awards</span>
            </div>
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
                <div className={`mb-5 h-28 rounded-[8px] bg-gradient-to-br ${competition.accent} p-4 text-[#071b3b]`}>
                  <Mic2 size={28} />
                  <p className="mt-5 text-lg font-black">{competition.category}</p>
                </div>
                <h3 className="text-lg font-black">{competition.name}</h3>
                <p className="mt-2 text-sm text-white/58">{competition.ageGroup} | {competition.fee} | Cash Prizes</p>
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
