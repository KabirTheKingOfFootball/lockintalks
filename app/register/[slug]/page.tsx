import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import { MotionShell } from "@/components/motion-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PosterBackdrop } from "@/components/brand-visuals";
import { AppSessionConfigError } from "@/lib/auth/app-session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getLiveCompetitionBySlug } from "@/lib/competitions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { competition } = await getLiveCompetitionBySlug(slug);
  return {
    title: competition ? `Register: ${competition.name}` : "Register",
    description: competition?.summary || "Register for a LockInTalks competition."
  };
}

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ debug?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { competition } = await getLiveCompetitionBySlug(slug);
  if (!competition) notFound();
  const nextPath = `/register/${competition.slug}`;
  const debugEnabled = Array.isArray(query.debug) ? query.debug.includes("1") : query.debug === "1";
  let session: Awaited<ReturnType<typeof getServerAuthSession>>;

  try {
    session = await getServerAuthSession();
  } catch (error) {
    if (error instanceof AppSessionConfigError) {
      console.error(`[LockInTalks registration page] ${error.message}`);
      session = { authenticated: false, source: null, user: null, role: null, redirectTo: "/login" };
    } else {
      throw error;
    }
  }
  const isLoggedIn = session.authenticated;

  if (!isLoggedIn) {
    return <LoginRequired competitionName={competition.name} nextPath={nextPath} />;
  }

  return (
    <MotionShell className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <PosterBackdrop compact />
      <div className="relative z-10 mx-auto max-w-4xl">
        <RegisterForm competition={competition} debug={debugEnabled} authenticated={isLoggedIn} />
      </div>
    </MotionShell>
  );
}

function LoginRequired({ competitionName, nextPath }: { competitionName: string; nextPath: string }) {
  return (
    <MotionShell className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <PosterBackdrop compact />
      <div className="relative z-10 mx-auto max-w-3xl">
      <Card className="text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Registration</p>
        <h1 className="text-3xl font-black sm:text-5xl">Please Log In or Create an Account Before Registering for a Competition.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65">
          To register for {competitionName}, LockInTalks needs a secure account so your competition entry, payment status, and dashboard details stay connected to you.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/login?next=${encodeURIComponent(nextPath)}`} className="gap-2"><LogIn size={18} /> Login</ButtonLink>
          <ButtonLink href={`/signup?next=${encodeURIComponent(nextPath)}`} variant="glass" className="gap-2"><UserPlus size={18} /> Create Account</ButtonLink>
        </div>
      </Card>
      </div>
    </MotionShell>
  );
}
