"use client";

import Link from "next/link";
import { Award, CalendarClock, CreditCard, FileBadge, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { RegistrationRow } from "@/lib/registrations";
import { isSeatConfirmed } from "@/lib/payment/status";
import { calculateLockInLevel } from "@/lib/rewards/levels";

type DashboardUser = {
  name: string;
  email: string;
};

export function DashboardClient({
  user,
  registrations,
  dataError,
  lockInPointsBalance
}: {
  user: DashboardUser;
  registrations: RegistrationRow[];
  dataError?: string;
  lockInPointsBalance: number;
}) {
  const latestRegistration = registrations[0];
  const paidRegistrations = registrations.filter((registration) => isSeatConfirmed(registration.payment_status));
  const pointsBalance = Math.max(0, Math.floor(Number(lockInPointsBalance) || 0));
  const lockInLevel = calculateLockInLevel(pointsBalance);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Dashboard</p>
      <h1 className="text-4xl font-black sm:text-6xl">Welcome, {user.name.split(" ")[0]}</h1>
      <p className="mt-4 text-white/62">{user.email}</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <Sparkles className="mb-4 text-[#d4af37]" />
          <h2 className="text-2xl font-black">Your Speaker Launchpad</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Start by choosing one competition, complete payment, and use the prep checklist before your live online round. Top performers can win cash awards in every competition.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/competitions">Find a Competition</ButtonLink>
            <ButtonLink href="mailto:lockintalks@gmail.com" variant="glass">Ask for Help</ButtonLink>
          </div>
        </Card>
        <Card>
          <ListChecks className="mb-4 text-[#d4af37]" />
          <h2 className="text-xl font-black">Before Your Round</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/65">
            <li>Check your camera, microphone, and internet.</li>
            <li>Practice a 30-second intro with a timer.</li>
            <li>Keep water, notes, and a quiet room ready.</li>
          </ul>
        </Card>
      </div>
      {dataError && (
        <div className="mt-6 rounded-[8px] border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          Could not load registrations: {dataError}. If this mentions relation registrations, run supabase/schema.sql in Supabase SQL Editor.
        </div>
      )}
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><Award className="mb-4 text-[#d4af37]" /><h2 className="font-black">Registered Competitions</h2><p className="mt-3 text-sm text-white/62">{latestRegistration?.competition_name || "No Registrations Yet"}</p></Card>
        <Card><CalendarClock className="mb-4 text-[#d4af37]" /><h2 className="font-black">Upcoming Events</h2><p className="mt-3 text-sm text-white/62">{latestRegistration ? "Check your email for live room details." : "Choose a competition to start."}</p></Card>
        <Card><CreditCard className="mb-4 text-[#d4af37]" /><h2 className="font-black">Payment History</h2><p className="mt-3 text-sm text-white/62">{paidRegistrations.length ? `${paidRegistrations.length} paid registration${paidRegistrations.length === 1 ? "" : "s"}` : "No paid registrations yet."}</p></Card>
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Sparkles className="mb-4 text-[#d4af37]" />
              <h2 className="font-black">Level {lockInLevel.currentLevel} Speaker</h2>
              <p className="mt-2 text-sm text-white/62">{pointsBalance} LockIn Point{pointsBalance === 1 ? "" : "s"} available.</p>
            </div>
            <div className="rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7dc83]">Next Bonus</p>
              <p className="text-lg font-black text-white">+{lockInLevel.nextLevelBonus}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-white/62">
              <span>{lockInLevel.currentXP} / {lockInLevel.nextRequirement} XP to Level {lockInLevel.nextLevel}</span>
              <span>{Math.max(0, lockInLevel.nextRequirement - lockInLevel.currentXP)} needed</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.06] shadow-[0_0_24px_rgba(212,175,55,0.16)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#f7dc83] to-white shadow-[0_0_18px_rgba(247,220,131,0.65)] transition-[width] duration-700"
                style={{ width: `${lockInLevel.progressPercent}%` }}
                aria-label={`LockIn Level progress ${Math.round(lockInLevel.progressPercent)} percent`}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/50">
              1 LockIn Point = INR 1 discount where enabled. Points are not cash, withdrawable, or transferable.
            </p>
          </div>
        </Card>
        <Card><FileBadge className="mb-4 text-[#d4af37]" /><h2 className="font-black">Certificates</h2><p className="mt-3 text-sm text-white/62">Certificates will appear after results are published.</p></Card>
      </div>
      {registrations.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-black">Your Registrations</h2>
          <div className="grid gap-3">
            {registrations.map((registration) => (
              <div key={registration.id} className="glass flex flex-col justify-between gap-3 rounded-[8px] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold">{registration.competition_name}</p>
                  <p className="text-sm text-white/58">{registration.student_name} | Age {registration.student_age} | {registration.city || registration.city_country}{registration.country ? `, ${registration.country}` : ""} | {registration.entry_fee}</p>
                  {Number(registration.points_redeemed || 0) > 0 && (
                    <p className="mt-1 text-xs text-white/50">LockIn Points Used: {registration.points_redeemed}</p>
                  )}
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Competing for cash prizes and recognition</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <StatusBadge status={registration.payment_status} />
                  {!isSeatConfirmed(registration.payment_status) && (
                    <ButtonLink
                      href={`/payment?competition=${encodeURIComponent(registration.competition_slug)}&registration=${encodeURIComponent(registration.id)}`}
                      variant="glass"
                      className="text-xs"
                    >
                      Continue Payment
                    </ButtonLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {registrations.length === 0 && (
        <Card className="mt-10 text-center">
          <Lightbulb className="mx-auto mb-4 text-[#d4af37]" />
          <h2 className="text-2xl font-black">No Registrations Yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/62">Explore the live competition tracks and lock in your first stage. Your events, payment status, cash prize details, and certificates will appear here.</p>
          <ButtonLink href="/competitions" className="mt-5">Explore Competitions</ButtonLink>
        </Card>
      )}
      <Link href="/competitions" className="mt-8 inline-flex text-sm font-bold text-[#d4af37]">Explore More Competitions</Link>
    </div>
  );
}
