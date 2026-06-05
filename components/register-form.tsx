"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicCompetition } from "@/lib/competitions";
import { buildPaymentUrl } from "@/lib/payment/registration-reference";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

type RegistrationResponse = {
  ok?: boolean;
  registrationId?: string;
  alreadyRegistered?: boolean;
  paymentStatus?: string;
  paymentUrl?: string;
  redirectTo?: string;
  error?: string;
  loginTo?: string;
};

export function RegisterForm({ competition }: { competition: PublicCompetition }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ student: "", age: "", guardian: "", email: "", city: "", country: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const age = Number(form.age);
    if (!form.student.trim() || !form.guardian.trim() || !form.city.trim() || !form.country.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (!Number.isFinite(age) || age < 6 || age > 19) {
      setError("Student age must be between 6 and 19.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid guardian email.");
      return;
    }
    try {
      setIsSubmitting(true);
      track("registration_started", { competition: competition.slug });
      const response = await fetch("/api/registrations", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionSlug: competition.slug,
          studentName: form.student.trim(),
          studentAge: age,
          guardianName: form.guardian.trim(),
          guardianEmail: form.email.trim(),
          city: form.city.trim(),
          country: form.country.trim()
        })
      });
      const result = await readJsonResponse<RegistrationResponse>(response);

      if (response.status === 401) {
        track("register_clicked_logged_out", { competition: competition.slug });
        setError(result.error || "Please Log In or Create an Account Before Registering for a Competition.");
        router.push(result.loginTo || `/login?next=${encodeURIComponent(`/register/${competition.slug}`)}`);
        return;
      }

      if (!response.ok || result.error || !result.registrationId) {
        console.error(`[LockInTalks registration] Save failed: ${result.error || response.statusText}`);
        setError(result.error || "Registration could not be saved. Please try again.");
        return;
      }

      const paymentUrl = result.paymentUrl || buildPaymentUrl({ registrationId: result.registrationId, competitionSlug: competition.slug });
      const redirectTo = result.redirectTo || paymentUrl;
      console.info(`[LockInTalks registration] Redirecting to payment. competition=${competition.slug} registration=${result.registrationId} redirect=${redirectTo}`);
      track("registration_submitted", { competition: competition.slug });
      router.push(redirectTo);
      router.refresh();
    } catch (submitError) {
      console.error("[LockInTalks registration] Unexpected registration error:", submitError);
      setError(getReadableError(submitError, "Registration is temporarily unavailable. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-[8px] p-6 sm:p-8">
      <h1 className="text-3xl font-black">Register for <span className="gold-text">{competition.name}</span></h1>
      <p className="mt-3 text-sm leading-6 text-white/62">Fill in the speaker details, then continue to the secure payment step. Top performers compete for cash awards, recognition, and confidence-building stage experience.</p>
      <div className="mt-5 rounded-[8px] border border-[#d4af37]/25 bg-[#d4af37]/10 p-4 text-sm leading-6 text-[#f7dc83]">
        Participants below 18 should register with parent or guardian awareness or consent. Please enter accurate age and guardian details. Age proof may be requested before participation to keep categories fair. For help, contact{" "}
        <a className="font-bold text-white" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a>.
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white/80">Student Name<Input value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Age<Input inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian Name<Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian Email<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">City<Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Country / Nation<Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
      </div>
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Saving Registration..." : "Continue to Payment"}
      </Button>
    </form>
  );
}
