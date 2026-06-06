"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { PosterBackdrop } from "@/components/brand-visuals";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[LockInTalks app error boundary]", error);
  }, [error]);

  return (
    <div className="relative min-h-[70vh] overflow-hidden px-4 py-20 text-center">
      <PosterBackdrop compact />
      <div className="glass relative z-10 mx-auto max-w-2xl rounded-[8px] p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Something went wrong</p>
        <h1 className="text-4xl font-black">This page could not load.</h1>
        <p className="mt-4 text-sm leading-6 text-white/65">Please try again. If the issue continues, the beta team can check the server logs using the error digest.</p>
        {error.digest && <p className="mt-3 text-xs text-white/40">Error digest: {error.digest}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>Try Again</Button>
          <ButtonLink href="/" variant="glass">Back Home</ButtonLink>
        </div>
      </div>
    </div>
  );
}
