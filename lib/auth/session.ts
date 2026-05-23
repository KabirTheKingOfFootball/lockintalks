import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/redirect";

export { getRoleRedirect } from "@/lib/auth/redirect";

export async function getUserRole(userId: string): Promise<AppRole> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (error) {
      console.warn(`[LockInTalks auth] Could not resolve user role for ${userId}: ${error.message}`);
      return "user";
    }

    return data?.role === "admin" ? "admin" : "user";
  } catch (error) {
    console.error("[LockInTalks auth] Role lookup failed:", error);
    return "user";
  }
}
