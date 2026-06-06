import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";
import { PosterBackdrop } from "@/components/brand-visuals";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your LockInTalks account."
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; next?: string }> }) {
  const { error, notice, next } = await searchParams;
  const readableError = error ? decodeURIComponent(error).replaceAll("-", " ") : "";
  const readableNotice = notice ? decodeURIComponent(notice).replaceAll("-", " ") : "";
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <MotionShell className="relative overflow-hidden px-4 py-16">
      <PosterBackdrop compact />
      <div className="relative z-10">
        <AuthForm mode="login" initialError={readableError} initialNotice={readableNotice} nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-[#071b3b]/72">
        New to LockInTalks? <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-bold text-[#d4af37]">Create an Account</Link>
      </p>
      </div>
    </MotionShell>
  );
}
