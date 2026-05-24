import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAuthCookieNames } from "@/lib/auth/http";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const cookieNames = cookiesToSet.map(({ name }) => name);
        const authCookieNames = getSupabaseAuthCookieNames(cookieNames);

        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          if (authCookieNames.length > 0) {
            console.info(`[LockInTalks Supabase server] Wrote auth cookie name(s): ${authCookieNames.join(", ")}.`);
          }
        } catch {
          console.warn(`[LockInTalks Supabase server] Could not write auth cookie name(s): ${authCookieNames.join(", ") || "none"}. Server Components cannot write cookies; Server Actions and Route Handlers should be able to.`);
        }
      }
    }
  });
}
