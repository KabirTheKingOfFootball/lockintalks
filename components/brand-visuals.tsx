import { Mic2, Sparkles, Trophy } from "lucide-react";
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
    <div className="poster-hero-art" aria-hidden="true">
      <div className="cash-shield">
        <Trophy size={24} />
        <span>Cash</span>
        <strong>Prizes</strong>
        <small>Win exciting rewards</small>
      </div>
      <div className="speaker-figure">
        <span className="speaker-head" />
        <span className="speaker-hair" />
        <span className="speaker-neck" />
        <span className="speaker-body" />
        <span className="speaker-shirt" />
        <span className="speaker-vest" />
        <span className="speaker-smile" />
        <span className="speaker-arm speaker-arm-left" />
        <span className="speaker-arm speaker-arm-right" />
        <span className="speaker-leg speaker-leg-left" />
        <span className="speaker-leg speaker-leg-right" />
        <span className="speaker-shoe speaker-shoe-left" />
        <span className="speaker-shoe speaker-shoe-right" />
        <span className="speaker-mic"><Mic2 size={20} /></span>
      </div>
      <span className="motif-straw-hat" />
      <span className="motif-sword" />
      <span className="motif-red-hat" />
      <span className="motif-seven">7</span>
      <span className="motif-flower motif-flower-one" />
      <span className="motif-flower motif-flower-two" />
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
