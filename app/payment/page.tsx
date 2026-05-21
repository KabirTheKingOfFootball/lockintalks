import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";
import { MotionShell } from "@/components/motion-shell";
import { createClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/supabase/env";

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
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (!userId) return null;

    const { data, error } = await supabase
      .from("registrations")
      .select("competition_slug, competition_name, entry_fee")
      .eq("id", registrationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error(`[LockInTalks payment] Could not load payment summary: ${error.message}`);
      return null;
    }

    const { data: competition } = await supabase
      .from("competitions")
      .select("event_date")
      .eq("slug", data.competition_slug)
      .maybeSingle();

    return {
      competitionName: data.competition_name,
      competitionDate: competition?.event_date || "See competition details",
      entryFee: data.entry_fee
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
