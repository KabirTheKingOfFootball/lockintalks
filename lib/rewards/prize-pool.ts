export type PrizePoolSummary = {
  enabled: boolean;
  paidParticipants: number;
  perPaidParticipant: number;
  displayThreshold: number;
  amount: number;
  showBadge: boolean;
  distribution: {
    first: number;
    second: number;
    third: number;
  };
};

export function calculatePrizePool({
  enabled = true,
  paidParticipants,
  perPaidParticipant = 9999,
  displayThreshold = 0
}: {
  enabled?: boolean | null;
  paidParticipants: number;
  perPaidParticipant?: number | null;
  displayThreshold?: number | null;
}): PrizePoolSummary {
  const safePaidParticipants = Math.max(0, Math.floor(Number(paidParticipants) || 0));
  const safePerParticipant = Math.max(0, Math.floor(Number(perPaidParticipant) || 9999));
  const safeThreshold = Math.max(0, Math.floor(Number(displayThreshold) || 0));
  const amount = enabled === false ? 0 : safePaidParticipants * safePerParticipant;

  return {
    enabled: enabled !== false,
    paidParticipants: safePaidParticipants,
    perPaidParticipant: safePerParticipant,
    displayThreshold: safeThreshold,
    amount,
    showBadge: enabled !== false && amount > 0,
    distribution: getPrizeDistribution(amount)
  };
}

export function getPrizeDistribution(amount: number) {
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const first = Math.floor(safeAmount * 0.45);
  const second = Math.floor(safeAmount * 0.3);
  const third = Math.max(0, safeAmount - first - second);

  return { first, second, third };
}

export function formatInr(amountPaise: number) {
  return `INR ${formatPaiseAsRupees(amountPaise).replace("₹", "")}`;
}

export function formatPrizePoolBadge(amountPaise: number) {
  return `Current Prize Pool: ${formatPaiseAsRupees(amountPaise)}`;
}

export function formatPaiseAsRupees(amountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(amountPaise) || 0));
  const hasPaise = amount % 100 !== 0;
  return `₹${(amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0
  })}`;
}
