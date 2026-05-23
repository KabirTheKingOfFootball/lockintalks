import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const next = String(body.next || "/dashboard");

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter the student's name." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a valid email and a password with at least 6 characters." }, { status: 400 });
    }

    const origin = getRequestOrigin(request);
    const emailRedirectTo = buildAppUrl(origin, `/auth/callback?next=${encodeURIComponent(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard")}`);
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
      return NextResponse.json({ error: getReadableSupabaseError(error, "Signup failed.") }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: !data.session
    });
  } catch (error) {
    console.error("[LockInTalks auth signup] Unexpected signup error:", error);
    return NextResponse.json({ error: getReadableSupabaseError(error, "Signup is temporarily unavailable.") }, { status: error instanceof SupabaseConfigError ? 503 : 500 });
  }
}
