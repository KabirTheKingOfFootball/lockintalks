import { Award, CreditCard, Mic2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AdminCompetition } from "@/lib/admin/competitions";
import type { RegistrationRow } from "@/lib/registrations";
import { isSeatConfirmed } from "@/lib/payment/status";
import { formatAmount } from "@/lib/razorpay/payments";

export function AnalyticsCards({ competitions, registrations }: { competitions: AdminCompetition[]; registrations: RegistrationRow[] }) {
  const paid = registrations.filter((registration) => isSeatConfirmed(registration.payment_status));
  const revenue = paid.reduce((total, registration) => total + (registration.amount_paid || registration.payment_amount || 0), 0);

  const cards = [
    { icon: Mic2, label: "Competitions", value: competitions.length },
    { icon: Users, label: "Registrations", value: registrations.length },
    { icon: CreditCard, label: "Paid Entries", value: paid.length },
    { icon: Award, label: "Revenue", value: formatAmount(revenue) }
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => (
        <Card key={item.label}>
          <item.icon className="mb-4 text-[#d4af37]" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/45">{item.label}</p>
          <p className="mt-3 text-3xl font-black">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
