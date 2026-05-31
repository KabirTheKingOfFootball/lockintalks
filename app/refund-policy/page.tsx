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
      intro="This policy explains how cancellation and refund requests are handled for LockInTalks digital competition registrations during the beta launch."
      sections={[
        {
          title: "Cancellation Requests",
          body: "To request cancellation, email lockintalks@gmail.com with the participant name, account email, competition name, and payment details. Requests should be sent as early as possible before the competition begins."
        },
        {
          title: "Refund Eligibility",
          body: [
            "Duplicate payments for the same registration may be reviewed for refund.",
            "If payment was deducted but registration was not confirmed, LockInTalks will review and help resolve the issue.",
            "If LockInTalks cancels an event, eligible paid participants will be contacted about next steps, rescheduling, credits, or refund handling.",
            "If a platform-side technical issue prevents participation, refund or credit eligibility may be reviewed based on available records.",
            "Refund decisions may depend on competition timing, payment status, event costs, event access, and whether the participant has already joined or received the digital service."
          ]
        },
        {
          title: "Non-Refundable or Limited-Refund Cases",
          body: [
            "A participant does not attend after a successful registration.",
            "A participant joins late or misses the scheduled online round.",
            "A participant violates competition rules or is removed for unsafe, abusive, or inappropriate conduct.",
            "A participant changes their mind close to event time after registration is confirmed.",
            "Wrong or incomplete information was submitted by the user and prevents smooth participation."
          ]
        },
        {
          title: "Rescheduled Competitions",
          body: [
            "If a competition is rescheduled, eligible participants may be moved to the new date.",
            "If the new date does not work for the participant, LockInTalks may review the case for refund, credit, or another reasonable option.",
            "Reschedule communication may be sent through the account email or guardian email."
          ]
        },
        {
          title: "Processing Time",
          body: "Approved refunds will be processed to the original payment method where possible. Processing time: [Refund timeline to be confirmed based on Razorpay/bank timelines]. Bank or gateway timelines may vary after LockInTalks initiates the refund."
        },
        {
          title: "Failed or Cancelled Payments",
          body: "Failed, cancelled, or unverified payments do not confirm a competition seat. If money is deducted but the dashboard still shows pending or failed, contact support before paying again."
        },
        {
          title: "LockIn Points",
          body: [
            "LockIn Points from refunded, cancelled, failed, duplicate, or invalid registrations may be reversed.",
            "LockIn Points are not cash, cannot be withdrawn, and cannot be transferred to another person or platform.",
            "Points may only be used as discounts on LockInTalks where enabled."
          ]
        }
      ]}
    />
  );
}
