import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabaseEnv();

  if (!env.ok) {
    console.error(`[LockInTalks Supabase proxy] ${env.message}`);
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
