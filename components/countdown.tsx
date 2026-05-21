"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining(targetIso)), 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  if (remaining.total <= 0) {
    return <span className="text-sm font-bold text-white/60">Event has started</span>;
  }

  if (!Number.isFinite(remaining.total)) {
    return <span className="text-sm font-bold text-white/60">Schedule coming soon</span>;
  }

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Competition countdown">
      {[
        ["Days", remaining.days],
        ["Hours", remaining.hours],
        ["Min", remaining.minutes],
        ["Sec", remaining.seconds]
      ].map(([label, value]) => (
        <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.06] p-2 text-center">
          <p className="text-lg font-black text-[#f7dc83]">{String(value).padStart(2, "0")}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</p>
        </div>
      ))}
    </div>
  );
}

function getRemaining(targetIso: string) {
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return { total: Number.NaN, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const total = Math.max(0, target - Date.now());
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total / 3600000) % 24);
  const minutes = Math.floor((total / 60000) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { total, days, hours, minutes, seconds };
}
