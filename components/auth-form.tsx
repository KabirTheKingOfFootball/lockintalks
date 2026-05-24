"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormAction = (formData: FormData) => void | Promise<void>;

export function AuthForm({ mode, action, initialError = "", initialNotice = "", nextPath = "/dashboard" }: { mode: "login" | "signup"; action: AuthFormAction; initialError?: string; initialNotice?: string; nextPath?: string }) {
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create Your Speaker Account" : "Welcome Back"), [isSignup]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    setError("");
    setNotice("");

    if (isSignup && form.name.trim().length < 2) {
      event.preventDefault();
      setError("Please enter the student's name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      event.preventDefault();
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      event.preventDefault();
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    track(isSignup ? "signup_started" : "login_started");
    clearLegacyAuthStorage();
  }

  return (
    <form action={action} onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
      <input type="hidden" name="next" value={nextPath} />
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">{isSignup ? "Sign up" : "Login"}</p>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Secure email and password authentication powered by Supabase sessions.</p>
      <div className="mt-7 grid gap-4">
        {isSignup && (
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Student Name
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
              <Input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student Name" className="pl-11" />
            </span>
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" className="pl-11" />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Password
          <span className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" className="pl-11" />
          </span>
        </label>
      </div>
      {notice && <p className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</p>}
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
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
        const isLegacySupabaseAuthKey = key === "supabase.auth.token" || /^sb-[^-]+-auth-token$/.test(key);
        if (isLegacySupabaseAuthKey) storage.removeItem(key);
      }
    } catch (error) {
      console.warn("[LockInTalks auth form] Could not clear legacy browser auth storage:", error);
    }
  }
}
