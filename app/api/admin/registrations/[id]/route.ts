import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = ["pending", "payment_created", "paid", "failed", "cancelled"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;

  try {
    const body = await request.json();
    const paymentStatus = String(body.payment_status || "");

    if (!allowedStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({
        payment_status: paymentStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null
      })
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
