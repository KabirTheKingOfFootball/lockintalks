import Image from "next/image";
import Link from "next/link";
import { Mail, PlayCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/15 bg-[#071b3b]/92">
      <div className="poster-backdrop poster-backdrop-compact opacity-35" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image src="/lockintalks-logo.png" alt="LockInTalks logo" width={62} height={62} className="rounded-full border border-[#ffd765]/35 object-cover shadow-[0_0_26px_rgba(255,215,101,0.4)]" />
            <div>
              <p className="flex items-center gap-2 text-xl font-black">LockIn<span className="gold-text">Talks</span></p>
              <p className="text-sm text-white/70">Speak. Perform. Inspire.</p>
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
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#d4af37]">Policies</p>
          <div className="grid gap-3 text-sm text-white/65">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/shipping-policy">No Shipping</Link>
            <Link href="/parent-consent">Parent Consent</Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">Copyright 2026 LockInTalks. All Rights Reserved.</div>
    </footer>
  );
}
