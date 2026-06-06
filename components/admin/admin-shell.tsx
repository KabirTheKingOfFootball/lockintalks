import { ShieldCheck } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/launch-readiness", label: "Launch Readiness" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 rounded-[8px] border border-[#ffd765]/30 bg-[#071b3b]/88 p-5 shadow-[0_18px_50px_rgba(7,27,59,0.24)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#ffd765]/15 p-3 text-[#ffd765]"><ShieldCheck /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ffd765]">Admin Panel</p>
            <h1 className="text-2xl font-black">LockInTalks Control Room</h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
          {adminLinks.map((link) => (
            <a key={link.href} href={link.href} className="focus-ring rounded-full border border-white/14 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/76 hover:border-[#ffd765]/60 hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
