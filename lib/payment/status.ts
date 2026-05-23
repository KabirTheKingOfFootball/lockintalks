export const paymentStatuses = [
  "pending",
  "order_created",
  "payment_created",
  "signature_verified",
  "captured",
  "paid",
  "failed",
  "cancelled",
  "refunded"
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export const registrationStatuses = ["submitted", "payment_pending", "paid", "under_review", "accepted", "rejected", "withdrawn"] as const;
export type RegistrationStatus = (typeof registrationStatuses)[number];

export const ageProofStatuses = ["not_required_yet", "requested", "submitted", "approved", "rejected"] as const;
export type AgeProofStatus = (typeof ageProofStatuses)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus);
}

export function isSeatConfirmed(status: string | null | undefined) {
  return status === "captured" || status === "paid";
}

export function isPaymentInProgress(status: string | null | undefined) {
  return status === "order_created" || status === "payment_created" || status === "signature_verified";
}

export function paymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "order_created":
    case "payment_created":
      return "Order Created";
    case "signature_verified":
      return "Payment Verifying";
    case "captured":
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
}
