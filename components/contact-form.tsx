"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  return (
    <form
      className="glass rounded-[8px] p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const subject = encodeURIComponent(`LockInTalks Support Request From ${form.name.trim() || "Website Visitor"}`);
        const body = encodeURIComponent(
          `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\nMessage:\n${form.message.trim()}`
        );
        window.location.href = `mailto:lockintalks@gmail.com?subject=${subject}&body=${body}`;
        setSent(true);
      }}
    >
      <h1 className="text-3xl font-black">Contact LockInTalks</h1>
      <p className="mt-3 text-sm leading-6 text-white/62">
        For support, questions, or competition help, contact <a className="font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a>.
      </p>
      <div className="mt-7 grid gap-4">
        <Input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Textarea required placeholder="How can we help?" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      </div>
      {sent && <p className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">Your email app should open with the message prepared. If it does not, please email lockintalks@gmail.com directly.</p>}
      <Button type="submit" className="mt-6">Email Support</Button>
    </form>
  );
}
