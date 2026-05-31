import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for using LockInTalks online public speaking competitions."
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms and Conditions"
      intro="These terms explain the basic rules for using LockInTalks, registering for online speaking competitions, and participating in beta events."
      sections={[
        {
          title: "Platform Use",
          body: "LockInTalks provides online public speaking competition experiences for students, parents, and guardians. Users should provide accurate registration information, use respectful language, and follow each competition's published rules."
        },
        {
          title: "Student and Guardian Responsibility",
          body: [
            "Students should participate with parent or guardian awareness and guidance.",
            "A valid guardian email is required so LockInTalks can send important event, age verification, and support messages.",
            "Participants must join age-appropriate competitions and may be asked to provide age proof before participation."
          ]
        },
        {
          title: "Competition Rules and Results",
          body: "Each competition may have its own rules, judging criteria, schedule, and prize details. LockInTalks may update event details when required for safety, fairness, technical issues, or operational reasons. Judge or organizer decisions are final for beta events unless a clear administrative mistake is found."
        },
        {
          title: "Payments",
          body: "Entry fees are shown on competition pages before payment. Payments are handled through Razorpay Checkout. A registration is treated as confirmed only after server-side payment verification."
        },
        {
          title: "Acceptable Conduct",
          body: "Participants must avoid offensive, unsafe, hateful, or inappropriate content. LockInTalks may remove or reject entries that break event rules, harm other participants, or create an unsafe learning environment."
        }
      ]}
    />
  );
}
