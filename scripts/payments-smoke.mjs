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
const registrationReference = require(path.resolve("lib/payment/registration-reference.ts"));
const paymentAmounts = require(path.resolve("lib/payment/amounts.ts"));
const rewardsFeature = require(path.resolve("lib/rewards/feature.ts"));
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
expectEqual(paymentAmounts.formatPaiseAsInr(19900), "INR 199", "Shared payment amount display formats 19900 paise as INR 199.");

const corruptedLaunchAmount = paymentAmounts.resolvePayableAmountPaise({
  registration: { payment_amount: 8, amount_due: 800, payment_status: "pending", payment_currency: "INR" },
  competition: { fee_amount: 800 },
  competitionSlug: "story-talks"
});
expectEqual(corruptedLaunchAmount.amountPaise, 19900, "Corrupted launch amounts like 8/800 repair to INR 199.");
expectEqual(corruptedLaunchAmount.source, "launch_fallback", "Corrupted launch amount uses launch fallback source.");
expectEqual(corruptedLaunchAmount.shouldRepairRegistration, true, "Corrupted unpaid registration amount is marked for repair.");

const validRegistrationPaymentAmount = paymentAmounts.resolvePayableAmountPaise({
  registration: { payment_amount: 19900, amount_due: 800, payment_status: "pending", payment_currency: "INR" },
  competition: { fee_amount: 800 },
  competitionSlug: "story-talks"
});
expectEqual(validRegistrationPaymentAmount.amountPaise, 19900, "Registration payment_amount wins when it is valid.");
expectEqual(validRegistrationPaymentAmount.source, "registration_payment_amount", "Resolver prefers valid registration payment_amount.");

const validRegistrationDueAmount = paymentAmounts.resolvePayableAmountPaise({
  registration: { payment_amount: 8, amount_due: 19900, payment_status: "failed", payment_currency: "INR" },
  competition: { fee_amount: 800 },
  competitionSlug: "idol-talk"
});
expectEqual(validRegistrationDueAmount.amountPaise, 19900, "Registration amount_due wins when payment_amount is corrupted.");
expectEqual(validRegistrationDueAmount.source, "registration_amount_due", "Resolver falls through to valid registration amount_due.");

const validDifferentCompetitionAmount = paymentAmounts.resolvePayableAmountPaise({
  competition: { fee_amount: 24900 },
  competitionSlug: "power-talk"
});
expectEqual(validDifferentCompetitionAmount.amountPaise, 24900, "A clearly valid explicit launch competition amount can override fallback.");
expectEqual(validDifferentCompetitionAmount.source, "competition_fee_amount", "Resolver uses valid competition fee_amount when present.");
expectEqual(Boolean(paymentAmounts.getRegistrationAmountRepairPatch(corruptedLaunchAmount, "pending")), true, "Unpaid corrupted registration gets a repair patch.");
expectEqual(paymentAmounts.getRegistrationAmountRepairPatch(corruptedLaunchAmount, "captured"), null, "Captured registrations are not repaired automatically.");
expectEqual(rewardsFeature.areLockInPointsEnabled(), false, "LockIn Points feature is disabled by default, so checkout discounts stay off.");

const envStatus = razorpayEnv.getRazorpayEnvStatus();
expectEqual(envStatus.checkoutReady, true, "Razorpay checkout env status detects configured test keys.");
expectEqual(envStatus.webhookReady, true, "Razorpay webhook env status detects configured webhook secret.");
expectEqual(envStatus.keyMode, "test", "Razorpay smoke key mode is test.");
expectEqual(
  registrationReference.buildPaymentUrl({ registrationId: "reg_123", competitionSlug: "story-talks" }),
  "/payment?registration=reg_123&competition=story-talks",
  "Registration redirect uses exact registration id as the primary payment reference."
);
expectEqual(
  registrationReference.getPaymentRegistrationReference({ registration: "reg_123", registrationId: "reg_456", id: "reg_789" }),
  "reg_123",
  "Payment page prefers registration query param before aliases."
);
expectEqual(
  registrationReference.getPaymentRegistrationReference({ registrationId: "reg_456", id: "reg_789" }),
  "reg_456",
  "Payment page accepts registrationId alias."
);
expectEqual(
  registrationReference.getPaymentRegistrationReference({ id: "reg_789" }),
  "reg_789",
  "Payment page accepts id alias."
);
expectEqual(
  registrationReference.getCreateOrderRegistrationReference({ registration: "reg_123" }),
  "reg_123",
  "Create-order accepts registration id from registration field."
);

const registrationRouteSource = readFileSync("app/api/registrations/route.ts", "utf8");
const paymentPageSource = readFileSync("app/payment/page.tsx", "utf8");
const createOrderSource = readFileSync("app/api/payments/create-order/route.ts", "utf8");
const paymentFormSource = readFileSync("components/payment-form.tsx", "utf8");
const dashboardPageSource = readFileSync("app/dashboard/page.tsx", "utf8");
const dashboardSource = readFileSync("components/dashboard-client.tsx", "utf8");
const adminDiagnoseSource = readFileSync("app/api/admin/registrations/diagnose/route.ts", "utf8");
const webhookSource = readFileSync("app/api/payments/webhook/route.ts", "utf8");
const razorpayHealthSource = readFileSync("app/api/health/razorpay/route.ts", "utf8");
const liveModeChecklistSource = readFileSync("LIVE_MODE_SWITCH_CHECKLIST.md", "utf8");

expectMatch(registrationRouteSource, /payment_amount:\s*feeAmount/, "Registration creation stores the server-side fee amount.");
expectMatch(registrationRouteSource, /amount_due:\s*feeAmount/, "Registration creation stores amount_due before payment.");
expectMatch(registrationRouteSource, /resolvePayableAmountPaise/, "Registration creation resolves amount through the shared backend amount utility.");
expectMatch(registrationRouteSource, /repairRegistrationAmountIfNeeded/, "Registration creation repairs bad unpaid duplicate amount fields.");
expectMatch(registrationRouteSource, /buildPaymentUrl\(\{\s*registrationId:\s*data\.id,\s*competitionSlug:\s*competition\.slug\s*\}\)/, "New registrations return a payment URL containing the exact registration id.");
expectMatch(registrationRouteSource, /buildPaymentUrl\(\{\s*registrationId:\s*existingRegistration\.id,\s*competitionSlug:\s*competition\.slug\s*\}\)/, "Pending duplicate registrations return their existing registration id.");
expectMatch(registrationRouteSource, /redirectTo:\s*alreadyPaid\s*\?\s*"\/dashboard"\s*:\s*paymentUrl/, "Paid duplicate registrations redirect away from duplicate payment.");
expectMatch(registrationRouteSource, /row_user=\$\{data\.user_id\}/, "Registration creation logs the database row owner safely.");
expectMatch(paymentPageSource, /PaymentSearchParams/, "Payment page accepts normalized payment search params.");
expectMatch(paymentPageSource, /findPaymentRegistration/, "Payment page reuses pending registrations by id or competition slug.");
expectMatch(paymentPageSource, /resolvePayableAmountPaise/, "Payment page displays the shared backend resolved amount.");
expectMatch(paymentPageSource, /repairRegistrationAmountIfNeeded/, "Payment page repairs unpaid bad amount rows.");
expectMatch(paymentPageSource, /getPaymentRegistrationReference/, "Payment page reads registration, registrationId, and id aliases.");
expectMatch(paymentPageSource, /if \(trimmedRegistrationId\)[\s\S]*\.eq\("id", trimmedRegistrationId\)/, "Payment page performs exact registration id lookup first.");
expectMatch(paymentPageSource, /owner_matches=\$\{ownerMatches\}/, "Payment page logs exact id owner match diagnostics.");
expectMatch(paymentPageSource, /Registration owner mismatch/, "Payment page detects exact id owner mismatch.");
expectMatch(paymentPageSource, /admin_owner_mismatch/, "Payment page has an admin-specific owner mismatch state.");
expectMatch(paymentPageSource, /This registration was created under a different account/, "Payment page explains owner mismatch without exposing another user's data.");
expectMatch(paymentPageSource, /You are logged in as an admin account/, "Payment page explains admin opening another user's registration.");
expectMatch(paymentPageSource, /feeAmount:\s*resolvedAmount\.amountPaise/, "Payment page summary uses the resolved backend amount.");
expectNotMatch(paymentPageSource, /isUuid/, "Payment page does not reject non-UUID registration references before exact lookup.");
expectNotMatch(paymentPageSource, /slugCandidates\.add\(trimmedRegistrationId\)/, "Payment page does not treat an exact registration id as a competition slug fallback.");
expectMatch(createOrderSource, /competitionSlug\?:\s*string/, "Create-order accepts a competition slug fallback.");
expectMatch(createOrderSource, /findPaymentRegistration/, "Create-order resolves registration server-side before Razorpay order creation.");
expectMatch(createOrderSource, /resolvePayableAmountPaise/, "Create-order uses shared backend amount resolver before Razorpay order creation.");
expectMatch(createOrderSource, /repairRegistrationAmountIfNeeded/, "Create-order repairs unpaid bad amount rows before creating a new order.");
expectMatch(createOrderSource, /getCreateOrderRegistrationReference/, "Create-order normalizes registration id aliases.");
expectMatch(createOrderSource, /if \(trimmedRegistrationId\)[\s\S]*\.eq\("id", trimmedRegistrationId\)/, "Create-order performs exact registration id lookup first.");
expectMatch(createOrderSource, /owner_matches=\$\{ownerMatches\}/, "Create-order logs exact id owner match diagnostics.");
expectMatch(createOrderSource, /Registration owner mismatch/, "Create-order rejects exact id owner mismatch.");
expectMatch(createOrderSource, /ownerMismatch:\s*true/, "Create-order returns a structured owner mismatch response.");
expectMatch(createOrderSource, /status:\s*403/, "Create-order rejects owner mismatch with a clear forbidden response.");
expectMatch(createOrderSource, /You are logged in as an admin account/, "Create-order returns an admin-specific mismatch message.");
expectMatch(createOrderSource, /return\s*\{\s*registration:\s*data as PaymentRegistration,\s*ownerMismatch:\s*false/, "Create-order still allows exact owner registration lookup.");
expectNotMatch(createOrderSource, /isUuid/, "Create-order does not reject non-UUID registration references before exact lookup.");
expectNotMatch(createOrderSource, /slugCandidates\.add\(trimmedRegistrationId\)/, "Create-order does not treat an exact registration id as a competition slug fallback.");
expectMatch(createOrderSource, /isSeatConfirmed\(registration\.payment_status\)/, "Create-order blocks duplicate orders for paid registrations.");
expectNotMatch(createOrderSource, /amount:\s*body\./, "Create-order does not trust a client-provided amount.");
expectNotMatch(createOrderSource, /lockInPointsToApply:\s*appliedPointsPreview/, "Create-order client no longer receives public points discounts.");
expectMatch(paymentFormSource, /competitionSlug:\s*summary\.competitionSlug/, "Checkout sends the competition slug alongside the registration id.");
expectMatch(paymentFormSource, /registration:\s*activeRegistrationId/, "Checkout sends the exact registration id using the registration field.");
expectMatch(paymentFormSource, /registrationId:\s*activeRegistrationId/, "Checkout sends the exact registration id using the registrationId field.");
expectMatch(paymentFormSource, /We could not find your registration for this account/, "Missing registration UI is friendly.");
expectMatch(paymentFormSource, /Registration Account Mismatch/, "Payment UI has a clear owner mismatch state.");
expectMatch(paymentFormSource, /You are currently logged in as/, "Payment UI shows the current account clue only.");
expectMatch(paymentFormSource, /Log in with another account/, "Payment UI offers a safe action for another-account login.");
expectMatch(paymentFormSource, /Register again for this competition/, "Payment UI offers a safe register-again action.");
expectMatch(paymentFormSource, /Contact support/, "Payment UI offers support for owner mismatch.");
expectMatch(paymentFormSource, /<form action="\/logout" method="post">/, "Another-account action keeps logout POST-only.");
expectMatch(dashboardPageSource, /\.eq\("user_id", session\.user\.id\)/, "Dashboard only loads registrations owned by the current server session user.");
expectMatch(dashboardPageSource, /export const dynamic = "force-dynamic"/, "Dashboard is dynamic so payment links are not stale cached data.");
expectMatch(dashboardSource, /Continue Payment/, "Dashboard exposes a continue-payment path for unpaid registrations.");
expectMatch(adminDiagnoseSource, /checkAdmin/, "Registration diagnostic endpoint is admin-only.");
expectMatch(adminDiagnoseSource, /serverPaymentApiCanReadRow/, "Registration diagnostic endpoint reports whether the server API can read the row.");
expectNotMatch(adminDiagnoseSource, /guardian_email|student_name|razorpay_signature/, "Registration diagnostic endpoint does not expose private participant or signature details.");
expectMatch(webhookSource, /refund\?:/, "Webhook parser understands Razorpay refund payloads.");
expectMatch(webhookSource, /refund\.processed/, "Webhook handles refund.processed as the refund-final event.");
expectMatch(webhookSource, /refund\.created/, "Webhook records refund.created without marking paid/refunded incorrectly.");
expectMatch(webhookSource, /refund\.failed/, "Webhook records refund.failed without marking paid/refunded incorrectly.");
expectNotMatch(webhookSource, /payment_order_id:\s*payment\.order_id\s*\|\|\s*null/, "Refund-only webhook updates must not overwrite an existing order id with null.");
expectMatch(webhookSource, /Duplicate event ignored/, "Webhook duplicate event id handling is preserved.");
expectMatch(razorpayHealthSource, /refund\.created/, "Razorpay health endpoint recommends refund.created.");
expectMatch(razorpayHealthSource, /refund\.processed/, "Razorpay health endpoint recommends refund.processed.");
expectMatch(razorpayHealthSource, /refund\.failed/, "Razorpay health endpoint recommends refund.failed.");
expectMatch(liveModeChecklistSource, /rzp_live_/, "Live Mode checklist documents live key switch.");
expectMatch(liveModeChecklistSource, /Rollback Plan/, "Live Mode checklist includes rollback plan.");

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

function expectNotMatch(source, pattern, label) {
  if (pattern.test(source)) {
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
