import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getUserRole } from "@/lib/auth/session";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    const origin = getRequestOrigin(request);

    console.info(`[LockInTalks auth signup] Signup request received for ${maskEmail(email)}.`);

    if (name.length < 2) {
      return jsonError("Please enter the student's name.", 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return jsonError("Enter a valid email and a password with at least 6 characters.", 400);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        },
        emailRedirectTo: buildAppUrl(origin, `/auth/callback?next=${encodeURIComponent(next)}`)
      }
    });

    if (error) {
      console.warn(`[LockInTalks auth signup] Supabase signup failed for ${maskEmail(email)}: ${error.message}`);
      return jsonError(getReadableSupabaseError(error, "Signup failed."), 400);
    }

    if (!data.session || !data.user) {
      console.info(`[LockInTalks auth signup] Signup created account for ${maskEmail(email)}. Email confirmation is required.`);
      return NextResponse.json(
        {
          ok: true,
          needsEmailConfirmation: true,
          message: "Account Created. Please check your email to confirm your account, then log in."
        },
        { status: 200, headers: authNoStoreHeaders }
      );
    }

    const role = await getUserRole(data.user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    const response = NextResponse.json(
      {
        ok: true,
        needsEmailConfirmation: false,
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

    console.info(`[LockInTalks auth signup] Signup session created for ${maskEmail(email)}. Role: ${role}. Redirect: ${redirectTo}. Set-Cookie header: ${Boolean(response.headers.get("set-cookie"))}.`);
    return response;
  } catch (error) {
    if (error instanceof AppSessionConfigError || error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth signup] ${error.message}`);
      return jsonError(error.message, 503);
    }

    console.error("[LockInTalks auth signup] Unexpected signup error:", error);
    return jsonError("Signup is temporarily unavailable. Please try again.", 500);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: authNoStoreHeaders });
}

function normalizeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
