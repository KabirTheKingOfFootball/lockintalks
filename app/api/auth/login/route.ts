import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { authNoStoreHeaders, clearSupabaseAuthCookies, maskEmail } from "@/lib/auth/http";
import { getUserRole } from "@/lib/auth/session";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

    console.info(`[LockInTalks auth login] Login request received for ${maskEmail(email)}.`);

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return jsonError("Enter a valid email and password.", 400);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      console.warn(`[LockInTalks auth login] Supabase login failed for ${maskEmail(email)}: ${error?.message || "No session returned"}`);
      return jsonError(getReadableSupabaseError(error, "Invalid login credentials."), 401);
    }

    const role = await getUserRole(data.user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    const response = NextResponse.json(
      {
        ok: true,
        user: { id: data.user.id, email: data.user.email || email },
        role,
        redirectTo
      },
      { status: 200, headers: authNoStoreHeaders }
    );

    setAppSessionCookie(response, {
      userId: data.user.id,
      email: data.user.email || email,
      role
    });
    clearSupabaseAuthCookies(response, request.cookies.getAll().map((cookie) => cookie.name));

    console.info(`[LockInTalks auth login] Login success for ${maskEmail(email)}. Role: ${role}. Redirect: ${redirectTo}. Set-Cookie header: ${Boolean(response.headers.get("set-cookie"))}.`);
    return response;
  } catch (error) {
    if (error instanceof AppSessionConfigError || error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth login] ${error.message}`);
      return jsonError(error.message, 503);
    }

    console.error("[LockInTalks auth login] Unexpected login error:", error);
    return jsonError("Login is temporarily unavailable. Please try again.", 500);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: authNoStoreHeaders });
}

function normalizeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
