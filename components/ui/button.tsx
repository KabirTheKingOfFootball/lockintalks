import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "glass" | "ghost";
};

const variants = {
  gold: "bg-gradient-to-r from-[#fff1a8] via-[#d4af37] to-[#9b7415] text-[#071225] shadow-[0_14px_40px_rgba(212,175,55,0.28)] hover:shadow-[0_18px_54px_rgba(212,175,55,0.42)]",
  glass: "glass text-white hover:border-[#d4af37]/60",
  ghost: "text-white/80 hover:bg-white/10 hover:text-white"
};

export function Button({ className, variant = "gold", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "gold",
  ariaLabel,
  prefetch
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "gold" | "glass" | "ghost";
  ariaLabel?: string;
  prefetch?: boolean;
}) {
  const classNameValue = cn(
    "focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5",
    variants[variant],
    className
  );

  if (prefetch === false && (href.startsWith("/admin") || href.startsWith("/api/admin"))) {
    return (
      <a href={href} aria-label={ariaLabel} className={classNameValue}>
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      prefetch={prefetch}
      className={classNameValue}
    >
      {children}
    </Link>
  );
}
