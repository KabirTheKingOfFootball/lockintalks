import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { normalizeCompetitionPayload } from "@/lib/admin/competition-payload";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;

  try {
    const body = await request.json();
    const supabaseAdmin = createAdminClient();
    const payload = normalizeCompetitionPayload(body);
    const { data: slugOwner } = await supabaseAdmin.from("competitions").select("id").eq("slug", payload.slug).neq("id", id).maybeSingle();

    if (slugOwner) {
      return NextResponse.json({ error: "A competition with this slug already exists. Choose a unique slug." }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("competitions")
      .update({ ...payload, updated_at: new Date().toISOString() })
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
  try {
    const supabaseAdmin = createAdminClient();
    const { data: competition, error: lookupError } = await supabaseAdmin.from("competitions").select("slug").eq("id", id).single();

    if (lookupError || !competition) {
      console.error(`[LockInTalks admin competitions] DELETE lookup failed for ${id}: ${lookupError?.message || "Not found"}`);
      return NextResponse.json({ error: "Competition not found." }, { status: 404 });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("competition_slug", competition.slug);

    if (countError) {
      console.error(`[LockInTalks admin competitions] DELETE registration check failed for ${id}: ${countError.message}`);
      return NextResponse.json({ error: "Could not confirm whether registrations exist for this competition." }, { status: 500 });
    }

    if ((count || 0) > 0) {
      return NextResponse.json({ error: "This competition has registrations. Close or unpublish it instead of deleting, so existing registrations stay safe." }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from("competitions").delete().eq("id", id);

    if (error) {
      console.error(`[LockInTalks admin competitions] DELETE failed for ${id}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[LockInTalks admin competitions] Unexpected DELETE error for ${id}:`, error);
    return NextResponse.json({ error: "Could not delete competition." }, { status: 503 });
  }
}
