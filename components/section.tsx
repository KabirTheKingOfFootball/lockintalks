import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  children,
  className
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}>
      {(eyebrow || title) && (
        <div className="mb-10 max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">{eyebrow}</p>}
          {title && <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}
