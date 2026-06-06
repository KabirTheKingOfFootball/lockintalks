import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";
import { MotionShell } from "@/components/motion-shell";
import { PosterBackdrop } from "@/components/brand-visuals";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { formatPaiseAsInr, getRegistrationAmountRepairPatch, resolvePayableAmountPaise } from "@/lib/payment/amounts";
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
  const paymentState = await getPaymentSummary({ competitionSlug, registrationId });
  const razorpayStatus = getRazorpayEnvStatus();

  return (
    <MotionShell className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <PosterBackdrop compact />
      <div className="relative z-10 mx-auto max-w-6xl">
      <PaymentForm
        competitionSlug={paymentState.summary?.competitionSlug || paymentState.issue?.competitionSlug || competitionSlug}
        registrationId={paymentState.summary?.registrationId || registrationId}
        summary={paymentState.summary}
        issue={paymentState.issue}
        currentAccount={paymentState.currentAccount}
        paymentConfig={{
          checkoutReady: razorpayStatus.checkoutReady,
          webhookReady: razorpayStatus.webhookReady,
          keyMode: razorpayStatus.keyMode
        }}
      />
      </div>
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
  registration_status: string | null;
  payment_amount: number | null;
  amount_due: number | null;
  payment_currency: string | null;
};

type PaymentIssue = {
  type: "not_authenticated" | "not_found" | "owner_mismatch" | "admin_owner_mismatch" | "invalid_amount";
  message: string;
  competitionSlug: string | null;
};

type PaymentRegistrationLookup = {
  registration: PaymentRegistration | null;
  ownerMismatch: boolean;
  competitionSlug: string | null;
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

    if (!session.authenticated) {
      return {
        summary: null,
        issue: {
          type: "not_authenticated",
          message: "Please log in before paying for a competition registration.",
          competitionSlug
        } satisfies PaymentIssue,
        currentAccount: null
      };
    }

    const currentAccount = {
      email: session.user.email,
      role: session.role
    };

    console.info(
      `[LockInTalks payment] Payment page query received. user=${session.user.id} registration=${registrationId || "none"} competition=${competitionSlug || "none"}`
    );

    const supabaseAdmin = createAdminClient();
    const lookup = await findPaymentRegistration({
      competitionSlug,
      registrationId,
      supabaseAdmin,
      userId: session.user.id
    });
    const registration = lookup.registration;

    if (lookup.ownerMismatch) {
      const isAdmin = session.role === "admin";
      console.warn(
        `[LockInTalks payment] Showing owner mismatch payment message. user=${session.user.id} role=${session.role} registration=${registrationId || "none"}`
      );
      return {
        summary: null,
        issue: {
          type: isAdmin ? "admin_owner_mismatch" : "owner_mismatch",
          message: isAdmin
            ? "You are logged in as an admin account. This registration belongs to another user account. Please log in as the participant account to pay."
            : "This registration was created under a different account. Please log in with the same account used for registration, or register again with this account.",
          competitionSlug: lookup.competitionSlug || competitionSlug
        } satisfies PaymentIssue,
        currentAccount
      };
    }

    if (!registration) {
      console.warn(`[LockInTalks payment] No registration found for payment lookup. user=${session.user.id} registration=${registrationId || "none"} competition=${competitionSlug || "none"}`);
      return {
        summary: null,
        issue: {
          type: "not_found",
          message: "We could not find your registration for this account. Please register again for this competition.",
          competitionSlug
        } satisfies PaymentIssue,
        currentAccount
      };
    }

    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("event_date, event_time, timezone, fee_amount")
      .eq("slug", registration.competition_slug)
      .maybeSingle();

    const resolvedAmount = resolvePayableAmountPaise({
      registration,
      competition,
      competitionSlug: registration.competition_slug
    });

    if (!resolvedAmount.amountPaise) {
      console.error(`[LockInTalks payment] Invalid amount for registration=${registration.id} competition=${registration.competition_slug}`);
      return {
        summary: null,
        issue: {
          type: "invalid_amount",
          message: "This registration does not have a valid payment amount configured yet. Please contact support.",
          competitionSlug: registration.competition_slug
        } satisfies PaymentIssue,
        currentAccount
      };
    }

    await repairRegistrationAmountIfNeeded({
      registration,
      resolvedAmount,
      supabaseAdmin,
      source: "payment_page"
    });

    return {
      summary: {
        registrationId: registration.id,
        competitionSlug: registration.competition_slug,
        paymentStatus: registration.payment_status || "pending",
        alreadyPaid: isSeatConfirmed(registration.payment_status),
        competitionName: registration.competition_name,
        competitionDate: competition ? `${competition.event_date} | ${competition.event_time || "TBA"} ${competition.timezone || "IST"}` : "See competition details",
        entryFee: formatPaiseAsInr(resolvedAmount.amountPaise),
        feeAmount: resolvedAmount.amountPaise
      },
      issue: null,
      currentAccount
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks payment] ${error.message}`);
    } else {
      console.error("[LockInTalks payment] Unexpected payment summary error:", error);
    }

    return {
      summary: null,
      issue: {
        type: "not_found",
        message: "Could not load payment details right now. Please try again or contact support.",
        competitionSlug
      } satisfies PaymentIssue,
      currentAccount: null
    };
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
}): Promise<PaymentRegistrationLookup> {
  const selectColumns = "id, user_id, competition_slug, competition_name, entry_fee, payment_status, registration_status, payment_amount, amount_due, payment_currency";
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
      if (ownerMatches) {
        return {
          registration: data as PaymentRegistration,
          ownerMismatch: false,
          competitionSlug: data.competition_slug || trimmedCompetitionSlug || null
        };
      }
      console.warn(`[LockInTalks payment] Registration owner mismatch. requested_user=${userId} registration=${trimmedRegistrationId} owner_user=${ownerUserId}`);
      return {
        registration: null,
        ownerMismatch: true,
        competitionSlug: data.competition_slug || trimmedCompetitionSlug || null
      };
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
      .in("payment_status", ["pending", "order_created", "payment_created", "signature_verified", "failed", "cancelled", "refunded"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.error(`[LockInTalks payment] Pending registration lookup failed for ${slug}: ${pendingError.message}`);
    }

    if (pendingRegistration) {
      console.info(`[LockInTalks payment] Pending slug fallback found. user=${userId} registration=${pendingRegistration.id} competition=${slug}`);
      return {
        registration: pendingRegistration as PaymentRegistration,
        ownerMismatch: false,
        competitionSlug: slug
      };
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
      return {
        registration: paidRegistration as PaymentRegistration,
        ownerMismatch: false,
        competitionSlug: slug
      };
    }
  }

  return {
    registration: null,
    ownerMismatch: false,
    competitionSlug: trimmedCompetitionSlug || null
  };
}

async function repairRegistrationAmountIfNeeded({
  registration,
  resolvedAmount,
  supabaseAdmin,
  source
}: {
  registration: PaymentRegistration;
  resolvedAmount: ReturnType<typeof resolvePayableAmountPaise>;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  source: string;
}) {
  const repairPatch = getRegistrationAmountRepairPatch(resolvedAmount, registration.payment_status);
  if (!repairPatch) return;

  const { error } = await supabaseAdmin.from("registrations").update(repairPatch).eq("id", registration.id);
  if (error) {
    console.warn(`[LockInTalks payment] Could not repair amount for registration=${registration.id}: ${error.message}`);
    return;
  }

  console.info(
    `[LockInTalks payment] Repaired unpaid registration amount. source=${source} registration=${registration.id} amount=${resolvedAmount.amountPaise} reason=${resolvedAmount.repairReason || "unknown"}`
  );
}
