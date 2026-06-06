import { getLaunchCompetitionDefault } from "@/lib/competition-defaults";
import { isSeatConfirmed } from "@/lib/payment/status";

export type PaymentAmountInput = {
  registration?: {
    payment_amount?: number | null;
    amount_due?: number | null;
    payment_currency?: string | null;
    payment_status?: string | null;
  } | null;
  competition?: {
    fee_amount?: number | null;
  } | null;
  competitionSlug?: string | null;
};

export type ResolvedPaymentAmount = {
  amountPaise: number;
  currency: "INR";
  source: "registration_payment_amount" | "registration_amount_due" | "competition_fee_amount" | "launch_fallback";
  usedLaunchFallback: boolean;
  shouldRepairRegistration: boolean;
  repairReason: string | null;
};

const maxReasonableAmountPaise = 10000000;

export function resolvePayableAmountPaise({ registration, competition, competitionSlug }: PaymentAmountInput): ResolvedPaymentAmount {
  const slug = String(competitionSlug || "").trim();
  const launchDefault = getLaunchCompetitionDefault(slug);

  if (launchDefault?.feeAmount && isValidAmountForCompetition(launchDefault.feeAmount, slug)) {
    return buildResult({
      amountPaise: launchDefault.feeAmount,
      source: "launch_fallback",
      usedLaunchFallback: true,
      registration
    });
  }

  const candidates = [
    { source: "registration_payment_amount" as const, value: registration?.payment_amount },
    { source: "registration_amount_due" as const, value: registration?.amount_due },
    { source: "competition_fee_amount" as const, value: competition?.fee_amount }
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
    source: "launch_fallback",
    usedLaunchFallback: true,
    registration
  });
}

export function formatPaiseAsInr(amountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(amountPaise) || 0));
  if (!amount) return "Calculated at Checkout";
  return `INR ${(amount / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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

function isValidAmountForCompetition(amountPaise: number, slug: string) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0 || amountPaise > maxReasonableAmountPaise) return false;

  const launchDefault = getLaunchCompetitionDefault(slug);
  if (!launchDefault) return true;

  return amountPaise === launchDefault.feeAmount;
}
