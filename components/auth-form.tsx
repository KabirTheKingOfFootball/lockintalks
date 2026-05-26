"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode, initialError = "", initialNotice = "", nextPath = "/dashboard" }: { mode: "login" | "signup"; initialError?: string; initialNotice?: string; nextPath?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create Your Speaker Account" : "Welcome Back"), [isSignup]);

  function submit() {
    setIsSubmitting(true);
    track(isSignup ? "signup_started" : "login_started");
    clearLegacyAuthStorage();
  }

  return (
    <form action={isSignup ? "/api/auth/signup" : "/api/auth/login"} method="post" onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
      <input type="hidden" name="next" value={nextPath} />
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">{isSignup ? "Sign up" : "Login"}</p>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Secure email and password authentication for your LockInTalks account.</p>
      <div className="mt-7 grid gap-4">
        {isSignup && (
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Student Name
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
              <Input name="name" required minLength={2} placeholder="Student Name" className="pl-11" />
            </span>
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input name="email" type="email" required autoComplete="email" placeholder="student@example.com" className="pl-11" />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Password
          <span className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input name="password" type="password" required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Minimum 6 characters" className="pl-11" />
          </span>
        </label>
      </div>
      {initialNotice && <p className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{initialNotice}</p>}
      {initialError && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{initialError}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? (isSignup ? "Creating Account..." : "Signing In...") : isSignup ? "Create Account" : "Login"}
      </Button>
    </form>
  );
}

function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  const storages = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (!key) continue;
        const isLegacySupabaseAuthKey = key === "supabase.auth.token" || (key.startsWith("sb-") && key.includes("auth-token"));
        if (isLegacySupabaseAuthKey) storage.removeItem(key);
      }
    } catch (error) {
      console.warn("[LockInTalks auth form] Could not clear legacy browser auth storage:", error);
    }
  }
}
