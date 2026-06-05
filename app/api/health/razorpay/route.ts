import { NextResponse, type NextRequest } from "next/server";
import { getRazorpayEnvStatus } from "@/lib/razorpay/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function GET(request: NextRequest) {
  const status = getRazorpayEnvStatus();

  return NextResponse.json(
    {
      ok: status.checkoutReady && status.webhookReady,
      checkoutReady: status.checkoutReady,
      webhookReady: status.webhookReady,
      env: {
        keyIdConfigured: status.keyIdConfigured,
        keySecretConfigured: status.keySecretConfigured,
        webhookSecretConfigured: status.webhookSecretConfigured,
        keyMode: status.keyMode
      },
      setup: {
        webhookUrl: `${request.nextUrl.origin}/api/payments/webhook`,
        recommendedEvents: ["payment.captured", "payment.failed", "refund.created", "refund.processed", "refund.failed"],
        reminder: "Do not paste secret values into chats, screenshots, commits, or client-side code."
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
