import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseDiagnostics, getSupabaseEnv, SupabaseConfigError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics = getSupabaseDiagnostics();
  const env = getSupabaseEnv();

  if (!env.ok) {
    console.error(`[LockInTalks Supabase health] Configuration failed: ${env.message}`);
    return NextResponse.json(
      {
        ok: false,
        env: diagnostics,
        checks: {
          config: env.message
        }
      },
      { status: 503 }
    );
  }

  const checks: Record<string, string | boolean | number> = {
    config: true
  };
  let ok = true;

  try {
    const authHealth = await fetch(`${env.url}/auth/v1/health`, {
      headers: {
        apikey: env.key
      },
      cache: "no-store"
    });

    checks.authReachable = authHealth.ok;
    if (!authHealth.ok) {
      ok = false;
      checks.authStatus = authHealth.status;
      console.error(`[LockInTalks Supabase health] Auth health failed with status ${authHealth.status}.`);
    }
  } catch (error) {
    ok = false;
    checks.authReachable = false;
    checks.authError = "Could not reach Supabase Auth from this deployment.";
    console.error("[LockInTalks Supabase health] Auth fetch failed:", error);
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("registrations").select("id", { count: "exact", head: true });

    checks.registrationsTable = !error;
    if (error) {
      ok = false;
      checks.registrationsError = error.message;
      console.error(`[LockInTalks Supabase health] registrations table check failed: ${error.message}`);
    }
  } catch (error) {
    ok = false;
    checks.registrationsTable = false;
    checks.registrationsError =
      error instanceof SupabaseConfigError ? error.message : "Could not query registrations with the service role key.";
    console.error("[LockInTalks Supabase health] Database health check failed:", error);
  }

  return NextResponse.json(
    {
      ok,
      env: {
        ...diagnostics,
        clientKeySource: env.keySource
      },
      checks
    },
    { status: ok ? 200 : 503 }
  );
}
