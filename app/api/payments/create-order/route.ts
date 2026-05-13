import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { createRazorpayClient, getAmountForCompetition, getPublicRazorpayKey, paymentCurrency } from "@/lib/razorpay/payments";
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      console.warn(`[LockInTalks payment order] Unauthenticated order attempt: ${claimsError?.message || "No user id"}`);
      return NextResponse.json({ error: "Please login before paying." }, { status: 401 });
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

    const amount = getAmountForCompetition(registration.competition_slug);
    const supabaseAdmin = createAdminClient();
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
