import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePrizePool, type PrizePoolSummary } from "@/lib/rewards/prize-pool";

export type AdminCompetition = {
  id: string;
  slug: string;
  name: string;
  category: string;
  age_group: string;
  event_date: string;
  event_time: string | null;
  timezone: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  fee_label: string;
  fee_amount: number;
  prize_pool_enabled: boolean | null;
  prize_pool_per_paid_participant: number | null;
  prize_pool_display_threshold: number | null;
  points_enabled: boolean | null;
  summary: string;
  description: string;
  image_url: string | null;
  status: "draft" | "live" | "closed";
  rules: string[];
  schedule: string[];
  prizes: string[];
  criteria: string[];
  judges: string[];
  created_at: string;
  verified_paid_participants?: number;
  calculated_prize_pool?: PrizePoolSummary;
};

export async function getAdminCompetitions() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(`[LockInTalks admin competitions] Failed to load competitions: ${error.message}`);
      return { competitions: [] as AdminCompetition[], error: error.message };
    }

    const competitions = ((data || []) as AdminCompetition[]).map((competition) => ({ ...competition }));
    const paidCounts = await getVerifiedPaidParticipantCounts(competitions.map((competition) => competition.slug));

    return {
      competitions: competitions.map((competition) => {
        const verifiedPaidParticipants = paidCounts.get(competition.slug) || 0;
        return {
          ...competition,
          verified_paid_participants: verifiedPaidParticipants,
          calculated_prize_pool: calculatePrizePool({
            enabled: competition.prize_pool_enabled,
            paidParticipants: verifiedPaidParticipants,
            perPaidParticipant: competition.prize_pool_per_paid_participant,
            displayThreshold: competition.prize_pool_display_threshold
          })
        };
      }),
      error: null
    };
  } catch (error) {
    console.error("[LockInTalks admin competitions] Unexpected load failure:", error);
    return { competitions: [] as AdminCompetition[], error: "Could not connect to Supabase competitions data." };
  }
}

async function getVerifiedPaidParticipantCounts(slugs: string[]) {
  const counts = new Map<string, number>();
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  if (uniqueSlugs.length === 0) return counts;

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select("competition_slug")
      .in("competition_slug", uniqueSlugs)
      .in("payment_status", ["captured", "paid"]);

    if (error) {
      console.warn(`[LockInTalks admin competitions] Could not calculate paid participant counts: ${error.message}`);
      return counts;
    }

    for (const row of data || []) {
      const slug = String(row.competition_slug || "");
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
  } catch (error) {
    console.warn("[LockInTalks admin competitions] Paid participant count skipped:", error);
  }

  return counts;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
