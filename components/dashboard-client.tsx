"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, CalendarClock, CreditCard, FileBadge, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

type User = { name: string; email: string };
type Registration = { competition: string; paid: string; date: string };
type DashboardState = {
  user: User | null;
  registration: Registration | null;
  loaded: boolean;
};

const initialDashboardState: DashboardState = {
  user: null,
  registration: null,
  loaded: false
};

export function DashboardClient() {
  const [{ user, registration, loaded }, setDashboardState] = useState<DashboardState>(initialDashboardState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // localStorage is client-only, so the dashboard hydrates after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDashboardState({
      user: readLocalStorage<User>("lockintalks-user"),
      registration: readLocalStorage<Registration>("lockintalks-registration"),
      loaded: true
    });
  }, []);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="glass rounded-[8px] p-8">
          <div className="h-7 w-48 animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-36 rounded-[8px] border border-white/10 bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto mb-5 text-[#d4af37]" size={42} />
        <h1 className="text-4xl font-black">Login required</h1>
        <p className="mt-4 text-white/62">The dashboard is protected in the demo flow. Login or create an account to continue.</p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/login">Login</ButtonLink>
          <ButtonLink href="/signup" variant="glass">Sign Up</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Dashboard</p>
      <h1 className="text-4xl font-black sm:text-6xl">Welcome, {user.name.split(" ")[0]}.</h1>
      <p className="mt-4 text-white/62">{user.email}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><Award className="mb-4 text-[#d4af37]" /><h2 className="font-black">Registered Competitions</h2><p className="mt-3 text-sm text-white/62">{registration?.competition || "No registrations yet."}</p></Card>
        <Card><CalendarClock className="mb-4 text-[#d4af37]" /><h2 className="font-black">Upcoming Events</h2><p className="mt-3 text-sm text-white/62">{registration ? "Check your email for live room details." : "Choose a competition to start."}</p></Card>
        <Card><CreditCard className="mb-4 text-[#d4af37]" /><h2 className="font-black">Payment History</h2><p className="mt-3 text-sm text-white/62">{registration ? `${registration.paid} paid` : "No payments yet."}</p></Card>
        <Card><FileBadge className="mb-4 text-[#d4af37]" /><h2 className="font-black">Certificates</h2><p className="mt-3 text-sm text-white/62">Certificates will appear after results are published.</p></Card>
      </div>
      <Link href="/competitions" className="mt-8 inline-flex text-sm font-bold text-[#d4af37]">Explore more competitions</Link>
    </div>
  );
}

function readLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
