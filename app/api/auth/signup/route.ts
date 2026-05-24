import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { authNoStoreHeaders, createAuthRouteClient } from "@/lib/supabase/auth-route";

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
    console.info("[LockInTalks auth signup] Signup request received.");

    if (name.length < 2) {
      return signupRedirect(origin, next, "Please enter the student's name.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return signupRedirect(origin, next, "Enter a valid email and a password with at least 6 characters.");
    }

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
      return applyAuthCookies(signupRedirect(origin, next, getReadableSupabaseError(error, "Signup failed.")));
    }

    if (!data.session) {
      console.info("[LockInTalks auth signup] Signup succeeded. Email confirmation is required before login.");
      return applyAuthCookies(loginNoticeRedirect(origin, next, "Account Created. Please check your email to confirm your account, then log in."));
    }

    if (getAuthCookieWriteCount() === 0) {
      console.warn("[LockInTalks auth signup] Signup created an active session, but no auth cookie writes were captured.");
    }
    console.info("[LockInTalks auth signup] Signup succeeded with active session. Redirecting through finalize.");

    const response = NextResponse.redirect(buildAppUrl(origin, `/auth/finalize?next=${encodeURIComponent(next)}`), { status: 303 });
    Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
    return applyAuthCookies(response);
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
