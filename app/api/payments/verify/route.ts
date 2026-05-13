import { NextResponse, type NextRequest } from "next/server";
import { RazorpayConfigError } from "@/lib/razorpay/env";
import { verifyRazorpaySignature } from "@/lib/razorpay/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

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

    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      console.warn(`[LockInTalks payment verify] Unauthenticated verification attempt: ${claimsError?.message || "No user id"}`);
      return NextResponse.json({ error: "Please login before verifying payment." }, { status: 401 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, user_id, razorpay_order_id, payment_status")
      .eq("id", registrationId)
      .eq("user_id", userId)
      .single();

    if (registrationError || !registration) {
      console.error(`[LockInTalks payment verify] Registration lookup failed: ${registrationError?.message || "Not found"}`);
      return NextResponse.json({ error: "Registration not found for this account." }, { status: 404 });
    }

    if (registration.razorpay_order_id !== orderId) {
      console.warn(`[LockInTalks payment verify] Order mismatch for registration ${registration.id}.`);
      return NextResponse.json({ error: "Payment order does not match this registration." }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!isValid) {
      console.warn(`[LockInTalks payment verify] Signature mismatch for registration ${registration.id}.`);
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from("registrations").update({ payment_status: "failed" }).eq("id", registration.id).eq("user_id", userId);
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({
        payment_status: "paid",
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paid_at: new Date().toISOString()
      })
      .eq("id", registration.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[LockInTalks payment verify] Failed to mark registration paid: ${updateError.message}`);
      return NextResponse.json({ error: "Payment verified, but registration could not be updated. Please contact support." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof RazorpayConfigError) {
      console.error(`[LockInTalks payment verify] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("[LockInTalks payment verify] Unexpected verification error:", error);
    return NextResponse.json({ error: "Could not verify payment right now." }, { status: 500 });
  }
}
