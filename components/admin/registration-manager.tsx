"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentStatusLabel } from "@/lib/payment/status";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";
import type { RegistrationRow } from "@/lib/registrations";

export function RegistrationManager({ registrations }: { registrations: RegistrationRow[] }) {
  const [rows, setRows] = useState(registrations);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return rows.filter((registration) => {
      if (!normalizedQuery) return true;
      return [registration.student_name, registration.guardian_email, registration.competition_name, registration.city, registration.country, registration.city_country]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, rows]);

  async function updateEmailStatus(registration: RegistrationRow, confirmationEmailSent: boolean) {
    setError("");
    setMessage("");
    setUpdatingId(registration.id);

    try {
      const response = await fetch(`/api/admin/registrations/${encodeURIComponent(registration.id)}`, {
        method: "PATCH",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation_email_sent: confirmationEmailSent })
      });
      const result = await readJsonResponse<{ error?: string; registration?: RegistrationRow }>(response);

      if (!response.ok || !result.registration) throw new Error(result.error || "Could not update confirmation email status.");

      setRows((current) => current.map((row) => (row.id === registration.id ? result.registration as RegistrationRow : row)));
      setMessage(confirmationEmailSent ? "Confirmation email marked as sent." : "Confirmation email marked as not sent.");
    } catch (updateError) {
      console.error("[LockInTalks admin UI] Confirmation email update failed:", updateError);
      setError(getReadableError(updateError, "Could not update confirmation email status."));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="glass rounded-[8px] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Paid Registration Review</h2>
          <p className="mt-1 text-sm text-white/55">{filteredRegistrations.length} Successful Paid Registrations</p>
        </div>
        <ButtonLink href="/api/admin/registrations/export" className="gap-2" prefetch={false}><Download size={16} /> Export Paid CSV</ButtonLink>
      </div>
      {error && <p className="mb-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {message && <p className="mb-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}
      <div className="mb-5">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Participant, Email, Competition, City..." className="pl-11" />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-[#d4af37]">
            <tr>
              <th className="px-3 py-2">Participant</th>
              <th className="px-3 py-2">Guardian Email</th>
              <th className="px-3 py-2">Competition</th>
              <th className="px-3 py-2">Amount Paid</th>
              <th className="px-3 py-2">Payment Status</th>
              <th className="px-3 py-2">Confirmation Email</th>
              <th className="px-3 py-2">Created / Paid</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((registration) => {
              const emailSent = Boolean(registration.confirmation_email_sent);
              return (
                <tr key={registration.id} className="bg-white/[0.055]">
                  <td className="rounded-l-[8px] px-3 py-3">
                    <p className="font-bold">{registration.student_name}</p>
                    <p className="text-white/50">Age {registration.student_age}</p>
                  </td>
                  <td className="px-3 py-3">{registration.guardian_email}</td>
                  <td className="px-3 py-3">
                    <p className="font-bold">{registration.competition_name}</p>
                    <p className="text-white/50">{registration.city || registration.city_country}{registration.country ? `, ${registration.country}` : ""}</p>
                  </td>
                  <td className="px-3 py-3">{formatPaidAmount(registration)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone="green">PAID</StatusBadge>
                    <p className="mt-1 text-xs text-white/45">{paymentStatusLabel(registration.payment_status)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={emailSent ? "green" : "amber"}>
                      {emailSent ? "EMAIL SENT" : "EMAIL NOT SENT"}
                    </StatusBadge>
                    {registration.confirmation_email_sent_at && <p className="mt-1 text-xs text-white/45">{formatDate(registration.confirmation_email_sent_at)}</p>}
                  </td>
                  <td className="px-3 py-3 text-white/60">
                    <p>Created: {formatDate(registration.created_at)}</p>
                    <p>Paid: {formatDate(registration.paid_at || registration.seat_confirmed_at)}</p>
                  </td>
                  <td className="rounded-r-[8px] px-3 py-3">
                    <Button
                      variant={emailSent ? "glass" : "gold"}
                      disabled={updatingId === registration.id}
                      onClick={() => updateEmailStatus(registration, !emailSent)}
                    >
                      {updatingId === registration.id ? "Saving..." : emailSent ? "Mark Email Not Sent" : "Mark Email Sent"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredRegistrations.length === 0 && <p className="py-8 text-center text-white/55">No successful paid registrations yet.</p>}
    </div>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" }) {
  const classes =
    tone === "green"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
      : "border-amber-300/35 bg-amber-400/15 text-amber-100";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${classes}`}>{children}</span>;
}

function formatPaidAmount(registration: RegistrationRow) {
  const amount = Math.max(0, Math.floor(Number(registration.amount_paid || registration.payment_amount || registration.amount_due || 0)));
  const currency = registration.payment_currency || "INR";
  if (!amount) return "Amount Not Recorded";
  return `${currency} ${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: amount % 100 ? 2 : 0, maximumFractionDigits: amount % 100 ? 2 : 0 })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not Recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not Recorded";
  return date.toLocaleDateString();
}
