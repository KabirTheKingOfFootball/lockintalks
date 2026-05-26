import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const testCookieName = "lockintalks_test";
const authStyleCookieName = "lockintalks_auth_style_test";
const htmlAuthStyleCookieName = "lockintalks_html_auth_style_test";

export function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();
  const present = cookieNames.includes(testCookieName);
  const authStylePresent = cookieNames.includes(authStyleCookieName);
  const htmlAuthStylePresent = cookieNames.includes(htmlAuthStyleCookieName);

  return NextResponse.json(
    {
      ok: true,
      cookieName: testCookieName,
      present,
      authStyleCookieName,
      authStylePresent,
      htmlAuthStyleCookieName,
      htmlAuthStylePresent,
      cookieNames,
      requestHost: request.headers.get("host") || request.nextUrl.host
    },
    { status: 200, headers: authNoStoreHeaders }
  );
}
