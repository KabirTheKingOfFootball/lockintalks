import { createPublicClient } from "@/lib/supabase/public";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePrizePool, type PrizePoolSummary } from "@/lib/rewards/prize-pool";

export type CompetitionStatus = "draft" | "live" | "closed";

export type CompetitionRecord = {
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
  prize_pool_enabled?: boolean | null;
  prize_pool_per_paid_participant?: number | null;
  prize_pool_display_threshold?: number | null;
  points_enabled?: boolean | null;
  summary: string;
  description: string;
  image_url: string | null;
  status: CompetitionStatus;
  rules: string[];
  schedule: string[];
  prizes: string[];
  criteria: string[];
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
  time: string;
  timezone: string;
  registrationDeadline: string | null;
  fee: string;
  feeAmount: number;
  prizePool: PrizePoolSummary;
  status: CompetitionStatus;
  slotsRemaining: number;
  maxParticipants: number;
  displayStatus: "Upcoming" | "Live" | "Closed";
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

const defaultCriteria = ["Confidence", "Clarity", "Creativity", "Speech Structure", "Stage Presence", "Time Management"];

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

    const paidCounts = await getVerifiedPaidParticipantCounts((data || []).map((record) => String(record.slug)));

    return { competitions: (data || []).map((record) => mapCompetitionRecord(record as CompetitionRecord, paidCounts.get(String(record.slug)) || 0)), error: null };
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

    const paidCounts = data ? await getVerifiedPaidParticipantCounts([String(data.slug)]) : new Map<string, number>();

    return { competition: data ? mapCompetitionRecord(data as CompetitionRecord, paidCounts.get(String(data.slug)) || 0) : null, error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks competitions] ${error.message}`);
      return { competition: null, error: error.message };
    }

    console.error(`[LockInTalks competitions] Unexpected competition load failure for ${slug}:`, error);
    return { competition: null, error: "Could not load this competition right now." };
  }
}

export function mapCompetitionRecord(record: CompetitionRecord, paidParticipants = 0): PublicCompetition {
  const dateIso = getDateIso(record.event_date, record.event_time || "");
  const accent = accents[Math.abs(hashString(record.slug)) % accents.length];
  const maxParticipants = Number(record.max_participants || 50);
  const prizePool = calculatePrizePool({
    enabled: record.prize_pool_enabled,
    paidParticipants,
    perPaidParticipant: record.prize_pool_per_paid_participant,
    displayThreshold: record.prize_pool_display_threshold
  });

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category,
    ageGroup: record.age_group,
    date: record.event_date,
    dateIso,
    time: record.event_time || "TBA",
    timezone: record.timezone || "IST",
    registrationDeadline: record.registration_deadline || null,
    fee: record.fee_label,
    feeAmount: record.fee_amount,
    prizePool,
    status: record.status,
    slotsRemaining: maxParticipants,
    maxParticipants,
    displayStatus: getDisplayStatus(record.status, dateIso),
    featured: record.status === "live",
    summary: record.summary,
    description: record.description,
    accent,
    imageUrl: record.image_url,
    rules: record.rules || [],
    schedule: record.schedule || [],
    prizes: record.prizes || [],
    judges: record.judges || [],
    criteria: record.criteria?.length ? record.criteria : defaultCriteria
  };
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
      console.warn(`[LockInTalks competitions] Prize pool count failed: ${error.message}`);
      return counts;
    }

    for (const row of data || []) {
      const slug = String(row.competition_slug || "");
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
  } catch (error) {
    console.warn("[LockInTalks competitions] Prize pool count skipped:", error);
  }

  return counts;
}

function getDateIso(eventDate: string, eventTime: string) {
  const istIso = toIstIso(eventDate, eventTime);
  if (istIso) return istIso;
  const parsed = new Date(`${eventDate} ${eventTime || ""}`.trim());
  if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function toIstIso(eventDate: string, eventTime: string) {
  const dateMatch = eventDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = eventTime.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!dateMatch || !timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] || 0);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  return new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`).toISOString();
}

function getDisplayStatus(status: CompetitionStatus, dateIso: string): "Upcoming" | "Live" | "Closed" {
  if (status === "closed") return "Closed";
  const now = Date.now();
  const eventTime = new Date(dateIso).getTime();
  if (!Number.isFinite(eventTime)) return status === "live" ? "Upcoming" : "Closed";
  if (eventTime + 3 * 60 * 60 * 1000 < now) return "Closed";
  if (eventTime <= now) return "Live";
  return "Upcoming";
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}
