import Image from "next/image";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PosterBackdrop({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("poster-backdrop", compact && "poster-backdrop-compact", className)} aria-hidden="true">
      <span className="poster-cloud poster-cloud-one" />
      <span className="poster-cloud poster-cloud-two" />
      <span className="poster-cloud poster-cloud-three" />
      <span className="poster-sunburst" />
      <span className="poster-petal poster-petal-one" />
      <span className="poster-petal poster-petal-two" />
      <span className="poster-petal poster-petal-three" />
      <span className="poster-petal poster-petal-four" />
      <span className="poster-petal poster-petal-five" />
      <span className="poster-petal poster-petal-six" />
      <span className="poster-petal poster-petal-seven" />
      <span className="poster-petal poster-petal-eight" />
      <span className="poster-grass" />
    </div>
  );
}

export function PosterHeroArt() {
  return (
    <div className="poster-hero-art">
      <Image
        src="/lockintalks-advertisement-poster.png"
        alt="LockInTalks online speaking competitions poster with cash prizes and a student speaker"
        fill
        priority
        sizes="(min-width: 1024px) 560px, 92vw"
        className="poster-hero-image"
      />
    </div>
  );
}

export function PrizePoolPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("prize-pool-pill", className)}>
      <Sparkles size={16} />
      <span>{children}</span>
    </div>
  );
}

export function RedHatMark({ className }: { className?: string }) {
  return <span className={cn("red-hat-mark", className)} aria-hidden="true" />;
}
