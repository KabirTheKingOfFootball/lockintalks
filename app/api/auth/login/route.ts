import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getUserRole } from "@/lib/auth/session";
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
  const formPost = isFormPost(request);
  let next = "/dashboard";

  try {
    const body = await readLoginRequest(request, formPost);
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    next = normalizeNextPath(body.next, "/dashboard");

    console.info(`[LockInTalks auth login] Login route hit for ${maskEmail(email)}.`);

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return authError(request, formPost, "Enter a valid email and password.", 400, next);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      console.warn(`[LockInTalks auth login] Supabase login failed for ${maskEmail(email)}: ${error?.message || "No session returned"}`);
      return authError(request, formPost, getReadableSupabaseError(error, "Invalid login credentials."), 401, next);
    }

    console.info(`[LockInTalks auth login] Supabase sign-in succeeded for ${maskEmail(email)}. User exists: ${Boolean(data.user)}. Session exists: ${Boolean(data.session)}.`);
    const role = await getUserRole(data.user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    const response = formPost
      ? redirectNoStore(request, redirectTo)
      : NextResponse.json(
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

    const responseCookieNames = response.cookies.getAll().map((cookie) => cookie.name);
    console.info(`[LockInTalks auth login] Login verified. Response cookie write count: ${responseCookieNames.length}. Cookie names: ${responseCookieNames.join(", ") || "none"}. Set-Cookie header present: ${Boolean(response.headers.get("set-cookie"))}. Role: ${role}. Redirect: ${redirectTo}.`);
    return response;
  } catch (error) {
    if (error instanceof AppSessionConfigError || error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth login] ${error.message}`);
      return authError(request, formPost, error.message, 503, next);
    }

    console.error("[LockInTalks auth login] Unexpected login error:", error);
    return authError(request, formPost, "Login is temporarily unavailable. Please try again.", 500, next);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: authNoStoreHeaders });
}

function authError(request: NextRequest, formPost: boolean, error: string, status: number, nextPath: string) {
  if (!formPost) return jsonError(error, status);
  return redirectNoStore(request, `/login?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(error)}`);
}

async function readLoginRequest(request: NextRequest, formPost: boolean): Promise<LoginRequest> {
  if (!formPost) return (await request.json()) as LoginRequest;
  const formData = await request.formData();
  return {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "")
  };
}

function redirectNoStore(request: NextRequest, path: string) {
  const response = NextResponse.redirect(buildSameHostUrl(request, path), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}

function normalizeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function isFormPost(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function buildSameHostUrl(request: NextRequest, path: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new URL(safePath, request.url);
}
