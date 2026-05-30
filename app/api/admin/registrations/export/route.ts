import { NextResponse } from "next/server";
import { adminNoStoreHeaders, checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const admin = await checkAdmin("GET /api/admin/registrations/export");
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status, headers: adminNoStoreHeaders });

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from("registrations").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(`[LockInTalks admin export] Export failed: ${error.message}`);
    return NextResponse.json({ error: "Could not export registrations." }, { status: 500, headers: adminNoStoreHeaders });
  }

  const headers = [
    "id",
    "competition_name",
    "student_name",
    "student_age",
    "guardian_name",
    "guardian_email",
    "city",
    "country",
    "city_country",
    "registration_status",
    "age_proof_status",
    "payment_provider",
    "payment_status",
    "payment_order_id",
    "payment_id",
    "razorpay_order_id",
    "razorpay_payment_id",
    "amount_due",
    "amount_paid",
    "points_redeemed",
    "points_discount_amount",
    "seat_confirmed_at",
    "created_at",
    "updated_at"
  ];
  const csv = [headers.join(","), ...(data || []).map((row) => headers.map((header) => csvCell(row[header as keyof typeof row])).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      ...adminNoStoreHeaders,
      "Content-Disposition": `attachment; filename="lockintalks-registrations.csv"`
    }
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
