type QueryValue = string | string[] | undefined | null;

export type PaymentSearchParams = {
  competition?: QueryValue;
  registration?: QueryValue;
  registrationId?: QueryValue;
  id?: QueryValue;
};

export function firstQueryValue(value: QueryValue) {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = String(raw || "").trim();
  return trimmed || null;
}

export function getPaymentRegistrationReference(params: PaymentSearchParams) {
  return firstQueryValue(params.registration) || firstQueryValue(params.registrationId) || firstQueryValue(params.id);
}

export function getPaymentCompetitionSlug(params: PaymentSearchParams) {
  return firstQueryValue(params.competition);
}

export function buildPaymentUrl({ registrationId, competitionSlug }: { registrationId: string; competitionSlug?: string | null }) {
  const params = new URLSearchParams();
  params.set("registration", registrationId);
  const slug = String(competitionSlug || "").trim();
  if (slug) params.set("competition", slug);
  return `/payment?${params.toString()}`;
}

export function getCreateOrderRegistrationReference(body: { registrationId?: unknown; registration?: unknown; id?: unknown }) {
  return firstQueryValue(String(body.registrationId || body.registration || body.id || ""));
}
