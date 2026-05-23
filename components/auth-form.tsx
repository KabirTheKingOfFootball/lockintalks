"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type AuthResponse = {
  ok?: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
  role?: "user" | "admin";
  redirectTo?: string;
};

type AuthSessionResponse = {
  authenticated?: boolean;
  role?: "user" | "admin" | null;
  redirectTo?: string;
  error?: string;
};

export function AuthForm({ mode, initialError = "", nextPath = "/dashboard" }: { mode: "login" | "signup"; initialError?: string; nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create Your Speaker Account" : "Welcome Back"), [isSignup]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

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

    let isNavigatingAway = false;

    try {
      setIsSubmitting(true);
      setStatusText(isSignup ? "Creating Account..." : "Signing In...");
      const response = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        cache: "no-store",
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
        setError("Account Created. Please check your email to confirm your account, then log in.");
        return;
      }

      setStatusText("Confirming Session...");
      const session = await waitForServerSession();
      const role = session.role === "admin" ? "admin" : "user";
      const redirectTo = getPostAuthRedirect(role, nextPath);

      setStatusText("Redirecting...");
      window.dispatchEvent(new CustomEvent("lockintalks-auth-changed", { detail: { ...session, redirectTo } }));
      router.refresh();
      isNavigatingAway = true;
      window.location.replace(redirectTo);
    } catch (submitError) {
      console.error(`[LockInTalks auth form] Unexpected ${mode} error:`, submitError);
      setError(getReadableError(submitError, "Authentication is temporarily unavailable. Please check the Supabase configuration."));
    } finally {
      if (!isNavigatingAway) {
        setIsSubmitting(false);
        setStatusText("");
      }
    }
  }

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">{isSignup ? "Sign up" : "Login"}</p>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Secure email and password authentication powered by Supabase sessions.</p>
      <div className="mt-7 grid gap-4">
        {isSignup && (
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Student Name
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student Name" className="pl-11" />
            </span>
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" className="pl-11" />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white/80">
          Password
          <span className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" className="pl-11" />
          </span>
        </label>
      </div>
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? statusText || "Please Wait..." : isSignup ? "Create Account" : "Login"}
      </Button>
    </form>
  );
}

async function waitForServerSession() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const result = await readJsonResponse<AuthSessionResponse>(response);

    if (!response.ok) {
      throw new Error(result.error || "Could not verify your login session.");
    }

    if (result.authenticated) {
      return result;
    }

    await sleep(160 + attempt * 45);
  }

  throw new Error("Login succeeded, but your session is still syncing. Please wait a moment and try opening the dashboard again.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
