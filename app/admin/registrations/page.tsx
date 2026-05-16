import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import { RegistrationManager } from "@/components/admin/registration-manager";
import { checkAdmin } from "@/lib/admin/auth";
import type { RegistrationRow } from "@/lib/registrations";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin Registrations",
  description: "Manage LockInTalks registrations."
};

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const admin = await checkAdmin();
  if (!admin.ok) return <AdminGate message={admin.message} />;

  const { data, error } = await createAdminClient().from("registrations").select("*").order("created_at", { ascending: false });

  return (
    <AdminShell>
      {error && <div className="mb-5 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error.message}</div>}
      <RegistrationManager registrations={(data || []) as RegistrationRow[]} />
    </AdminShell>
  );
}
