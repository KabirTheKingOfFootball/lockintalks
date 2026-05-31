import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Digital Service and No Physical Shipping Policy",
  description: "LockInTalks provides online competition services and does not ship physical products."
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Digital Service"
      title="Digital Service and No Physical Shipping Policy"
      intro="LockInTalks is an online competition platform. Registrations provide access to digital participation and related online services, not physical goods."
      sections={[
        {
          title: "No Physical Shipping",
          body: [
            "LockInTalks does not ship physical products for standard competition registrations.",
            "No shipping address is required for online competition participation.",
            "No shipping charges apply unless a future physical item is clearly announced before payment."
          ]
        },
        {
          title: "Digital Delivery",
          body: [
            "Competitions happen online through digital communication and online event access.",
            "Competition details, schedule updates, age verification requests, certificates, feedback, results, and support messages may be delivered through the website, dashboard, or email.",
            "Participants should use a valid guardian email during registration.",
            "Dashboard updates may show registration status, payment status, event details, certificates, feedback, and reward information where available."
          ]
        },
        {
          title: "Event Access",
          body: "Online competition access details are shared after registration and payment verification. If access details are missing close to an event, contact lockintalks@gmail.com."
        },
        {
          title: "Support",
          body: "For digital delivery, event access, certificate, or competition communication questions, contact lockintalks@gmail.com."
        }
      ]}
    />
  );
}
