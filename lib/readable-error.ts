export function getReadableError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error) {
    if (isNetworkFetchError(error)) {
      return "Could not reach the server. Check the production environment variables, Supabase project status, and internet connection, then try again.";
    }

    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function getReadableSupabaseError(error: unknown, fallback = "Supabase is temporarily unavailable. Please try again.") {
  const message = getReadableError(error, fallback);

  if (/failed to fetch|fetch failed|networkerror|load failed|typeerror/i.test(message)) {
    return "Could not connect to Supabase. Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in Vercel, the Supabase project is active, and the app was redeployed after saving env vars.";
  }

  if (/invalid api key|jwt|apikey|unauthorized/i.test(message)) {
    return "Supabase rejected the request. Check that the publishable key in Vercel belongs to the same Supabase project as the URL.";
  }

  if (/relation .* does not exist|schema cache|registrations/i.test(message)) {
    return `${message}. If this mentions a missing table, run supabase/schema.sql in the Supabase SQL Editor.`;
  }

  return message;
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The server returned an invalid response. Check Vercel function logs for this route.");
  }
}

function isNetworkFetchError(error: Error) {
  return /failed to fetch|fetch failed|networkerror|load failed/i.test(error.message);
}
