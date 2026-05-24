import { NextResponse, type NextRequest } from "next/server";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { authNoStoreHeaders, createAuthRouteClient } from "@/lib/supabase/auth-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  const origin = getRequestOrigin(request);

  if (!code) {
    console.warn("[LockInTalks auth callback] Missing auth code in callback URL.");
    return redirectNoStore(origin, "/login?error=missing-auth-code");
  }

  try {
    const { supabase, applyAuthCookies, getAuthCookieWriteCount } = createAuthRouteClient(request, "GET /auth/callback");
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(`[LockInTalks auth callback] Code exchange failed: ${error.message}`);
      return applyAuthCookies(redirectNoStore(origin, `/login?error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`));
    }

    if (getAuthCookieWriteCount() === 0) {
      console.warn("[LockInTalks auth callback] Code exchange succeeded, but no auth cookie writes were captured.");
    }
    console.info("[LockInTalks auth callback] Code exchange succeeded. Redirecting through finalize.");
    return applyAuthCookies(redirectNoStore(origin, `/auth/finalize?next=${encodeURIComponent(next)}`));
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth callback] ${error.message}`);
      return redirectNoStore(origin, `/login?error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`);
    }

    console.error("[LockInTalks auth callback] Unexpected callback error:", error);
    return redirectNoStore(origin, "/login?error=auth-callback-failed");
  }
}

function redirectNoStore(origin: string, path: string) {
  const response = NextResponse.redirect(buildAppUrl(origin, path));
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}
