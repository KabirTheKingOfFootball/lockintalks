import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getRequestOrigin(request);
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  try {
    console.info("[LockInTalks auth finalize] Finalize request received.");
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn(`[LockInTalks auth finalize] Session not confirmed: ${userError?.message || "No active session"}`);
      return redirectNoStore(origin, `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Your login session could not be confirmed. Please log in again.")}`);
    }

    console.info("[LockInTalks auth finalize] Session confirmed.");
    const role = await getUserRoleFromClient(supabase, user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    console.info(`[LockInTalks auth finalize] Role loaded: ${role}. Redirect target selected: ${redirectTo}`);

    return redirectNoStore(origin, redirectTo);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth finalize] ${error.message}`);
      return redirectNoStore(origin, `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(getReadableSupabaseError(error, "Login could not be completed."))}`);
    }

    console.error("[LockInTalks auth finalize] Unexpected finalize error:", error);
    return redirectNoStore(origin, `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Login could not be completed. Please try again.")}`);
  }
}

function redirectNoStore(origin: string, path: string) {
  const response = NextResponse.redirect(buildAppUrl(origin, path));
  response.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return response;
}
