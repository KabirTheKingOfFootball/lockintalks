import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import { CompetitionManager } from "@/components/admin/competition-manager";
import { checkAdmin } from "@/lib/admin/auth";
import { getAdminCompetitions } from "@/lib/admin/competitions";

export const metadata: Metadata = {
  title: "Admin Competitions",
  description: "Create and manage LockInTalks competitions."
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminCompetitionsPage() {
  const admin = await checkAdmin("/admin/competitions");
  if (!admin.ok) return <AdminGate message={admin.message} />;

  const { competitions, error } = await getAdminCompetitions();

  return (
    <AdminShell>
      {error && <div className="mb-5 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      <CompetitionManager initialCompetitions={competitions} />
    </AdminShell>
  );
}
