import { NextResponse, type NextRequest } from "next/server";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { formatPaiseAsInr, getRegistrationAmountRepairPatch, resolvePayableAmountPaise } from "@/lib/payment/amounts";
import { isPaymentInProgress, isSeatConfirmed } from "@/lib/payment/status";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { createRazorpayClient, getPublicRazorpayKey, paymentCurrency } from "@/lib/razorpay/payments";
import { areLockInPointsEnabled } from "@/lib/rewards/feature";
import { calculateLockInPointCheckout, getUserLockInPointsBalance } from "@/lib/rewards/points";
import { getReadableSupabaseError } from "@/lib/readable-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateCheckoutRequest = {
  competitionSlug?: string;
  studentName?: string;
  studentAge?: number | string;
  guardianName?: string;
  guardianEmail?: string;
  city?: string;
  country?: string;
};

type CheckoutRegistration = {
  id: string;
  user_id: string;
  competition_slug: string;
  competition_name: string;
  student_name: string;
  guardian_email: string;
  entry_fee: string | null;
  payment_status: string | null;
  razorpay_order_id: string | null;
  payment_order_id: string | null;
  payment_amount: number | null;
  amount_due: number | null;
  payment_currency: string | null;
  points_redeemed: number | null;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status?: string;
};

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function POST(request: NextRequest) {
  let activeRegistrationId: string | null = null;

  try {
    const body = (await request.json()) as CreateCheckoutRequest;
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
      console.warn("[LockInTalks checkout registration] Auth check failed: No active server session.");
      return NextResponse.json(
        {
          error: "Please Log In or Create an Account Before Registering for a Competition.",
          loginTo: `/login?next=${encodeURIComponent(`/register/${competitionSlug}`)}`
        },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const userId = session.user.id;
    console.info(`[LockInTalks checkout registration] Request received. user=${userId} competition=${competitionSlug}`);
    const supabaseAdmin = createAdminClient();
    const { data: competition, error: competitionError } = await supabaseAdmin
      .from("competitions")
      .select("slug,name,fee_label,fee_amount,status")
      .eq("slug", competitionSlug)
      .eq("status", "live")
      .maybeSingle();

    if (competitionError) {
      console.error(`[LockInTalks checkout registration] Competition lookup failed: ${competitionError.message}`);
      return jsonError("This competition could not be loaded right now. Please try again.", 500);
    }

    if (!competition) {
      return jsonError("This competition is not available for registration right now.", 404);
    }

    const { data: existingRegistrations, error: existingError } = await supabaseAdmin
      .from("registrations")
      .select(
        "id,user_id,competition_slug,competition_name,student_name,guardian_email,entry_fee,payment_status,registration_status,razorpay_order_id,payment_order_id,payment_amount,amount_due,payment_currency,points_redeemed"
      )
      .eq("user_id", userId)
      .eq("competition_slug", competition.slug)
      .order("created_at", { ascending: false })
      .limit(10);

    if (existingError) {
      console.warn(`[LockInTalks checkout registration] Duplicate registration check skipped: ${existingError.message}`);
    }

    const paidRegistration = (existingRegistrations || []).find((registration) => isSeatConfirmed(registration.payment_status));

    if (paidRegistration) {
      console.info(`[LockInTalks checkout registration] Paid duplicate rejected. user=${userId} registration=${paidRegistration.id}`);
      return NextResponse.json(
        {
          error: "You already have a paid registration for this competition. Please check your dashboard.",
          alreadyPaid: true,
          registrationId: paidRegistration.id,
          redirectTo: "/dashboard"
        },
        { status: 409, headers: noStoreHeaders }
      );
    }

    const pendingRegistration = (existingRegistrations || []).find((registration) => !isSeatConfirmed(registration.payment_status));
    let registration: CheckoutRegistration;
    const resolvedNewAmount = resolvePayableAmountPaise({ competition, competitionSlug: competition.slug });
    const feeAmount = resolvedNewAmount.amountPaise;
    const feeLabel = formatPaiseAsInr(feeAmount);

    if (!feeAmount) {
      console.error(`[LockInTalks checkout registration] Invalid registration amount. competition=${competition.slug} source=${resolvedNewAmount.source}`);
      return jsonError("This competition does not have a valid registration fee configured. Please contact support.", 400);
    }

    if (pendingRegistration) {
      activeRegistrationId = pendingRegistration.id;
      const resolvedExistingAmount = resolvePayableAmountPaise({
        registration: pendingRegistration,
        competition,
        competitionSlug: competition.slug
      });
      const amountPatch = getRegistrationAmountRepairPatch(resolvedExistingAmount, pendingRegistration.payment_status) || {};
      const { data: updatedRegistration, error: updateError } = await supabaseAdmin
        .from("registrations")
        .update({
          ...amountPatch,
          student_name: studentName,
          student_age: studentAge,
          guardian_name: guardianName,
          guardian_email: guardianEmail,
          city,
          country,
          city_country: `${city}, ${country}`,
          entry_fee: formatPaiseAsInr(resolvedExistingAmount.amountPaise),
          updated_at: new Date().toISOString()
        })
        .eq("id", pendingRegistration.id)
        .eq("user_id", userId)
        .select(
          "id,user_id,competition_slug,competition_name,student_name,guardian_email,entry_fee,payment_status,razorpay_order_id,payment_order_id,payment_amount,amount_due,payment_currency,points_redeemed"
        )
        .single();

      if (updateError || !updatedRegistration) {
        console.error(`[LockInTalks checkout registration] Pending registration update failed: ${updateError?.message || "Not found"}`);
        return jsonError("Registration could not be updated. Please try again.", 500);
      }

      registration = updatedRegistration as CheckoutRegistration;
      console.info(
        `[LockInTalks checkout registration] Pending registration reused. user=${userId} registration=${registration.id} amount=${resolvedExistingAmount.amountPaise} source=${resolvedExistingAmount.source}`
      );
    } else {
      const { data: insertedRegistration, error: insertError } = await supabaseAdmin
        .from("registrations")
        .insert({
          user_id: userId,
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
        .select(
          "id,user_id,competition_slug,competition_name,student_name,guardian_email,entry_fee,payment_status,razorpay_order_id,payment_order_id,payment_amount,amount_due,payment_currency,points_redeemed"
        )
        .single();

      if (insertError || !insertedRegistration) {
        console.error(`[LockInTalks checkout registration] Insert failed: ${insertError?.message || "Not found"}`);
        return jsonError(getReadableSupabaseError(insertError, "Registration could not be saved."), 400);
      }

      registration = insertedRegistration as CheckoutRegistration;
      activeRegistrationId = registration.id;
      console.info(
        `[LockInTalks checkout registration] Registration created. user=${userId} registration=${registration.id} competition=${registration.competition_slug} amount=${feeAmount} source=${resolvedNewAmount.source}`
      );
    }

    const checkoutPayload = await createCheckoutOrder({
      registration,
      competition,
      supabaseAdmin,
      userId
    });

    return NextResponse.json(
      {
        ok: true,
        ...checkoutPayload
      },
      { status: 200, headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks checkout registration] ${error.message}`);
      return jsonError(error.message, 503);
    }

    if (error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks checkout registration] ${error.message}`);
      return NextResponse.json(
        {
          error: "Payments are not fully configured yet. Please contact support or try again later.",
          registrationId: activeRegistrationId
        },
        { status: 503, headers: noStoreHeaders }
      );
    }

    console.error("[LockInTalks checkout registration] Unexpected checkout registration error:", error);
    return jsonError("Registration payment is temporarily unavailable. Please try again.", 500);
  }
}

async function createCheckoutOrder({
  registration,
  competition,
  supabaseAdmin,
  userId
}: {
  registration: CheckoutRegistration;
  competition: { fee_amount?: number | null };
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const resolvedAmount = resolvePayableAmountPaise({
    registration,
    competition,
    competitionSlug: registration.competition_slug
  });
  const feeAmount = resolvedAmount.amountPaise;

  if (!feeAmount) {
    throw new Error("Invalid payment amount.");
  }

  await repairRegistrationAmountIfNeeded({
    registration,
    resolvedAmount,
    supabaseAdmin,
    source: "registration_checkout"
  });

  const pointsEnabled = areLockInPointsEnabled();
  const availablePoints = pointsEnabled ? await getUserLockInPointsBalance(userId) : 0;
  const checkout = pointsEnabled
    ? calculateLockInPointCheckout({
        feeAmountPaise: feeAmount,
        requestedPoints: 0,
        availablePoints
      })
    : {
        feeAmountPaise: feeAmount,
        requestedPoints: 0,
        availablePoints: 0,
        maxUsablePoints: 0,
        appliedPoints: 0,
        discountAmountPaise: 0,
        payableAmountPaise: feeAmount
      };
  const amount = checkout.payableAmountPaise;
  const existingOrderId = registration.payment_order_id || registration.razorpay_order_id;
  const existingAmountBeforeRepair = Number(registration.amount_due || registration.payment_amount || 0);

  if (
    existingOrderId &&
    isPaymentInProgress(registration.payment_status) &&
    existingAmountBeforeRepair === amount &&
    Number(registration.points_redeemed || 0) === checkout.appliedPoints
  ) {
    await savePaymentAttempt({
      registrationId: registration.id,
      userId,
      providerOrderId: existingOrderId,
      amount,
      currency: registration.payment_currency || paymentCurrency,
      status: "reused"
    });

    return {
      keyId: getPublicRazorpayKey(),
      orderId: existingOrderId,
      amount,
      originalAmount: checkout.feeAmountPaise,
      currency: registration.payment_currency || paymentCurrency,
      name: "LockInTalks",
      description: registration.competition_name,
      registrationId: registration.id,
      paymentStatus: registration.payment_status || "order_created",
      entryFee: formatPaiseAsInr(amount),
      prefill: {
        name: registration.student_name,
        email: registration.guardian_email
      }
    };
  }

  const razorpay = createRazorpayClient();
  const order = (await razorpay.orders.create({
    amount,
    currency: paymentCurrency,
    receipt: `reg_${registration.id.slice(0, 24)}`,
    notes: {
      registration_id: registration.id,
      competition: registration.competition_name
    }
  })) as RazorpayOrder;

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      payment_status: "order_created",
      registration_status: "payment_pending",
      payment_provider: "razorpay",
      razorpay_order_id: order.id,
      payment_order_id: order.id,
      payment_amount: amount,
      amount_due: amount,
      points_redeemed: pointsEnabled ? checkout.appliedPoints : 0,
      points_discount_amount: pointsEnabled ? checkout.discountAmountPaise : 0,
      payment_currency: paymentCurrency,
      updated_at: new Date().toISOString()
    })
    .eq("id", registration.id)
    .eq("user_id", userId);

  if (updateError) {
    console.error(`[LockInTalks checkout registration] Failed to save Razorpay order ${order.id}: ${updateError.message}`);
    throw new Error("Payment order was created, but could not be saved. Please contact support.");
  }

  await savePaymentAttempt({
    registrationId: registration.id,
    userId,
    providerOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status || "created"
  });

  return {
    keyId: getPublicRazorpayKey(),
    orderId: order.id,
    amount: order.amount,
    originalAmount: checkout.feeAmountPaise,
    currency: order.currency,
    name: "LockInTalks",
    description: registration.competition_name,
    registrationId: registration.id,
    paymentStatus: "order_created",
    entryFee: formatPaiseAsInr(order.amount),
    prefill: {
      name: registration.student_name,
      email: registration.guardian_email
    }
  };
}

async function savePaymentAttempt({
  registrationId,
  userId,
  providerOrderId,
  amount,
  currency,
  status
}: {
  registrationId: string;
  userId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  status: string;
}) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("payment_attempts").upsert(
      {
        registration_id: registrationId,
        user_id: userId,
        provider: "razorpay",
        provider_order_id: providerOrderId,
        amount,
        currency,
        status,
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider,provider_order_id" }
    );

    if (error) console.warn(`[LockInTalks checkout registration] Could not save payment attempt ${providerOrderId}: ${error.message}`);
  } catch (error) {
    console.warn("[LockInTalks checkout registration] Payment attempt logging skipped:", error);
  }
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
    console.warn(`[LockInTalks checkout registration] Could not repair amount for registration=${registration.id}: ${error.message}`);
    return;
  }

  console.info(
    `[LockInTalks checkout registration] Repaired unpaid registration amount. source=${source} registration=${registration.id} amount=${resolvedAmount.amountPaise} reason=${resolvedAmount.repairReason || "unknown"}`
  );
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders });
}
