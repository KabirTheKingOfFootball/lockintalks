import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders, maskEmail } from "@/lib/auth/http";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { buildAppUrl, getRequestOrigin, normalizeNextPath } from "@/lib/site-url";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ResendConfirmationRequest = {
  email?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResendConfirmationRequest;
    const email = String(body.email || "").trim();
    const next = normalizeNextPath(body.next, "/dashboard");
    const origin = getRequestOrigin(request);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return jsonError("Enter the email address you used to sign up.", 400);
    }

    const emailRedirectTo = buildAppUrl(origin, `/auth/callback?next=${encodeURIComponent(next)}`);
    console.info(`[LockInTalks auth resend] Resend confirmation requested for ${maskEmail(email)}.`);

    const supabase = createPublicClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo
      }
    });

    if (error) {
      console.warn(`[LockInTalks auth resend] Supabase resend failed for ${maskEmail(email)}: ${error.message}`);
      return jsonError(getReadableSupabaseError(error, "Could not resend verification email."), 400);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Verification email sent. Please check your inbox and spam folder."
      },
      { status: 200, headers: authNoStoreHeaders }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks auth resend] ${error.message}`);
      return jsonError(error.message, 503);
    }

    console.error("[LockInTalks auth resend] Unexpected resend error:", error);
    return jsonError("Could not resend verification email right now.", 500);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: authNoStoreHeaders });
}
