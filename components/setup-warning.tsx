import { ButtonLink } from "@/components/ui/button";

export function SetupWarning({ title = "Supabase setup needed", message }: { title?: string; message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="glass rounded-[8px] p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Configuration</p>
        <h1 className="text-4xl font-black">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/68">{message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="glass">Back Home</ButtonLink>
          <ButtonLink href="/contact">Contact Support</ButtonLink>
        </div>
      </div>
    </div>
  );
}
