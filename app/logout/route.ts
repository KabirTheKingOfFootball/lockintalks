import { NextResponse, type NextRequest } from "next/server";
import { clearAppSessionCookie } from "@/lib/auth/app-session";
import { authNoStoreHeaders } from "@/lib/auth/http";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
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

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  clearAppSessionCookie(response);
  return response;
}
