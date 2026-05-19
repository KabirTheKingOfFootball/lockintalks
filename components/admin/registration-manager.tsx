"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";
import type { RegistrationRow } from "@/lib/registrations";

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
        [registration.student_name, registration.guardian_name, registration.guardian_email, registration.competition_name, registration.city_country]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/registrations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentStatus })
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

  return (
    <div className="glass rounded-[8px] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Registrations</h2>
          <p className="mt-1 text-sm text-white/55">{filteredRegistrations.length} visible of {rows.length}</p>
        </div>
        <ButtonLink href="/api/admin/registrations/export" className="gap-2"><Download size={16} /> Export CSV</ButtonLink>
      </div>
      {error && <p className="mb-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {message && <p className="mb-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 text-white/40" size={18} />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student, guardian, email, competition..." className="pl-11" />
        </label>
        <select className="focus-ring min-h-12 rounded-[8px] border border-white/15 bg-[#071b3b] px-4 text-sm text-white" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="payment_created">Payment created</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-[#d4af37]">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Competition</th>
              <th className="px-3 py-2">Guardian</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Payment</th>
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
                <td className="px-3 py-3">{registration.city_country}</td>
                <td className="px-3 py-3">
                  <select
                    className="focus-ring rounded-full border border-[#d4af37]/30 bg-[#071b3b] px-3 py-1 text-xs font-bold uppercase text-[#d4af37]"
                    value={registration.payment_status}
                    onChange={(event) => updatePaymentStatus(registration.id, event.target.value)}
                    aria-label={`Update payment status for ${registration.student_name}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="payment_created">Payment created</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="rounded-r-[8px] px-3 py-3 text-white/55">{new Date(registration.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRegistrations.length === 0 && <p className="py-8 text-center text-white/55">No registrations match your filters.</p>}
    </div>
  );
}
