import { NextResponse } from "next/server";
import { getRoleRedirect } from "@/lib/auth/redirect";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { authNoStoreHeaders } from "@/lib/auth/http";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        { status: 200, headers: authNoStoreHeaders }
      );
    }

    console.info("[LockInTalks auth session] Session confirmed.");
    const role = await getUserRoleFromClient(supabase, user.id);
    return NextResponse.json(
      { authenticated: true, user: { id: user.id, email: user.email || "" }, role, redirectTo: getRoleRedirect(role) },
      { status: 200, headers: authNoStoreHeaders }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth session] ${error.message}`);
      return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: error.message }, { status: 503, headers: authNoStoreHeaders });
    }

    console.error("[LockInTalks auth session] Unexpected session check error:", error);
    return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: "Could not verify session." }, { status: 500, headers: authNoStoreHeaders });
  }
}
