import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { authNoStoreHeaders } from "@/lib/auth/http";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(`[LockInTalks auth callback] Code exchange failed: ${error.message}`);
      return redirectNoStore(origin, `/login?error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`);
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn(`[LockInTalks auth callback] Code exchange succeeded, but session was not confirmed: ${userError?.message || "No active session"}`);
      return redirectNoStore(origin, `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Login could not be confirmed. Please try again.")}`);
    }

    const role = await getUserRoleFromClient(supabase, user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    console.info(`[LockInTalks auth callback] Session confirmed. Role: ${role}. Redirect: ${redirectTo}.`);
    const response = redirectNoStore(origin, redirectTo);
    setAppSessionCookie(response, {
      userId: user.id,
      email: user.email || "",
      role
    });
    return response;
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof AppSessionConfigError) {
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
