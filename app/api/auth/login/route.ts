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

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`[LockInTalks auth login] Supabase signIn failed for ${maskEmail(email)}: ${error.message}`);
      return authErrorRedirect(origin, next, getReadableSupabaseError(error, "Login failed."));
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn(`[LockInTalks auth login] Login succeeded, but server session was not confirmed: ${userError?.message || "No active session"}`);
      return authErrorRedirect(origin, next, "Your login session could not be confirmed. Please try again.");
    }

    const role = await getUserRoleFromClient(supabase, user.id);
    const redirectTo = getPostAuthRedirect(role, next);
    console.info(`[LockInTalks auth login] Server session confirmed. Role: ${role}. Redirect: ${redirectTo}.`);
    const response = NextResponse.redirect(buildAppUrl(origin, redirectTo), { status: 303 });
    Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
    console.info(`[LockInTalks auth login] Final response status: ${response.status}.`);
    return response;
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
