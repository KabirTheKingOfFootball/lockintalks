"use client";

import Link from "next/link";
import { Award, CalendarClock, CreditCard, FileBadge } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RegistrationRow } from "@/lib/registrations";

type DashboardUser = {
  name: string;
  email: string;
};

export function DashboardClient({
  user,
  registrations,
  dataError
}: {
  user: DashboardUser;
  registrations: RegistrationRow[];
  dataError?: string;
}) {
  const latestRegistration = registrations[0];
  const paidRegistrations = registrations.filter((registration) => registration.payment_status === "paid");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Dashboard</p>
      <h1 className="text-4xl font-black sm:text-6xl">Welcome, {user.name.split(" ")[0]}.</h1>
      <p className="mt-4 text-white/62">{user.email}</p>
      {dataError && (
        <div className="mt-6 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          Could not load registrations: {dataError}. If this mentions relation registrations, run supabase/schema.sql in Supabase SQL Editor.
        </div>
      )}
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><Award className="mb-4 text-[#d4af37]" /><h2 className="font-black">Registered Competitions</h2><p className="mt-3 text-sm text-white/62">{latestRegistration?.competition_name || "No registrations yet."}</p></Card>
        <Card><CalendarClock className="mb-4 text-[#d4af37]" /><h2 className="font-black">Upcoming Events</h2><p className="mt-3 text-sm text-white/62">{latestRegistration ? "Check your email for live room details." : "Choose a competition to start."}</p></Card>
        <Card><CreditCard className="mb-4 text-[#d4af37]" /><h2 className="font-black">Payment History</h2><p className="mt-3 text-sm text-white/62">{paidRegistrations.length ? `${paidRegistrations.length} paid registration${paidRegistrations.length === 1 ? "" : "s"}` : "No paid registrations yet."}</p></Card>
        <Card><FileBadge className="mb-4 text-[#d4af37]" /><h2 className="font-black">Certificates</h2><p className="mt-3 text-sm text-white/62">Certificates will appear after results are published.</p></Card>
      </div>
      {registrations.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-black">Your registrations</h2>
          <div className="grid gap-3">
            {registrations.map((registration) => (
              <div key={registration.id} className="glass flex flex-col justify-between gap-3 rounded-[8px] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold">{registration.competition_name}</p>
                  <p className="text-sm text-white/58">{registration.student_name} • {registration.entry_fee}</p>
                </div>
                <span className="rounded-full border border-[#d4af37]/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">{registration.payment_status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <Link href="/competitions" className="mt-8 inline-flex text-sm font-bold text-[#d4af37]">Explore more competitions</Link>
    </div>
  );
}
