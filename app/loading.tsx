import { PosterBackdrop } from "@/components/brand-visuals";

export default function Loading() {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4">
      <PosterBackdrop compact />
      <div className="glass relative z-10 rounded-[8px] p-8 text-center">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#d4af37]">Loading</p>
      </div>
    </div>
  );
}
