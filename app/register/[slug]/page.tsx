import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import { MotionShell } from "@/components/motion-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLiveCompetitionBySlug, getLiveCompetitions } from "@/lib/competitions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { competitions } = await getLiveCompetitions();
  return competitions.map((competition) => ({ slug: competition.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { competition } = await getLiveCompetitionBySlug(slug);
  return {
    title: competition ? `Register: ${competition.name}` : "Register",
    description: competition?.summary || "Register for a LockInTalks competition."
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { competition } = await getLiveCompetitionBySlug(slug);
  if (!competition) notFound();
  const nextPath = `/register/${competition.slug}`;
  let isLoggedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);
  } catch (error) {
    console.error("[LockInTalks registration page] Could not confirm session:", error);
  }

  if (!isLoggedIn) {
    return <LoginRequired competitionName={competition.name} nextPath={nextPath} />;
  }

  return (
    <MotionShell className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <RegisterForm competition={competition} />
    </MotionShell>
  );
}

function LoginRequired({ competitionName, nextPath }: { competitionName: string; nextPath: string }) {
  return (
    <MotionShell className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
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
    </MotionShell>
  );
}
