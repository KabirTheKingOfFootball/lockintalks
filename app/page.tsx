import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Globe2, Mic2, ShieldCheck, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { competitions } from "@/data/competitions";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionShell, Reveal } from "@/components/motion-shell";
import { Section } from "@/components/section";

const reasons = [
  { icon: ShieldCheck, title: "Improve confidence", text: "Practice structured speaking in a supportive, high-standard environment." },
  { icon: Globe2, title: "Compete globally", text: "Join online events with students from different cities and countries." },
  { icon: Mic2, title: "Build communication skills", text: "Learn clarity, persuasion, storytelling, and live delivery." },
  { icon: Award, title: "Win recognition", text: "Earn certificates, badges, finalist mentions, and judge feedback." }
];

const categories = ["Debate Battles", "Storytelling", "Motivational Speaking", "Extempore", "Speech Challenges", "Team Speaking"];
const steps = ["Sign Up", "Choose Competition", "Pay Registration Fee", "Compete Online", "Get Results & Certificates"];
const faqs = [
  ["Who can join LockInTalks?", "Kids and teenagers can join age-grouped online competitions from anywhere with a stable internet connection."],
  ["Are competitions fully online?", "Yes. Briefings, live rounds, judging, payments, and certificates are handled through the online platform."],
  ["Do students receive feedback?", "Most competitions include judge notes or a scorecard so students can keep improving after the event."],
  ["Is payment real on this demo?", "This build includes a demo-safe payment UI prepared for a secure server-side payment provider integration."]
];

export default function HomePage() {
  return (
    <MotionShell>
      <section className="relative overflow-hidden">
        <div className="mesh-bg absolute inset-0" aria-hidden="true" />
        <div className="absolute left-8 top-28 hidden h-24 w-24 rounded-full border border-[#d4af37]/35 lg:block" aria-hidden="true" />
        <div className="absolute bottom-16 right-10 hidden h-32 w-32 rounded-full border border-white/10 lg:block" aria-hidden="true" />
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f7dc83]">
              <Trophy size={16} /> Global youth speaking championship
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] text-white sm:text-7xl lg:text-8xl">
              Speak. <span className="gold-text">Inspire.</span> Lead.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">
              LockInTalks is an online public speaking competition platform where students compete, improve confidence, and showcase speaking talent globally.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/competitions" className="gap-2">Explore Competitions <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/signup" variant="glass">Register Now</ButtonLink>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {["2K+ Speakers", "40+ Events", "Global Stage"].map((item) => (
                <div key={item} className="rounded-[8px] border border-white/10 bg-white/[0.05] p-3 text-center text-sm font-bold text-white/75">{item}</div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-8 rounded-full bg-[#d4af37]/20 blur-3xl" aria-hidden="true" />
            <Image
              src="/lockintalks-logo.png"
              alt="LockInTalks championship logo"
              width={720}
              height={720}
              priority
              className="relative rounded-full drop-shadow-[0_0_55px_rgba(212,175,55,0.45)]"
            />
            <div className="glass absolute -bottom-4 left-2 flex items-center gap-3 rounded-[8px] p-4">
              <Sparkles className="text-[#d4af37]" size={22} />
              <span className="text-sm font-bold">Champions League for young speakers</span>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="What is LockInTalks?" title={<>A premium online arena for young voices.</>}>
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass rounded-[8px] p-8">
              <p className="text-xl leading-9 text-white/76">
                LockInTalks combines the energy of a championship with the polish of a world-class speaking stage. Students enter age-appropriate competitions, perform online, receive feedback, and build the courage to speak when it matters.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {["Live online rounds", "Judge-led scoring", "Certificates & recognition"].map((item) => (
                <div key={item} className="rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 p-5 font-bold text-[#f7dc83]">{item}</div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section eyebrow="Why Join?" title={<>Confidence, skill, and recognition in one elite platform.</>}>
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

      <Section eyebrow="Competition Categories" title="Pick your stage. Build your edge.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Reveal key={category}>
              <Link href="/competitions" className="glass group flex min-h-28 items-center justify-between rounded-[8px] p-5">
                <span className="text-lg font-black">{category}</span>
                <span className="rounded-full border border-[#d4af37]/35 p-3 text-[#d4af37] transition group-hover:translate-x-1"><ArrowRight size={18} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="How It Works" title="From sign-up to spotlight in five clean steps.">
        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <Reveal key={step}>
              <div className="h-full rounded-[8px] border border-white/10 bg-white/[0.055] p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1a8] to-[#d4af37] font-black text-[#071b3b]">{index + 1}</div>
                <p className="font-black">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Featured Competitions" title="Current championship tracks.">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {competitions.map((competition) => (
            <Card key={competition.slug}>
              <div className={`mb-5 h-28 rounded-[8px] bg-gradient-to-br ${competition.accent} p-4 text-[#071b3b]`}>
                <Mic2 size={28} />
                <p className="mt-5 text-lg font-black">{competition.category}</p>
              </div>
              <h3 className="text-lg font-black">{competition.name}</h3>
              <p className="mt-2 text-sm text-white/58">{competition.ageGroup} • {competition.fee}</p>
              <ButtonLink href={`/competitions/${competition.slug}`} variant="glass" className="mt-5 w-full">View Details</ButtonLink>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Testimonials" title="What young speakers say.">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Aarav, 14", "The feedback helped me sound confident instead of rushed."],
            ["Mia, 11", "It felt like a real championship, but friendly and fun."],
            ["Zoya, 16", "I finally learned how to structure a speech under pressure."]
          ].map(([name, quote]) => (
            <Card key={name}>
              <p className="text-lg leading-8 text-white/78">“{quote}”</p>
              <p className="mt-5 font-bold text-[#d4af37]">{name}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Quick answers before you step on stage.">
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
