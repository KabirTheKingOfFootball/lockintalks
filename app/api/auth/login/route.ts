import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { authNoStoreHeaders, createAuthRouteClient } from "@/lib/supabase/auth-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequest = {
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const next = normalizeNextPath(body.next, "/dashboard");
    console.info("[LockInTalks auth login] Login request received.");

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400, headers: authNoStoreHeaders });
    }

    const { supabase, applyAuthCookies, getAuthCookieWriteCount } = createAuthRouteClient(request, "POST /api/auth/login");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`[LockInTalks auth login] Supabase login failed: ${error.message}`);
      return applyAuthCookies(NextResponse.json({ error: getReadableSupabaseError(error, "Login failed.") }, { status: 401, headers: authNoStoreHeaders }));
    }

    if (!data.session || !data.user) {
      console.warn("[LockInTalks auth login] Supabase login succeeded without a usable session.");
      return applyAuthCookies(NextResponse.json({ error: "Login could not create a session. Please try again." }, { status: 401, headers: authNoStoreHeaders }));
    }

    const finalizeTo = `/auth/finalize?next=${encodeURIComponent(next)}`;
    if (getAuthCookieWriteCount() === 0) {
      console.warn("[LockInTalks auth login] Login succeeded, but no auth cookie writes were captured.");
    }
    console.info("[LockInTalks auth login] Login succeeded. Redirecting through finalize.");
    return applyAuthCookies(NextResponse.json({ ok: true, finalizeTo }, { headers: authNoStoreHeaders }));
  } catch (error) {
    console.error("[LockInTalks auth login] Unexpected login error:", error);
    return NextResponse.json({ error: getReadableSupabaseError(error, "Login is temporarily unavailable.") }, { status: error instanceof SupabaseConfigError ? 503 : 500, headers: authNoStoreHeaders });
  }
}
