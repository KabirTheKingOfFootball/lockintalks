import type { Metadata } from "next";
import { AuthTestClient } from "@/components/auth-test-client";

export const metadata: Metadata = {
  title: "Auth Test",
  description: "Temporary safe LockInTalks authentication diagnostics."
};

export const dynamic = "force-dynamic";

export default function AuthTestPage() {
  return <AuthTestClient />;
}
