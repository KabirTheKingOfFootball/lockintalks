import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requireRazorpayEnv } from "@/lib/razorpay/env";

export const paymentCurrency = "INR";

export function formatAmount(amountPaise: number) {
  return `₹${(amountPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
