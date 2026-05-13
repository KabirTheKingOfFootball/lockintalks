"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Competition } from "@/data/competitions";

export function RegisterForm({ competition }: { competition: Competition }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ student: "", age: "", guardian: "", email: "", city: "" });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = Number(form.age);
    if (!form.student.trim() || !form.guardian.trim() || !form.city.trim()) {
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
    localStorage.setItem("lockintalks-pending-registration", JSON.stringify({ ...form, competition: competition.name, fee: competition.fee }));
    router.push(`/payment?competition=${competition.slug}`);
  }

  return (
    <form onSubmit={submit} className="glass rounded-[8px] p-6 sm:p-8">
      <h1 className="text-3xl font-black">Register for <span className="gold-text">{competition.name}</span></h1>
      <p className="mt-3 text-sm leading-6 text-white/62">Fill in the speaker details, then continue to the secure payment step.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white/80">Student name<Input value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Age<Input inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian name<Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80">Guardian email<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-white/80 sm:col-span-2">City / Country<Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
      </div>
      {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full sm:w-auto">Continue to Payment</Button>
    </form>
  );
}
