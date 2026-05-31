import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { createRazorpayClient, getPublicRazorpayKey, paymentCurrency } from "@/lib/razorpay/payments";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { isPaymentInProgress, isSeatConfirmed } from "@/lib/payment/status";
import { calculateLockInPointCheckout, getUserLockInPointsBalance } from "@/lib/rewards/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateOrderRequest = {
  registrationId?: string;
  lockInPointsToApply?: number;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest;

    if (!body.registrationId) {
      return NextResponse.json({ error: "Missing registration id." }, { status: 400 });
    }

    const session = await getServerAuthSession();

    if (!session.authenticated) {
      console.warn("[LockInTalks payment order] Unauthenticated order attempt.");
      return NextResponse.json({ error: "Please log in before paying." }, { status: 401 });
    }

    const userId = session.user.id;
    const supabaseAdmin = createAdminClient();
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("registrations")
      .select("id, user_id, competition_slug, competition_name, student_name, guardian_email, entry_fee, payment_status, razorpay_order_id, payment_order_id, payment_amount, amount_due, payment_currency, points_redeemed")
      .eq("id", body.registrationId)
      .eq("user_id", userId)
      .single();

    if (registrationError || !registration) {
      console.error(`[LockInTalks payment order] Registration lookup failed: ${registrationError?.message || "Not found"}`);
      return NextResponse.json({ error: "Registration not found for this account." }, { status: 404 });
    }

    if (isSeatConfirmed(registration.payment_status)) {
      return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    }

    const { data: competition, error: competitionError } = await supabaseAdmin
      .from("competitions")
      .select("fee_amount, status")
      .eq("slug", registration.competition_slug)
      .single();

    if (competitionError || !competition) {
      console.error(`[LockInTalks payment order] Competition lookup failed for ${registration.competition_slug}: ${competitionError?.message || "Not found"}`);
      return NextResponse.json({ error: "This competition is no longer available for payment." }, { status: 404 });
    }

    if (competition.status !== "live") {
      return NextResponse.json({ error: "This competition is not currently accepting payments." }, { status: 409 });
    }

    const feeAmount = Number(competition.fee_amount);
    if (!Number.isFinite(feeAmount) || feeAmount <= 0) {
      return NextResponse.json({ error: "This competition does not have a valid payment amount configured." }, { status: 400 });
    }

    const availablePoints = await getUserLockInPointsBalance(userId);
    const checkout = calculateLockInPointCheckout({
      feeAmountPaise: feeAmount,
      requestedPoints: Number(body.lockInPointsToApply || 0),
      availablePoints
    });
    const amount = checkout.payableAmountPaise;

    const existingOrderId = registration.payment_order_id || registration.razorpay_order_id;
    const existingAmount = Number(registration.amount_due || registration.payment_amount || 0);

    if (existingOrderId && isPaymentInProgress(registration.payment_status) && existingAmount === amount && Number(registration.points_redeemed || 0) === checkout.appliedPoints) {
      await savePaymentAttempt({
        registrationId: registration.id,
        userId,
        providerOrderId: existingOrderId,
        amount,
        currency: registration.payment_currency || paymentCurrency,
        status: "reused"
      });

      return NextResponse.json(
        {
          keyId: getPublicRazorpayKey(),
          orderId: existingOrderId,
          amount,
          originalAmount: checkout.feeAmountPaise,
          lockInPoints: checkout,
          currency: registration.payment_currency || paymentCurrency,
          name: "LockInTalks",
          description: registration.competition_name,
          prefill: {
            name: registration.student_name,
            email: registration.guardian_email
          },
          registrationId: registration.id
        },
        { headers: { "Cache-Control": "no-store" } }
      );
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
        points_redeemed: checkout.appliedPoints,
        points_discount_amount: checkout.discountAmountPaise,
        payment_currency: paymentCurrency,
        updated_at: new Date().toISOString()
      })
      .eq("id", registration.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[LockInTalks payment order] Failed to save Razorpay order ${order.id}: ${updateError.message}`);
      return NextResponse.json({ error: "Payment order was created, but could not be saved. Please contact support." }, { status: 500 });
    }

    await savePaymentAttempt({
      registrationId: registration.id,
      userId,
      providerOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status || "created"
    });

    return NextResponse.json(
      {
        keyId: getPublicRazorpayKey(),
        orderId: order.id,
        amount: order.amount,
        originalAmount: checkout.feeAmountPaise,
        lockInPoints: checkout,
        currency: order.currency,
        name: "LockInTalks",
        description: registration.competition_name,
        prefill: {
          name: registration.student_name,
          email: registration.guardian_email
        },
        registrationId: registration.id
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks payment order] ${error.message}`);
      return NextResponse.json({ error: "Payments are not fully configured yet. Please contact support or try again later." }, { status: 503 });
    }

    console.error("[LockInTalks payment order] Unexpected order creation error:", error);
    return NextResponse.json({ error: "Could not create payment order right now." }, { status: 500 });
  }
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

    if (error) console.warn(`[LockInTalks payment order] Could not save payment attempt ${providerOrderId}: ${error.message}`);
  } catch (error) {
    console.warn("[LockInTalks payment order] Payment attempt logging skipped:", error);
  }
}
