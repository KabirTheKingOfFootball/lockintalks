"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { maskEmail } from "@/lib/auth/http";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = normalizeNextPath(String(formData.get("next") || ""), "/dashboard");

  console.info(`[LockInTalks auth action] Login started for ${maskEmail(email)}. Next: ${next}.`);

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    redirectWithLoginError(next, "Enter a valid email and password.");
  }

  const supabase = await getActionClient("login", next);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error(`[LockInTalks auth action] Login failed for ${maskEmail(email)}: ${error.message}`);
    redirectWithLoginError(next, getReadableSupabaseError(error, "Login failed."));
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn(`[LockInTalks auth action] Login session was not confirmed: ${userError?.message || "No active session"}`);
    redirectWithLoginError(next, "Your login session could not be confirmed. Please try again.");
  }

  const role = await getUserRoleFromClient(supabase, user.id);
  const redirectTo = getPostAuthRedirect(role, next);
  console.info(`[LockInTalks auth action] Login confirmed. Role: ${role}. Redirect: ${redirectTo}.`);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = normalizeNextPath(String(formData.get("next") || ""), "/dashboard");

  console.info(`[LockInTalks auth action] Signup started for ${maskEmail(email)}. Next: ${next}.`);

  if (name.length < 2) {
    redirectWithSignupError(next, "Please enter the student's name.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    redirectWithSignupError(next, "Enter a valid email and a password with at least 6 characters.");
  }

  const supabase = await getActionClient("signup", next);
  const origin = await getActionOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error) {
    console.error(`[LockInTalks auth action] Signup failed for ${maskEmail(email)}: ${error.message}`);
    redirectWithSignupError(next, getReadableSupabaseError(error, "Signup failed."));
  }

  if (!data.session) {
    console.info("[LockInTalks auth action] Signup created account. Email confirmation is required.");
    redirect(`/login?next=${encodeURIComponent(next)}&notice=${encodeURIComponent("Account Created. Please check your email to confirm your account, then log in.")}`);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn(`[LockInTalks auth action] Signup session was not confirmed: ${userError?.message || "No active session"}`);
    redirectWithLoginError(next, "Account created. Please log in to continue.");
  }

  const role = await getUserRoleFromClient(supabase, user.id);
  const redirectTo = getPostAuthRedirect(role, next);
  console.info(`[LockInTalks auth action] Signup confirmed. Role: ${role}. Redirect: ${redirectTo}.`);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

async function getActionClient(context: "login" | "signup", next: string) {
  try {
    return await createClient();
  } catch (error) {
    const message = getReadableSupabaseError(error, error instanceof SupabaseConfigError ? "Supabase is not configured correctly." : "Authentication is temporarily unavailable.");
    console.error(`[LockInTalks auth action] Could not create Supabase client during ${context}:`, error);

    if (context === "signup") {
      redirectWithSignupError(next, message);
    }

    redirectWithLoginError(next, message);
  }
}

function redirectWithLoginError(next: string, message: string): never {
  redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
}

function redirectWithSignupError(next: string, message: string): never {
  redirect(`/signup?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
}

async function getActionOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host") || process.env.VERCEL_URL || "localhost:3000";
  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
