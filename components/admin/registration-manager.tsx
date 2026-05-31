"use client";

import { useMemo, useState } from "react";
import { Award, Download, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";
import type { RegistrationRow } from "@/lib/registrations";
import { ageProofStatuses, paymentStatusLabel, paymentStatuses, registrationStatuses } from "@/lib/payment/status";

export function RegistrationManager({ registrations }: { registrations: RegistrationRow[] }) {
  const [rows, setRows] = useState(registrations);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return rows.filter((registration) => {
      const matchesStatus = status === "all" || registration.payment_status === status;
      const matchesQuery =
        !normalizedQuery ||
        [registration.student_name, registration.guardian_name, registration.guardian_email, registration.competition_name, registration.city, registration.country, registration.city_country]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  async function updateRegistration(id: string, payload: Partial<Pick<RegistrationRow, "payment_status" | "registration_status" | "age_proof_status">>) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/registrations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await readJsonResponse<{ error?: string; registration?: RegistrationRow }>(response);

      if (!response.ok || !result.registration) throw new Error(result.error || "Could not update registration.");

      const updatedRegistration = result.registration;
      setRows((current) => current.map((row) => (row.id === id ? updatedRegistration : row)));
      setMessage("Registration updated.");
    } catch (updateError) {
      console.error("[LockInTalks admin UI] Registration update failed:", updateError);
      setError(getReadableError(updateError, "Could not update registration."));
    }
  }

  async function awardWinnerPoints(id: string, place: "first" | "second" | "third") {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/points/award-winner", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id, place })
      });
      const result = await readJsonResponse<{ error?: string; pointsAwarded?: number; alreadyAwarded?: boolean }>(response);

      if (!response.ok) throw new Error(result.error || "Could not award winner points.");

      setMessage(result.alreadyAwarded ? "Winner points were already awarded for this registration." : `Awarded ${result.pointsAwarded || 0} LockIn Points.`);
    } catch (awardError) {
      console.error("[LockInTalks admin UI] Winner points award failed:", awardError);
      setError(getReadableError(awardError, "Could not award winner points."));
    }
  }

  return (
    <div className="glass rounded-[8px] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Registrations</h2>
          <p className="mt-1 text-sm text-white/55">{filteredRegistrations.length} Visible of {rows.length}</p>
        </div>
        <ButtonLink href="/api/admin/registrations/export" className="gap-2" prefetch={false}><Download size={16} /> Export CSV</ButtonLink>
      </div>
      {error && <p className="mb-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {message && <p className="mb-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Student, Guardian, Email, Competition..." className="pl-11" />
        </label>
        <select className="focus-ring min-h-12 rounded-[8px] border border-white/15 bg-[#071b3b] px-4 text-sm text-white" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All Statuses</option>
          {paymentStatuses.map((paymentStatus) => (
            <option key={paymentStatus} value={paymentStatus}>{paymentStatusLabel(paymentStatus)}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1420px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-[#d4af37]">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Competition</th>
              <th className="px-3 py-2">Guardian</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Country / Nation</th>
              <th className="px-3 py-2">Entry Status</th>
              <th className="px-3 py-2">Age Proof</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Points Used</th>
              <th className="px-3 py-2">Winner Points</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((registration) => (
              <tr key={registration.id} className="bg-white/[0.055]">
                <td className="rounded-l-[8px] px-3 py-3">
                  <p className="font-bold">{registration.student_name}</p>
                  <p className="text-white/50">Age {registration.student_age}</p>
                </td>
                <td className="px-3 py-3">{registration.competition_name}</td>
                <td className="px-3 py-3">
                  <p>{registration.guardian_name}</p>
                  <p className="text-white/50">{registration.guardian_email}</p>
                </td>
                <td className="px-3 py-3">{registration.city || registration.city_country}</td>
                <td className="px-3 py-3">{registration.country || "Not Provided"}</td>
                <td className="px-3 py-3">
                  <select
                    className="focus-ring rounded-full border border-white/15 bg-[#071b3b] px-3 py-1 text-xs font-bold text-white/80"
                    value={registration.registration_status || "submitted"}
                    onChange={(event) => updateRegistration(registration.id, { registration_status: event.target.value as RegistrationRow["registration_status"] })}
                    aria-label={`Update registration status for ${registration.student_name}`}
                  >
                    {registrationStatuses.map((registrationStatus) => (
                      <option key={registrationStatus} value={registrationStatus}>{formatSimpleStatus(registrationStatus)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <select
                    className="focus-ring rounded-full border border-white/15 bg-[#071b3b] px-3 py-1 text-xs font-bold text-white/80"
                    value={registration.age_proof_status || "not_required_yet"}
                    onChange={(event) => updateRegistration(registration.id, { age_proof_status: event.target.value as RegistrationRow["age_proof_status"] })}
                    aria-label={`Update age proof status for ${registration.student_name}`}
                  >
                    {ageProofStatuses.map((ageProofStatus) => (
                      <option key={ageProofStatus} value={ageProofStatus}>{formatSimpleStatus(ageProofStatus)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <select
                    className="focus-ring rounded-full border border-[#d4af37]/30 bg-[#071b3b] px-3 py-1 text-xs font-bold uppercase text-[#d4af37]"
                    value={registration.payment_status}
                    onChange={(event) => updateRegistration(registration.id, { payment_status: event.target.value as RegistrationRow["payment_status"] })}
                    aria-label={`Update payment status for ${registration.student_name}`}
                  >
                    {paymentStatuses.map((paymentStatus) => (
                      <option key={paymentStatus} value={paymentStatus}>{paymentStatusLabel(paymentStatus)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 text-white/70">{registration.points_redeemed || 0}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(["first", "second", "third"] as const).map((place) => (
                      <Button
                        key={place}
                        type="button"
                        variant="glass"
                        className="min-h-8 px-2 py-1 text-xs"
                        onClick={() => awardWinnerPoints(registration.id, place)}
                        aria-label={`Award ${place} place points to ${registration.student_name}`}
                      >
                        <Award size={12} /> {place === "first" ? "1st" : place === "second" ? "2nd" : "3rd"}
                      </Button>
                    ))}
                  </div>
                </td>
                <td className="rounded-r-[8px] px-3 py-3 text-white/55">{new Date(registration.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRegistrations.length === 0 && <p className="py-8 text-center text-white/55">No Registrations Match Your Filters.</p>}
    </div>
  );
}

function formatSimpleStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
