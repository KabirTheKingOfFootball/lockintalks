import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsCards } from "@/components/admin/analytics-cards";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { checkAdmin } from "@/lib/admin/auth";
import { getAdminCompetitions } from "@/lib/admin/competitions";
import type { RegistrationRow } from "@/lib/registrations";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "LockInTalks admin dashboard."
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await checkAdmin();
  if (!admin.ok) return <AdminGate message={admin.message} />;

  const { competitions, error: competitionError } = await getAdminCompetitions();
  let registrations: RegistrationRow[] = [];
  let registrationsError: string | null = null;

  try {
    const registrationsResult = await createAdminClient().from("registrations").select("*").order("created_at", { ascending: false });
    registrations = (registrationsResult.data || []) as RegistrationRow[];
    registrationsError = registrationsResult.error?.message || null;
  } catch (error) {
    console.error("[LockInTalks admin] Failed to load dashboard registrations:", error);
    registrationsError = "Could not connect to Supabase registrations data.";
  }

  return (
    <AdminShell>
      {competitionError && <AdminError message={competitionError} />}
      {registrationsError && <AdminError message={registrationsError} />}
      <AnalyticsCards competitions={competitions} registrations={registrations} />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-black">Quick Actions</h2>
          <div className="mt-5 grid gap-3">
            <ButtonLink href="/admin/competitions">Create Competition</ButtonLink>
            <ButtonLink href="/admin/registrations" variant="glass">Review Registrations</ButtonLink>
            <ButtonLink href="/api/admin/registrations/export" variant="glass">Export CSV</ButtonLink>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Latest Registrations</h2>
          <div className="mt-5 grid gap-3">
            {registrations.slice(0, 5).map((registration) => (
              <div key={registration.id} className="rounded-[8px] bg-white/[0.05] p-3">
                <p className="font-bold">{registration.student_name}</p>
                <p className="text-sm text-white/55">{registration.competition_name} • {registration.payment_status}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Competition Status</h2>
          <div className="mt-5 grid gap-3">
            {competitions.slice(0, 5).map((competition) => (
              <div key={competition.id} className="flex items-center justify-between rounded-[8px] bg-white/[0.05] p-3">
                <p className="font-bold">{competition.name}</p>
                <span className="text-xs font-bold uppercase text-[#d4af37]">{competition.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function AdminError({ message }: { message: string }) {
  return <div className="mb-5 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{message}</div>;
}
