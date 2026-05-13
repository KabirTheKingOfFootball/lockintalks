import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { MotionShell } from "@/components/motion-shell";
import { SetupWarning } from "@/components/setup-warning";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationRow } from "@/lib/registrations";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your LockInTalks registrations, events, payments, and certificates."
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks dashboard] ${error.message}`);
      return <SetupWarning message={error.message} />;
    }

    console.error("[LockInTalks dashboard] Failed to create Supabase server client:", error);
    return <SetupWarning title="Dashboard unavailable" message="The dashboard could not connect to Supabase. Check your Vercel function logs for the exact server error." />;
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(`[LockInTalks dashboard] Failed to read Supabase user: ${userError.message}`);
  }

  if (!user) {
    redirect("/login");
  }

  let registrations: RegistrationRow[] = [];
  let dataError: string | undefined;

  try {
    const { data, error: registrationsError } = await supabase
      .from("registrations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (registrationsError) {
      console.error(`[LockInTalks dashboard] Failed to load registrations: ${registrationsError.message}`);
      dataError = registrationsError.message;
    }

    registrations = (data || []) as RegistrationRow[];
  } catch (error) {
    console.error("[LockInTalks dashboard] Unexpected registrations query error:", error);
    return <SetupWarning title="Dashboard unavailable" message="The dashboard could not load registrations right now. Check that supabase/schema.sql has been run in your Supabase project." />;
  }

  const displayName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "LockIn Speaker";

  return (
    <MotionShell>
      <DashboardClient user={{ name: displayName, email: user.email || "" }} registrations={registrations} dataError={dataError} />
    </MotionShell>
  );
}
