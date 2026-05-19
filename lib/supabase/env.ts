type SupabaseEnv =
  | {
      ok: true;
      url: string;
      key: string;
      keySource: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
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

const placeholderValues = new Set([
  "https://your-project-ref.supabase.co",
  "sb_publishable_your_key_here",
  "server_only_service_role_key_for_payment_updates"
]);

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = publishableKey || anonKey;
  const keySource = publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY";
  const missing: string[] = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      message: `Missing Supabase environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel Project Settings > Environment Variables, then redeploy.`
    };
  }

  const safeUrl = url as string;
  const safeKey = key as string;
  const placeholder = [safeUrl, safeKey].find((value) => placeholderValues.has(value));

  if (placeholder) {
    return {
      ok: false,
      missing: [],
      message: "Supabase environment variables still contain example placeholder values. Replace them with the real values from your Supabase project, then redeploy on Vercel."
    };
  }

  try {
    new URL(safeUrl);
  } catch {
    return {
      ok: false,
      missing: [],
      message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. It should look like https://your-project-ref.supabase.co."
    };
  }

  return { ok: true, url: safeUrl, key: safeKey, keySource };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.ok) {
    throw new SupabaseConfigError(env.message);
  }

  return env;
}

export function requireSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new SupabaseConfigError("Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel for server-only payment verification updates.");
  }

  if (placeholderValues.has(key)) {
    throw new SupabaseConfigError("SUPABASE_SERVICE_ROLE_KEY still contains the example placeholder value. Replace it with the real server-only key from Supabase.");
  }

  return key;
}

export function getSupabaseDiagnostics() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const parsedUrl = safeParseUrl(url);

  return {
    urlConfigured: Boolean(url) && !placeholderValues.has(url),
    urlHost: parsedUrl?.host || null,
    publishableKeyConfigured: Boolean(publishableKey) && !placeholderValues.has(publishableKey),
    legacyAnonKeyConfigured: Boolean(anonKey) && !placeholderValues.has(anonKey),
    serviceRoleKeyConfigured: Boolean(serviceRoleKey) && !placeholderValues.has(serviceRoleKey),
    keySource: publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null
  };
}

function safeParseUrl(value: string) {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}
