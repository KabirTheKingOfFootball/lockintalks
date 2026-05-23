import { NextResponse, type NextRequest } from "next/server";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { getReadableSupabaseError } from "@/lib/readable-error";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  const origin = getRequestOrigin(request);

  if (!code) {
    console.warn("[LockInTalks auth callback] Missing auth code in callback URL.");
    return NextResponse.redirect(buildAppUrl(origin, "/login?error=missing-auth-code"));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(`[LockInTalks auth callback] Code exchange failed: ${error.message}`);
      return NextResponse.redirect(buildAppUrl(origin, `/login?error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`));
    }

    console.info(`[LockInTalks auth callback] Code exchange succeeded. Redirecting to ${next}.`);
    return NextResponse.redirect(buildAppUrl(origin, next));
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth callback] ${error.message}`);
      return NextResponse.redirect(buildAppUrl(origin, `/login?error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`));
    }

    console.error("[LockInTalks auth callback] Unexpected callback error:", error);
    return NextResponse.redirect(buildAppUrl(origin, "/login?error=auth-callback-failed"));
  }
}
