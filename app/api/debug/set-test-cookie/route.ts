import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const testCookieName = "lockintalks_test";

export function GET(request: NextRequest) {
  const response = NextResponse.json(
    {
      ok: true,
      cookieName: testCookieName,
      set: true,
      requestHost: request.headers.get("host") || request.nextUrl.host
    },
    { status: 200, headers: authNoStoreHeaders }
  );

  response.cookies.set(testCookieName, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
