import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const testCookieName = "lockintalks_test";

export function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();
  const present = cookieNames.includes(testCookieName);

  return NextResponse.json(
    {
      ok: true,
      cookieName: testCookieName,
      present,
      cookieNames,
      requestHost: request.headers.get("host") || request.nextUrl.host
    },
    { status: 200, headers: authNoStoreHeaders }
  );
}
