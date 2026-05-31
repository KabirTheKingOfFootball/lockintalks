import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { fetchRazorpayPayment, isRazorpayPaymentCaptured, verifyRazorpaySignature } from "@/lib/razorpay/payments";
import { isSeatConfirmed } from "@/lib/payment/status";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { syncLockInPointsForRegistration } from "@/lib/rewards/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyPaymentRequest = {
  registrationId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyPaymentRequest;
    const { registrationId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;

    if (!registrationId || !orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing Razorpay verification details." }, { status: 400 });
    }

    const session = await getServerAuthSession();

    if (!session.authenticated) {
      console.warn("[LockInTalks payment verify] Unauthenticated verification attempt.");
      return NextResponse.json({ error: "Please log in before verifying payment." }, { status: 401 });
    }

    const userId = session.user.id;
    const supabaseAdmin = createAdminClient();
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("registrations")
      .select("id, user_id, razorpay_order_id, payment_order_id, payment_status, amount_due, payment_amount")
      .eq("id", registrationId)
      .eq("user_id", userId)
      .single();

    if (registrationError || !registration) {
      console.error(`[LockInTalks payment verify] Registration lookup failed: ${registrationError?.message || "Not found"}`);
      return NextResponse.json({ error: "Registration not found for this account." }, { status: 404 });
    }

    const storedOrderId = registration.payment_order_id || registration.razorpay_order_id;

    if (!storedOrderId || storedOrderId !== orderId) {
      console.warn(`[LockInTalks payment verify] Order mismatch for registration ${registration.id}.`);
      return NextResponse.json({ error: "Payment order does not match this registration." }, { status: 400 });
    }

    if (isSeatConfirmed(registration.payment_status)) {
      await syncLockInPointsForRegistration(registration.id, "razorpay_verify_already_confirmed");
      return NextResponse.json({ ok: true, status: registration.payment_status, alreadyConfirmed: true });
    }

    const isValid = verifyRazorpaySignature({ orderId: storedOrderId, paymentId, signature });

    if (!isValid) {
      console.warn(`[LockInTalks payment verify] Signature mismatch for registration ${registration.id}.`);
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from("registrations")
        .update({ payment_status: "failed", registration_status: "payment_pending", updated_at: new Date().toISOString() })
        .eq("id", registration.id)
        .eq("user_id", userId);
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const payment = await fetchRazorpayPayment(paymentId);

    if (payment.order_id && payment.order_id !== storedOrderId) {
      console.warn(`[LockInTalks payment verify] Razorpay payment ${paymentId} belongs to ${payment.order_id}, expected ${storedOrderId}.`);
      return NextResponse.json({ error: "Payment details do not match this registration." }, { status: 400 });
    }

    const expectedAmount = Number(registration.amount_due || registration.payment_amount || 0);
    const paidAmount = Number(payment.amount || 0);

    if (expectedAmount > 0 && paidAmount > 0 && paidAmount !== expectedAmount) {
      console.warn(`[LockInTalks payment verify] Amount mismatch for registration ${registration.id}.`);
      return NextResponse.json({ error: "Payment amount does not match this registration." }, { status: 400 });
    }

    const captured = isRazorpayPaymentCaptured(payment);
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({
        payment_status: captured ? "captured" : "signature_verified",
        registration_status: captured ? "accepted" : "payment_pending",
        payment_provider: "razorpay",
        payment_order_id: storedOrderId,
        payment_id: paymentId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        amount_paid: captured ? paidAmount || null : null,
        payment_currency: payment.currency || "INR",
        paid_at: captured ? now : null,
        seat_confirmed_at: captured ? now : null,
        updated_at: now
      })
      .eq("id", registration.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[LockInTalks payment verify] Failed to mark registration paid: ${updateError.message}`);
      return NextResponse.json({ error: "Payment verified, but registration could not be updated. Please contact support." }, { status: 500 });
    }

    await supabaseAdmin.from("payment_attempts").upsert(
      {
        registration_id: registration.id,
        user_id: userId,
        provider: "razorpay",
        provider_order_id: storedOrderId,
        provider_payment_id: paymentId,
        amount: paidAmount || expectedAmount,
        currency: payment.currency || "INR",
        status: payment.status || (captured ? "captured" : "signature_verified"),
        signature_verified: true,
        updated_at: now
      },
      { onConflict: "provider,provider_order_id" }
    );

    await syncLockInPointsForRegistration(registration.id, "razorpay_verify");

    return NextResponse.json({ ok: true, status: captured ? "captured" : "signature_verified", pending: !captured }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks payment verify] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("[LockInTalks payment verify] Unexpected verification error:", error);
    return NextResponse.json({ error: "Could not verify payment right now." }, { status: 500 });
  }
}
