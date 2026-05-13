type SupabaseEnv =
  | {
      ok: true;
      url: string;
      key: string;
    }
  | {
      ok: false;
      message: string;
      missing: string[];
    };

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      message: `Missing Supabase environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Add them in Vercel Project Settings > Environment Variables.`
    };
  }

  const safeUrl = url as string;
  const safeKey = key as string;

  try {
    new URL(safeUrl);
  } catch {
    return {
      ok: false,
      missing: [],
      message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. It should look like https://your-project-ref.supabase.co."
    };
  }

  return { ok: true, url: safeUrl, key: safeKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.ok) {
    throw new SupabaseConfigError(env.message);
  }

  return env;
}
