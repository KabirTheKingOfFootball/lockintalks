import { NextResponse, type NextRequest } from "next/server";
import { appSessionCookieName, AppSessionConfigError, getAppSessionDiagnostics, inspectAppSessionCookie } from "@/lib/auth/app-session";
import { authNoStoreHeaders, getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getRequestOrigin } from "@/lib/site-url";
import { getSupabaseDiagnostics, getSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();
  const supabaseAuthCookieNames = getSupabaseAuthCookieNames(cookieNames);
  const env = getSupabaseEnv();
  const diagnostics = getSupabaseDiagnostics();
  const session = await safeSession();
  const host = request.headers.get("host") || request.nextUrl.host;

  return NextResponse.json(
    {
      authenticated: session.authenticated,
      authSource: session.source,
      user: session.authenticated ? { email: session.user.email } : null,
      role: session.role,
      authError: session.authenticated ? null : "No active app session.",
      cookieCount: cookieNames.length,
      cookieNames,
      supabaseAuthCookieNames,
      hasSupabaseAuthCookies: supabaseAuthCookieNames.length > 0,
      appSessionCookieName,
      hasAppSessionCookie: cookieNames.includes(appSessionCookieName),
      appSession: getAppSessionDiagnostics(),
      appSessionCookie: await inspectAppSessionCookie(),
      request: {
        host,
        forwardedHost: request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || null,
        protocol: request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", ""),
        origin: getRequestOrigin(request),
        nextUrlOrigin: request.nextUrl.origin
      },
      supabase: {
        configured: env.ok,
        urlHost: env.ok ? safeHost(env.url) : null,
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
    },
    { status: 200, headers: authNoStoreHeaders }
  );
}

async function safeSession() {
  try {
    return await getServerAuthSession();
  } catch (error) {
    if (error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks debug auth cookies] ${error.message}`);
    } else {
      console.error("[LockInTalks debug auth cookies] Could not read app session:", error);
    }

    return {
      authenticated: false as const,
      source: null,
      user: null,
      role: null,
      redirectTo: "/login" as const
    };
  }
}

function safeHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}
