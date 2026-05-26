import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appSessionCookieName } from "@/lib/auth/app-session";
import { getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabaseEnv();
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);

  if (!env.ok) {
    console.error(`[LockInTalks Supabase proxy] ${env.message}`);
    return supabaseResponse;
  }

  // The signed LockInTalks app session is the production auth source of truth.
  // When it is present, avoid refreshing Supabase cookies on navigation because
  // a stale Supabase cookie was causing route-to-route auth disagreement.
  if (cookieNames.includes(appSessionCookieName)) {
    return supabaseResponse;
  }

  if (getSupabaseAuthCookieNames(cookieNames).length === 0) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers = {}) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      }
    });

    const { error } = await supabase.auth.getUser();

    if (error && !isExpectedMissingSession(error.message)) {
      console.warn(`[LockInTalks Supabase proxy] Could not refresh auth session for ${request.nextUrl.pathname}: ${error.message}`);
    }
  } catch (error) {
    console.error(`[LockInTalks Supabase proxy] Unexpected session refresh error for ${request.nextUrl.pathname}:`, error);
  }

  return supabaseResponse;
}

function isExpectedMissingSession(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("auth session missing") || normalized.includes("session_not_found") || normalized.includes("no active session");
}
