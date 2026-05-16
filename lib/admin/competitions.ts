import { competitions as fallbackCompetitions } from "@/data/competitions";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCompetition = {
  id: string;
  slug: string;
  name: string;
  category: string;
  age_group: string;
  event_date: string;
  fee_label: string;
  fee_amount: number;
  summary: string;
  description: string;
  image_url: string | null;
  status: "draft" | "live" | "closed";
  rules: string[];
  schedule: string[];
  prizes: string[];
  judges: string[];
  created_at: string;
};

export async function getAdminCompetitions() {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(`[LockInTalks admin competitions] Failed to load competitions: ${error.message}`);
    return { competitions: [] as AdminCompetition[], error: error.message };
  }

  return { competitions: (data || []) as AdminCompetition[], error: null };
}

export function getFallbackAdminCompetitions(): AdminCompetition[] {
  return fallbackCompetitions.map((competition, index) => ({
    id: competition.slug,
    slug: competition.slug,
    name: competition.name,
    category: competition.category,
    age_group: competition.ageGroup,
    event_date: competition.date,
    fee_label: competition.fee,
    fee_amount: Number(competition.fee.replace(/\D/g, "")) * 100 || 0,
    summary: competition.summary,
    description: competition.description,
    image_url: null,
    status: "live",
    rules: competition.rules,
    schedule: competition.schedule,
    prizes: competition.prizes,
    judges: competition.judges,
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString()
  }));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
