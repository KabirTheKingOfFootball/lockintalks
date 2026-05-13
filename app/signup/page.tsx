import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { MotionShell } from "@/components/motion-shell";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a LockInTalks account and register for online speaking competitions."
};

export default function SignUpPage() {
  return (
    <MotionShell className="px-4 py-16">
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-sm text-white/60">
        Already registered? <Link href="/login" className="font-bold text-[#d4af37]">Login</Link>
      </p>
    </MotionShell>
  );
}
