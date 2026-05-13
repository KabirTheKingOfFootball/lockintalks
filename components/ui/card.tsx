import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <article className={cn("glass rounded-[8px] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/45", className)}>{children}</article>;
}
