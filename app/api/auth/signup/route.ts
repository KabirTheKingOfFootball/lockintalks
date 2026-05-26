import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { setAppSessionCookie, AppSessionConfigError } from "@/lib/auth/app-session";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getUserRole } from "@/lib/auth/session";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

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
  const formPost = isFormPost(request);
  let next = "/dashboard";

  try {
    const body = await readSignupRequest(request, formPost);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    next = normalizeNextPath(body.next, "/dashboard");
    const origin = getRequestOrigin(request);

    console.info(`[LockInTalks auth signup] Signup route hit for ${maskEmail(email)}.`);

    if (name.length < 2) {
      return authError(request, formPost, "Please enter the student's name.", 400, next);
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return authError(request, formPost, "Enter a valid email and a password with at least 6 characters.", 400, next);
    }

    const supabase = await createClient();
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
      return authError(request, formPost, getReadableSupabaseError(error, "Signup failed."), 400, next);
    }

    if (!data.session || !data.user) {
      console.info(`[LockInTalks auth signup] Signup created account for ${maskEmail(email)}. Email confirmation is required.`);
      if (formPost) {
        return redirectNoStore(request, `/login?next=${encodeURIComponent(next)}&notice=${encodeURIComponent("Account Created. Please check your email to confirm your account, then log in.")}`);
      }

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
    const response = formPost
      ? htmlRedirectNoStore(redirectTo)
      : NextResponse.json(
          {
            ok: true,
            needsEmailConfirmation: false,
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
    console.info(`[LockInTalks auth signup] Signup verified. Response cookie write count: ${responseCookieNames.length}. Cookie names: ${responseCookieNames.join(", ") || "none"}. Set-Cookie header present: ${Boolean(response.headers.get("set-cookie"))}. Role: ${role}. Redirect: ${redirectTo}.`);
    return response;
  } catch (error) {
    if (error instanceof AppSessionConfigError || error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth signup] ${error.message}`);
      return authError(request, formPost, error.message, 503, next);
    }

    console.error("[LockInTalks auth signup] Unexpected signup error:", error);
    return authError(request, formPost, "Signup is temporarily unavailable. Please try again.", 500, next);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: authNoStoreHeaders });
}

function authError(request: NextRequest, formPost: boolean, error: string, status: number, nextPath: string) {
  if (!formPost) return jsonError(error, status);
  return redirectNoStore(request, `/signup?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(error)}`);
}

async function readSignupRequest(request: NextRequest, formPost: boolean): Promise<SignupRequest> {
  if (!formPost) return (await request.json()) as SignupRequest;
  const formData = await request.formData();
  return {
    name: String(formData.get("name") || ""),
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

function htmlRedirectNoStore(path: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="2;url=${escapeHtmlAttribute(safePath)}"><title>Creating Account</title></head><body style="background:#020817;color:white;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;margin:0"><main style="text-align:center"><h1>Opening Your Account...</h1><p>Please wait while LockInTalks prepares your dashboard.</p></main><script>setTimeout(function(){window.location.replace(${JSON.stringify(safePath)});},900);</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      ...authNoStoreHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "X-LockInTalks-Redirect": safePath
    }
  });
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

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
