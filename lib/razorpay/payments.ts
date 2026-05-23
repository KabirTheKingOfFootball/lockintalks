import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requireRazorpayEnv, requireRazorpayWebhookSecret } from "@/lib/razorpay/env";

export const paymentCurrency = "INR";

export type RazorpayPayment = {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  captured?: boolean;
  method?: string;
  error_description?: string;
};

export function formatAmount(amountPaise: number) {
  return `Rs. ${(amountPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function createRazorpayClient() {
  const { keyId, keySecret } = requireRazorpayEnv();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

export function getPublicRazorpayKey() {
  return requireRazorpayEnv().keyId;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = requireRazorpayEnv();
  const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (expectedSignature.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = requireRazorpayWebhookSecret();
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (expectedSignature.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export async function fetchRazorpayPayment(paymentId: string) {
  const razorpay = createRazorpayClient();
  return (await razorpay.payments.fetch(paymentId)) as RazorpayPayment;
}

export function isRazorpayPaymentCaptured(payment: RazorpayPayment) {
  return payment.status === "captured" || payment.captured === true;
}
