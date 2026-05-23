import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { createRazorpayClient, getPublicRazorpayKey, paymentCurrency } from "@/lib/razorpay/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateOrderRequest = {
  registrationId?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest;

    if (!body.registrationId) {
      return NextResponse.json({ error: "Missing registration id." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (userError || !userId) {
      console.warn(`[LockInTalks payment order] Unauthenticated order attempt: ${userError?.message || "No user id"}`);
      return NextResponse.json({ error: "Please log in before paying." }, { status: 401 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, user_id, competition_slug, competition_name, student_name, guardian_email, entry_fee, payment_status")
      .eq("id", body.registrationId)
      .eq("user_id", userId)
      .single();

    if (registrationError || !registration) {
      console.error(`[LockInTalks payment order] Registration lookup failed: ${registrationError?.message || "Not found"}`);
      return NextResponse.json({ error: "Registration not found for this account." }, { status: 404 });
    }

    if (registration.payment_status === "paid") {
      return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    }

    const supabaseAdmin = createAdminClient();
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

    const amount = Number(competition.fee_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "This competition does not have a valid payment amount configured." }, { status: 400 });
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
        payment_status: "payment_created",
        razorpay_order_id: order.id,
        payment_amount: amount,
        payment_currency: paymentCurrency
      })
      .eq("id", registration.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[LockInTalks payment order] Failed to save Razorpay order ${order.id}: ${updateError.message}`);
      return NextResponse.json({ error: "Payment order was created, but could not be saved. Please contact support." }, { status: 500 });
    }

    return NextResponse.json({
      keyId: getPublicRazorpayKey(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "LockInTalks",
      description: registration.competition_name,
      prefill: {
        name: registration.student_name,
        email: registration.guardian_email
      },
      registrationId: registration.id
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks payment order] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("[LockInTalks payment order] Unexpected order creation error:", error);
    return NextResponse.json({ error: "Could not create payment order right now." }, { status: 500 });
  }
}
