import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your LockInTalks account."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const readableError = error ? decodeURIComponent(error).replaceAll("-", " ") : "";
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <MotionShell className="px-4 py-16">
      <AuthForm mode="login" initialError={readableError} nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-white/60">
        New to LockInTalks? <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-bold text-[#d4af37]">Create an Account</Link>
      </p>
    </MotionShell>
  );
}
