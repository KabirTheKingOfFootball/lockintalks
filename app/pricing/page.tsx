import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";
import { getLiveCompetitions } from "@/lib/competitions";

export const metadata: Metadata = {
  title: "Pricing and Competition Fees",
  description: "Pricing and entry fee information for LockInTalks online public speaking competitions."
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { competitions, error } = await getLiveCompetitions();

  return (
    <MotionShell className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Pricing</p>
      <h1 className="text-4xl font-black sm:text-6xl">Pricing and Competition Fees</h1>
      <p className="mt-5 text-sm leading-7 text-white/68">
        LockInTalks entry fees are shown on each live competition page before checkout. Payments are processed through Razorpay Checkout when enabled, and registrations are confirmed only after server-side verification.
      </p>
      <p className="mt-4 text-xs leading-6 text-white/45">
        Last Updated: May 31, 2026. Pricing should be reviewed before public launch and may change for future events.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="text-2xl font-black">How Fees Work</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-white/65">
            <li>Each competition has its own entry fee shown on the competition card and details page.</li>
            <li>A common beta entry fee example is INR 199 where applicable, but the actual fee may vary by competition.</li>
            <li>Taxes, gateway charges, or other applicable charges should be shown before payment if they apply.</li>
            <li>Razorpay may show the final payable INR amount during Checkout before payment is completed.</li>
            <li>No physical shipping fee is charged for standard online competition registrations.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Prize Pool and Rewards</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-white/65">
            <li>The prize pool may increase by INR 500 for every 5 verified paid participants where prize pool logic is enabled.</li>
            <li>Prize pool calculations count only verified successful paid registrations.</li>
            <li>Failed, cancelled, pending, refunded, or unverified payments do not count toward prize pool calculations.</li>
            <li>Where enabled, prize distribution is 1st Place: 45%, 2nd Place: 30%, and 3rd Place: 25%.</li>
            <li>Cash rewards, Amazon gift cards, certificates, and feedback apply only when shown for a specific competition.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Current Live Competition Fees</h2>
          {error && <p className="mt-4 text-sm leading-7 text-red-100">Could not load live fees right now. Please check the competition pages or contact support.</p>}
          {!error && competitions.length === 0 && (
            <p className="mt-4 text-sm leading-7 text-white/65">No live competition fees are published yet. New event fees will appear when competitions are shown on the website.</p>
          )}
          {competitions.length > 0 && (
            <div className="mt-5 grid gap-3">
              {competitions.map((competition) => (
                <Link key={competition.slug} href={`/competitions/${competition.slug}`} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#d4af37]/45">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-bold text-white">{competition.name}</span>
                    <span className="text-sm font-black text-[#f7dc83]">{competition.fee}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{competition.ageGroup} | {competition.date} | {competition.time} {competition.timezone}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Support</h2>
          <p className="mt-4 text-sm leading-7 text-white/65">
            For payment, pricing, or competition fee questions, contact{" "}
            <Link className="font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">
              lockintalks@gmail.com
            </Link>
            .
          </p>
        </Card>
      </div>
    </MotionShell>
  );
}
