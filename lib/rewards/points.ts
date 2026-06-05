import { isSeatConfirmed } from "@/lib/payment/status";
import { createAdminClient } from "@/lib/supabase/admin";

export { calculateLockInPointCheckout, getMaxUsableLockInPoints, pointValueInr } from "@/lib/rewards/checkout";

export const participationPoints = 7;
export const fivePaidCompetitionMilestonePoints = 47;
export const tenPaidCompetitionMilestonePoints = 107;
export const winnerPoints = {
  first: 77,
  second: 47,
  third: 27
} as const;

const reversalStatuses = new Set(["failed", "cancelled", "refunded"]);
const paidStatuses = ["captured", "paid"];

type LedgerType = "participation" | "milestone" | "winner" | "redemption" | "refund_reversal" | "admin_adjustment";

type RegistrationForRewards = {
  id: string;
  user_id: string;
  competition_slug: string;
  competition_name: string;
  payment_status: string | null;
  points_redeemed?: number | null;
};

type WinnerPlace = keyof typeof winnerPoints;

export async function getUserLockInPointsBalance(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from("lockin_points_ledger").select("points").eq("user_id", userId);

  if (error) {
    console.warn(`[LockInTalks points] Could not load points balance for user ${userId}: ${error.message}`);
    return 0;
  }

  return (data || []).reduce((total, row) => total + Number(row.points || 0), 0);
}

export async function syncLockInPointsForRegistration(registrationId: string, source: string) {
  try {
    const supabaseAdmin = createAdminClient();
    const { data: registration, error } = await supabaseAdmin
      .from("registrations")
      .select("id,user_id,competition_slug,competition_name,payment_status,points_redeemed")
      .eq("id", registrationId)
      .maybeSingle();

    if (error || !registration) {
      console.warn(`[LockInTalks points] Could not sync points for registration ${registrationId}: ${error?.message || "not found"}`);
      return;
    }

    const typedRegistration = registration as RegistrationForRewards;

    if (isSeatConfirmed(typedRegistration.payment_status)) {
      await awardParticipationPoints(typedRegistration, source);
      await recordRedeemedPoints(typedRegistration, source);
      await awardMilestonePoints(typedRegistration.user_id, source);
      return;
    }

    if (typedRegistration.payment_status && reversalStatuses.has(typedRegistration.payment_status)) {
      await reverseParticipationPoints(typedRegistration, source);
      await reverseRedeemedPoints(typedRegistration, source);
      await reverseUnearnedMilestonePoints(typedRegistration.user_id, source);
    }
  } catch (error) {
    console.warn(`[LockInTalks points] Reward sync skipped for registration ${registrationId}:`, error);
  }
}

export async function awardWinnerPointsForRegistration({
  registrationId,
  place,
  createdBy,
  source
}: {
  registrationId: string;
  place: WinnerPlace;
  createdBy: string;
  source: string;
}) {
  const points = winnerPoints[place];
  const supabaseAdmin = createAdminClient();
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("id,user_id,competition_slug,competition_name")
    .eq("id", registrationId)
    .maybeSingle();

  if (error || !registration) {
    return { ok: false, error: error?.message || "Registration not found." };
  }

  const existingWinnerPoints = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "winner"
  });

  if (existingWinnerPoints > 0) {
    return { ok: true, pointsAwarded: 0, alreadyAwarded: true };
  }

  await insertLedgerEntry({
    userId: registration.user_id,
    registrationId: registration.id,
    competitionSlug: registration.competition_slug,
    points,
    type: "winner",
    description: `Earned ${points} LockIn Points for ${formatWinnerPlace(place)} in ${registration.competition_name}. Source: ${source}.`,
    createdBy
  });

  return { ok: true, pointsAwarded: points, alreadyAwarded: false };
}

async function awardParticipationPoints(registration: RegistrationForRewards, source: string) {
  const alreadyAwarded = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "participation"
  });

  if (alreadyAwarded > 0) return;

  await insertLedgerEntry({
    userId: registration.user_id,
    registrationId: registration.id,
    competitionSlug: registration.competition_slug,
    points: participationPoints,
    type: "participation",
    description: `Earned ${participationPoints} LockIn Points for verified paid registration: ${registration.competition_name}. Source: ${source}.`
  });
}

async function awardMilestonePoints(userId: string, source: string) {
  const paidCount = await getVerifiedPaidCompetitionCount(userId);

  if (paidCount >= 5) {
    await insertMilestoneIfMissing({
      userId,
      points: fivePaidCompetitionMilestonePoints,
      description: `Earned ${fivePaidCompetitionMilestonePoints} LockIn Points for completing 5 paid competitions. Source: ${source}.`
    });
  }

  if (paidCount >= 10) {
    await insertMilestoneIfMissing({
      userId,
      points: tenPaidCompetitionMilestonePoints,
      description: `Earned ${tenPaidCompetitionMilestonePoints} LockIn Points for completing 10 paid competitions. Source: ${source}.`
    });
  }
}

async function insertMilestoneIfMissing({ userId, points, description }: { userId: string; points: number; description: string }) {
  const existing = await getLedgerTotal({ userId, type: "milestone", points });
  if (existing > 0) return;

  await insertLedgerEntry({
    userId,
    points,
    type: "milestone",
    description
  });
}

async function recordRedeemedPoints(registration: RegistrationForRewards, source: string) {
  const pointsToRedeem = Math.max(0, Math.floor(Number(registration.points_redeemed || 0)));
  if (!pointsToRedeem) return;

  const currentRedemptionTotal = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "redemption"
  });
  const targetTotal = -pointsToRedeem;
  const delta = targetTotal - currentRedemptionTotal;

  if (delta === 0) return;

  await insertLedgerEntry({
    userId: registration.user_id,
    registrationId: registration.id,
    competitionSlug: registration.competition_slug,
    points: delta,
    type: "redemption",
    description: `Applied ${pointsToRedeem} LockIn Points as a checkout discount for ${registration.competition_name}. Source: ${source}.`
  });
}

async function reverseParticipationPoints(registration: RegistrationForRewards, source: string) {
  const netParticipation = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "participation"
  });

  const existingReversals = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "refund_reversal",
    descriptionIncludes: "participation"
  });

  const netToReverse = netParticipation + existingReversals;
  if (netToReverse <= 0) return;

  await insertLedgerEntry({
    userId: registration.user_id,
    registrationId: registration.id,
    competitionSlug: registration.competition_slug,
    points: -netToReverse,
    type: "refund_reversal",
    description: `Removed participation LockIn Points because payment is ${registration.payment_status}. Source: ${source}.`
  });
}

async function reverseRedeemedPoints(registration: RegistrationForRewards, source: string) {
  const redemptionTotal = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "redemption"
  });

  const existingReversals = await getLedgerTotal({
    userId: registration.user_id,
    registrationId: registration.id,
    type: "refund_reversal",
    descriptionIncludes: "redeemed"
  });

  const netToRestore = redemptionTotal + existingReversals;
  if (netToRestore >= 0) return;

  await insertLedgerEntry({
    userId: registration.user_id,
    registrationId: registration.id,
    competitionSlug: registration.competition_slug,
    points: Math.abs(netToRestore),
    type: "refund_reversal",
    description: `Restored redeemed LockIn Points because payment is ${registration.payment_status}. Source: ${source}.`
  });
}

async function reverseUnearnedMilestonePoints(userId: string, source: string) {
  const paidCount = await getVerifiedPaidCompetitionCount(userId);

  if (paidCount < 10) {
    await reverseMilestoneIfNeeded({
      userId,
      points: tenPaidCompetitionMilestonePoints,
      description: `Removed 10 paid competition milestone LockIn Points after payment reversal. Source: ${source}.`
    });
  }

  if (paidCount < 5) {
    await reverseMilestoneIfNeeded({
      userId,
      points: fivePaidCompetitionMilestonePoints,
      description: `Removed 5 paid competition milestone LockIn Points after payment reversal. Source: ${source}.`
    });
  }
}

async function reverseMilestoneIfNeeded({ userId, points, description }: { userId: string; points: number; description: string }) {
  const milestoneTotal = await getLedgerTotal({ userId, type: "milestone", points });
  const reversalTotal = await getLedgerTotal({
    userId,
    type: "refund_reversal",
    points: -points,
    descriptionIncludes: "milestone"
  });

  if (milestoneTotal + reversalTotal <= 0) return;

  await insertLedgerEntry({
    userId,
    points: -points,
    type: "refund_reversal",
    description
  });
}

async function getVerifiedPaidCompetitionCount(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("user_id", userId)
    .in("payment_status", paidStatuses);

  if (error) {
    console.warn(`[LockInTalks points] Could not load paid competition count for user ${userId}: ${error.message}`);
    return 0;
  }

  return data?.length || 0;
}

async function getLedgerTotal({
  userId,
  registrationId,
  type,
  points,
  descriptionIncludes
}: {
  userId: string;
  registrationId?: string;
  type?: LedgerType;
  points?: number;
  descriptionIncludes?: string;
}) {
  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin.from("lockin_points_ledger").select("points,description").eq("user_id", userId);

  if (registrationId) query = query.eq("registration_id", registrationId);
  if (type) query = query.eq("type", type);
  if (typeof points === "number") query = query.eq("points", points);

  const { data, error } = await query;

  if (error) {
    console.warn(`[LockInTalks points] Could not read ledger for user ${userId}: ${error.message}`);
    return 0;
  }

  return (data || [])
    .filter((row) => !descriptionIncludes || String(row.description || "").toLowerCase().includes(descriptionIncludes.toLowerCase()))
    .reduce((total, row) => total + Number(row.points || 0), 0);
}

async function insertLedgerEntry({
  userId,
  registrationId = null,
  competitionSlug = null,
  points,
  type,
  description,
  createdBy = null
}: {
  userId: string;
  registrationId?: string | null;
  competitionSlug?: string | null;
  points: number;
  type: LedgerType;
  description: string;
  createdBy?: string | null;
}) {
  if (!points) return;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("lockin_points_ledger").insert({
    user_id: userId,
    registration_id: registrationId,
    competition_slug: competitionSlug,
    points,
    type,
    description,
    created_by: createdBy
  });

  if (error) console.warn(`[LockInTalks points] Could not insert ${type} points for user ${userId}: ${error.message}`);
}

function formatWinnerPlace(place: WinnerPlace) {
  if (place === "first") return "1st place";
  if (place === "second") return "2nd place";
  return "3rd place";
}
