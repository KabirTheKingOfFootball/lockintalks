import { ButtonLink } from "@/components/ui/button";
import { PosterBackdrop } from "@/components/brand-visuals";

export default function NotFound() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden px-4 py-20 text-center">
      <PosterBackdrop compact />
      <div className="poster-panel relative z-10 mx-auto max-w-2xl rounded-[8px] p-8">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#0d4ea6]">404</p>
      <h1 className="text-4xl font-black text-[#071b3b] sm:text-5xl">Page not found</h1>
      <p className="mt-4 text-[#071b3b]/68">That stage does not exist yet.</p>
      <ButtonLink href="/" className="mt-8">Back Home</ButtonLink>
      </div>
    </div>
  );
}
