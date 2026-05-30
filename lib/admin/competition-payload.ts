import { slugify } from "@/lib/admin/competitions";

export function normalizeCompetitionPayload(body: Record<string, unknown>) {
  return {
    slug: slugify(String(body.slug || body.name || "")),
    name: String(body.name || "").trim(),
    category: String(body.category || "Speech Challenges").trim(),
    age_group: String(body.age_group || "").trim(),
    event_date: String(body.event_date || "").trim(),
    event_time: String(body.event_time || "TBA").trim(),
    timezone: String(body.timezone || "IST").trim(),
    registration_deadline: String(body.registration_deadline || "").trim() || null,
    max_participants: Math.max(1, Number(body.max_participants || 50)),
    fee_label: String(body.fee_label || "").trim(),
    fee_amount: Number(body.fee_amount || 0),
    prize_pool_enabled: toBoolean(body.prize_pool_enabled, true),
    prize_pool_per_paid_participant: Math.max(0, Number(body.prize_pool_per_paid_participant || 100)),
    prize_pool_display_threshold: Math.max(0, Number(body.prize_pool_display_threshold || 1000)),
    points_enabled: toBoolean(body.points_enabled, true),
    summary: String(body.summary || "").trim(),
    description: String(body.description || "").trim(),
    image_url: body.image_url ? String(body.image_url) : null,
    status: ["draft", "live", "closed"].includes(String(body.status)) ? String(body.status) : "draft",
    rules: toTextArray(body.rules),
    schedule: toTextArray(body.schedule),
    prizes: toTextArray(body.prizes),
    criteria: toTextArray(body.criteria),
    judges: toTextArray(body.judges)
  };
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function toTextArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
