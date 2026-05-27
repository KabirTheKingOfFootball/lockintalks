import { getRoleRedirect, type AppRole } from "@/lib/auth/redirect";
import { readAppSession } from "@/lib/auth/app-session";

export type ServerAuthSession =
  | {
      authenticated: true;
      source: "app-session";
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
  // Single source of truth for protected routes: the signed httpOnly
  // lockintalks_app_session cookie written after Supabase verifies credentials.
  const appSession = await readAppSession();

  if (!appSession) {
    return {
      authenticated: false,
      source: null,
      user: null,
      role: null,
      redirectTo: "/login"
    };
  }

  return {
    authenticated: true,
    source: "app-session",
    user: { id: appSession.userId, email: appSession.email },
    role: appSession.role,
    redirectTo: getRoleRedirect(appSession.role)
  };
}
