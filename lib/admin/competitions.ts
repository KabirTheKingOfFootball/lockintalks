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
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(`[LockInTalks admin competitions] Failed to load competitions: ${error.message}`);
      return { competitions: [] as AdminCompetition[], error: error.message };
    }

    return { competitions: (data || []) as AdminCompetition[], error: null };
  } catch (error) {
    console.error("[LockInTalks admin competitions] Unexpected load failure:", error);
    return { competitions: [] as AdminCompetition[], error: "Could not connect to Supabase competitions data." };
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
