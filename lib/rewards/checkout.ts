export const pointValueInr = 1;

export function getMaxUsableLockInPoints(feeAmountPaise: number) {
  return Math.max(0, Math.floor((Number(feeAmountPaise) || 0) / 200));
}

export function calculateLockInPointCheckout({
  feeAmountPaise,
  requestedPoints,
  availablePoints
}: {
  feeAmountPaise: number;
  requestedPoints: number;
  availablePoints: number;
}) {
  const safeFee = Math.max(0, Math.floor(Number(feeAmountPaise) || 0));
  const safeRequested = Math.max(0, Math.floor(Number(requestedPoints) || 0));
  const safeAvailable = Math.max(0, Math.floor(Number(availablePoints) || 0));
  const maxUsablePoints = getMaxUsableLockInPoints(safeFee);
  const appliedPoints = Math.min(safeRequested, safeAvailable, maxUsablePoints);
  const discountAmountPaise = appliedPoints * 100;
  const payableAmountPaise = Math.max(0, safeFee - discountAmountPaise);

  return {
    feeAmountPaise: safeFee,
    availablePoints: safeAvailable,
    maxUsablePoints,
    appliedPoints,
    discountAmountPaise,
    payableAmountPaise
  };
}
