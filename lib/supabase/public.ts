import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export function createPublicClient() {
  const { url, key } = requireSupabaseEnv();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
