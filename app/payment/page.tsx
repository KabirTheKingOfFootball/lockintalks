import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";
import { MotionShell } from "@/components/motion-shell";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { getLaunchCompetitionDefault } from "@/lib/competition-defaults";
import { getRazorpayEnvStatus } from "@/lib/razorpay/env";
import { isSeatConfirmed } from "@/lib/payment/status";
import { getPaymentCompetitionSlug, getPaymentRegistrationReference, type PaymentSearchParams } from "@/lib/payment/registration-reference";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your LockInTalks competition registration payment."
};

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }: { searchParams: Promise<PaymentSearchParams> }) {
  const params = await searchParams;
  const competitionSlug = getPaymentCompetitionSlug(params);
  const registrationId = getPaymentRegistrationReference(params);
  const summary = await getPaymentSummary({ competitionSlug, registrationId });
  const razorpayStatus = getRazorpayEnvStatus();

  return (
    <MotionShell className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <PaymentForm
        competitionSlug={summary?.competitionSlug || competitionSlug}
        registrationId={summary?.registrationId || registrationId}
        summary={summary}
        paymentConfig={{
          checkoutReady: razorpayStatus.checkoutReady,
          webhookReady: razorpayStatus.webhookReady,
          keyMode: razorpayStatus.keyMode
        }}
      />
    </MotionShell>
  );
}

type PaymentRegistration = {
  id: string;
  user_id: string;
  competition_slug: string;
  competition_name: string;
  entry_fee: string | null;
  payment_status: string | null;
};

async function getPaymentSummary({
  competitionSlug,
  registrationId
}: {
  competitionSlug: string | null;
  registrationId: string | null;
}) {
  try {
    const session = await getServerAuthSession();

    if (!session.authenticated) return null;

    console.info(
      `[LockInTalks payment] Payment page query received. user=${session.user.id} registration=${registrationId || "none"} competition=${competitionSlug || "none"}`
    );

    const supabaseAdmin = createAdminClient();
    const registration = await findPaymentRegistration({
      competitionSlug,
      registrationId,
      supabaseAdmin,
      userId: session.user.id
    });

    if (!registration) {
      console.warn(`[LockInTalks payment] No registration found for payment lookup. user=${session.user.id} registration=${registrationId || "none"} competition=${competitionSlug || "none"}`);
      return null;
    }

    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("event_date, event_time, timezone, fee_amount")
      .eq("slug", registration.competition_slug)
      .maybeSingle();

    const launchDefault = getLaunchCompetitionDefault(registration.competition_slug);
    const parsedFeeAmount = Number(competition?.fee_amount);
    const feeAmount = Number.isFinite(parsedFeeAmount) && parsedFeeAmount > 0 ? parsedFeeAmount : launchDefault?.feeAmount || 0;

    return {
      registrationId: registration.id,
      competitionSlug: registration.competition_slug,
      paymentStatus: registration.payment_status || "pending",
      alreadyPaid: isSeatConfirmed(registration.payment_status),
      competitionName: registration.competition_name,
      competitionDate: competition ? `${competition.event_date} | ${competition.event_time || "TBA"} ${competition.timezone || "IST"}` : "See competition details",
      entryFee: registration.entry_fee || launchDefault?.feeLabel || formatFeeLabel(feeAmount),
      feeAmount
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks payment] ${error.message}`);
    } else {
      console.error("[LockInTalks payment] Unexpected payment summary error:", error);
    }

    return null;
  }
}

async function findPaymentRegistration({
  competitionSlug,
  registrationId,
  supabaseAdmin,
  userId
}: {
  competitionSlug: string | null;
  registrationId: string | null;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
}): Promise<PaymentRegistration | null> {
  const selectColumns = "id, user_id, competition_slug, competition_name, entry_fee, payment_status";
  const slugCandidates = new Set<string>();
  const trimmedRegistrationId = String(registrationId || "").trim();
  const trimmedCompetitionSlug = String(competitionSlug || "").trim();

  if (trimmedCompetitionSlug) slugCandidates.add(trimmedCompetitionSlug);

  if (trimmedRegistrationId) {
    console.info(`[LockInTalks payment] Exact registration lookup started. user=${userId} registration=${trimmedRegistrationId}`);
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select(selectColumns)
      .eq("id", trimmedRegistrationId)
      .maybeSingle();

    if (error) {
      console.error(`[LockInTalks payment] Registration id lookup failed: ${error.message}`);
    }

    if (data) {
      const ownerUserId = String(data.user_id || "");
      const ownerMatches = ownerUserId === userId;
      console.info(
        `[LockInTalks payment] Exact registration lookup found. requested_user=${userId} registration=${trimmedRegistrationId} owner_user=${ownerUserId} owner_matches=${ownerMatches} competition=${data.competition_slug}`
      );
      if (ownerMatches) return data as PaymentRegistration;
      console.warn(`[LockInTalks payment] Registration owner mismatch. requested_user=${userId} registration=${trimmedRegistrationId} owner_user=${ownerUserId}`);
      return null;
    }

    console.warn(`[LockInTalks payment] Exact registration lookup not found. user=${userId} registration=${trimmedRegistrationId}`);
  }

  for (const slug of slugCandidates) {
    console.info(`[LockInTalks payment] Slug fallback lookup started. user=${userId} competition=${slug}`);
    const { data: pendingRegistration, error: pendingError } = await supabaseAdmin
      .from("registrations")
      .select(selectColumns)
      .eq("user_id", userId)
      .eq("competition_slug", slug)
      .in("payment_status", ["pending", "order_created", "payment_created", "signature_verified"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.error(`[LockInTalks payment] Pending registration lookup failed for ${slug}: ${pendingError.message}`);
    }

    if (pendingRegistration) {
      console.info(`[LockInTalks payment] Pending slug fallback found. user=${userId} registration=${pendingRegistration.id} competition=${slug}`);
      return pendingRegistration as PaymentRegistration;
    }

    const { data: paidRegistration, error: paidError } = await supabaseAdmin
      .from("registrations")
      .select(selectColumns)
      .eq("user_id", userId)
      .eq("competition_slug", slug)
      .in("payment_status", ["captured", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paidError) {
      console.error(`[LockInTalks payment] Paid registration lookup failed for ${slug}: ${paidError.message}`);
    }

    if (paidRegistration) {
      console.info(`[LockInTalks payment] Paid slug fallback found. user=${userId} registration=${paidRegistration.id} competition=${slug}`);
      return paidRegistration as PaymentRegistration;
    }
  }

  return null;
}

function formatFeeLabel(feeAmountPaise: number) {
  const amount = Math.max(0, Math.floor(Number(feeAmountPaise) || 0));
  if (!amount) return "Calculated at Checkout";
  return `INR ${(amount / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
