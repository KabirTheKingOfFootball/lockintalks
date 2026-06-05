"use client";

import { useMemo, useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type AuthResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  needsEmailConfirmation?: boolean;
  redirectTo?: string;
};

export function AuthForm({ mode, initialError = "", initialNotice = "", nextPath = "/dashboard" }: { mode: "login" | "signup"; initialError?: string; initialNotice?: string; nextPath?: string }) {
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create Your Speaker Account" : "Welcome Back"), [isSignup]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isSignup && form.name.trim().length < 2) {
      setError("Please enter the student's name.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          next: nextPath
        })
      });
      const result = await readJsonResponse<AuthResponse>(response);

      if (!response.ok || result.error) {
        console.error(`[LockInTalks auth form] ${mode} failed: ${result.error || response.statusText}`);
        setError(result.error || "Authentication failed.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setConfirmationEmail(form.email.trim());
        setNotice(result.message || "Please check your email to verify your account.");
        return;
      }

      const sessionConfirmed = await waitForServerSession();
      if (!sessionConfirmed) {
        setError("Login succeeded, but this browser did not store the session yet. Please clear site data for LockInTalks, reload, and try once more.");
        return;
      }

      window.location.assign(result.redirectTo || nextPath);
    } catch (submitError) {
      console.error(`[LockInTalks auth form] Unexpected ${mode} error:`, submitError);
      setError(getReadableError(submitError, "Authentication is temporarily unavailable. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendConfirmationEmail() {
    const email = confirmationEmail || form.email.trim();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the email address you used to sign up.");
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          next: nextPath
        })
      });
      const result = await readJsonResponse<AuthResponse>(response);

      if (!response.ok || result.error) {
        setError(result.error || "Could not resend verification email.");
        return;
      }

      setConfirmationEmail(email);
      setNotice(result.message || "Verification email sent. Please check your inbox and spam folder.");
    } catch (resendError) {
      console.error("[LockInTalks auth form] Unexpected resend error:", resendError);
      setError(getReadableError(resendError, "Could not resend verification email right now."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">{isSignup ? "Sign Up" : "Login"}</p>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Secure email and password authentication for your LockInTalks account.</p>
      <div className="mt-7 grid gap-4">
        {isSignup && (
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Student Name
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} placeholder="Student Name" className="pl-11" />
            </span>
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required autoComplete="email" placeholder="student@example.com" className="pl-11" />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Password
          <span className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Minimum 6 characters" className="pl-11" />
          </span>
        </label>
      </div>
      {notice && (
        <div className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          <p>{notice}</p>
          {isSignup && confirmationEmail && (
            <button
              type="button"
              onClick={resendConfirmationEmail}
              disabled={isResending}
              className="mt-3 text-left text-sm font-black text-white underline underline-offset-4 disabled:text-white/50"
            >
              {isResending ? "Resending Verification Email..." : "Resend Verification Email"}
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Please Wait..." : isSignup ? "Create Account" : "Login"}
      </Button>
    </form>
  );
}

async function waitForServerSession() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const session = (await response.json().catch(() => null)) as { authenticated?: boolean } | null;

    if (session?.authenticated) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return false;
}
