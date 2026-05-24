"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { readJsonResponse } from "@/lib/readable-error";
import { createClient } from "@/lib/supabase/client";

type TestResult = {
  clientLoginSuccess: boolean | null;
  clientSessionExists: boolean | null;
  serverAuthenticated: boolean | null;
  browserCookieNames: string[];
  supabaseAuthCookieNames: string[];
  hasSupabaseAuthCookies: boolean;
  serverSession: unknown;
  error: string | null;
};

const initialResult: TestResult = {
  clientLoginSuccess: null,
  clientSessionExists: null,
  serverAuthenticated: null,
  browserCookieNames: [],
  supabaseAuthCookieNames: [],
  hasSupabaseAuthCookies: false,
  serverSession: null,
  error: null
};

export function AuthTestClient() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [result, setResult] = useState<TestResult>(initialResult);
  const [loading, setLoading] = useState(false);

  async function runExistingSessionCheck() {
    setLoading(true);
    setResult(initialResult);
    try {
      const clientSessionExists = await getClientSessionExists();
      const serverSession = await getServerSession();
      setResult({
        clientLoginSuccess: null,
        clientSessionExists,
        serverAuthenticated: Boolean((serverSession as { authenticated?: boolean }).authenticated),
        ...getBrowserCookieSummary(),
        serverSession,
        error: null
      });
    } catch (error) {
      setResult({ ...initialResult, error: error instanceof Error ? error.message : "Could not run auth check." });
    } finally {
      setLoading(false);
    }
  }

  async function runBrowserLoginTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(initialResult);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password
      });
      const clientSessionExists = await getClientSessionExists();
      const serverSession = await getServerSession();

      setResult({
        clientLoginSuccess: !error,
        clientSessionExists,
        serverAuthenticated: Boolean((serverSession as { authenticated?: boolean }).authenticated),
        ...getBrowserCookieSummary(),
        serverSession,
        error: error?.message || null
      });
    } catch (error) {
      setResult({ ...initialResult, error: error instanceof Error ? error.message : "Could not run auth test." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <form onSubmit={runBrowserLoginTest} className="glass rounded-[8px] p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d4af37]">Temporary Auth Test</p>
        <h1 className="text-3xl font-black">LockInTalks Auth Diagnostics</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">Use only a temporary test account. This page shows booleans and cookie names only, never passwords, tokens, or cookie values.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-white/80">Email<Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-bold text-white/80">Password<Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Testing..." : "Test Browser Supabase Login"}</Button>
          <Button type="button" variant="glass" onClick={runExistingSessionCheck} disabled={loading}>Check Current Session</Button>
        </div>
      </form>
      <pre className="mt-6 overflow-auto rounded-[8px] border border-white/10 bg-black/40 p-4 text-xs leading-6 text-white/78">{JSON.stringify(result, null, 2)}</pre>
    </main>
  );
}

async function getClientSessionExists() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

async function getServerSession() {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin"
  });
  return readJsonResponse<unknown>(response);
}

function getBrowserCookieSummary() {
  const browserCookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean)
    .sort();
  const supabaseAuthCookieNames = getSupabaseAuthCookieNames(browserCookieNames);

  return {
    browserCookieNames,
    supabaseAuthCookieNames,
    hasSupabaseAuthCookies: supabaseAuthCookieNames.length > 0
  };
}
