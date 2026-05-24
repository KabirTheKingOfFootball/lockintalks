import { NextResponse, type NextRequest } from "next/server";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { getRequestOrigin } from "@/lib/site-url";
import { authNoStoreHeaders, createAuthRouteClient, getSupabaseAuthCookieNames } from "@/lib/supabase/auth-route";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();
  const supabaseAuthCookieNames = getSupabaseAuthCookieNames(cookieNames);
  const env = getSupabaseEnv();
  const host = request.headers.get("host") || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "");
  const origin = getRequestOrigin(request);
  const supabaseUrlHost = env.ok ? safeHost(env.url) : null;
  const basePayload = {
    cookieCount: cookieNames.length,
    cookieNames,
    supabaseAuthCookieNames,
    hasSupabaseAuthCookies: supabaseAuthCookieNames.length > 0,
    request: {
      host,
      protocol,
      origin
    },
    supabase: {
      configured: env.ok,
      urlHost: supabaseUrlHost,
      keySource: env.ok ? env.keySource : null,
      error: env.ok ? null : env.message
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      vercel: process.env.VERCEL === "1",
      vercelEnvironment: process.env.VERCEL_ENV || null,
      vercelUrlConfigured: Boolean(process.env.VERCEL_URL)
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
    const { supabase, applyAuthCookies } = createAuthRouteClient(request, "GET /api/debug/auth-cookies");
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (error) console.warn(`[LockInTalks debug auth cookies] No server session found: ${error.message}`);
      return applyAuthCookies(NextResponse.json(
        {
          authenticated: false,
          user: null,
          role: null,
          authError: error?.message || "No active server session.",
          ...basePayload
        },
        { status: 200, headers: authNoStoreHeaders }
      ));
    }

    const role = await getUserRoleFromClient(supabase, user.id);
    console.info("[LockInTalks debug auth cookies] Server session confirmed for debug endpoint.");
    return applyAuthCookies(NextResponse.json(
      {
        authenticated: true,
        user: {
          email: user.email || null
        },
        role,
        authError: null,
        ...basePayload
      },
      { status: 200, headers: authNoStoreHeaders }
    ));
  } catch (error) {
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
