import { NextResponse, type NextRequest } from "next/server";
import { appSessionCookieName, AppSessionConfigError, getAppSessionDiagnostics, inspectAppSessionCookie } from "@/lib/auth/app-session";
import { authNoStoreHeaders, getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { loginDiagnosticCookieName } from "@/lib/auth/login-diagnostics";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { getRequestOrigin } from "@/lib/site-url";
import { getSupabaseDiagnostics, getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();
  const supabaseAuthCookieNames = getSupabaseAuthCookieNames(cookieNames);
  const hasAppSessionCookie = cookieNames.includes(appSessionCookieName);
  const env = getSupabaseEnv();
  const diagnostics = getSupabaseDiagnostics();
  const appSessionDiagnostics = getAppSessionDiagnostics();
  const appSessionCookie = await inspectAppSessionCookie();
  const loginDiagnostic = readLoginDiagnostic(request.cookies.get(loginDiagnosticCookieName)?.value);
  const host = request.headers.get("host") || request.nextUrl.host;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || null;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "");
  const origin = getRequestOrigin(request);
  const supabaseUrlHost = env.ok ? safeHost(env.url) : null;
  const basePayload = {
    cookieCount: cookieNames.length,
    cookieNames,
    supabaseAuthCookieNames,
    hasSupabaseAuthCookies: supabaseAuthCookieNames.length > 0,
    appSessionCookieName,
    hasAppSessionCookie,
    appSession: appSessionDiagnostics,
    appSessionCookie,
    loginDiagnosticCookieName,
    loginDiagnostic,
    request: {
      host,
      forwardedHost,
      protocol,
      origin,
      nextUrlOrigin: request.nextUrl.origin
    },
    supabase: {
      configured: env.ok,
      urlHost: supabaseUrlHost,
      keySource: env.ok ? env.keySource : null,
      serviceRoleKeyConfigured: diagnostics.serviceRoleKeyConfigured,
      error: env.ok ? null : env.message
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      vercel: process.env.VERCEL === "1",
      vercelEnvironment: process.env.VERCEL_ENV || null,
      vercelUrlConfigured: Boolean(process.env.VERCEL_URL),
      vercelUrl: process.env.VERCEL_URL || null
    },
    deployment: {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      commitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      repo: process.env.VERCEL_GIT_REPO_SLUG || null,
      owner: process.env.VERCEL_GIT_REPO_OWNER || null
    }
  };

  if (!env.ok) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        role: null,
        authError: env.message,
        ...basePayload
      },
      { status: 503, headers: authNoStoreHeaders }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (error) console.warn(`[LockInTalks debug auth cookies] No server session found: ${error.message}`);
      const fallbackSession = await getServerAuthSession();
      return NextResponse.json(
        {
          authenticated: fallbackSession.authenticated,
          authSource: fallbackSession.source,
          user: fallbackSession.authenticated ? { email: fallbackSession.user.email } : null,
          role: fallbackSession.role,
          authError: error?.message || "No active server session.",
          ...basePayload
        },
        { status: 200, headers: authNoStoreHeaders }
      );
    }

    const role = await getUserRoleFromClient(supabase, user.id);
    console.info("[LockInTalks debug auth cookies] Server session confirmed for debug endpoint.");
    return NextResponse.json(
      {
        authenticated: true,
        authSource: "supabase",
        user: {
          email: user.email || null
        },
        role,
        authError: null,
        ...basePayload
      },
      { status: 200, headers: authNoStoreHeaders }
    );
  } catch (error) {
    if (error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks debug auth cookies] ${error.message}`);
      return NextResponse.json(
        {
          authenticated: false,
          authSource: null,
          user: null,
          role: null,
          authError: error.message,
          ...basePayload
        },
        { status: 503, headers: authNoStoreHeaders }
      );
    }

    console.error("[LockInTalks debug auth cookies] Unexpected debug endpoint error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        role: null,
        authError: "Could not inspect auth cookies safely.",
        ...basePayload
      },
      { status: 500, headers: authNoStoreHeaders }
    );
  }
}

function safeHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function readLoginDiagnostic(value: string | undefined) {
  if (!value) return null;

  try {
    const diagnostic = JSON.parse(value) as Record<string, unknown>;
    return {
      status: typeof diagnostic.status === "string" ? diagnostic.status : null,
      reason: typeof diagnostic.reason === "string" ? diagnostic.reason : null,
      redirectTo: typeof diagnostic.redirectTo === "string" ? diagnostic.redirectTo : null,
      source: typeof diagnostic.source === "string" ? diagnostic.source : null,
      at: typeof diagnostic.at === "string" ? diagnostic.at : null
    };
  } catch {
    return { status: "unreadable", reason: "invalid-json", redirectTo: null, source: null, at: null };
  }
}
