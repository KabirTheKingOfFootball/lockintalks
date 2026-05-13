import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">404</p>
      <h1 className="text-5xl font-black">Page not found</h1>
      <p className="mt-4 text-white/62">That stage does not exist yet.</p>
      <ButtonLink href="/" className="mt-8">Back Home</ButtonLink>
    </div>
  );
}
