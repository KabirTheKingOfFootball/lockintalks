"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { readJsonResponse } from "@/lib/readable-error";
import { createClient } from "@/lib/supabase/client";

const appSessionCookieName = "lockintalks_app_session";

type TestResult = {
  userAgent: string;
  clientLoginSuccess: boolean | null;
  clientSessionExists: boolean | null;
  serverAuthenticated: boolean | null;
  browserCookieNames: string[];
  supabaseAuthCookieNames: string[];
  hasSupabaseAuthCookies: boolean;
  hasReadableAppSessionCookie: boolean;
  firstPartyCookie: {
    setResponse: unknown;
    readResponse: unknown;
    readBackPresent: boolean | null;
    browserReadable: boolean;
  };
  debugAuthCookies: unknown;
  serverSession: unknown;
  logoutSession: unknown;
  error: string | null;
};

const initialResult: TestResult = {
  userAgent: "",
  clientLoginSuccess: null,
  clientSessionExists: null,
  serverAuthenticated: null,
  browserCookieNames: [],
  supabaseAuthCookieNames: [],
  hasSupabaseAuthCookies: false,
  hasReadableAppSessionCookie: false,
  firstPartyCookie: {
    setResponse: null,
    readResponse: null,
    readBackPresent: null,
    browserReadable: false
  },
  debugAuthCookies: null,
  serverSession: null,
  logoutSession: null,
  error: null
};

export function AuthTestClient() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [result, setResult] = useState<TestResult>(initialResult);
  const [loading, setLoading] = useState(false);

  async function runExistingSessionCheck() {
    await runDiagnostic(async () => {
      const clientSessionExists = await getClientSessionExists();
      const serverSession = await getServerSession();
      const debugAuthCookies = await getDebugAuthCookies();

      return {
        clientLoginSuccess: null,
        clientSessionExists,
        serverSession,
        debugAuthCookies,
        serverAuthenticated: Boolean((serverSession as { authenticated?: boolean }).authenticated)
      };
    });
  }

  async function runFirstPartyCookieTest() {
    await runDiagnostic(async () => {
      const setResponse = await fetchJson("/api/debug/set-test-cookie");
      const readResponse = await fetchJson("/api/debug/read-test-cookie");
      const firstPartyCookie = {
        setResponse,
        readResponse,
        readBackPresent: Boolean((readResponse as { present?: boolean }).present),
        browserReadable: getCookieNames().includes("lockintalks_test")
      };

      return { firstPartyCookie, debugAuthCookies: await getDebugAuthCookies() };
    });
  }

  async function runBrowserLoginTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runDiagnostic(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password
      });
      const clientSessionExists = await getClientSessionExists();
      const serverSession = await getServerSession();
      const debugAuthCookies = await getDebugAuthCookies();

      return {
        clientLoginSuccess: !error,
        clientSessionExists,
        serverSession,
        debugAuthCookies,
        serverAuthenticated: Boolean((serverSession as { authenticated?: boolean }).authenticated),
        error: error?.message || null
      };
    });
  }

  async function runAppLoginRouteTest() {
    await runDiagnostic(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          next: "/dashboard"
        })
      });
      const loginResponse = await readJsonResponse<unknown>(response);
      const serverSession = await getServerSession();
      const debugAuthCookies = await getDebugAuthCookies();

      return {
        clientLoginSuccess: response.ok && Boolean((loginResponse as { ok?: boolean }).ok),
        clientSessionExists: await getClientSessionExists(),
        serverSession,
        debugAuthCookies,
        serverAuthenticated: Boolean((serverSession as { authenticated?: boolean }).authenticated),
        error: response.ok ? null : String((loginResponse as { error?: string }).error || "App login route failed.")
      };
    });
  }

  async function runLogoutTest() {
    await runDiagnostic(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // The server logout route is the source of truth; browser sign-out is only cleanup.
      }

      await fetch("/logout", {
        cache: "no-store",
        credentials: "same-origin"
      });

      const logoutSession = await getServerSession();
      return {
        logoutSession,
        serverSession: logoutSession,
        debugAuthCookies: await getDebugAuthCookies(),
        clientSessionExists: await getClientSessionExists(),
        serverAuthenticated: Boolean((logoutSession as { authenticated?: boolean }).authenticated)
      };
    });
  }

  async function runDiagnostic(getExtraState: () => Promise<Partial<TestResult>>) {
    setLoading(true);
    setResult({ ...initialResult, userAgent: navigator.userAgent });

    try {
      const extra = await getExtraState();
      const cookieSummary = getBrowserCookieSummary();
      setResult({
        ...initialResult,
        userAgent: navigator.userAgent,
        ...cookieSummary,
        ...extra,
        error: extra.error ?? null
      });
    } catch (error) {
      setResult({
        ...initialResult,
        userAgent: navigator.userAgent,
        ...getBrowserCookieSummary(),
        error: error instanceof Error ? error.message : "Could not run auth check."
      });
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
          <Button type="button" variant="glass" onClick={runAppLoginRouteTest} disabled={loading}>Test App Login Route</Button>
          <Button type="button" variant="glass" onClick={runExistingSessionCheck} disabled={loading}>Check Current Session</Button>
          <Button type="button" variant="glass" onClick={runFirstPartyCookieTest} disabled={loading}>Test First-Party Cookie</Button>
          <Button type="button" variant="glass" onClick={runLogoutTest} disabled={loading}>Test Logout</Button>
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
  return fetchJson("/api/auth/session");
}

async function getDebugAuthCookies() {
  return fetchJson("/api/debug/auth-cookies");
}

async function fetchJson(path: string) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin"
  });
  return readJsonResponse<unknown>(response);
}

function getBrowserCookieSummary() {
  const browserCookieNames = getCookieNames();
  const supabaseAuthCookieNames = getSupabaseAuthCookieNames(browserCookieNames);

  return {
    browserCookieNames,
    supabaseAuthCookieNames,
    hasSupabaseAuthCookies: supabaseAuthCookieNames.length > 0,
    hasReadableAppSessionCookie: browserCookieNames.includes(appSessionCookieName)
  };
}

function getCookieNames() {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean)
    .sort();
}
