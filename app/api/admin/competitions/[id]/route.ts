import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCompetitionPayload } from "@/app/api/admin/competitions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;

  try {
    const body = await request.json();
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("competitions")
      .update({ ...normalizeCompetitionPayload(body), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(`[LockInTalks admin competitions] PUT failed for ${id}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ competition: data });
  } catch (error) {
    console.error(`[LockInTalks admin competitions] Unexpected PUT error for ${id}:`, error);
    return NextResponse.json({ error: "Could not update competition." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("competitions").delete().eq("id", id);

  if (error) {
    console.error(`[LockInTalks admin competitions] DELETE failed for ${id}: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
