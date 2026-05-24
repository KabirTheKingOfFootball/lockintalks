import { NextResponse, type NextRequest } from "next/server";
import { buildAppUrl, getRequestOrigin } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { authNoStoreHeaders, createAuthRouteClient } from "@/lib/supabase/auth-route";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  let applyAuthCookies: ((response: NextResponse) => NextResponse) | null = null;

  try {
    const authRoute = createAuthRouteClient(request, "GET /logout");
    const supabase = authRoute.supabase;
    applyAuthCookies = authRoute.applyAuthCookies;
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(`[LockInTalks logout] Sign out failed: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks logout] ${error.message}`);
    } else {
      console.error("[LockInTalks logout] Unexpected logout error:", error);
    }
  }

  const response = NextResponse.redirect(buildAppUrl(origin, "/login"));
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return applyAuthCookies ? applyAuthCookies(response) : response;
}
