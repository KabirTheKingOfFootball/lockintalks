import { NextResponse, type NextRequest } from "next/server";
import { adminNoStoreHeaders, checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const admin = await checkAdmin("GET /api/admin/registrations/diagnose");
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status, headers: adminNoStoreHeaders });

  const registrationId = String(request.nextUrl.searchParams.get("registration") || request.nextUrl.searchParams.get("id") || "").trim();

  if (!registrationId) {
    return NextResponse.json({ error: "Add ?registration=<registration_id> to diagnose a registration." }, { status: 400, headers: adminNoStoreHeaders });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("id,user_id,competition_slug,payment_status,registration_status,amount_due,payment_amount,created_at,updated_at")
    .eq("id", registrationId)
    .maybeSingle();

  if (error) {
    console.error(`[LockInTalks admin registration diagnose] Lookup failed for ${registrationId}: ${error.message}`);
    return NextResponse.json({ error: "Could not diagnose registration." }, { status: 500, headers: adminNoStoreHeaders });
  }

  const ownerUserId = data?.user_id ? String(data.user_id) : null;
  const currentUserOwnsRegistration = Boolean(ownerUserId && ownerUserId === admin.userId);

  console.info(
    `[LockInTalks admin registration diagnose] admin=${admin.userId} registration=${registrationId} exists=${Boolean(data)} owner=${ownerUserId || "none"} admin_owns=${currentUserOwnsRegistration}`
  );

  return NextResponse.json(
    {
      ok: true,
      requestedRegistrationId: registrationId,
      exists: Boolean(data),
      currentAdminUserId: admin.userId,
      currentUserOwnsRegistration,
      serverPaymentApiCanReadRow: Boolean(data),
      registration: data
        ? {
            id: data.id,
            user_id: data.user_id,
            competition_slug: data.competition_slug,
            payment_status: data.payment_status,
            registration_status: data.registration_status,
            amount_due: data.amount_due,
            payment_amount: data.payment_amount,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        : null
    },
    { status: 200, headers: adminNoStoreHeaders }
  );
}
