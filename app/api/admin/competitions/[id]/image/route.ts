import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status });

  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    const extension = file.name.split(".").pop() || "png";
    const path = `${id}/${Date.now()}.${extension}`;
    const supabaseAdmin = createAdminClient();
    const { error: uploadError } = await supabaseAdmin.storage.from("competition-images").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type
    });

    if (uploadError) {
      console.error(`[LockInTalks admin image] Upload failed for ${id}: ${uploadError.message}`);
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("competition-images").getPublicUrl(path);
    const imageUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabaseAdmin.from("competitions").update({ image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", id);

    if (updateError) {
      console.error(`[LockInTalks admin image] Could not save image URL for ${id}: ${updateError.message}`);
      return NextResponse.json({ error: "Image uploaded, but the competition could not be updated." }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error(`[LockInTalks admin image] Unexpected upload error for ${id}:`, error);
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }
}
