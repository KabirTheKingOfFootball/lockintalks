import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
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

export function normalizeCompetitionPayload(body: Record<string, unknown>) {
  return {
    slug: slugify(String(body.slug || body.name || "")),
    name: String(body.name || "").trim(),
    category: String(body.category || "Speech Challenges").trim(),
    age_group: String(body.age_group || "").trim(),
    event_date: String(body.event_date || "").trim(),
    fee_label: String(body.fee_label || "").trim(),
    fee_amount: Number(body.fee_amount || 0),
    summary: String(body.summary || "").trim(),
    description: String(body.description || "").trim(),
    image_url: body.image_url ? String(body.image_url) : null,
    status: ["draft", "live", "closed"].includes(String(body.status)) ? String(body.status) : "draft",
    rules: toTextArray(body.rules),
    schedule: toTextArray(body.schedule),
    prizes: toTextArray(body.prizes),
    judges: toTextArray(body.judges)
  };
}

function toTextArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
