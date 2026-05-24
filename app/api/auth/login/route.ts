import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

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

    console.info(`[LockInTalks auth login] Login route hit for ${maskEmail(email)}.`);

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return jsonError("Enter a valid email and password.", 400);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      console.warn(`[LockInTalks auth login] Supabase login failed for ${maskEmail(email)}: ${error?.message || "No session returned"}`);
      return jsonError(getReadableSupabaseError(error, "Invalid login credentials."), 401);
    }

    const role = await getUserRoleFromClient(supabase, data.user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    const response = NextResponse.json(
      {
        ok: true,
        authSource: "app-session",
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

    console.info(`[LockInTalks auth login] Login verified. App session cookie set. Role: ${role}. Redirect: ${redirectTo}.`);
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
