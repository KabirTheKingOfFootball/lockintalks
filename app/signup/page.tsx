import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a LockInTalks account and register for online speaking competitions."
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <MotionShell className="px-4 py-16">
      <AuthForm mode="signup" nextPath={nextPath} />
      <div className="mx-auto mt-6 grid max-w-md gap-3">
        <Card>
          <p className="text-sm font-bold text-[#d4af37]">After Signup</p>
          <p className="mt-2 text-sm leading-6 text-white/62">You will land in your dashboard, choose a competition, register, and receive next-step guidance.</p>
        </Card>
      </div>
      <p className="mt-6 text-center text-sm text-white/60">
        Already registered? <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-bold text-[#d4af37]">Login</Link>
      </p>
    </MotionShell>
  );
}
