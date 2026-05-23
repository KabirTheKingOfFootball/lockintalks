"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      className="glass rounded-[8px] p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h1 className="text-3xl font-black">Contact LockInTalks</h1>
      <p className="mt-3 text-sm leading-6 text-white/62">
        For support, questions, or competition help, contact <a className="font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">lockintalks@gmail.com</a>.
      </p>
      <div className="mt-7 grid gap-4">
        <Input required placeholder="Name" />
        <Input required type="email" placeholder="Email" />
        <Textarea required placeholder="How can we help?" />
      </div>
      {sent && <p className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">Message received. We will get back to you soon.</p>}
      <Button type="submit" className="mt-6">Send Message</Button>
    </form>
  );
}
