import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { isSeatConfirmed } from "@/lib/payment/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FailedPaymentRequest = {
  registrationId?: string;
  status?: "failed" | "cancelled";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FailedPaymentRequest;

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
      return NextResponse.json({ error: "Please log in before updating payment status." }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: registration, error: lookupError } = await supabaseAdmin
      .from("registrations")
      .select("id, user_id, payment_status")
      .eq("id", body.registrationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError || !registration) {
      console.error(`[LockInTalks payment failed] Registration lookup failed: ${lookupError?.message || "Not found"}`);
      return NextResponse.json({ error: "Registration not found for this account." }, { status: 404 });
    }

    if (isSeatConfirmed(registration.payment_status)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { error } = await supabaseAdmin
      .from("registrations")
      .update({
        payment_status: body.status === "cancelled" ? "cancelled" : "failed",
        registration_status: "payment_pending",
        updated_at: new Date().toISOString()
      })
      .eq("id", body.registrationId)
      .eq("user_id", userId);

    if (error) {
      console.error(`[LockInTalks payment failed] Could not update failed status: ${error.message}`);
      return NextResponse.json({ error: "Could not update payment status." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks payment failed] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("[LockInTalks payment failed] Unexpected status update error:", error);
    return NextResponse.json({ error: "Could not update payment status right now." }, { status: 500 });
  }
}
