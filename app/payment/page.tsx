import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";
import { MotionShell } from "@/components/motion-shell";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { getMaxUsableLockInPoints, getUserLockInPointsBalance } from "@/lib/rewards/points";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your LockInTalks competition registration payment."
};

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ registration?: string }> }) {
  const { registration: registrationId = null } = await searchParams;
  const summary = await getPaymentSummary(registrationId);

  return (
    <MotionShell className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <PaymentForm registrationId={registrationId} summary={summary} />
    </MotionShell>
  );
}

async function getPaymentSummary(registrationId: string | null) {
  if (!registrationId) return null;

  try {
    const session = await getServerAuthSession();

    if (!session.authenticated) return null;

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select("competition_slug, competition_name, entry_fee, points_redeemed")
      .eq("id", registrationId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error(`[LockInTalks payment] Could not load payment summary: ${error.message}`);
      return null;
    }

    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("event_date, event_time, timezone, fee_amount")
      .eq("slug", data.competition_slug)
      .maybeSingle();

    const feeAmount = Number(competition?.fee_amount || 0);
    const availablePoints = await getUserLockInPointsBalance(session.user.id);

    return {
      competitionName: data.competition_name,
      competitionDate: competition ? `${competition.event_date} | ${competition.event_time || "TBA"} ${competition.timezone || "IST"}` : "See competition details",
      entryFee: data.entry_fee,
      feeAmount,
      availablePoints,
      maxUsablePoints: getMaxUsableLockInPoints(feeAmount),
      previouslyAppliedPoints: Number(data.points_redeemed || 0)
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
