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
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminRegistrationsPage() {
  const admin = await checkAdmin("/admin/registrations");
  if (!admin.ok) return <AdminGate message={admin.message} />;

  let registrations: RegistrationRow[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await createAdminClient()
      .from("registrations")
      .select("*")
      .in("payment_status", ["captured", "paid"])
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false });
    registrations = (data || []) as RegistrationRow[];
    errorMessage = error?.message || null;
  } catch (error) {
    console.error("[LockInTalks admin registrations] Failed to load registrations page:", error);
    errorMessage = "Could not connect to Supabase registrations data.";
  }

  return (
    <AdminShell>
      {errorMessage && <div className="mb-5 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{errorMessage}</div>}
      <RegistrationManager registrations={registrations} />
    </AdminShell>
  );
}
