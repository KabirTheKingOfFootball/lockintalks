import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { authNoStoreHeaders, createAuthRouteClient, maskEmail } from "@/lib/supabase/auth-route";

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
  const origin = getRequestOrigin(request);

  try {
    const body = await readLoginRequest(request);
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const next = normalizeNextPath(body.next, "/dashboard");
    console.info(`[LockInTalks auth login] Login route hit. Email: ${maskEmail(email)}. Next: ${next}.`);

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return authErrorRedirect(origin, next, "Enter a valid email and password.");
    }

    const { supabase, applyAuthCookies, getAuthCookieWriteCount, getAuthCookieWriteNames } = createAuthRouteClient(request, "POST /api/auth/login");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`[LockInTalks auth login] Supabase signIn failed for ${maskEmail(email)}: ${error.message}`);
      return applyAuthCookies(authErrorRedirect(origin, next, getReadableSupabaseError(error, "Login failed.")));
    }

    if (!data.session || !data.user) {
      console.warn(`[LockInTalks auth login] Supabase signIn returned success but usable session was missing. User exists: ${Boolean(data.user)}. Session exists: ${Boolean(data.session)}.`);
      return applyAuthCookies(authErrorRedirect(origin, next, "Login could not create a session. Please try again."));
    }

    const finalizeTo = `/auth/finalize?next=${encodeURIComponent(next)}`;
    console.info(`[LockInTalks auth login] Supabase signIn success. User exists: ${Boolean(data.user)}. User id exists: ${Boolean(data.user.id)}. Session exists: ${Boolean(data.session)}.`);
    console.info(`[LockInTalks auth login] Cookie writes captured: ${getAuthCookieWriteCount()}. Cookie names: ${getAuthCookieWriteNames().join(", ") || "none"}. Finalize target: ${finalizeTo}.`);
    if (getAuthCookieWriteCount() === 0) {
      console.warn("[LockInTalks auth login] Login succeeded, but no auth cookie writes were captured.");
    }
    const response = NextResponse.redirect(buildAppUrl(origin, finalizeTo), { status: 303 });
    Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
    const finalResponse = applyAuthCookies(response);
    console.info(`[LockInTalks auth login] Final response status: ${finalResponse.status}. Set-Cookie present: ${finalResponse.headers.has("set-cookie")}.`);
    return finalResponse;
  } catch (error) {
    console.error("[LockInTalks auth login] Unexpected login error:", error);
    return authErrorRedirect(origin, "/dashboard", getReadableSupabaseError(error, error instanceof SupabaseConfigError ? "Supabase is not configured correctly." : "Login is temporarily unavailable."));
  }
}

async function readLoginRequest(request: NextRequest): Promise<LoginRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LoginRequest;
  }

  const formData = await request.formData();
  return {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "")
  };
}

function authErrorRedirect(origin: string, next: string, message: string) {
  const safeNext = normalizeNextPath(next, "/dashboard");
  const response = NextResponse.redirect(buildAppUrl(origin, `/login?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent(message)}`), { status: 303 });
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}
