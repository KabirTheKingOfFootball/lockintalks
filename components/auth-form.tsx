"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isSignup = mode === "signup";
  const title = useMemo(() => (isSignup ? "Create your speaker account" : "Welcome back, champion"), [isSignup]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    localStorage.setItem("lockintalks-user", JSON.stringify({ name: form.name || "LockIn Speaker", email: form.email }));
    router.push("/dashboard");
  }

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-md rounded-[8px] p-6 sm:p-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">{isSignup ? "Sign up" : "Login"}</p>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Demo authentication with validation, ready to connect to a secure server-side auth provider.</p>
      <div className="mt-7 grid gap-4">
        {isSignup && (
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Student name
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aarav Sharma" className="pl-11" />
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
      <Button type="submit" className="mt-6 w-full">{isSignup ? "Create Account" : "Login"}</Button>
    </form>
  );
}
