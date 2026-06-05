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

const webhookEvents = ["payment.captured", "payment.failed", "refund.created", "refund.processed", "refund.failed"];

export default async function AdminLaunchReadinessPage() {
  const admin = await checkAdmin("/admin/launch-readiness");
  if (!admin.ok) return <AdminGate message={admin.message} />;

  const razorpay = getRazorpayEnvStatus();
  const { competitions, error } = await getAdminCompetitions();
  const liveCompetitions = competitions.filter((competition) => competition.status === "live").length;
  const publicStatus = liveCompetitions > 0 ? "Ready" : "Needs Live Competition";
  const paymentStatus = razorpay.checkoutReady && razorpay.webhookReady ? (razorpay.keyMode === "live" ? "Live Mode Configured" : "Test Mode Ready") : "Needs Setup";
  const liveModeStatus = razorpay.keyMode === "live" ? "Needs Adult Final Check" : "Not Switched";

  return (
    <AdminShell>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-black">Payment Setup</h2>
          <dl className="mt-5 grid gap-3 text-sm text-white/65">
            <StatusRow label="Checkout" value={razorpay.checkoutReady ? "Configured" : "Missing"} />
            <StatusRow label="Webhook" value={razorpay.webhookReady ? "Configured" : "Missing"} />
            <StatusRow label="Mode" value={razorpay.keyMode} />
            <StatusRow label="Live Selling" value={liveModeStatus} />
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

      <Card className="mt-5">
        <h2 className="text-xl font-black">Razorpay Webhook Events</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Use this URL in Razorpay Test Mode first, then recreate it in Live Mode after KYC and adult/legal approval:
          <span className="mt-2 block rounded-[8px] bg-white/[0.045] p-3 font-mono text-xs text-[#f7dc83]">https://lockintalks.vercel.app/api/payments/webhook</span>
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {webhookEvents.map((event) => (
            <span key={event} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3 text-xs font-black text-white/70">
              {event}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="text-xl font-black">Before Live Mode</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/65">
          <li>Complete Razorpay KYC/account activation with adult supervision.</li>
          <li>Get adult/legal approval for Terms, Privacy, Refund Policy, Pricing, No Shipping, Parent Consent, and Contact pages.</li>
          <li>Generate Live Mode Razorpay keys only after approval, then replace the Test Mode env vars in Vercel.</li>
          <li>Create a Live Mode webhook with a new live webhook secret and redeploy.</li>
          <li>Run one small real payment test with adult supervision and verify dashboard, admin, prize pool, and LockIn Points.</li>
        </ul>
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
