import { createClient } from "@/lib/supabase/server";

export const adminNoStoreHeaders = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate"
};

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

export async function checkAdmin(context = "admin route"): Promise<AdminCheck> {
  console.info(`[LockInTalks admin] Admin check started for ${context}.`);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (userError || !userId) {
      console.warn(`[LockInTalks admin] User not found for ${context}: ${userError?.message || "No active session"}`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 401, message: "Please log in with an admin account." };
    }

    console.info(`[LockInTalks admin] User id found for ${context}: ${userId}.`);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (profileError) {
      console.error(`[LockInTalks admin] Profile role lookup failed for ${context}: ${profileError.message}`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 403, message: "Your admin profile is not configured yet." };
    }

    if (!profile?.role) {
      console.warn(`[LockInTalks admin] Profile role missing for ${context}.`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 403, message: "Your admin profile is not configured yet." };
    }

    console.info(`[LockInTalks admin] Profile role found for ${context}: ${profile.role}.`);

    if (profile?.role !== "admin") {
      console.warn(`[LockInTalks admin] Non-admin user attempted ${context}: ${userId}`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 403, message: "You do not have admin access." };
    }

    console.info(`[LockInTalks admin] Admin allowed for ${context}.`);

    return {
      ok: true,
      userId,
      email: user.email || ""
    };
  } catch (error) {
    console.error(`[LockInTalks admin] Admin authorization failed for ${context}:`, error);
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
