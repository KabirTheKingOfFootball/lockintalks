import type { Metadata } from "next";
import Image from "next/image";
import { Globe2, HeartHandshake, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { PosterBackdrop } from "@/components/brand-visuals";

export const metadata: Metadata = {
  title: "About",
  description: "The LockInTalks mission: helping young speakers build confidence through online public speaking competitions."
};

export default function AboutPage() {
  return (
    <MotionShell className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <PosterBackdrop compact />
      <div className="relative z-10 mx-auto max-w-7xl">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <Image src="/lockintalks-logo.png" alt="LockInTalks logo" width={520} height={520} className="mx-auto rounded-full border border-[#ffd765]/35 object-cover drop-shadow-[0_0_45px_rgba(255,215,101,0.5)]" />
        <div className="poster-panel rounded-[8px] p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#0d4ea6]">Mission</p>
          <h1 className="text-4xl font-black text-[#071b3b] sm:text-6xl">Helping Young Voices Become Clear, Confident, and Prepared</h1>
          <p className="mt-6 text-lg leading-8 text-[#071b3b]/72">LockInTalks exists to make public speaking feel exciting, structured, and achievable for kids and teenagers. We combine competition energy with thoughtful learning so students can practise with purpose.</p>
        </div>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          [HeartHandshake, "Supportive by Design", "Clear rules, age groups, and guidance reduce stress for students and parents."],
          [Trophy, "Recognition Matters", "Students build a record of effort, certificates, and competition milestones."],
          [Globe2, "Online and Accessible", "Students can join from anywhere with a camera, microphone, and stable internet connection."]
        ].map(([Icon, title, text]) => (
          <Card key={String(title)}>
            <Icon className="mb-4 text-[#d4af37]" />
            <h2 className="text-xl font-black">{String(title)}</h2>
            <p className="mt-3 text-sm leading-6 text-white/62">{String(text)}</p>
          </Card>
        ))}
      </div>
      </div>
    </MotionShell>
  );
}
