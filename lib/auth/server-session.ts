import { getRoleRedirect, type AppRole } from "@/lib/auth/redirect";
import { readAppSession } from "@/lib/auth/app-session";
import { getUserRoleFromClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ServerAuthSession =
  | {
      authenticated: true;
      source: "supabase" | "app-session";
      user: {
        id: string;
        email: string;
      };
      role: AppRole;
      redirectTo: string;
    }
  | {
      authenticated: false;
      source: null;
      user: null;
      role: null;
      redirectTo: "/login";
    };

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (!error && user) {
      const role = await getUserRoleFromClient(supabase, user.id);
      return {
        authenticated: true,
        source: "supabase",
        user: { id: user.id, email: user.email || "" },
        role,
        redirectTo: getRoleRedirect(role)
      };
    }
  } catch (error) {
    console.warn("[LockInTalks auth session] Supabase session check skipped:", error);
  }

  const appSession = await readAppSession();
  if (appSession) {
    return {
      authenticated: true,
      source: "app-session",
      user: { id: appSession.userId, email: appSession.email },
      role: appSession.role,
      redirectTo: getRoleRedirect(appSession.role)
    };
  }

  return {
    authenticated: false,
    source: null,
    user: null,
    role: null,
    redirectTo: "/login"
  };
}
