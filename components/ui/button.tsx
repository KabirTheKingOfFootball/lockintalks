import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "glass" | "ghost";
};

const variants = {
  gold: "relative overflow-hidden bg-gradient-to-r from-[#fff3a3] via-[#ffd765] to-[#d49a22] text-[#071225] shadow-[0_14px_40px_rgba(255,215,101,0.32)] hover:shadow-[0_18px_54px_rgba(255,215,101,0.48)] before:absolute before:inset-y-[-40%] before:left-[-45%] before:w-1/3 before:rotate-12 before:bg-white/45 before:transition before:duration-700 hover:before:left-[120%]",
  glass: "glass text-white hover:border-[#ffd765]/70",
  ghost: "text-white/86 hover:bg-white/14 hover:text-white"
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
