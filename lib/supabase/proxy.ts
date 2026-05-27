import { NextResponse, type NextRequest } from "next/server";

export function updateSession(request: NextRequest) {
  // LockInTalks now uses one server auth source: the signed app-session cookie.
  // The Supabase proxy refresh path is intentionally disabled so it cannot
  // overwrite or clear auth state while users navigate admin/dashboard pages.
  return NextResponse.next({ request });
}
