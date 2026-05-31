type RazorpayEnv =
  | {
      ok: true;
      keyId: string;
      keySecret: string;
      webhookSecret: string | null;
    }
  | {
      ok: false;
      message: string;
      missing: string[];
    };

export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayConfigError";
  }
}

export function getRazorpayEnv(): RazorpayEnv {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || null;
  const missing = [];

  if (!keyId) missing.push("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  if (!keySecret) missing.push("RAZORPAY_KEY_SECRET");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      message: `Missing Razorpay environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Add them in Vercel Project Settings > Environment Variables.`
    };
  }

  return { ok: true, keyId: keyId as string, keySecret: keySecret as string, webhookSecret };
}

export function getRazorpayEnvStatus() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  return {
    checkoutReady: Boolean(keyId && keySecret),
    webhookReady: Boolean(webhookSecret),
    keyIdConfigured: Boolean(keyId),
    keySecretConfigured: Boolean(keySecret),
    webhookSecretConfigured: Boolean(webhookSecret),
    keyMode: keyId.startsWith("rzp_test_") ? "test" : keyId.startsWith("rzp_live_") ? "live" : keyId ? "unknown" : "missing"
  };
}

export function requireRazorpayEnv() {
  const env = getRazorpayEnv();

  if (!env.ok) {
    throw new RazorpayConfigError(env.message);
  }

  return env;
}

export function requireRazorpayWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new RazorpayConfigError("Missing RAZORPAY_WEBHOOK_SECRET. Add the webhook secret from Razorpay Dashboard before enabling payment webhooks.");
  }

  return secret;
}
