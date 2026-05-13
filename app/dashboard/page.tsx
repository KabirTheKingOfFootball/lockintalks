import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { MotionShell } from "@/components/motion-shell";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationRow } from "@/lib/registrations";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your LockInTalks registrations, events, payments, and certificates."
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const displayName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "LockIn Speaker";

  return (
    <MotionShell>
      <DashboardClient user={{ name: displayName, email: user.email || "" }} registrations={(registrations || []) as RegistrationRow[]} />
    </MotionShell>
  );
}
