import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { authNoStoreHeaders, createAuthRouteClient } from "@/lib/supabase/auth-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupRequest = {
  name?: string;
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupRequest;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const next = normalizeNextPath(body.next, "/dashboard");
    console.info("[LockInTalks auth signup] Signup request received.");

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter the student's name." }, { status: 400, headers: authNoStoreHeaders });
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a valid email and a password with at least 6 characters." }, { status: 400, headers: authNoStoreHeaders });
    }

    const origin = getRequestOrigin(request);
    const emailRedirectTo = buildAppUrl(origin, `/auth/callback?next=${encodeURIComponent(next)}`);
    console.info(`[LockInTalks auth signup] Using email redirect origin ${origin} and callback ${emailRedirectTo}`);

    const { supabase, applyAuthCookies, getAuthCookieWriteCount } = createAuthRouteClient(request, "POST /api/auth/signup");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        },
        emailRedirectTo
      }
    });

    if (error) {
      console.error(`[LockInTalks auth signup] Supabase signup failed: ${error.message}`);
      return applyAuthCookies(NextResponse.json({ error: getReadableSupabaseError(error, "Signup failed.") }, { status: 400, headers: authNoStoreHeaders }));
    }

    if (!data.session) {
      console.info("[LockInTalks auth signup] Signup succeeded. Email confirmation is required before login.");
      return applyAuthCookies(NextResponse.json(
        {
          ok: true,
          needsEmailConfirmation: true
        },
        { headers: authNoStoreHeaders }
      ));
    }

    if (getAuthCookieWriteCount() === 0) {
      console.warn("[LockInTalks auth signup] Signup created an active session, but no auth cookie writes were captured.");
    }
    console.info("[LockInTalks auth signup] Signup succeeded with active session. Redirecting through finalize.");

    return applyAuthCookies(NextResponse.json(
      {
        ok: true,
        needsEmailConfirmation: false,
        finalizeTo: `/auth/finalize?next=${encodeURIComponent(next)}`
      },
      { headers: authNoStoreHeaders }
    ));
  } catch (error) {
    console.error("[LockInTalks auth signup] Unexpected signup error:", error);
    return NextResponse.json({ error: getReadableSupabaseError(error, "Signup is temporarily unavailable.") }, { status: error instanceof SupabaseConfigError ? 503 : 500, headers: authNoStoreHeaders });
  }
}
