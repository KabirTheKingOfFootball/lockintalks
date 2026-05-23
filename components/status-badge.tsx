import { cn } from "@/lib/utils";

const styles = {
  draft: "border-white/20 text-white/65 bg-white/10",
  live: "border-emerald-300/35 text-emerald-100 bg-emerald-500/12",
  closed: "border-red-300/35 text-red-100 bg-red-500/12",
  paid: "border-emerald-300/35 text-emerald-100 bg-emerald-500/12",
  captured: "border-emerald-300/35 text-emerald-100 bg-emerald-500/12",
  pending: "border-[#d4af37]/35 text-[#f7dc83] bg-[#d4af37]/10",
  order_created: "border-[#d4af37]/35 text-[#f7dc83] bg-[#d4af37]/10",
  payment_created: "border-[#d4af37]/35 text-[#f7dc83] bg-[#d4af37]/10",
  signature_verified: "border-[#d4af37]/35 text-[#f7dc83] bg-[#d4af37]/10",
  failed: "border-red-300/35 text-red-100 bg-red-500/12",
  cancelled: "border-red-300/35 text-red-100 bg-red-500/12",
  refunded: "border-blue-300/35 text-blue-100 bg-blue-500/12"
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status, className }: { status: keyof typeof styles; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]", styles[status], className)}>
      {formatStatus(status)}
    </span>
  );
}
