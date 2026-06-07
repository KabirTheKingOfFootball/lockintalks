import { NextResponse, type NextRequest } from "next/server";
import { adminNoStoreHeaders, checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type RegistrationEmailUpdate = {
  confirmation_email_sent?: boolean;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin("PATCH /api/admin/registrations/[id]");
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status, headers: adminNoStoreHeaders });

  const { id } = await params;

  try {
    const body = (await request.json()) as RegistrationEmailUpdate;

    if (typeof body.confirmation_email_sent !== "boolean") {
      return NextResponse.json({ error: "Choose whether the confirmation email was sent." }, { status: 400, headers: adminNoStoreHeaders });
    }

    const now = new Date().toISOString();
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({
        confirmation_email_sent: body.confirmation_email_sent,
        confirmation_email_sent_at: body.confirmation_email_sent ? now : null,
        confirmation_email_sent_by: body.confirmation_email_sent ? admin.userId : null,
        updated_at: now
      })
      .eq("id", id)
      .in("payment_status", ["captured", "paid"])
      .select("*")
      .single();

    if (error) {
      console.error(`[LockInTalks admin registrations] Email tracking PATCH failed for ${id}: ${error.message}`);
      return NextResponse.json({ error: "Could not update confirmation email status." }, { status: 400, headers: adminNoStoreHeaders });
    }

    return NextResponse.json({ registration: data }, { headers: adminNoStoreHeaders });
  } catch (error) {
    console.error(`[LockInTalks admin registrations] Unexpected email tracking PATCH error for ${id}:`, error);
    return NextResponse.json({ error: "Could not update confirmation email status." }, { status: 500, headers: adminNoStoreHeaders });
  }
}
