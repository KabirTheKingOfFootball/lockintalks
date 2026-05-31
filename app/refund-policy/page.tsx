import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy",
  description: "Cancellation and refund information for LockInTalks online competition registrations."
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Refunds"
      title="Cancellation and Refund Policy"
      intro="This policy explains how cancellation and refund requests are handled during the LockInTalks beta launch."
      sections={[
        {
          title: "Cancellation Requests",
          body: "To request cancellation, email lockintalks@gmail.com with the participant name, account email, competition name, and payment details. Requests should be sent as early as possible before the competition begins."
        },
        {
          title: "Refund Eligibility",
          body: [
            "If payment was deducted but registration was not confirmed, LockInTalks will review and help resolve the issue.",
            "If LockInTalks cancels an event, eligible paid participants will be contacted about next steps, rescheduling, credits, or refund handling.",
            "If a participant cannot attend after the event has started, a refund may not be available because the digital competition service has already begun.",
            "Refund decisions may depend on competition timing, payment status, event costs, and whether the participant has already joined or received event access."
          ]
        },
        {
          title: "Processing Time",
          body: "Approved refunds will be processed through the original payment method when possible. Bank or gateway timelines may vary after LockInTalks initiates the refund."
        },
        {
          title: "Failed or Cancelled Payments",
          body: "Failed, cancelled, or unverified payments do not confirm a competition seat. If money is deducted but the dashboard still shows pending or failed, contact support before paying again."
        }
      ]}
    />
  );
}
