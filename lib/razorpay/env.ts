type RazorpayEnv =
  | {
      ok: true;
      keyId: string;
      keySecret: string;
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

  return { ok: true, keyId: keyId as string, keySecret: keySecret as string };
}

export function requireRazorpayEnv() {
  const env = getRazorpayEnv();

  if (!env.ok) {
    throw new RazorpayConfigError(env.message);
  }

  return env;
}
