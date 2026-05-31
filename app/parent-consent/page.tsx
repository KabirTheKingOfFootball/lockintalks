import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Parent and Guardian Consent",
  description: "Parent and guardian consent guidance for LockInTalks young participant competitions."
};

export default function ParentConsentPage() {
  return (
    <PolicyPage
      eyebrow="Parent Guidance"
      title="Parent and Guardian Consent"
      intro="LockInTalks is designed for young participants. This page explains how parents and guardians should support safe, fair, and age-appropriate participation."
      sections={[
        {
          title: "Permission for Young Participants",
          body: [
            "Participants below 18 should have parent or guardian permission before creating an account, registering, paying, or joining a competition.",
            "A parent or guardian should review the competition topic, entry fee, date, time, rules, and payment details before registration.",
            "Parents or guardians should help younger participants understand online event expectations."
          ]
        },
        {
          title: "Guardian Contact Details",
          body: [
            "LockInTalks may collect guardian name and guardian email during registration.",
            "Guardian contact details may be used for age verification, event updates, payment or refund questions, results, certificates, feedback, and safety concerns.",
            "Please enter a valid guardian email so important competition communication is not missed."
          ]
        },
        {
          title: "Age Verification",
          body: [
            "Age proof may be requested before participation to keep competition categories fair.",
            "Requests may be sent by email before an event begins.",
            "If parents or guardians have questions about age proof, they should contact lockintalks@gmail.com before sending documents."
          ]
        },
        {
          title: "Online Safety",
          body: [
            "Parents or guardians should make sure the participant can safely use a device, microphone, camera, and internet connection if required.",
            "Participants should join from a safe and appropriate environment.",
            "LockInTalks may remove or reject unsafe, abusive, or inappropriate behavior to protect the competition environment."
          ]
        },
        {
          title: "Questions, Corrections, or Deletion Requests",
          body: "Parents or guardians can contact lockintalks@gmail.com for questions, correction requests, deletion requests where possible, registration help, payment support, or minor-related concerns."
        },
        {
          title: "Review Note",
          body: "This parent and guardian consent wording is a launch-ready draft and must be reviewed by an adult/legal advisor before wider public launch."
        }
      ]}
    />
  );
}
