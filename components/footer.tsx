import Image from "next/image";
import Link from "next/link";
import { Mail, PlayCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image src="/lockintalks-logo.png" alt="LockInTalks logo" width={58} height={58} className="rounded-full" />
            <div>
              <p className="text-xl font-black">LockIn<span className="gold-text">Talks</span></p>
              <p className="text-sm text-white/55">Speak. Inspire. Lead.</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/60">
            A structured online speaking platform for students building confidence, clarity, and communication skills.
          </p>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#d4af37]">Explore</p>
          <div className="grid gap-3 text-sm text-white/65">
            <Link href="/competitions">Competitions</Link>
            <Link href="/signup">Sign Up</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#d4af37]">Connect</p>
          <div className="flex gap-3">
            <Link href="mailto:lockintalks@gmail.com" aria-label="Email LockInTalks" className="focus-ring rounded-full border border-white/15 p-3 text-white/75 hover:border-[#d4af37] hover:text-[#d4af37]">
              <Mail size={18} />
            </Link>
            <Link href="https://youtube.com" aria-label="LockInTalks YouTube" className="focus-ring rounded-full border border-white/15 p-3 text-white/75 hover:border-[#d4af37] hover:text-[#d4af37]">
              <PlayCircle size={18} />
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/55">lockintalks@gmail.com</p>
          <p className="mt-2 text-sm text-white/55">YouTube: LockInTalks</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">Copyright 2026 LockInTalks. All Rights Reserved.</div>
    </footer>
  );
}
