export const defaultFeeAmountPaise = 9999;
export const defaultEntryFeeLabel = "₹99.99";
export const defaultPrizePoolContributionPaise = 9999;
export const defaultPublicOfferLabel = "Founder's Discount";

export type CompetitionPricingInput = {
  fee_amount_paise?: number | null;
  entry_fee_label?: string | null;
  prize_pool_contribution_paise?: number | null;
  public_offer_label?: string | null;
  fee_amount?: number | null;
  fee_label?: string | null;
};

export type CompetitionPricing = {
  feeAmountPaise: number;
  entryFeeLabel: string;
  prizePoolContributionPaise: number;
  publicOfferLabel: string;
};

const knownLaunchStaleAmounts = new Set([8, 800, 9900, 19900, 19999, 24900]);

export function normalizeCompetitionPricing(input: CompetitionPricingInput | null | undefined, slug?: string | null): CompetitionPricing {
  const feeAmountPaise = resolveFeeAmount(input, slug);
  const entryFeeLabel = String(input?.entry_fee_label || input?.fee_label || "").trim() || formatPaiseAsDisplayFee(feeAmountPaise);
  const contributionCandidate = normalizeInteger(input?.prize_pool_contribution_paise);
  const prizePoolContributionPaise =
    contributionCandidate === null ? Math.min(defaultPrizePoolContributionPaise, feeAmountPaise) : clamp(contributionCandidate, 0, feeAmountPaise);
  const publicOfferLabel = String(input?.public_offer_label || "").trim() || defaultPublicOfferLabel;

  return {
    feeAmountPaise,
    entryFeeLabel,
    prizePoolContributionPaise,
    publicOfferLabel
  };
}

export function buildPrizePoolContributionCopy({ feeAmountPaise, prizePoolContributionPaise }: Pick<CompetitionPricing, "feeAmountPaise" | "prizePoolContributionPaise">) {
  if (prizePoolContributionPaise >= feeAmountPaise && feeAmountPaise > 0) {
    return "100% of entry fees go into the prize pool for this launch batch.";
  }

  return `${formatPaiseAsDisplayFee(prizePoolContributionPaise)} from every verified entry goes into the prize pool.`;
}

export function formatPaiseAsDisplayFee(amountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(amountPaise) || 0));
  if (!amount) return "Free";
  const hasPaise = amount % 100 !== 0;
  return `₹${(amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0
  })}`;
}

export function formatPaiseAsInrText(amountPaise: number) {
  return `INR ${formatPaiseAsDisplayFee(amountPaise).replace("₹", "")}`;
}

export function isLaunchCompetitionSlug(slug: string | null | undefined) {
  return slug === "story-talks" || slug === "idol-talk" || slug === "power-talk";
}

function resolveFeeAmount(input: CompetitionPricingInput | null | undefined, slug?: string | null) {
  const modernAmount = normalizeInteger(input?.fee_amount_paise);
  if (modernAmount !== null) return modernAmount;

  const legacyAmount = normalizeInteger(input?.fee_amount);
  if (legacyAmount !== null) {
    if (isLaunchCompetitionSlug(slug) && knownLaunchStaleAmounts.has(legacyAmount)) return defaultFeeAmountPaise;
    return legacyAmount;
  }

  return defaultFeeAmountPaise;
}

function normalizeInteger(value: unknown) {
  const amount = Math.floor(Number(value));
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
