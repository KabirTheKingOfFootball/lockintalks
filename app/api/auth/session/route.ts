import { NextResponse } from "next/server";
import { authNoStoreHeaders } from "@/lib/auth/http";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (session.authenticated) console.info(`[LockInTalks auth session] Session confirmed from ${session.source}.`);
    return NextResponse.json(session, { status: 200, headers: authNoStoreHeaders });
  } catch (error) {
    if (error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks auth session] ${error.message}`);
      return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: error.message }, { status: 503, headers: authNoStoreHeaders });
    }

    console.error("[LockInTalks auth session] Unexpected session check error:", error);
    return NextResponse.json({ authenticated: false, user: null, role: null, redirectTo: "/login", error: "Could not verify session." }, { status: 500, headers: authNoStoreHeaders });
  }
}
