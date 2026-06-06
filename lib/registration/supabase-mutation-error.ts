import type { RegistrationCheckoutDetailsCode } from "@/lib/registration/checkout-request";

export type SafeSupabaseMutationError = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

export type ClassifiedSupabaseMutationError = {
  detailsCode: RegistrationCheckoutDetailsCode;
  supabaseError: SafeSupabaseMutationError;
};

export function classifySupabaseMutationError(error: unknown): ClassifiedSupabaseMutationError {
  const safeError = getSafeSupabaseMutationError(error);
  const haystack = `${safeError.code || ""} ${safeError.message || ""} ${safeError.details || ""} ${safeError.hint || ""}`.toLowerCase();

  if (safeError.code === "42501" || /row-level security|violates row-level security|permission denied|rls/.test(haystack)) {
    return { detailsCode: "INSERT_RLS_BLOCKED", supabaseError: safeError };
  }

  if (safeError.code === "23502" || /null value in column|not-null|null constraint/.test(haystack)) {
    return { detailsCode: "INSERT_MISSING_REQUIRED_COLUMN", supabaseError: safeError };
  }

  if (safeError.code === "PGRST204" || safeError.code === "42703" || /schema cache|could not find.*column|column .* does not exist|unknown column/.test(haystack)) {
    return { detailsCode: "INSERT_UNKNOWN_COLUMN", supabaseError: safeError };
  }

  if (safeError.code === "23514" || /violates check constraint|check constraint/.test(haystack)) {
    return { detailsCode: "INSERT_CHECK_CONSTRAINT_FAILED", supabaseError: safeError };
  }

  if (safeError.code === "23503" || /foreign key constraint/.test(haystack)) {
    return { detailsCode: "INSERT_FOREIGN_KEY_FAILED", supabaseError: safeError };
  }

  if (safeError.code === "23505" || /duplicate key|unique constraint|already exists/.test(haystack)) {
    return { detailsCode: "INSERT_DUPLICATE_CONSTRAINT", supabaseError: safeError };
  }

  if (/invalid input value for enum|enum/.test(haystack)) {
    return { detailsCode: "INSERT_ENUM_VALUE_INVALID", supabaseError: safeError };
  }

  if (safeError.code === "22P02" || safeError.code === "42804" || /invalid input syntax|type mismatch|invalid text representation|datatype mismatch/.test(haystack)) {
    return { detailsCode: "INSERT_TYPE_MISMATCH", supabaseError: safeError };
  }

  return { detailsCode: "INSERT_UNKNOWN_SUPABASE_ERROR", supabaseError: safeError };
}

export function shouldRetryWithLegacyRegistrationPayload(detailsCode: RegistrationCheckoutDetailsCode) {
  return (
    detailsCode === "INSERT_UNKNOWN_COLUMN" ||
    detailsCode === "INSERT_CHECK_CONSTRAINT_FAILED" ||
    detailsCode === "INSERT_ENUM_VALUE_INVALID" ||
    detailsCode === "INSERT_TYPE_MISMATCH"
  );
}

function getSafeSupabaseMutationError(error: unknown): SafeSupabaseMutationError {
  const record = isRecord(error) ? error : {};

  return {
    code: sanitizeSupabaseErrorField(record.code),
    message: sanitizeSupabaseErrorField(record.message),
    details: sanitizeSupabaseErrorField(record.details),
    hint: sanitizeSupabaseErrorField(record.hint)
  };
}

function sanitizeSupabaseErrorField(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  return value
    .replace(/Failing row contains\s*\([\s\S]+?\)\.?/gi, "Failing row contains [redacted row].")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[redacted-id]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
