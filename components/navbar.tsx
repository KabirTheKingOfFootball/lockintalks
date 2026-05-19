"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AuthNavState =
  | {
      status: "loading";
      role: null;
    }
  | {
      status: "out";
      role: null;
    }
  | {
      status: "in";
      role: "user" | "admin";
    };

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<AuthNavState>({ status: "loading", role: null });
  const requestId = useRef(0);

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch (error) {
      console.warn("[LockInTalks navbar] Supabase client unavailable:", error);
      queueMicrotask(() => {
        if (mounted) setAuth({ status: "out", role: null });
      });
      return;
    }

    async function resolveAuthState() {
      const currentRequest = ++requestId.current;

      try {
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (!mounted || currentRequest !== requestId.current) return;

        if (userError || !user) {
          if (userError) {
            console.warn(`[LockInTalks navbar] Could not resolve user session: ${userError.message}`);
          }
          setAuth({ status: "out", role: null });
          return;
        }

        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

        if (!mounted || currentRequest !== requestId.current) return;

        if (profileError) {
          console.warn(`[LockInTalks navbar] Could not resolve profile role: ${profileError.message}`);
        }

        setAuth({ status: "in", role: profile?.role === "admin" ? "admin" : "user" });
      } catch (error) {
        console.error("[LockInTalks navbar] Auth state resolution failed:", error);
        if (mounted) setAuth({ status: "out", role: null });
      }
    }

    void resolveAuthState();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        requestId.current += 1;
        setAuth({ status: "out", role: null });
        return;
      }

      setAuth({ status: "loading", role: null });
      void resolveAuthState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const links = useMemo(() => {
    if (auth.status !== "in") return publicLinks;

    const authenticatedLinks = [
      ...publicLinks.slice(0, 4),
      { href: "/dashboard", label: "Dashboard" },
      ...(auth.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      publicLinks[4]
    ];

    return authenticatedLinks;
  }, [auth]);

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
          <AuthActions auth={auth} />
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
            <div className="mt-2 grid grid-cols-2 gap-3" onClick={() => setOpen(false)}>
              <AuthActions auth={auth} mobile />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function AuthActions({ auth, mobile = false }: { auth: AuthNavState; mobile?: boolean }) {
  if (auth.status === "loading") {
    return (
      <>
        <span className={mobile ? "h-11 rounded-full bg-white/10" : "h-11 w-24 rounded-full bg-white/10"} aria-hidden="true" />
        <span className={mobile ? "h-11 rounded-full bg-white/10" : "h-11 w-32 rounded-full bg-white/10"} aria-hidden="true" />
      </>
    );
  }

  if (auth.status === "in") {
    return (
      <ButtonLink href="/logout" variant={mobile ? "glass" : "ghost"} className={mobile ? "col-span-2" : undefined}>Logout</ButtonLink>
    );
  }

  return (
    <>
      <ButtonLink href="/login" variant={mobile ? "glass" : "ghost"}>Login</ButtonLink>
      <ButtonLink href="/signup" className={mobile ? "col-span-1" : undefined}>Register Now</ButtonLink>
    </>
  );
}
