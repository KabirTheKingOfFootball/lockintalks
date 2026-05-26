import type { NextResponse } from "next/server";

export const authNoStoreHeaders = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

export function maskEmail(value: string) {
  const [name = "", domain = ""] = value.split("@");
  if (!name || !domain) return "invalid-email";
  const visibleName = name.length <= 2 ? `${name[0] || ""}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${visibleName}@${domain}`;
}

export function getSupabaseAuthCookieNames(cookieNames: string[]) {
  return cookieNames.filter((name) => name === "supabase.auth.token" || (name.startsWith("sb-") && name.includes("auth-token")));
}

export function clearSupabaseAuthCookies(response: NextResponse, cookieNames: string[]) {
  for (const name of getSupabaseAuthCookieNames(cookieNames)) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0
    });
  }
}
