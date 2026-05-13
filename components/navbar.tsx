"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-full" onClick={() => setOpen(false)}>
          <Image src="/lockintalks-logo.png" alt="LockInTalks logo" width={54} height={54} priority className="rounded-full shadow-[0_0_28px_rgba(212,175,55,0.45)]" />
          <span className="text-lg font-black tracking-wide">LockIn<span className="gold-text">Talks</span></span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/login" variant="ghost">Login</ButtonLink>
          <ButtonLink href="/signup">Register Now</ButtonLink>
        </div>
        <button className="focus-ring rounded-full p-2 md:hidden" aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-[#020817]/95 px-4 py-5 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-[8px] px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <ButtonLink href="/login" variant="glass">Login</ButtonLink>
              <ButtonLink href="/signup">Register</ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
