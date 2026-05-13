import { competitions } from "@/data/competitions";

export type RegistrationRow = {
  id: string;
  user_id: string;
  competition_slug: string;
  competition_name: string;
  student_name: string;
  student_age: number;
  guardian_name: string;
  guardian_email: string;
  city_country: string;
  entry_fee: string;
  payment_status: "pending" | "paid";
  created_at: string;
};

export function getCompetitionBySlug(slug: string | null) {
  return competitions.find((competition) => competition.slug === slug) || competitions[0];
}
