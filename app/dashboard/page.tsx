import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your LockInTalks registrations, events, payments, and certificates."
};

export default function DashboardPage() {
  return (
    <MotionShell>
      <DashboardClient />
    </MotionShell>
  );
}
