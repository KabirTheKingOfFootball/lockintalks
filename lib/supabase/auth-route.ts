import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabaseEnv } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export const authNoStoreHeaders = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

export function createAuthRouteClient(request: NextRequest, context: string) {
  const { url, key } = requireSupabaseEnv();
  const cookieUpdates: CookieToSet[] = [];
  const headerUpdates = new Map<string, string>();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookieUpdates.push(...cookiesToSet);
        Object.entries(headers).forEach(([header, value]) => headerUpdates.set(header, value));

        try {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        } catch {
          // The final response still receives the Set-Cookie headers below.
        }
      }
    }
  });

  function applyAuthCookies<T extends NextResponse>(response: T) {
    headerUpdates.forEach((value, header) => response.headers.set(header, value));
    Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));

    cookieUpdates.forEach(({ name, value, options }) => {
      const cookieOptions = { ...options };
      delete (cookieOptions as CookieOptions & { name?: string }).name;
      response.cookies.set(name, value, cookieOptions);
    });

    console.info(
      `[LockInTalks auth cookies] ${context}: ${cookieUpdates.length} auth cookie write(s) attached to response. Names: ${cookieUpdates.map(({ name }) => name).join(", ") || "none"}. Final response has Set-Cookie: ${response.headers.has("set-cookie")}. Status: ${response.status}.`
    );
    return response;
  }

  return {
    supabase,
    applyAuthCookies,
    getAuthCookieWriteCount: () => cookieUpdates.length,
    getAuthCookieWriteNames: () => cookieUpdates.map(({ name }) => name)
  };
}

export function getSupabaseAuthCookieNames(cookieNames: string[]) {
  return cookieNames.filter((name) => name === "supabase.auth.token" || /^sb-.+-auth-token(?:\.[0-9]+)?$/.test(name));
}

export function maskEmail(value: string) {
  const [name = "", domain = ""] = value.split("@");
  if (!name || !domain) return "invalid-email";
  const visibleName = name.length <= 2 ? `${name[0] || ""}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${visibleName}@${domain}`;
}
