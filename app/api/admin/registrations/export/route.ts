import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from("registrations").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(`[LockInTalks admin export] Export failed: ${error.message}`);
    return NextResponse.json({ error: "Could not export registrations." }, { status: 500 });
  }

  const headers = [
    "id",
    "competition_name",
    "student_name",
    "student_age",
    "guardian_name",
    "guardian_email",
    "city_country",
    "payment_status",
    "razorpay_order_id",
    "razorpay_payment_id",
    "created_at"
  ];
  const csv = [headers.join(","), ...(data || []).map((row) => headers.map((header) => csvCell(row[header as keyof typeof row])).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lockintalks-registrations.csv"`
    }
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
