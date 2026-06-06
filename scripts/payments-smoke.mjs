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
const checkoutRequest = require(path.resolve("lib/registration/checkout-request.ts"));
const mutationError = require(path.resolve("lib/registration/supabase-mutation-error.ts"));
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
  registration: { payment_amount: 19899, amount_due: 19899, payment_status: "pending", payment_currency: "INR" },
  competition: { fee_amount: 800 },
  competitionSlug: "story-talks"
});
expectEqual(validRegistrationPaymentAmount.amountPaise, 19900, "Launch checkout repairs stale 19899 registration amounts to INR 199.");
expectEqual(validRegistrationPaymentAmount.source, "launch_fallback", "Launch competition defaults override stale registration amounts.");

const validRegistrationDueAmount = paymentAmounts.resolvePayableAmountPaise({
  registration: { payment_amount: 8, amount_due: 19899, payment_status: "failed", payment_currency: "INR" },
  competition: { fee_amount: 800 },
  competitionSlug: "idol-talk"
});
expectEqual(validRegistrationDueAmount.amountPaise, 19900, "Launch checkout repairs stale 19899 amount_due values to INR 199.");
expectEqual(validRegistrationDueAmount.source, "launch_fallback", "Launch competition defaults override stale amount_due values.");

const validDifferentCompetitionAmount = paymentAmounts.resolvePayableAmountPaise({
  competition: { fee_amount: 24900 },
  competitionSlug: "power-talk"
});
expectEqual(validDifferentCompetitionAmount.amountPaise, 19900, "Power Talk launch checkout always resolves to INR 199.");
expectEqual(validDifferentCompetitionAmount.source, "launch_fallback", "Power Talk launch default overrides Supabase fee_amount drift.");
expectEqual(Boolean(paymentAmounts.getRegistrationAmountRepairPatch(corruptedLaunchAmount, "pending")), true, "Unpaid corrupted registration gets a repair patch.");
expectEqual(paymentAmounts.getRegistrationAmountRepairPatch(corruptedLaunchAmount, "captured"), null, "Captured registrations are not repaired automatically.");
expectEqual(rewardsFeature.areLockInPointsEnabled(), false, "LockIn Points feature is disabled by default, so checkout discounts stay off.");

const camelCaseCheckoutRequest = checkoutRequest.normalizeCreateCheckoutRequest({
  competitionSlug: "idol-talk",
  studentName: "Smoke Student",
  studentAge: 12,
  guardianName: "Smoke Guardian",
  guardianEmail: "smoke@example.com",
  city: "Mumbai",
  country: "India"
});
expectEqual(camelCaseCheckoutRequest.ok, true, "Current register form camelCase checkout payload is accepted.");
if (camelCaseCheckoutRequest.ok) {
  expectEqual(camelCaseCheckoutRequest.values.competitionSlug, "idol-talk", "CamelCase checkout payload normalizes the idol-talk slug.");
  expectEqual(camelCaseCheckoutRequest.values.studentAge, 12, "CamelCase checkout payload normalizes numeric age.");
}

const snakeCaseCheckoutRequest = checkoutRequest.normalizeCreateCheckoutRequest({
  competition_slug: "story-talks",
  student_name: "Smoke Student",
  student_age: "13",
  guardian_name: "Smoke Guardian",
  guardian_email: "smoke@example.com",
  city: "Delhi",
  country: "India"
});
expectEqual(snakeCaseCheckoutRequest.ok, true, "Snake_case checkout payload is accepted.");
if (snakeCaseCheckoutRequest.ok) {
  expectEqual(snakeCaseCheckoutRequest.values.competitionSlug, "story-talks", "Snake_case checkout payload normalizes the story-talks slug.");
  expectEqual(snakeCaseCheckoutRequest.values.studentAge, 13, "Snake_case checkout payload normalizes string age.");
}

const aliasCheckoutRequest = checkoutRequest.normalizeCreateCheckoutRequest({
  slug: "power-talk",
  student: "Smoke Student",
  age: "14",
  parentName: "Smoke Parent",
  parentEmail: "smoke@example.com",
  city: "Bengaluru",
  nation: "India"
});
expectEqual(aliasCheckoutRequest.ok, true, "Common parent/student alias checkout payload is accepted.");
if (aliasCheckoutRequest.ok) {
  expectEqual(aliasCheckoutRequest.values.competitionSlug, "power-talk", "Alias checkout payload normalizes the power-talk slug.");
}

expectDetailsCode(
  checkoutRequest.normalizeCreateCheckoutRequest({
    competitionSlug: "idol-talk",
    studentAge: 12,
    guardianName: "Smoke Guardian",
    guardianEmail: "smoke@example.com",
    city: "Mumbai",
    country: "India"
  }),
  "MISSING_STUDENT_NAME",
  "Missing student name returns a specific checkout details code."
);
expectDetailsCode(
  checkoutRequest.normalizeCreateCheckoutRequest({
    competitionSlug: "idol-talk",
    studentName: "Smoke Student",
    studentAge: 4,
    guardianName: "Smoke Guardian",
    guardianEmail: "smoke@example.com",
    city: "Mumbai",
    country: "India"
  }),
  "INVALID_STUDENT_AGE",
  "Invalid student age returns a specific checkout details code."
);
expectDetailsCode(
  checkoutRequest.normalizeCreateCheckoutRequest({
    competitionSlug: "../bad",
    studentName: "Smoke Student",
    studentAge: 12,
    guardianName: "Smoke Guardian",
    guardianEmail: "smoke@example.com",
    city: "Mumbai",
    country: "India"
  }),
  "INVALID_COMPETITION_SLUG",
  "Bad competition slug returns a specific checkout details code."
);

expectEqual(
  mutationError.classifySupabaseMutationError({ code: "42501", message: "new row violates row-level security policy for table registrations" }).detailsCode,
  "INSERT_RLS_BLOCKED",
  "RLS blocked insert maps to INSERT_RLS_BLOCKED."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "23502", message: "null value in column student_name violates not-null constraint" }).detailsCode,
  "INSERT_MISSING_REQUIRED_COLUMN",
  "Missing required column insert maps to INSERT_MISSING_REQUIRED_COLUMN."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "PGRST204", message: "Could not find the 'age_proof_status' column of 'registrations' in the schema cache" }).detailsCode,
  "INSERT_UNKNOWN_COLUMN",
  "Unknown schema column maps to INSERT_UNKNOWN_COLUMN."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "23514", message: "new row for relation registrations violates check constraint registrations_payment_status_check" }).detailsCode,
  "INSERT_CHECK_CONSTRAINT_FAILED",
  "Bad status/check constraint maps to INSERT_CHECK_CONSTRAINT_FAILED."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "23503", message: "insert or update on table registrations violates foreign key constraint registrations_user_id_fkey" }).detailsCode,
  "INSERT_FOREIGN_KEY_FAILED",
  "Foreign-key failure maps to INSERT_FOREIGN_KEY_FAILED."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "23505", message: "duplicate key value violates unique constraint" }).detailsCode,
  "INSERT_DUPLICATE_CONSTRAINT",
  "Duplicate constraint maps to INSERT_DUPLICATE_CONSTRAINT."
);
expectEqual(
  mutationError.classifySupabaseMutationError({ code: "22P02", message: "invalid input syntax for type integer" }).detailsCode,
  "INSERT_TYPE_MISMATCH",
  "Type mismatch maps to INSERT_TYPE_MISMATCH."
);
expectEqual(
  mutationError.classifySupabaseMutationError({
    code: "23514",
    message: "new row violates check constraint",
    details: "Failing row contains (7b902893-30e1-4e03-bfcd-b6922cdc6ec6, kid@example.com, Secret Student)."
  }).supabaseError.details.includes("kid@example.com"),
  false,
  "Supabase insert error details redact private row/email values."
);
expectEqual(
  mutationError.shouldRetryWithLegacyRegistrationPayload("INSERT_UNKNOWN_COLUMN"),
  true,
  "Unknown optional columns retry with the legacy-safe registration payload."
);
expectEqual(
  mutationError.shouldRetryWithLegacyRegistrationPayload("INSERT_RLS_BLOCKED"),
  false,
  "RLS failures do not retry with a legacy payload."
);

for (const slug of ["story-talks", "idol-talk", "power-talk"]) {
  const acceptedPayload = checkoutRequest.normalizeCreateCheckoutRequest({
    competitionSlug: slug,
    studentName: "Smoke Student",
    studentAge: 12,
    guardianName: "Smoke Guardian",
    guardianEmail: "smoke@example.com",
    city: "Mumbai",
    country: "India"
  });
  const resolvedLaunchAmount = paymentAmounts.resolvePayableAmountPaise({
    registration: { payment_amount: 19899, amount_due: 19899, payment_status: "order_created", payment_currency: "INR" },
    competition: { fee_amount: 19899 },
    competitionSlug: slug
  });
  expectEqual(acceptedPayload.ok, true, `${slug} register checkout payload validates before order creation.`);
  expectEqual(resolvedLaunchAmount.amountPaise, 19900, `${slug} launch checkout amount resolves to 19900 paise even if Supabase has 19899.`);
}

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
const registrationCheckoutSource = readFileSync("app/api/registrations/create-checkout/route.ts", "utf8");
const registrationCheckoutRequestSource = readFileSync("lib/registration/checkout-request.ts", "utf8");
const supabaseMutationErrorSource = readFileSync("lib/registration/supabase-mutation-error.ts", "utf8");
const amountResolverSource = readFileSync("lib/payment/amounts.ts", "utf8");
const competitionsSource = readFileSync("lib/competitions.ts", "utf8");
const registerPageSource = readFileSync("app/register/[slug]/page.tsx", "utf8");
const paymentPageSource = readFileSync("app/payment/page.tsx", "utf8");
const createOrderSource = readFileSync("app/api/payments/create-order/route.ts", "utf8");
const paymentFormSource = readFileSync("components/payment-form.tsx", "utf8");
const registerFormSource = readFileSync("components/register-form.tsx", "utf8");
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
expectBefore(
  amountResolverSource,
  "if (launchDefault?.feeAmount",
  "const candidates =",
  "Payment amount resolver checks launch defaults before stale registration or competition amounts."
);
expectMatch(amountResolverSource, /return amountPaise === launchDefault\.feeAmount/, "Launch payment amounts must exactly match the launch default.");
expectMatch(competitionsSource, /usesLaunchFeeDefault \? launchDefault\?\.feeAmount/, "Public competition fee amount uses launch defaults for launch slugs.");
expectMatch(competitionsSource, /usesLaunchFeeDefault \? launchDefault\?\.feeLabel/, "Public competition fee label uses launch defaults for launch slugs.");
expectMatch(registrationRouteSource, /buildPaymentUrl\(\{\s*registrationId:\s*data\.id,\s*competitionSlug:\s*competition\.slug\s*\}\)/, "New registrations return a payment URL containing the exact registration id.");
expectMatch(registrationRouteSource, /buildPaymentUrl\(\{\s*registrationId:\s*existingRegistration\.id,\s*competitionSlug:\s*competition\.slug\s*\}\)/, "Pending duplicate registrations return their existing registration id.");
expectMatch(registrationRouteSource, /redirectTo:\s*alreadyPaid\s*\?\s*"\/dashboard"\s*:\s*paymentUrl/, "Paid duplicate registrations redirect away from duplicate payment.");
expectMatch(registrationRouteSource, /row_user=\$\{data\.user_id\}/, "Registration creation logs the database row owner safely.");
expectMatch(registrationCheckoutSource, /export const dynamic = "force-dynamic"/, "Registration checkout endpoint is dynamic.");
expectMatch(registrationCheckoutSource, /getServerAuthSession/, "Registration checkout requires the server auth session.");
expectMatch(registrationCheckoutSource, /normalizeCreateCheckoutRequest/, "Registration checkout normalizes the request before auth and database work.");
expectMatch(registrationCheckoutSource, /insertCheckoutRegistration/, "Registration checkout uses a schema-aware insert helper.");
expectMatch(registrationCheckoutSource, /buildModernRegistrationInsertPayload/, "Registration checkout first tries the modern launch registration insert payload.");
expectMatch(registrationCheckoutSource, /buildLegacyRegistrationInsertPayload/, "Registration checkout can retry a legacy-safe registration insert payload.");
expectMatch(registrationCheckoutSource, /saveOrderOnRegistration/, "Registration checkout uses a schema-aware order-save helper.");
expectMatch(registrationCheckoutSource, /payment_created/, "Registration checkout can fall back to legacy payment_created status when needed.");
expectMatch(registrationCheckoutSource, /errorCode:\s*"AUTH_MISSING"/, "Registration checkout returns AUTH_MISSING for missing sessions.");
expectMatch(registrationCheckoutSource, /detailsCode/, "Registration checkout returns safe details codes for production debugging.");
expectMatch(registrationCheckoutSource, /errorCode:\s*"RAZORPAY_KEY_MISSING"/, "Registration checkout returns RAZORPAY_KEY_MISSING for missing Razorpay config.");
expectMatch(registrationCheckoutSource, /jsonError\([^)]*"REGISTRATION_CREATE_FAILED"/, "Registration checkout exposes safe registration failure codes.");
expectMatch(registrationCheckoutSource, /jsonError\([^)]*"ORDER_CREATE_FAILED"/, "Registration checkout exposes safe order failure codes.");
expectMatch(registrationCheckoutSource, /\.eq\("user_id", userId\)/, "Registration checkout only reuses or updates the current user's registrations.");
expectMatch(registrationCheckoutSource, /payment_status:\s*"pending"/, "Registration checkout creates a pending registration before payment.");
expectMatch(registrationCheckoutSource, /payment_amount:\s*fields\.amountPaise/, "Registration checkout stores server-resolved payment_amount before Razorpay.");
expectMatch(registrationCheckoutSource, /amount_due:\s*fields\.amountPaise/, "Registration checkout stores server-resolved amount_due before Razorpay.");
expectMatch(registrationCheckoutSource, /payment_currency:\s*"INR"/, "Registration checkout stores INR currency before Razorpay.");
expectMatch(registrationCheckoutSource, /resolvePayableAmountPaise/, "Registration checkout uses the shared backend amount resolver.");
expectMatch(registrationCheckoutSource, /repairRegistrationAmountIfNeeded/, "Registration checkout repairs invalid unpaid launch amounts.");
expectMatch(registrationCheckoutSource, /createRazorpayClient/, "Registration checkout creates Razorpay orders server-side.");
expectMatch(registrationCheckoutSource, /razorpay\.orders\.create/, "Registration checkout calls Razorpay Orders API.");
expectMatch(registrationCheckoutSource, /amount,\s*currency:\s*paymentCurrency/, "Registration checkout creates Razorpay orders with the resolved backend amount.");
expectMatch(registrationCheckoutSource, /payableAmountPaise:\s*feeAmount/, "Disabled LockIn Points branch does not discount the checkout amount.");
expectMatch(registrationCheckoutSource, /getPublicRazorpayKey/, "Registration checkout returns only the public Razorpay key id.");
expectMatch(registrationCheckoutSource, /isSeatConfirmed/, "Registration checkout rejects paid duplicate registrations.");
expectMatch(registrationCheckoutSource, /isPaymentInProgress/, "Registration checkout reuses in-progress orders when safe.");
expectMatch(registrationCheckoutSource, /payment_status:\s*"order_created"/, "Registration checkout marks registrations order_created after order creation.");
expectMatch(registrationCheckoutSource, /payment_attempts/, "Registration checkout records payment attempts.");
expectMatch(registrationCheckoutSource, /competitionName:\s*registration\.competition_name/, "Registration checkout returns a safe competitionName field.");
expectMatch(registrationCheckoutSource, /participantName:\s*registration\.student_name/, "Registration checkout returns participantName only to the current submitting user.");
expectNotMatch(registrationCheckoutSource, /amount:\s*body\./, "Registration checkout never trusts a client-provided amount.");
expectNotMatch(registrationCheckoutSource, /lockInPointsToApply/, "Registration checkout does not expose public LockIn Points checkout controls.");
expectMatch(registrationCheckoutRequestSource, /studentName", "student_name", "student"/, "Registration checkout accepts current and legacy student-name payload keys.");
expectMatch(registrationCheckoutRequestSource, /guardianName", "guardian_name", "parentName"/, "Registration checkout accepts guardian and parent-name payload keys.");
expectMatch(registrationCheckoutRequestSource, /guardianEmail", "guardian_email", "parentEmail"/, "Registration checkout accepts guardian and parent-email payload keys.");
expectMatch(registrationCheckoutRequestSource, /country", "nation"/, "Registration checkout accepts country and nation payload keys.");
expectMatch(registrationCheckoutRequestSource, /MISSING_STUDENT_NAME/, "Registration checkout reports missing student name details.");
expectMatch(registrationCheckoutRequestSource, /INVALID_STUDENT_AGE/, "Registration checkout reports invalid student age details.");
expectMatch(registrationCheckoutRequestSource, /INVALID_COMPETITION_SLUG/, "Registration checkout reports invalid competition slug details.");
expectMatch(supabaseMutationErrorSource, /INSERT_RLS_BLOCKED/, "Supabase mutation classifier reports RLS insert failures.");
expectMatch(supabaseMutationErrorSource, /INSERT_UNKNOWN_COLUMN/, "Supabase mutation classifier reports unknown column insert failures.");
expectMatch(supabaseMutationErrorSource, /INSERT_CHECK_CONSTRAINT_FAILED/, "Supabase mutation classifier reports check constraint failures.");
expectMatch(supabaseMutationErrorSource, /Failing row contains \[redacted row\]/, "Supabase mutation classifier redacts failing row details.");
expectBefore(
  registrationCheckoutSource,
  "normalizeCreateCheckoutRequest",
  "createCheckoutOrder({",
  "Registration checkout validates payload before trying to create a Razorpay order."
);
expectMatch(registerPageSource, /searchParams/, "Register page reads search params for safe debug mode.");
expectMatch(registerPageSource, /debug=\{debugEnabled\}/, "Register page passes debug mode to the client form.");
expectMatch(registerPageSource, /authenticated=\{isLoggedIn\}/, "Register page passes server auth state to the debug panel.");
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
expectMatch(registerFormSource, /\/api\/registrations\/create-checkout/, "Register form uses direct create-checkout instead of redirecting to payment first.");
expectMatch(registerFormSource, /CheckoutErrorCode/, "Register form uses explicit safe checkout error codes.");
expectMatch(registerFormSource, /Error Code:/, "Register form shows a visible safe error code.");
expectMatch(registerFormSource, /Details Code:/, "Register form can show safe details code in debug mode.");
expectMatch(registerFormSource, /Checkout Debug/, "Register form exposes a safe query-param debug panel.");
expectMatch(registerFormSource, /details code/, "Register form debug panel shows the exact checkout details code.");
expectMatch(registerFormSource, /create-checkout status/, "Register form debug panel shows create-checkout status.");
expectMatch(registerFormSource, /registration id exists/, "Register form debug panel avoids exposing registration id values.");
expectMatch(registerFormSource, /order id exists/, "Register form debug panel avoids exposing order id values.");
expectMatch(registerFormSource, /key id configured/, "Register form debug panel avoids exposing the public key value.");
expectMatch(registerFormSource, /script_preload_complete/, "Register form preloads Razorpay script safely.");
expectMatch(registerFormSource, /waitForRazorpayScript/, "Register form handles existing Razorpay script tags reliably.");
expectMatch(registerFormSource, /RAZORPAY_SCRIPT_FAILED/, "Register form reports Razorpay script failures.");
expectMatch(registerFormSource, /RAZORPAY_OPEN_FAILED/, "Register form reports Razorpay open failures.");
expectMatch(registerFormSource, /VERIFY_FAILED/, "Register form reports verification failures.");
expectMatch(registerFormSource, /Creating your registration/, "Register form shows the create-registration loading state.");
expectMatch(registerFormSource, /Opening secure payment/, "Register form shows the opening-payment loading state.");
expectMatch(registerFormSource, /window\.Razorpay/, "Register form opens Razorpay Checkout directly.");
expectMatch(registerFormSource, /\/api\/payments\/verify/, "Register form still verifies payment server-side.");
expectMatch(registerFormSource, /\/api\/payments\/failed/, "Register form records cancelled or failed payments without confirming seats.");
expectMatch(registerFormSource, /razorpay_order_id/, "Register form sends Razorpay order id to the verify endpoint.");
expectMatch(registerFormSource, /razorpay_payment_id/, "Register form sends Razorpay payment id to the verify endpoint.");
expectMatch(registerFormSource, /razorpay_signature/, "Register form sends Razorpay signature to the verify endpoint.");
expectNotMatch(registerFormSource, /fetch\("\/api\/registrations"\)/, "Register form no longer depends on the old registration-then-payment redirect flow.");
expectNotMatch(registerFormSource, /buildPaymentUrl/, "Register form no longer builds a payment page URL after new registrations.");
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

function expectDetailsCode(result, expectedDetailsCode, label) {
  if (result.ok || result.detailsCode !== expectedDetailsCode) {
    failures.push(`${label} Expected ${expectedDetailsCode}, received ${result.ok ? "ok" : result.detailsCode}.`);
  }
}

function expectBefore(source, firstNeedle, secondNeedle, label) {
  const firstIndex = source.indexOf(firstNeedle);
  const secondIndex = source.indexOf(secondNeedle);
  if (firstIndex === -1 || secondIndex === -1 || firstIndex > secondIndex) {
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
