import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { MotionShell } from "@/components/motion-shell";
import { getLiveCompetitionBySlug, getLiveCompetitions } from "@/lib/competitions";

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

  return (
    <MotionShell className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <RegisterForm competition={competition} />
    </MotionShell>
  );
}
