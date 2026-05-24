import { getServerAuthSession } from "@/lib/auth/server-session";

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
    const session = await getServerAuthSession();

    if (!session.authenticated) {
      console.warn(`[LockInTalks admin] User not found for ${context}.`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 401, message: "Please log in with an admin account." };
    }

    console.info(`[LockInTalks admin] User id found for ${context}: ${session.user.id}. Source: ${session.source}.`);
    console.info(`[LockInTalks admin] Profile role found for ${context}: ${session.role}.`);

    if (session.role !== "admin") {
      console.warn(`[LockInTalks admin] Non-admin user attempted ${context}: ${session.user.id}`);
      console.warn(`[LockInTalks admin] Admin denied for ${context}.`);
      return { ok: false, status: 403, message: "You do not have admin access." };
    }

    console.info(`[LockInTalks admin] Admin allowed for ${context}.`);

    return {
      ok: true,
      userId: session.user.id,
      email: session.user.email
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
