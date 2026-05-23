import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/payments";
import { isSeatConfirmed } from "@/lib/payment/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        captured?: boolean;
        method?: string;
        error_description?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const eventId = request.headers.get("x-razorpay-event-id") || "";
  const signature = request.headers.get("x-razorpay-signature") || "";
  const rawBody = await request.text();

  if (!eventId) {
    console.warn("[LockInTalks Razorpay webhook] Missing x-razorpay-event-id header.");
    return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  }

  if (!signature) {
    console.warn("[LockInTalks Razorpay webhook] Missing x-razorpay-signature header.");
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      console.warn(`[LockInTalks Razorpay webhook] Signature mismatch for event ${eventId}.`);
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const eventType = payload.event || "unknown";
    const payment = payload.payload?.payment?.entity || {};
    const supabaseAdmin = createAdminClient();

    const { error: insertEventError } = await supabaseAdmin.from("payment_events").insert({
      provider: "razorpay",
      provider_event_id: eventId,
      event_type: eventType,
      provider_order_id: payment.order_id || null,
      provider_payment_id: payment.id || null,
      raw_payload: payload
    });

    if (insertEventError) {
      if (insertEventError.code === "23505") {
        console.info(`[LockInTalks Razorpay webhook] Duplicate event ignored: ${eventId}`);
        return NextResponse.json({ ok: true, duplicate: true });
      }

      console.error(`[LockInTalks Razorpay webhook] Could not record event ${eventId}: ${insertEventError.message}`);
      return NextResponse.json({ error: "Could not record webhook event." }, { status: 500 });
    }

    if (!payment.order_id) {
      await markEventProcessed(eventId, false, "Webhook did not include a payment order id.");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const now = new Date().toISOString();
    const captured = eventType === "payment.captured" || payment.status === "captured" || payment.captured === true;
    const failed = eventType === "payment.failed" || payment.status === "failed";
    const update =
      captured
        ? {
            payment_status: "captured",
            registration_status: "accepted",
            payment_provider: "razorpay",
            payment_order_id: payment.order_id,
            payment_id: payment.id || null,
            razorpay_payment_id: payment.id || null,
            amount_paid: payment.amount || null,
            payment_currency: payment.currency || "INR",
            paid_at: now,
            seat_confirmed_at: now,
            updated_at: now
          }
        : failed
          ? {
              payment_status: "failed",
              registration_status: "payment_pending",
              payment_provider: "razorpay",
              payment_order_id: payment.order_id,
              payment_id: payment.id || null,
              razorpay_payment_id: payment.id || null,
              updated_at: now
            }
          : {
              payment_status: "signature_verified",
              registration_status: "payment_pending",
              payment_provider: "razorpay",
              payment_order_id: payment.order_id,
              payment_id: payment.id || null,
              razorpay_payment_id: payment.id || null,
              updated_at: now
            };

    const orderFilter = `razorpay_order_id.eq.${payment.order_id},payment_order_id.eq.${payment.order_id}`;
    const { data: existingRegistration, error: lookupError } = await supabaseAdmin
      .from("registrations")
      .select("id, user_id, payment_status")
      .or(orderFilter)
      .maybeSingle();

    if (lookupError) {
      console.error(`[LockInTalks Razorpay webhook] Registration lookup failed for event ${eventId}: ${lookupError.message}`);
      await markEventProcessed(eventId, false, lookupError.message);
      return NextResponse.json({ error: "Could not locate registration from webhook." }, { status: 500 });
    }

    if (!existingRegistration) {
      const message = `No registration matched order ${payment.order_id}.`;
      console.warn(`[LockInTalks Razorpay webhook] ${message}`);
      await markEventProcessed(eventId, false, message);
      return NextResponse.json({ ok: true, unmatched: true });
    }

    if (isSeatConfirmed(existingRegistration.payment_status) && !captured) {
      await supabaseAdmin
        .from("payment_events")
        .update({ registration_id: existingRegistration.id, processed: true, processed_at: now, processing_error: null })
        .eq("provider_event_id", eventId);
      return NextResponse.json({ ok: true, ignored: true, currentStatus: existingRegistration.payment_status });
    }

    const { data: registration, error: updateError } = await supabaseAdmin
      .from("registrations")
      .update(update)
      .eq("id", existingRegistration.id)
      .select("id, user_id")
      .maybeSingle();

    if (updateError) {
      console.error(`[LockInTalks Razorpay webhook] Registration update failed for event ${eventId}: ${updateError.message}`);
      await markEventProcessed(eventId, false, updateError.message);
      return NextResponse.json({ error: "Could not update registration from webhook." }, { status: 500 });
    }

    if (!registration) {
      const message = `Registration disappeared while processing order ${payment.order_id}.`;
      console.warn(`[LockInTalks Razorpay webhook] ${message}`);
      await markEventProcessed(eventId, false, message);
      return NextResponse.json({ ok: true, unmatched: true });
    }

    await supabaseAdmin.from("payment_attempts").upsert(
      {
        registration_id: registration.id,
        user_id: registration.user_id,
        provider: "razorpay",
        provider_order_id: payment.order_id,
        provider_payment_id: payment.id || null,
        amount: payment.amount || 0,
        currency: payment.currency || "INR",
        status: payment.status || eventType,
        signature_verified: true,
        updated_at: now
      },
      { onConflict: "provider,provider_order_id" }
    );

    await supabaseAdmin
      .from("payment_events")
      .update({ registration_id: registration.id, processed: true, processed_at: now, processing_error: null })
      .eq("provider_event_id", eventId);

    return NextResponse.json({ ok: true, status: captured ? "captured" : failed ? "failed" : "signature_verified" });
  } catch (error) {
    if (error instanceof RazorpayConfigError || error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks Razorpay webhook] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error(`[LockInTalks Razorpay webhook] Unexpected webhook error for ${eventId}:`, error);
    return NextResponse.json({ error: "Could not process Razorpay webhook." }, { status: 500 });
  }
}

async function markEventProcessed(eventId: string, processed: boolean, processingError: string) {
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin
      .from("payment_events")
      .update({ processed, processed_at: new Date().toISOString(), processing_error: processingError })
      .eq("provider_event_id", eventId);
  } catch (error) {
    console.warn(`[LockInTalks Razorpay webhook] Could not mark event ${eventId}:`, error);
  }
}
