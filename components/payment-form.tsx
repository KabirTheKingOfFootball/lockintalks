"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompetitionBySlug } from "@/lib/registrations";
import { createClient } from "@/lib/supabase/client";

export function PaymentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const competition = getCompetitionBySlug(params.get("competition"));
  const registrationId = params.get("registration");
  const [method, setMethod] = useState<"card" | "upi">("card");
  const [error, setError] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "", upi: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (method === "card" && (card.number.replace(/\s/g, "").length < 12 || card.name.trim().length < 2 || card.cvv.length < 3)) {
      setError("Please enter valid card details for this demo checkout.");
      return;
    }
    if (method === "upi" && !card.upi.includes("@")) {
      setError("Please enter a valid UPI ID.");
      return;
    }
    if (registrationId) {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("registrations").update({ payment_status: "paid" }).eq("id", registrationId);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    }

    router.push("/payment/success");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_0.55fr]">
      <div className="glass rounded-[8px] p-6 sm:p-8">
        <h1 className="text-3xl font-black">Payment</h1>
        <p className="mt-3 text-sm text-white/62">Demo-safe checkout UI with a secure integration structure for production providers.</p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMethod("card")} className={`focus-ring rounded-[8px] border p-4 text-left transition ${method === "card" ? "border-[#d4af37] bg-[#d4af37]/12" : "border-white/12 bg-white/[0.05]"}`}>
            <CreditCard className="mb-3 text-[#d4af37]" /> <span className="font-bold">Card</span>
          </button>
          <button type="button" onClick={() => setMethod("upi")} className={`focus-ring rounded-[8px] border p-4 text-left transition ${method === "upi" ? "border-[#d4af37] bg-[#d4af37]/12" : "border-white/12 bg-white/[0.05]"}`}>
            <Smartphone className="mb-3 text-[#d4af37]" /> <span className="font-bold">UPI</span>
          </button>
        </div>
        {method === "card" ? (
          <div className="mt-6 grid gap-4">
            <Input inputMode="numeric" placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
            <Input placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="MM / YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
              <Input inputMode="numeric" placeholder="CVV" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="mt-6"><Input placeholder="student@upi" value={card.upi} onChange={(e) => setCard({ ...card, upi: e.target.value })} /></div>
        )}
        {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        <Button type="submit" className="mt-6 w-full">Pay {competition.fee}</Button>
      </div>
      <aside className="glass rounded-[8px] p-6">
        <CheckCircle2 className="mb-5 text-[#d4af37]" size={34} />
        <h2 className="text-2xl font-black">Order Summary</h2>
        <div className="mt-6 grid gap-4 text-sm text-white/68">
          <p><span className="font-bold text-white">Competition:</span> {competition.name}</p>
          <p><span className="font-bold text-white">Date:</span> {competition.date}</p>
          <p><span className="font-bold text-white">Entry fee:</span> {competition.fee}</p>
          <p><span className="font-bold text-white">Platform:</span> Online</p>
        </div>
      </aside>
    </form>
  );
}
