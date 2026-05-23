import { NextResponse, type NextRequest } from "next/server";
import { buildAppUrl, getRequestOrigin } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);

  try {
    const supabase = await createClient();
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
  response.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return response;
}
