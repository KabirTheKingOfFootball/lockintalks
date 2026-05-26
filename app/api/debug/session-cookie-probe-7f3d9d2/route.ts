import { NextResponse, type NextRequest } from "next/server";
import { setAppSessionCookie } from "@/lib/auth/app-session";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/api/auth/session", request.url), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  setAppSessionCookie(response, {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "cookie-probe@lockintalks.test",
    role: "user"
  });
  return response;
}
