import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/redirect";

export { getRoleRedirect } from "@/lib/auth/redirect";

type ProfileRoleReader = {
  from: (table: "profiles") => {
    select: (columns: "role") => {
      eq: (column: "id", value: string) => {
        maybeSingle: () => Promise<{ data: { role?: string } | null; error: { message: string } | null }>;
      };
    };
  };
};

export async function getUserRoleFromClient(supabase: unknown, userId: string): Promise<AppRole> {
  try {
    const profileReader = supabase as ProfileRoleReader;
    const { data, error } = await profileReader.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (error) {
      console.warn(`[LockInTalks auth] Could not resolve session role from profile: ${error.message}`);
      return "user";
    }

    return data?.role === "admin" ? "admin" : "user";
  } catch (error) {
    console.error("[LockInTalks auth] Session role lookup failed:", error);
    return "user";
  }
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
