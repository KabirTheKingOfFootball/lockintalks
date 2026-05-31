import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MotionShell } from "@/components/motion-shell";

type PolicySection = {
  title: string;
  body: string | string[];
};

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <MotionShell className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">{eyebrow}</p>
      <h1 className="text-4xl font-black sm:text-6xl">{title}</h1>
      <p className="mt-5 text-sm leading-7 text-white/68">{intro}</p>
      <p className="mt-4 text-xs leading-6 text-white/45">
        Last Updated: May 31, 2026. These pages are written for beta launch clarity and Razorpay review. They should be reviewed by an adult/legal advisor before wider public launch.
      </p>
      <div className="mt-8 grid gap-5">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-2xl font-black">{section.title}</h2>
            {Array.isArray(section.body) ? (
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-white/65">
                {section.body.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-white/65">{section.body}</p>
            )}
          </Card>
        ))}
      </div>
      <Card className="mt-8">
        <h2 className="text-2xl font-black">Need Help?</h2>
        <p className="mt-4 text-sm leading-7 text-white/65">
          For support, payment questions, cancellation requests, or competition help, contact{" "}
          <Link className="font-bold text-[#d4af37]" href="mailto:lockintalks@gmail.com">
            lockintalks@gmail.com
          </Link>
          .
        </p>
      </Card>
    </MotionShell>
  );
}
