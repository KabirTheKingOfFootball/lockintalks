import { NextResponse } from "next/server";
import { getRoleRedirect } from "@/lib/auth/redirect";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (error) console.warn(`[LockInTalks auth session] Session check failed: ${error.message}`);
      return NextResponse.json(
        { authenticated: false, user: null, role: null, redirectTo: "/login" },
        { status: 200, headers: noStoreHeaders }
      );
    }

    console.info("[LockInTalks auth session] Session confirmed.");
    const role = await getUserRoleFromClient(supabase, user.id);
    return NextResponse.json(
      { authenticated: true, user: { id: user.id, email: user.email || "" }, role, redirectTo: getRoleRedirect(role) },
      { status: 200, headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth session] ${error.message}`);
      return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: error.message }, { status: 503, headers: noStoreHeaders });
    }

    console.error("[LockInTalks auth session] Unexpected session check error:", error);
    return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: "Could not verify session." }, { status: 500, headers: noStoreHeaders });
  }
}
