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
      intro="These terms explain the basic rules for using LockInTalks, registering for online speaking competitions, making payments when enabled, and participating in beta events."
      sections={[
        {
          title: "What LockInTalks Provides",
          body: "LockInTalks is an online public speaking competition platform for kids and teenagers. The platform helps young speakers register for events, participate online, build confidence, receive recognition where offered, and compete in a structured speaking environment."
        },
        {
          title: "Who Can Use LockInTalks",
          body: [
            "Competitions are designed for young participants, including kids and teenagers.",
            "Participants below 18 should use LockInTalks with parent or guardian permission and guidance.",
            "Parents or guardians are responsible for making sure the participant can safely join an online event.",
            "LockInTalks may refuse or remove registrations that appear unsafe, inaccurate, abusive, or outside the intended competition rules."
          ]
        },
        {
          title: "Accurate Information",
          body: "Users must provide accurate account, student, age, city, country, guardian, and payment information. Accurate details help LockInTalks keep age categories fair, contact guardians when needed, and support payment or registration questions."
        },
        {
          title: "Competition Participation Rules",
          body: [
            "Each competition may have its own topic, age group, schedule, rules, judging criteria, and reward details.",
            "Participants should prepare their own speeches and follow the timing, topic, and format shown on the competition page.",
            "Live online rounds may require a working camera, microphone, internet connection, and a quiet environment where possible.",
            "Participants must use respectful language and avoid offensive, unsafe, hateful, harassing, or inappropriate content.",
            "Judges' and organizers' decisions are final for beta events unless a clear administrative or technical mistake is confirmed."
          ]
        },
        {
          title: "Registration and Payments",
          body: [
            "Entry fees are shown on competition pages before payment.",
            "Payments are processed through Razorpay Checkout when payments are enabled.",
            "A registration is treated as paid or confirmed only after server-side verification.",
            "Failed, cancelled, pending, refunded, or unverified payments do not confirm a paid seat.",
            "Refunds and cancellation requests are handled under the Cancellation and Refund Policy."
          ]
        },
        {
          title: "Prizes, Certificates, and LockIn Points",
          body: [
            "Cash rewards, Amazon gift cards, certificates, feedback, or other recognition may be offered only where clearly stated for a competition.",
            "Prize pool values must be based on verified paid registrations where prize pool logic is enabled.",
            "LockIn Points are not cash, not withdrawable, not transferable, and only usable as LockInTalks discounts where enabled.",
            "LockIn Points may be reversed for refunded, cancelled, failed, or invalid registrations.",
            "Certificates, feedback, results, and event communication may be provided digitally."
          ]
        },
        {
          title: "Changes, Rescheduling, and Cancellation",
          body: "LockInTalks may cancel, reschedule, modify, or pause a competition if needed for safety, fairness, technical issues, low participation, judge availability, or operational reasons. Eligible participants will be informed about next steps, which may include a new date, credit, or refund review."
        },
        {
          title: "Privacy and Data",
          body: "User and registration data is handled according to the LockInTalks Privacy Policy. Private student, guardian, registration, and payment reference details should not be publicly exposed."
        },
        {
          title: "Limitation of Liability",
          body: "LockInTalks will try to run events fairly and professionally, but online services can be affected by internet issues, device problems, third-party service outages, payment gateway delays, or other events outside direct control. LockInTalks is not responsible for losses beyond the amount paid for the affected registration, unless required differently by applicable law."
        },
        {
          title: "Business Details To Be Confirmed",
          body: [
            "Legal Entity: [Legal Entity Name To Be Added]",
            "Registered Address: [Registered Business Address To Be Added]",
            "Phone: [Phone Number To Be Added If Needed]",
            "GST: [GST Details To Be Added If Applicable]"
          ]
        }
      ]}
    />
  );
}
