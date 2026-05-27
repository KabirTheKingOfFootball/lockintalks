import { NextResponse, type NextRequest } from "next/server";
import { clearAppSessionCookie } from "@/lib/auth/app-session";
import { authNoStoreHeaders, clearSupabaseAuthCookies } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  return response;
}

export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  Object.entries(authNoStoreHeaders).forEach(([header, value]) => response.headers.set(header, value));
  clearAppSessionCookie(response);
  clearSupabaseAuthCookies(response, request.cookies.getAll().map((cookie) => cookie.name));
  return response;
}
