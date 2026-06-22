import { normalizeCompetitionPricing } from "@/lib/competition-pricing";
import { isSeatConfirmed } from "@/lib/payment/status";

export type PaymentAmountInput = {
  registration?: {
    payment_amount?: number | null;
    amount_due?: number | null;
    payment_currency?: string | null;
    payment_status?: string | null;
  } | null;
  competition?: {
    fee_amount_paise?: number | null;
    fee_amount?: number | null;
    entry_fee_label?: string | null;
    fee_label?: string | null;
    prize_pool_contribution_paise?: number | null;
    public_offer_label?: string | null;
  } | null;
  competitionSlug?: string | null;
};

export type ResolvedPaymentAmount = {
  amountPaise: number;
  currency: "INR";
  source: "registration_payment_amount" | "registration_amount_due" | "competition_fee_amount";
  usedLaunchFallback: boolean;
  shouldRepairRegistration: boolean;
  repairReason: string | null;
};

const maxReasonableAmountPaise = 10000000;

export function resolvePayableAmountPaise({ registration, competition, competitionSlug }: PaymentAmountInput): ResolvedPaymentAmount {
  const slug = String(competitionSlug || "").trim();
  if (competition) {
    const pricing = normalizeCompetitionPricing(competition, slug);
    return buildResult({
      amountPaise: isValidAmountForCompetition(pricing.feeAmountPaise, slug) ? pricing.feeAmountPaise : 0,
      source: "competition_fee_amount",
      usedLaunchFallback: false,
      registration
    });
  }

  const candidates = [
    { source: "registration_payment_amount" as const, value: registration?.payment_amount },
    { source: "registration_amount_due" as const, value: registration?.amount_due }
  ];

  for (const candidate of candidates) {
    const amount = normalizeAmountPaise(candidate.value);
    if (isValidAmountForCompetition(amount, slug)) {
      return buildResult({
        amountPaise: amount,
        source: candidate.source,
        usedLaunchFallback: false,
        registration
      });
    }
  }

  return buildResult({
    amountPaise: 0,
    source: "competition_fee_amount",
    usedLaunchFallback: false,
    registration
  });
}

export function formatPaiseAsInr(amountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(amountPaise) || 0));
  if (!amount) return "Calculated at Checkout";
  return `INR ${formatRupeeAmount(amount)}`;
}

export function canRepairRegistrationAmount(status: string | null | undefined) {
  return !isSeatConfirmed(status);
}

export function getRegistrationAmountRepairPatch(resolved: ResolvedPaymentAmount, status: string | null | undefined) {
  if (!resolved.shouldRepairRegistration || !canRepairRegistrationAmount(status) || resolved.amountPaise <= 0) return null;

  return {
    payment_amount: resolved.amountPaise,
    amount_due: resolved.amountPaise,
    payment_currency: resolved.currency,
    entry_fee: formatPaiseAsInr(resolved.amountPaise),
    updated_at: new Date().toISOString()
  };
}

function buildResult({
  amountPaise,
  source,
  usedLaunchFallback,
  registration
}: {
  amountPaise: number;
  source: ResolvedPaymentAmount["source"];
  usedLaunchFallback: boolean;
  registration: PaymentAmountInput["registration"];
}): ResolvedPaymentAmount {
  const currentPaymentAmount = normalizeAmountPaise(registration?.payment_amount);
  const currentAmountDue = normalizeAmountPaise(registration?.amount_due);
  const shouldRepairRegistration = Boolean(
    registration &&
      amountPaise > 0 &&
      (currentPaymentAmount !== amountPaise || currentAmountDue !== amountPaise || String(registration.payment_currency || "INR").toUpperCase() !== "INR")
  );

  return {
    amountPaise,
    currency: "INR",
    source,
    usedLaunchFallback,
    shouldRepairRegistration,
    repairReason: shouldRepairRegistration
      ? `registration amount mismatch: payment_amount=${currentPaymentAmount || "missing"} amount_due=${currentAmountDue || "missing"} resolved=${amountPaise}`
      : null
  };
}

function normalizeAmountPaise(value: unknown) {
  const amount = Math.floor(Number(value));
  if (!Number.isFinite(amount)) return 0;
  return amount;
}

function formatRupeeAmount(amountPaise: number) {
  const hasPaise = amountPaise % 100 !== 0;
  return (amountPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0
  });
}

function isValidAmountForCompetition(amountPaise: number, _slug: string) {
  if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > maxReasonableAmountPaise) return false;
  return true;
}
