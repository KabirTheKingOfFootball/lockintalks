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
      intro="LockInTalks is an online competition platform. Registrations provide access to digital competition participation, not physical goods."
      sections={[
        {
          title: "No Physical Shipping",
          body: "LockInTalks does not ship physical products for standard competition registrations. No shipping address is required for participation."
        },
        {
          title: "Digital Delivery",
          body: [
            "Competition details, schedule updates, age verification requests, and support messages may be sent by email.",
            "Participants should use a valid guardian email during registration.",
            "Dashboard updates may show registration status, payment status, event details, and certificate placeholders."
          ]
        },
        {
          title: "Event Access",
          body: "Online competition access details are shared after registration and payment verification. If access details are missing close to an event, contact lockintalks@gmail.com."
        }
      ]}
    />
  );
}
