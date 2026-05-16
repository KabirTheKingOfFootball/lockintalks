import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminCheck =
  | {
      ok: true;
      userId: string;
      email: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

export async function checkAdmin(): Promise<AdminCheck> {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      console.warn(`[LockInTalks admin] Unauthorized admin access: ${claimsError?.message || "No active session"}`);
      return { ok: false, status: 401, message: "Please login with an admin account." };
    }

    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();

    if (profileError) {
      console.error(`[LockInTalks admin] Could not load admin profile: ${profileError.message}`);
      return { ok: false, status: 403, message: "Your admin profile is not configured yet." };
    }

    if (profile?.role !== "admin") {
      console.warn(`[LockInTalks admin] Non-admin user attempted admin access: ${userId}`);
      return { ok: false, status: 403, message: "You do not have admin access." };
    }

    return {
      ok: true,
      userId,
      email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : ""
    };
  } catch (error) {
    console.error("[LockInTalks admin] Admin authorization failed:", error);
    return { ok: false, status: 503, message: "Admin authorization is temporarily unavailable." };
  }
}

export async function requireAdmin() {
  const result = await checkAdmin();

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}
