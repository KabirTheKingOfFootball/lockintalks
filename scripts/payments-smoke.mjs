#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import ts from "typescript";

process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||= "rzp_test_smoke_key";
process.env.RAZORPAY_KEY_SECRET ||= "smoke_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET ||= "smoke_webhook_secret";

const require = createRequire(import.meta.url);
installTsLoader();

const payments = require(path.resolve("lib/razorpay/payments.ts"));
const razorpayEnv = require(path.resolve("lib/razorpay/env.ts"));
const failures = [];

const orderId = "order_lockintalks_smoke";
const paymentId = "pay_lockintalks_smoke";
const checkoutSignature = sign(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);

expectEqual(
  payments.verifyRazorpaySignature({ orderId, paymentId, signature: checkoutSignature }),
  true,
  "Valid checkout signature verifies."
);
expectEqual(
  payments.verifyRazorpaySignature({ orderId, paymentId, signature: checkoutSignature.replace(/.$/, "0") }),
  false,
  "Tampered checkout signature is rejected."
);

const rawWebhookBody = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: 19900, currency: "INR", status: "captured" } } }
});
const webhookSignature = sign(process.env.RAZORPAY_WEBHOOK_SECRET, rawWebhookBody);

expectEqual(payments.verifyRazorpayWebhookSignature(rawWebhookBody, webhookSignature), true, "Valid webhook signature verifies.");
expectEqual(payments.verifyRazorpayWebhookSignature(rawWebhookBody, webhookSignature.replace(/.$/, "0")), false, "Tampered webhook signature is rejected.");
expectEqual(payments.formatAmount(19900), "INR 199", "Payment amounts display as INR.");

const envStatus = razorpayEnv.getRazorpayEnvStatus();
expectEqual(envStatus.checkoutReady, true, "Razorpay checkout env status detects configured test keys.");
expectEqual(envStatus.webhookReady, true, "Razorpay webhook env status detects configured webhook secret.");
expectEqual(envStatus.keyMode, "test", "Razorpay smoke key mode is test.");

const registrationRouteSource = readFileSync("app/api/registrations/route.ts", "utf8");
const paymentPageSource = readFileSync("app/payment/page.tsx", "utf8");
const createOrderSource = readFileSync("app/api/payments/create-order/route.ts", "utf8");
const paymentFormSource = readFileSync("components/payment-form.tsx", "utf8");
const dashboardSource = readFileSync("components/dashboard-client.tsx", "utf8");

expectMatch(registrationRouteSource, /payment_amount:\s*feeAmount/, "Registration creation stores the server-side fee amount.");
expectMatch(registrationRouteSource, /amount_due:\s*feeAmount/, "Registration creation stores amount_due before payment.");
expectMatch(paymentPageSource, /competition\?:\s*string/, "Payment page accepts competition slug query params.");
expectMatch(paymentPageSource, /findPaymentRegistration/, "Payment page reuses pending registrations by id or competition slug.");
expectMatch(createOrderSource, /competitionSlug\?:\s*string/, "Create-order accepts a competition slug fallback.");
expectMatch(createOrderSource, /findPaymentRegistration/, "Create-order resolves registration server-side before Razorpay order creation.");
expectMatch(paymentFormSource, /competitionSlug:\s*summary\.competitionSlug/, "Checkout sends the competition slug alongside the registration id.");
expectMatch(paymentFormSource, /We could not find your registration for this account/, "Missing registration UI is friendly.");
expectMatch(dashboardSource, /Continue Payment/, "Dashboard exposes a continue-payment path for unpaid registrations.");

if (failures.length > 0) {
  console.error("\n[payments-smoke] Failed checks:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[payments-smoke] Passed.");

function sign(secret, value) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(`${label} Expected ${expected}, received ${actual}.`);
  }
}

function expectMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    failures.push(label);
  }
}

function installTsLoader() {
  const originalResolve = Module._resolveFilename;

  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const withoutAlias = path.resolve(process.cwd(), request.slice(2));
      for (const extension of [".ts", ".tsx", ".js", ".mjs"]) {
        if (existsSync(`${withoutAlias}${extension}`)) return `${withoutAlias}${extension}`;
      }
      return withoutAlias;
    }

    return originalResolve.call(this, request, parent, isMain, options);
  };

  require.extensions[".ts"] = function compileTs(module, filename) {
    const source = readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020
      }
    }).outputText;
    module._compile(output, filename);
  };
}
