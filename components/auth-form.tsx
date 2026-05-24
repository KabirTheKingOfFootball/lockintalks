"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type AuthSessionResponse = {
  authenticated?: boolean;
  role?: "user" | "admin" | null;
  redirectTo?: string;
  error?: string;
};

type AuthResponse = AuthSessionResponse & {
  ok?: boolean;
  needsEmailConfirmation?: boolean;
  message?: string;
};

export function AuthForm({ mode, initialError = "", initialNotice = "", nextPath = "/dashboard" }: { mode: "login" | "signup"; initialError?: string; initialNotice?: string; nextPath?: string }) {
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create Your Speaker Account" : "Welcome Back"), [isSignup]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    try {
      setIsSubmitting(true);
      setStatusText(isSignup ? "Creating Account..." : "Signing In...");
      track(isSignup ? "signup_started" : "login_started");
      clearLegacyAuthStorage();
      const response = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          next: nextPath
        })
      });
      const result = await readJsonResponse<AuthResponse>(response);

      if (!response.ok || result.error) {
        console.error(`[LockInTalks auth client] ${mode} failed: ${result.error || response.statusText}`);
        setError(result.error || "Authentication failed. Please try again.");
        track(isSignup ? "signup_failed" : "login_failed", { reason: "api_error" });
        return;
      }

      if (result.needsEmailConfirmation) {
        setNotice(result.message || "Account Created. Please check your email to confirm your account, then log in.");
        track("signup_completed", { needsEmailConfirmation: true });
        return;
      }

      await finishWithServerConfirmedSession(isSignup ? "signup_completed" : "login_completed", result.redirectTo);
    } catch (submitError) {
      console.error(`[LockInTalks auth client] Unexpected ${mode} error:`, submitError);
      setError(getReadableError(submitError, "Authentication is temporarily unavailable. Please try again."));
      track(isSignup ? "signup_failed" : "login_failed", { reason: "unexpected_error" });
    } finally {
      setIsSubmitting(false);
      setStatusText("");
    }
  }

  async function finishWithServerConfirmedSession(eventName: "login_completed" | "signup_completed", preferredRedirect?: string | null) {
    setStatusText("Confirming Session...");
    const session = await waitForServerSession();

    if (!session?.authenticated) {
      console.warn("[LockInTalks auth client] App session cookie was not confirmed by the server.");
      setError("Login worked, but the secure app session was not confirmed. Please clear site data and try again.");
      track(eventName === "login_completed" ? "login_failed" : "signup_failed", { reason: "server_session_not_confirmed" });
      return;
    }

    const destination = getPostAuthDestination(nextPath, session, preferredRedirect);
    track(eventName, { destination });
    window.dispatchEvent(new CustomEvent("lockintalks-auth-changed", { detail: { status: "authenticated" } }));
    window.location.replace(destination);
  }

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
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
        {isSubmitting ? statusText || "Please Wait..." : isSignup ? "Create Account" : "Login"}
      </Button>
    </form>
  );
}

async function waitForServerSession(maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const session = await readJsonResponse<AuthSessionResponse>(response);

    if (response.ok && session.authenticated) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, 175 + attempt * 75));
  }

  return null;
}

function getPostAuthDestination(nextPath: string, session: AuthSessionResponse, preferredRedirect?: string | null) {
  if (nextPath.startsWith("/register/") || nextPath.startsWith("/competitions/") || nextPath.startsWith("/payment")) {
    return nextPath;
  }

  if (preferredRedirect?.startsWith("/") && !preferredRedirect.startsWith("//")) {
    return preferredRedirect;
  }

  if (session.redirectTo?.startsWith("/") && !session.redirectTo.startsWith("//")) {
    return session.redirectTo;
  }

  return session.role === "admin" ? "/admin" : "/dashboard";
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
