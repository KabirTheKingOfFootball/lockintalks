import type { Metadata } from "next";
import Link from "next/link";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { checkAdmin } from "@/lib/admin/auth";
import { getAdminCompetitions } from "@/lib/admin/competitions";
import { getRazorpayEnvStatus } from "@/lib/razorpay/env";

export const metadata: Metadata = {
  title: "Admin Launch Readiness",
  description: "Admin-only LockInTalks launch readiness checks."
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const policyPages = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/pricing", label: "Pricing" },
  { href: "/shipping-policy", label: "No Shipping" },
  { href: "/parent-consent", label: "Parent Consent" },
  { href: "/contact", label: "Contact" }
];

export default async function AdminLaunchReadinessPage() {
  const admin = await checkAdmin("/admin/launch-readiness");
  if (!admin.ok) return <AdminGate message={admin.message} />;

  const razorpay = getRazorpayEnvStatus();
  const { competitions, error } = await getAdminCompetitions();
  const liveCompetitions = competitions.filter((competition) => competition.status === "live").length;
  const publicStatus = liveCompetitions > 0 ? "Ready" : "Needs Live Competition";
  const paymentStatus = razorpay.checkoutReady && razorpay.webhookReady ? "Ready" : "Needs Setup";

  return (
    <AdminShell>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-black">Payment Setup</h2>
          <dl className="mt-5 grid gap-3 text-sm text-white/65">
            <StatusRow label="Checkout" value={razorpay.checkoutReady ? "Configured" : "Missing"} />
            <StatusRow label="Webhook" value={razorpay.webhookReady ? "Configured" : "Missing"} />
            <StatusRow label="Mode" value={razorpay.keyMode} />
          </dl>
          <p className="mt-4 text-xs leading-5 text-white/45">Secret values are never shown here.</p>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Competitions</h2>
          <dl className="mt-5 grid gap-3 text-sm text-white/65">
            <StatusRow label="Total" value={String(competitions.length)} />
            <StatusRow label="Live" value={String(liveCompetitions)} />
            <StatusRow label="Public Status" value={publicStatus} />
          </dl>
          {error && <p className="mt-4 text-sm text-red-100">{error}</p>}
        </Card>

        <Card>
          <h2 className="text-xl font-black">Launch Health</h2>
          <dl className="mt-5 grid gap-3 text-sm text-white/65">
            <StatusRow label="Payments" value={paymentStatus} />
            <StatusRow label="Support Email" value="lockintalks@gmail.com" />
            <StatusRow label="Review Needed" value="Adult/Legal" />
          </dl>
        </Card>
      </div>

      <Card className="mt-5">
        <h2 className="text-xl font-black">Policy Pages</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {policyPages.map((page) => (
            <Link key={page.href} href={page.href} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3 text-sm font-bold text-white/72 hover:border-[#d4af37]/45 hover:text-white">
              {page.label}
            </Link>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] bg-white/[0.045] p-3">
      <dt>{label}</dt>
      <dd className="text-right font-black text-[#f7dc83]">{value}</dd>
    </div>
  );
}
