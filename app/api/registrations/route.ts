import { NextResponse, type NextRequest } from "next/server";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getLaunchCompetitionDefault } from "@/lib/competition-defaults";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistrationRequest = {
  competitionSlug?: string;
  studentName?: string;
  studentAge?: number | string;
  guardianName?: string;
  guardianEmail?: string;
  city?: string;
  country?: string;
};

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegistrationRequest;
    const competitionSlug = String(body.competitionSlug || "").trim();
    const studentName = String(body.studentName || "").trim();
    const studentAge = Number(body.studentAge);
    const guardianName = String(body.guardianName || "").trim();
    const guardianEmail = String(body.guardianEmail || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "").trim();

    if (!competitionSlug || !studentName || !guardianName || !city || !country) {
      return jsonError("Please complete all required fields.", 400);
    }

    if (!Number.isFinite(studentAge) || studentAge < 6 || studentAge > 19) {
      return jsonError("Student age must be between 6 and 19.", 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(guardianEmail)) {
      return jsonError("Please enter a valid guardian email.", 400);
    }

    const session = await getServerAuthSession();

    if (!session.authenticated) {
      console.warn("[LockInTalks registration] Registration auth check failed: No active server session.");
      return NextResponse.json(
        {
          error: "Please Log In or Create an Account Before Registering for a Competition.",
          loginTo: `/login?next=${encodeURIComponent(`/register/${competitionSlug}`)}`
        },
        { status: 401, headers: noStoreHeaders }
      );
    }

    console.info(`[LockInTalks registration] Registration auth check passed from ${session.source}.`);
    const supabaseAdmin = createAdminClient();
    const { data: competition, error: competitionError } = await supabaseAdmin
      .from("competitions")
      .select("slug,name,fee_label,fee_amount,status")
      .eq("slug", competitionSlug)
      .eq("status", "live")
      .maybeSingle();

    if (competitionError) {
      console.error(`[LockInTalks registration] Competition lookup failed: ${competitionError.message}`);
      return jsonError("This competition could not be loaded right now. Please try again.", 500);
    }

    if (!competition) {
      return jsonError("This competition is not available for registration right now.", 404);
    }

    const { data: existingRegistration, error: existingError } = await supabaseAdmin
      .from("registrations")
      .select("id,payment_status")
      .eq("user_id", session.user.id)
      .eq("competition_slug", competition.slug)
      .not("payment_status", "in", "(failed,cancelled,refunded)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.warn(`[LockInTalks registration] Duplicate registration check skipped: ${existingError.message}`);
    }

    if (existingRegistration) {
      return NextResponse.json(
        {
          ok: true,
          registrationId: existingRegistration.id,
          alreadyRegistered: true,
          paymentStatus: existingRegistration.payment_status,
          redirectTo: existingRegistration.payment_status === "captured" || existingRegistration.payment_status === "paid" ? "/dashboard" : undefined
        },
        { status: 200, headers: noStoreHeaders }
      );
    }

    const launchDefault = getLaunchCompetitionDefault(competition.slug);
    const parsedFeeAmount = Number(competition.fee_amount);
    const feeLabel = String(competition.fee_label || "").trim() || launchDefault?.feeLabel || formatFeeLabel(parsedFeeAmount);

    const { data, error: insertError } = await supabaseAdmin
      .from("registrations")
      .insert({
        user_id: session.user.id,
        competition_slug: competition.slug,
        competition_name: competition.name,
        student_name: studentName,
        student_age: studentAge,
        guardian_name: guardianName,
        guardian_email: guardianEmail,
        city,
        country,
        city_country: `${city}, ${country}`,
        entry_fee: feeLabel,
        registration_status: "submitted",
        age_proof_status: "not_required_yet",
        payment_required: true,
        payment_provider: "razorpay",
        payment_status: "pending"
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(`[LockInTalks registration] Insert failed: ${insertError.message}`);
      return jsonError(getReadableSupabaseError(insertError, "Registration could not be saved."), 400);
    }

    return NextResponse.json({ ok: true, registrationId: data.id }, { status: 200, headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks registration] ${error.message}`);
      return jsonError(error.message, 503);
    }

    console.error("[LockInTalks registration] Unexpected registration error:", error);
    return jsonError("Registration is temporarily unavailable. Please try again.", 500);
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders });
}

function formatFeeLabel(feeAmountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(feeAmountPaise) || 0));
  if (!amount) return "Calculated at Checkout";
  return `INR ${(amount / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
