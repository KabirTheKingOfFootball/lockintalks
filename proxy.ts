import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/register/:path*",
    "/payment/:path*",
    "/api/auth/:path*",
    "/api/registrations",
    "/api/admin/:path*",
    "/api/payments/create-order",
    "/api/payments/verify",
    "/api/payments/failed",
    "/auth/callback",
    "/auth/finalize",
    "/logout"
  ]
};
