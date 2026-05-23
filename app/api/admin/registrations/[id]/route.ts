import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { ageProofStatuses, isSeatConfirmed, isPaymentStatus, registrationStatuses } from "@/lib/payment/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;

  try {
    const body = await request.json();
    const paymentStatus = body.payment_status ? String(body.payment_status) : "";
    const registrationStatus = body.registration_status ? String(body.registration_status) : "";
    const ageProofStatus = body.age_proof_status ? String(body.age_proof_status) : "";
    const updates: Record<string, string | null> = { updated_at: new Date().toISOString() };

    if (!paymentStatus && !registrationStatus && !ageProofStatus) {
      return NextResponse.json({ error: "No registration update was provided." }, { status: 400 });
    }

    if (paymentStatus && !isPaymentStatus(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }

    if (registrationStatus && !registrationStatuses.includes(registrationStatus as (typeof registrationStatuses)[number])) {
      return NextResponse.json({ error: "Invalid registration status." }, { status: 400 });
    }

    if (ageProofStatus && !ageProofStatuses.includes(ageProofStatus as (typeof ageProofStatuses)[number])) {
      return NextResponse.json({ error: "Invalid age proof status." }, { status: 400 });
    }

    if (paymentStatus) {
      const confirmed = isSeatConfirmed(paymentStatus);
      updates.payment_status = paymentStatus;
      updates.registration_status = confirmed ? "accepted" : "payment_pending";
      updates.paid_at = confirmed ? updates.updated_at : null;
      updates.seat_confirmed_at = confirmed ? updates.updated_at : null;
    }

    if (registrationStatus) updates.registration_status = registrationStatus;
    if (ageProofStatus) updates.age_proof_status = ageProofStatus;

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(`[LockInTalks admin registrations] PATCH failed for ${id}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ registration: data });
  } catch (error) {
    console.error(`[LockInTalks admin registrations] Unexpected PATCH error for ${id}:`, error);
    return NextResponse.json({ error: "Could not update registration." }, { status: 500 });
  }
}
