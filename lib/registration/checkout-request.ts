export type RegistrationCheckoutDetailsCode =
  | "INVALID_PAYLOAD_SHAPE"
  | "INVALID_COMPETITION_SLUG"
  | "MISSING_STUDENT_NAME"
  | "MISSING_STUDENT_AGE"
  | "INVALID_STUDENT_AGE"
  | "MISSING_GUARDIAN_NAME"
  | "MISSING_GUARDIAN_EMAIL"
  | "INVALID_GUARDIAN_EMAIL"
  | "MISSING_CITY"
  | "MISSING_COUNTRY"
  | "COMPETITION_NOT_FOUND"
  | "INSERT_FAILED"
  | "INSERT_RLS_BLOCKED"
  | "INSERT_MISSING_REQUIRED_COLUMN"
  | "INSERT_UNKNOWN_COLUMN"
  | "INSERT_CHECK_CONSTRAINT_FAILED"
  | "INSERT_FOREIGN_KEY_FAILED"
  | "INSERT_DUPLICATE_CONSTRAINT"
  | "INSERT_ENUM_VALUE_INVALID"
  | "INSERT_TYPE_MISMATCH"
  | "INSERT_UNKNOWN_SUPABASE_ERROR"
  | "ORDER_FAILED";

export type NormalizedRegistrationCheckoutRequest = {
  competitionSlug: string;
  studentName: string;
  studentAge: number;
  guardianName: string;
  guardianEmail: string;
  city: string;
  country: string;
};

type NormalizationResult =
  | {
      ok: true;
      values: NormalizedRegistrationCheckoutRequest;
    }
  | {
      ok: false;
      detailsCode: RegistrationCheckoutDetailsCode;
      error: string;
      slugForRedirect?: string;
    };

const emailPattern = /^\S+@\S+\.\S+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeCreateCheckoutRequest(payload: unknown): NormalizationResult {
  if (!isPlainRecord(payload)) {
    return invalid("INVALID_PAYLOAD_SHAPE", "The registration form sent an invalid request. Please refresh and try again.");
  }

  const competitionSlug = normalizeSlug(firstValue(payload, ["competitionSlug", "competition_slug", "slug"]));
  const studentName = normalizeText(firstValue(payload, ["studentName", "student_name", "student"]));
  const studentAgeValue = firstValue(payload, ["studentAge", "student_age", "age"]);
  const guardianName = normalizeText(firstValue(payload, ["guardianName", "guardian_name", "parentName", "parent_name", "guardian"]));
  const guardianEmail = normalizeText(firstValue(payload, ["guardianEmail", "guardian_email", "parentEmail", "parent_email", "email"]));
  const city = normalizeText(firstValue(payload, ["city"]));
  const country = normalizeText(firstValue(payload, ["country", "nation", "countryNation", "country_nation"]));

  if (!competitionSlug || !slugPattern.test(competitionSlug)) {
    return invalid("INVALID_COMPETITION_SLUG", "This competition link is invalid. Please open the competition page again.");
  }

  if (!studentName) {
    return invalid("MISSING_STUDENT_NAME", "Please enter the student name.", competitionSlug);
  }

  if (studentAgeValue === undefined || studentAgeValue === null || String(studentAgeValue).trim() === "") {
    return invalid("MISSING_STUDENT_AGE", "Please enter the student age.", competitionSlug);
  }

  const studentAge = Number(studentAgeValue);
  if (!Number.isInteger(studentAge) || studentAge < 6 || studentAge > 19) {
    return invalid("INVALID_STUDENT_AGE", "Student age must be between 6 and 19.", competitionSlug);
  }

  if (!guardianName) {
    return invalid("MISSING_GUARDIAN_NAME", "Please enter the guardian name.", competitionSlug);
  }

  if (!guardianEmail) {
    return invalid("MISSING_GUARDIAN_EMAIL", "Please enter the guardian email.", competitionSlug);
  }

  if (!emailPattern.test(guardianEmail)) {
    return invalid("INVALID_GUARDIAN_EMAIL", "Please enter a valid guardian email.", competitionSlug);
  }

  if (!city) {
    return invalid("MISSING_CITY", "Please enter the city.", competitionSlug);
  }

  if (!country) {
    return invalid("MISSING_COUNTRY", "Please enter the country or nation.", competitionSlug);
  }

  return {
    ok: true,
    values: {
      competitionSlug,
      studentName,
      studentAge,
      guardianName,
      guardianEmail,
      city,
      country
    }
  };
}

function invalid(detailsCode: RegistrationCheckoutDetailsCode, error: string, slugForRedirect?: string): NormalizationResult {
  return {
    ok: false,
    detailsCode,
    error,
    slugForRedirect
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function normalizeText(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function normalizeSlug(value: unknown) {
  return normalizeText(value).toLowerCase();
}
