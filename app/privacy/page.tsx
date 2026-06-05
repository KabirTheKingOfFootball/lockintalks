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
      intro="LockInTalks is used by young participants, parents, and guardians, so privacy, safety, and careful data handling are important."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "Account information such as user name if provided, email address, login status, and session information.",
            "Registration details such as student name, student age, city, country or nation, selected competition, guardian name, and guardian email.",
            "Competition information such as registration status, event selected, results, certificates, feedback, and reward status where enabled.",
            "Payment reference information such as order id, payment id, amount, currency, payment status, verification status, and refund status if applicable.",
            "Support or communication information sent to LockInTalks by email, forms, or admin support workflows."
          ]
        },
        {
          title: "How Information Is Used",
          body: [
            "To create accounts, protect dashboards, and manage competition registrations.",
            "To place participants in appropriate age categories and keep competitions fair.",
            "To contact parents or guardians about registration, age verification, event updates, results, support, or refund questions.",
            "To process payments, verify payment status, prevent duplicate confirmations, and help with refund or support requests.",
            "To provide digital certificates, feedback, results, and rewards where available.",
            "To help authorized admins manage competitions and registrations safely."
          ]
        },
        {
          title: "Children and Minors",
          body: [
            "LockInTalks is designed for young participants, including kids and teenagers.",
            "Participants below 18 should use LockInTalks with parent or guardian permission and guidance.",
            "Guardian contact details may be used for important competition communication, safety questions, age verification, and support.",
            "Age proof may be requested before participation when needed to keep categories fair."
          ]
        },
        {
          title: "Payments and Razorpay",
          body: [
            "Payments are processed through Razorpay when payments are enabled.",
            "LockInTalks should not store full card numbers, UPI credentials, wallet credentials, banking passwords, or other sensitive payment credentials.",
            "Payment references and statuses may be stored for verification, dashboard status, admin review, refund support, and accounting or dispute handling."
          ]
        },
        {
          title: "Data Sharing",
          body: [
            "LockInTalks may use trusted services such as Supabase for authentication/database storage, Vercel for hosting/deployment, and Razorpay for payments.",
            "Data may be visible to authorized LockInTalks admins or support helpers only as needed to operate competitions, support users, or handle safety and payment questions.",
            "LockInTalks does not intentionally sell private student, guardian, registration, or payment reference information."
          ]
        },
        {
          title: "Security and Restricted Access",
          body: [
            "LockInTalks uses reasonable technical and operational measures to protect account, registration, and payment reference information.",
            "Private registration and payment details should not be publicly exposed.",
            "Admin tools and exports are protected and should only be used by authorized LockInTalks administrators."
          ]
        },
        {
          title: "Retention",
          body: "LockInTalks may keep competition, registration, payment, and support records as needed for operations, disputes, refund handling, legal/accounting requirements, safety review, and platform improvement."
        },
        {
          title: "Parent, Guardian, and User Rights",
          body: [
            "Parents, guardians, or users can request corrections to account or registration information.",
            "Deletion requests may be reviewed and completed where legally and operationally possible.",
            "For privacy, correction, deletion, or safety questions, contact lockintalks@gmail.com."
          ]
        },
        {
          title: "Compliance Review Note",
          body: "Because LockInTalks involves young participants, this Privacy Policy should be reviewed by an adult/legal advisor for Indian DPDP Act, children-data, payment, and platform compliance before wider public launch."
        }
      ]}
    />
  );
}
