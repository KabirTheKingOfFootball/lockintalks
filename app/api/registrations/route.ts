import { NextResponse, type NextRequest } from "next/server";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { formatPaiseAsInr, getRegistrationAmountRepairPatch, resolvePayableAmountPaise } from "@/lib/payment/amounts";
import { isSeatConfirmed } from "@/lib/payment/status";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentUrl } from "@/lib/payment/registration-reference";

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

    console.info(`[LockInTalks registration] Registration auth check passed. user=${session.user.id} source=${session.source} competition=${competitionSlug}`);
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

    const { data: existingRegistrations, error: existingError } = await supabaseAdmin
      .from("registrations")
      .select("id,user_id,competition_slug,competition_name,payment_status,registration_status,payment_amount,amount_due,payment_currency,entry_fee")
      .eq("user_id", session.user.id)
      .eq("competition_slug", competition.slug)
      .order("created_at", { ascending: false })
      .limit(10);

    if (existingError) {
      console.warn(`[LockInTalks registration] Duplicate registration check skipped: ${existingError.message}`);
    }

    const existingRegistration =
      (existingRegistrations || []).find((registration) => isSeatConfirmed(registration.payment_status)) ||
      (existingRegistrations || []).find((registration) => !isSeatConfirmed(registration.payment_status));

    if (existingRegistration) {
      const alreadyPaid = isSeatConfirmed(existingRegistration.payment_status);
      const resolvedAmount = resolvePayableAmountPaise({
        registration: existingRegistration,
        competition,
        competitionSlug: competition.slug
      });

      if (!alreadyPaid) {
        await repairRegistrationAmountIfNeeded({
          registration: existingRegistration,
          resolvedAmount,
          supabaseAdmin,
          source: "registration_reuse"
        });
      }

      const paymentUrl = buildPaymentUrl({ registrationId: existingRegistration.id, competitionSlug: competition.slug });
      console.info(
        `[LockInTalks registration] Existing registration returned. current_user=${session.user.id} row_user=${existingRegistration.user_id} registration=${existingRegistration.id} competition=${existingRegistration.competition_slug} payment_status=${existingRegistration.payment_status} amount=${resolvedAmount.amountPaise} source=${resolvedAmount.source} redirect=${alreadyPaid ? "/dashboard" : paymentUrl}`
      );
      return NextResponse.json(
        {
          ok: true,
          registrationId: existingRegistration.id,
          alreadyRegistered: true,
          paymentStatus: existingRegistration.payment_status,
          paymentUrl: alreadyPaid ? undefined : paymentUrl,
          redirectTo: alreadyPaid ? "/dashboard" : paymentUrl
        },
        { status: 200, headers: noStoreHeaders }
      );
    }

    const resolvedAmount = resolvePayableAmountPaise({ competition, competitionSlug: competition.slug });
    const feeAmount = resolvedAmount.amountPaise;
    const feeLabel = formatPaiseAsInr(feeAmount);

    if (!feeAmount) {
      console.error(`[LockInTalks registration] Invalid registration amount. competition=${competition.slug} source=${resolvedAmount.source}`);
      return jsonError("This competition does not have a valid registration fee configured. Please contact support.", 400);
    }

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
        payment_status: "pending",
        payment_amount: feeAmount,
        amount_due: feeAmount,
        payment_currency: "INR"
      })
      .select("id,user_id,competition_slug")
      .single();

    if (insertError) {
      console.error(`[LockInTalks registration] Insert failed: ${insertError.message}`);
      return jsonError(getReadableSupabaseError(insertError, "Registration could not be saved."), 400);
    }

    const paymentUrl = buildPaymentUrl({ registrationId: data.id, competitionSlug: competition.slug });
    console.info(
      `[LockInTalks registration] Registration created. current_user=${session.user.id} row_user=${data.user_id} registration=${data.id} competition=${data.competition_slug} amount=${feeAmount} source=${resolvedAmount.source} redirect=${paymentUrl}`
    );

    return NextResponse.json({ ok: true, registrationId: data.id, paymentUrl, redirectTo: paymentUrl }, { status: 200, headers: noStoreHeaders });
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

async function repairRegistrationAmountIfNeeded({
  registration,
  resolvedAmount,
  supabaseAdmin,
  source
}: {
  registration: {
    id: string;
    payment_status: string | null;
  };
  resolvedAmount: ReturnType<typeof resolvePayableAmountPaise>;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  source: string;
}) {
  const repairPatch = getRegistrationAmountRepairPatch(resolvedAmount, registration.payment_status);
  if (!repairPatch) return;

  const { error } = await supabaseAdmin.from("registrations").update(repairPatch).eq("id", registration.id);
  if (error) {
    console.warn(`[LockInTalks registration] Could not repair amount for registration=${registration.id}: ${error.message}`);
    return;
  }

  console.info(
    `[LockInTalks registration] Repaired unpaid registration amount. source=${source} registration=${registration.id} amount=${resolvedAmount.amountPaise} reason=${resolvedAmount.repairReason || "unknown"}`
  );
}
