import { slugify } from "@/lib/admin/competitions";
import { formatPaiseAsDisplayFee } from "@/lib/competition-pricing";

export function normalizeCompetitionPayload(body: Record<string, unknown>) {
  const feeAmountPaise = Math.floor(Number(body.fee_amount_paise ?? body.fee_amount ?? 9999));
  const prizePoolContributionPaise = Math.floor(Number(body.prize_pool_contribution_paise ?? feeAmountPaise));

  if (!Number.isFinite(feeAmountPaise) || feeAmountPaise < 100) {
    throw new Error("Entry Fee Amount in Paise must be at least 100.");
  }

  if (!Number.isFinite(prizePoolContributionPaise) || prizePoolContributionPaise < 0) {
    throw new Error("Prize Pool Contribution in Paise must be 0 or higher.");
  }

  if (prizePoolContributionPaise > feeAmountPaise) {
    throw new Error("Prize Pool Contribution cannot be higher than the Entry Fee Amount.");
  }

  const entryFeeLabel = String(body.entry_fee_label ?? body.fee_label ?? "").trim() || formatPaiseAsDisplayFee(feeAmountPaise);

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
    fee_label: entryFeeLabel,
    fee_amount: feeAmountPaise,
    fee_amount_paise: feeAmountPaise,
    entry_fee_label: entryFeeLabel,
    prize_pool_contribution_paise: prizePoolContributionPaise,
    public_offer_label: String(body.public_offer_label || "").trim() || null,
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

function toTextArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
