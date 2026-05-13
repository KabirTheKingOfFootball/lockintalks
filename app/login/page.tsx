import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your LockInTalks account."
};

export default function LoginPage() {
  return (
    <MotionShell className="px-4 py-16">
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-white/60">
        New to LockInTalks? <Link href="/signup" className="font-bold text-[#d4af37]">Create an account</Link>
      </p>
    </MotionShell>
  );
}
