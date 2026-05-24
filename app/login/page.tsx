import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your LockInTalks account."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; next?: string }> }) {
  const { error, notice, next } = await searchParams;
  const readableError = error ? decodeURIComponent(error).replaceAll("-", " ") : "";
  const readableNotice = notice ? decodeURIComponent(notice).replaceAll("-", " ") : "";
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <MotionShell className="px-4 py-16">
      <AuthForm mode="login" action={loginAction} initialError={readableError} initialNotice={readableNotice} nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-white/60">
        New to LockInTalks? <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-bold text-[#d4af37]">Create an Account</Link>
      </p>
    </MotionShell>
  );
}
