import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv, requireSupabaseServiceRoleKey } from "@/lib/supabase/env";

export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceRoleKey = requireSupabaseServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
