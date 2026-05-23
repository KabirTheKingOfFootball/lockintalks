import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { normalizeCompetitionPayload } from "@/lib/admin/competition-payload";
import { slugify } from "@/lib/admin/competitions";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(`[LockInTalks admin competitions] GET failed: ${error.message}`);
      return NextResponse.json({ error: "Could not load competitions." }, { status: 500 });
    }

    return NextResponse.json({ competitions: data || [] });
  } catch (error) {
    console.error("[LockInTalks admin competitions] Unexpected GET error:", error);
    return NextResponse.json({ error: "Could not connect to Supabase competitions data." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const slug = slugify(String(body.slug || name));

    if (!name || !slug) {
      return NextResponse.json({ error: "Competition name is required." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: existing } = await supabaseAdmin.from("competitions").select("id").eq("slug", slug).maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A competition with this slug already exists. Choose a unique slug." }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("competitions")
      .insert(normalizeCompetitionPayload({ ...body, name, slug }))
      .select("*")
      .single();

    if (error) {
      console.error(`[LockInTalks admin competitions] POST failed: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ competition: data }, { status: 201 });
  } catch (error) {
    console.error("[LockInTalks admin competitions] Unexpected POST error:", error);
    return NextResponse.json({ error: "Could not create competition." }, { status: 500 });
  }
}
