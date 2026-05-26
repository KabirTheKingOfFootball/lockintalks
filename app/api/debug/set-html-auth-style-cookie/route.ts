import { NextResponse, type NextRequest } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const testCookieName = "lockintalks_html_auth_style_test";

export function GET(request: NextRequest) {
  const readPath = "/api/debug/read-test-cookie";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2;url=${readPath}"><title>Cookie Test</title></head><body><p>Testing auth-style HTML cookie...</p><script>setTimeout(function(){window.location.replace(${JSON.stringify(readPath)});},900);</script></body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      ...authNoStoreHeaders,
      "Content-Type": "text/html; charset=utf-8"
    }
  });

  response.cookies.set(testCookieName, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  response.headers.set("X-LockInTalks-Debug-Redirect", new URL(readPath, request.url).toString());
  return response;
}
