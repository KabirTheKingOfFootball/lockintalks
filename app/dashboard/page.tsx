import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { MotionShell } from "@/components/motion-shell";
import { SetupWarning } from "@/components/setup-warning";
import { PosterBackdrop } from "@/components/brand-visuals";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RegistrationRow } from "@/lib/registrations";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your LockInTalks registrations, events, payments, and certificates."
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session: Awaited<ReturnType<typeof getServerAuthSession>>;

  try {
    session = await getServerAuthSession();
  } catch (error) {
    if (error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks dashboard] ${error.message}`);
      return <SetupWarning title="Dashboard unavailable" message={error.message} />;
    }
    throw error;
  }

  if (!session.authenticated) {
    console.error("[LockInTalks dashboard] No active server session.");
    redirect("/login");
  }

  let registrations: RegistrationRow[] = [];
  let dataError: string | undefined;

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error: registrationsError } = await supabaseAdmin
      .from("registrations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (registrationsError) {
      console.error(`[LockInTalks dashboard] Failed to load registrations: ${registrationsError.message}`);
      dataError = registrationsError.message;
    }

    registrations = (data || []) as RegistrationRow[];
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks dashboard] ${error.message}`);
      return <SetupWarning message={error.message} />;
    }

    console.error("[LockInTalks dashboard] Unexpected registrations query error:", error);
    return <SetupWarning title="Dashboard unavailable" message="The dashboard could not load registrations right now. Check that supabase/schema.sql has been run in your Supabase project." />;
  }

  const displayName = "LockIn Speaker";
  const email = session.user.email;

  return (
    <MotionShell className="relative overflow-hidden">
      <PosterBackdrop compact />
      <DashboardClient user={{ name: displayName, email }} registrations={registrations} dataError={dataError} />
    </MotionShell>
  );
}
