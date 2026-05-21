import { createPublicClient } from "@/lib/supabase/public";
import { SupabaseConfigError } from "@/lib/supabase/env";

export type CompetitionStatus = "draft" | "live" | "closed";

export type CompetitionRecord = {
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
  status: CompetitionStatus;
  rules: string[];
  schedule: string[];
  prizes: string[];
  judges: string[];
  created_at: string;
  updated_at?: string | null;
};

export type PublicCompetition = {
  id: string;
  slug: string;
  name: string;
  category: string;
  ageGroup: string;
  date: string;
  dateIso: string;
  fee: string;
  feeAmount: number;
  status: CompetitionStatus;
  slotsRemaining: number;
  featured: boolean;
  summary: string;
  description: string;
  accent: string;
  imageUrl: string | null;
  rules: string[];
  schedule: string[];
  prizes: string[];
  judges: string[];
  criteria: string[];
};

const accents = [
  "from-amber-300 via-yellow-500 to-orange-500",
  "from-yellow-200 via-amber-400 to-yellow-700",
  "from-white via-yellow-300 to-amber-600",
  "from-blue-100 via-amber-300 to-yellow-600"
];

const defaultCriteria = ["Message clarity", "Structure", "Voice control", "Presence and confidence"];

export async function getLiveCompetitions(limit?: number) {
  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("competitions")
      .select("*")
      .eq("status", "live")
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error(`[LockInTalks competitions] Failed to load live competitions: ${error.message}`);
      return { competitions: [] as PublicCompetition[], error: error.message };
    }

    return { competitions: (data || []).map(mapCompetitionRecord), error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks competitions] ${error.message}`);
      return { competitions: [] as PublicCompetition[], error: error.message };
    }

    console.error("[LockInTalks competitions] Unexpected live competition load failure:", error);
    return { competitions: [] as PublicCompetition[], error: "Could not load competitions right now." };
  }
}

export async function getLiveCompetitionBySlug(slug: string) {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("competitions").select("*").eq("slug", slug).eq("status", "live").maybeSingle();

    if (error) {
      console.error(`[LockInTalks competitions] Failed to load competition ${slug}: ${error.message}`);
      return { competition: null, error: error.message };
    }

    return { competition: data ? mapCompetitionRecord(data as CompetitionRecord) : null, error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks competitions] ${error.message}`);
      return { competition: null, error: error.message };
    }

    console.error(`[LockInTalks competitions] Unexpected competition load failure for ${slug}:`, error);
    return { competition: null, error: "Could not load this competition right now." };
  }
}

export function mapCompetitionRecord(record: CompetitionRecord): PublicCompetition {
  const dateIso = getDateIso(record.event_date);
  const accent = accents[Math.abs(hashString(record.slug)) % accents.length];

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category,
    ageGroup: record.age_group,
    date: record.event_date,
    dateIso,
    fee: record.fee_label,
    feeAmount: record.fee_amount,
    status: record.status,
    slotsRemaining: getSlotsRemaining(record),
    featured: record.status === "live",
    summary: record.summary,
    description: record.description,
    accent,
    imageUrl: record.image_url,
    rules: record.rules || [],
    schedule: record.schedule || [],
    prizes: record.prizes || [],
    judges: record.judges || [],
    criteria: defaultCriteria
  };
}

function getDateIso(eventDate: string) {
  const parsed = new Date(eventDate);
  if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function getSlotsRemaining(record: CompetitionRecord) {
  const seed = Math.abs(hashString(record.id || record.slug));
  return 18 + (seed % 35);
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}
