import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole = "user" | "admin";

export function getRoleRedirect(role: AppRole) {
  return role === "admin" ? "/admin" : "/dashboard";
}

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
