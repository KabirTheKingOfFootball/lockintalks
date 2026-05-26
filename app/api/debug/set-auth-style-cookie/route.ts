import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const testCookieName = "lockintalks_auth_style_test";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/api/debug/read-test-cookie", request.url), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  response.cookies.set(testCookieName, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
