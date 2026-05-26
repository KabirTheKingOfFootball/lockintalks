import type { NextResponse } from "next/server";

export const loginDiagnosticCookieName = "lockintalks_login_diag";

export function setLoginDiagnosticCookie(response: NextResponse, diagnostic: { status: "success" | "failed" | "config-error" | "unexpected-error"; reason: string; redirectTo?: string; source?: string }) {
  response.cookies.set(loginDiagnosticCookieName, JSON.stringify({ ...diagnostic, at: new Date().toISOString() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });
}
