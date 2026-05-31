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
  perPaidParticipant = 100,
  displayThreshold = 1000
}: {
  enabled?: boolean | null;
  paidParticipants: number;
  perPaidParticipant?: number | null;
  displayThreshold?: number | null;
}): PrizePoolSummary {
  const safePaidParticipants = Math.max(0, Math.floor(Number(paidParticipants) || 0));
  const safePerParticipant = Math.max(0, Math.floor(Number(perPaidParticipant) || 100));
  const safeThreshold = Math.max(0, Math.floor(Number(displayThreshold) || 1000));
  const paidParticipantBlocks = Math.floor(safePaidParticipants / 5);
  const amount = enabled === false ? 0 : paidParticipantBlocks * safePerParticipant * 5;

  return {
    enabled: enabled !== false,
    paidParticipants: safePaidParticipants,
    perPaidParticipant: safePerParticipant,
    displayThreshold: safeThreshold,
    amount,
    showBadge: enabled !== false && amount >= safeThreshold,
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

export function formatInr(amount: number) {
  return `INR ${Math.max(0, Math.floor(Number(amount) || 0)).toLocaleString("en-IN")}`;
}

export function formatPrizePoolBadge(amount: number) {
  return `LIVE PRIZE POOL: INR ${Math.max(0, Math.floor(Number(amount) || 0)).toLocaleString("en-IN")}`;
}
