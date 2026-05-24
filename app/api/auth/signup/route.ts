import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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
  const origin = getRequestOrigin(request);

  try {
    const body = await readSignupRequest(request);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const next = normalizeNextPath(body.next, "/dashboard");
    console.info(`[LockInTalks auth signup] Signup request received for ${maskEmail(email)}.`);

    if (name.length < 2) {
      return signupRedirect(origin, next, "Please enter the student's name.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return signupRedirect(origin, next, "Enter a valid email and a password with at least 6 characters.");
    }

    const emailRedirectTo = buildAppUrl(origin, `/auth/callback?next=${encodeURIComponent(next)}`);
    console.info(`[LockInTalks auth signup] Using email redirect origin ${origin} and callback ${emailRedirectTo}`);

    const supabase = await createClient();
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
      return signupRedirect(origin, next, getReadableSupabaseError(error, "Signup failed."));
    }

    if (!data.session) {
      console.info("[LockInTalks auth signup] Signup succeeded. Email confirmation is required before login.");
      return loginNoticeRedirect(origin, next, "Account Created. Please check your email to confirm your account, then log in.");
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn(`[LockInTalks auth signup] Signup created session, but server confirmation failed: ${userError?.message || "No active session"}`);
      return loginNoticeRedirect(origin, next, "Account Created. Please log in to continue.");
    }

    const role = await getUserRoleFromClient(supabase, user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    console.info(`[LockInTalks auth signup] Signup confirmed. Role: ${role}. Redirect: ${redirectTo}.`);
    const response = NextResponse.redirect(buildAppUrl(origin, redirectTo), { status: 303 });
    Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
    return response;
  } catch (error) {
    console.error("[LockInTalks auth signup] Unexpected signup error:", error);
    return signupRedirect(origin, "/dashboard", getReadableSupabaseError(error, error instanceof SupabaseConfigError ? "Supabase is not configured correctly." : "Signup is temporarily unavailable."));
  }
}

async function readSignupRequest(request: NextRequest): Promise<SignupRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as SignupRequest;
  }

  const formData = await request.formData();
  return {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "")
  };
}

function signupRedirect(origin: string, next: string, message: string) {
  const safeNext = normalizeNextPath(next, "/dashboard");
  const response = NextResponse.redirect(buildAppUrl(origin, `/signup?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent(message)}`), { status: 303 });
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}

function loginNoticeRedirect(origin: string, next: string, message: string) {
  const safeNext = normalizeNextPath(next, "/dashboard");
  const response = NextResponse.redirect(buildAppUrl(origin, `/login?next=${encodeURIComponent(safeNext)}&notice=${encodeURIComponent(message)}`), { status: 303 });
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}
