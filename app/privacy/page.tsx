import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LockInTalks handles account, registration, payment, and guardian contact information."
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="LockInTalks is used by students, parents, and guardians, so privacy and careful data handling are important."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "Account information such as email address and login session details.",
            "Registration details such as student name, age, city, country or nation, competition selected, guardian name, and guardian email.",
            "Payment status information such as order id, payment id, amount, currency, and verification status. Full card, UPI, wallet, or bank details are handled by Razorpay and are not stored by LockInTalks."
          ]
        },
        {
          title: "How Information Is Used",
          body: [
            "To create accounts, protect dashboards, and manage competition registrations.",
            "To verify payment status and show the correct registration state.",
            "To contact guardians about age verification, event updates, results, support, or refund questions.",
            "To help admins manage competitions and registrations safely."
          ]
        },
        {
          title: "Student Safety",
          body: "LockInTalks does not intentionally make private student registration details public. Admin tools and exports are protected and should only be used by authorized LockInTalks administrators."
        },
        {
          title: "Data Sharing",
          body: "LockInTalks may use trusted services such as Supabase for authentication/database storage, Vercel for hosting, and Razorpay for payments. Data is shared only as needed to operate the platform."
        },
        {
          title: "Support and Correction Requests",
          body: "Parents or guardians can contact lockintalks@gmail.com to ask questions, request corrections, or request help with account or registration information."
        }
      ]}
    />
  );
}
