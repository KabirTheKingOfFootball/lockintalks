import { NextResponse, type NextRequest } from "next/server";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`[LockInTalks auth login] Supabase login failed: ${error.message}`);
      return NextResponse.json({ error: getReadableSupabaseError(error, "Login failed.") }, { status: 401 });
    }

    console.info(`[LockInTalks auth login] Login succeeded. Session set: ${Boolean(data.session)} User set: ${Boolean(data.user)}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LockInTalks auth login] Unexpected login error:", error);
    return NextResponse.json({ error: getReadableSupabaseError(error, "Login is temporarily unavailable.") }, { status: error instanceof SupabaseConfigError ? 503 : 500 });
  }
}
