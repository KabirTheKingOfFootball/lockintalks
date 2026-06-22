#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
installTsLoader();

const failures = [];
const warnings = [];
const baseUrl = process.env.LOCKINTALKS_TEST_BASE_URL?.replace(/\/$/, "");

const prizePool = require(path.resolve("lib/rewards/prize-pool.ts"));
const paymentStatus = require(path.resolve("lib/payment/status.ts"));
const faqKnowledge = require(path.resolve("lib/faq/knowledge.ts"));
const faqEssay = require(path.resolve("lib/faq/essay-loader.ts"));
const rewardsFeature = require(path.resolve("lib/rewards/feature.ts"));
const competitionsModule = require(path.resolve("lib/competitions.ts"));

expectEqual(rewardsFeature.areLockInPointsEnabled(), false, "LockIn Points are disabled by default for launch.");

for (const [paidParticipants, expectedAmount] of [
  [0, 0],
  [1, 9999],
  [5, 49995],
  [10, 99990]
]) {
  expectEqual(
    prizePool.calculatePrizePool({ paidParticipants }).amount,
    expectedAmount,
    `${paidParticipants} paid participants maps to ${expectedAmount} paise prize pool.`
  );
}
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 0 }).showBadge, false, "Prize pool display hides at INR 0.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 1 }).showBadge, true, "Prize pool display appears above INR 0.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 1, perPaidParticipant: 5000 }).amount, 5000, "Admin-configured INR 50 contribution is used for prize pool math.");
expectEqual(prizePool.formatPrizePoolBadge(9999), "Current Prize Pool: ₹99.99", "Prize pool display shows INR 99.99 exactly.");
expectEqual(prizePool.formatPrizePoolBadge(99990), "Current Prize Pool: ₹999.90", "Prize pool display does not use old INR 1,000 threshold logic.");
const launchCompetitionWithAdminSlots = competitionsModule.mapCompetitionRecord(
  {
    id: "slot-smoke",
    slug: "idol-talk",
    name: "Idol Talk",
    category: "Inspirational Speaking",
    age_group: "Ages 9-16",
    event_date: "2026-07-15",
    event_time: "11:00 AM",
    timezone: "IST",
    registration_deadline: null,
    max_participants: 27,
    fee_label: "₹99.99",
    fee_amount: 9999,
    fee_amount_paise: 9999,
    entry_fee_label: "₹99.99",
    prize_pool_contribution_paise: 9999,
    public_offer_label: "Founder's Discount",
    summary: "Slot smoke test",
    description: "Slot smoke test",
    image_url: null,
    status: "live",
    rules: [],
    schedule: [],
    prizes: [],
    criteria: [],
    judges: [],
    created_at: "2026-06-22T00:00:00.000Z"
  },
  0
);
expectEqual(launchCompetitionWithAdminSlots.maxParticipants, 27, "Launch competitions use the admin-entered Maximum Participants value.");
expectEqual(launchCompetitionWithAdminSlots.slotsRemaining, 27, "Slots remaining reflects the admin-entered Maximum Participants value when there are no paid registrations.");
expectEqual(paymentStatus.isSeatConfirmed("captured"), true, "Captured payments confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("paid"), true, "Paid payments confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("failed"), false, "Failed payments do not confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("cancelled"), false, "Cancelled payments do not confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("refunded"), false, "Refunded payments do not confirm seats.");

checkAdminRegistrationReview();

const essayKnowledge = faqEssay.getFAQEssayKnowledge();
expectAtLeast(essayKnowledge.wordCount, 7000, "FAQ essay knowledge base is at least 7,000 words.");
expectAtLeast(essayKnowledge.chunks.length, 20, "FAQ essay produces enough safe searchable context sections.");

for (const question of [
  "My child is 7. Can they join?",
  "Can I speak about football or my role model?",
  "How does the prize pool work for verified paid participants?",
  "What details do I need for registration?",
  "What happens if payment is pending?",
  "Is LockInTalks safe for parents?"
]) {
  const result = faqKnowledge.findFAQAnswer(question, essayKnowledge.chunks);
  if (result.isFallback) {
    failures.push(`FAQ assistant fell back for useful question: ${question}`);
  }
}

scanSourceForBadLaunchCopy();

if (baseUrl) {
  await smokePublicRoutes(baseUrl);
} else {
  warnings.push("Set LOCKINTALKS_TEST_BASE_URL to run deployed route checks.");
}

if (failures.length > 0) {
  console.error("\n[launch-smoke] Failed checks:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`[launch-smoke] ${warning}`));
console.log("[launch-smoke] Passed.");

function scanSourceForBadLaunchCopy() {
  const files = [
    ...walk("app").filter((file) => !file.includes(`${path.sep}api${path.sep}`) && !file.includes(`${path.sep}admin${path.sep}`)),
    ...walk("components").filter((file) => !file.includes(`${path.sep}admin${path.sep}`)),
    ...walk("lib").filter((file) => !file.includes(`${path.sep}rewards${path.sep}`)),
    "supabase/seed-competitions.sql",
    "README.md",
    "LAUNCH_CHECKLIST.md",
    "LIVE_MODE_SWITCH_CHECKLIST.md",
    "RAZORPAY_SETUP.md",
    "PARENT_LEGAL_REVIEW_CHECKLIST.md"
  ].filter((file) => existsSync(file));

  const banned = [
    /!PEOPLE!/i,
    /!FUN!/i,
    /!PRIZES!/i,
    /!STAKES!/i,
    /â‚|â‚‘â‚“/i,
    /examples are/i,
    /lorem ipsum/i,
    /support@lockintalks/i,
    /hello@lockintalks/i,
    /What are LockIn Points/i,
    /LockIn Points are/i,
    /\+\s*(77|47|27)\s+LockIn Points/i,
    /1\s+LockIn Point\s*=\s*(?:INR\s*)?1/i,
    /XP meter/i
  ];

  for (const file of files) {
    if (file.includes("readable-error.ts")) continue;
    if (file.includes(`${path.sep}competitions.ts`)) continue;
    const source = readFileSync(file, "utf8");
    for (const pattern of banned) {
      if (pattern.test(source)) {
        failures.push(`Bad launch copy matched ${pattern} in ${file}.`);
      }
    }
  }
}

async function smokePublicRoutes(origin) {
  const localMissingSupabase = isLocalOrigin(origin) && !process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const publicRoutes = [
    "/",
    "/about",
    "/competitions",
    "/competitions/story-talks",
    "/competitions/idol-talk",
    "/competitions/power-talk",
    "/register/story-talks",
    "/register/idol-talk",
    "/register/power-talk",
    "/dashboard",
    "/login",
    "/signup",
    "/contact",
    "/faq",
    "/pricing",
    "/privacy",
    "/refund-policy",
    "/shipping-policy",
    "/terms",
    "/parent-consent",
    "/api/health/razorpay",
    "/api/health/supabase"
  ];

  for (const route of publicRoutes) {
    const response = await fetch(`${origin}${route}`, { cache: "no-store" });
    if (!response.ok) {
      if (localMissingSupabase && route === "/api/health/supabase" && response.status === 503) {
        warnings.push("/api/health/supabase returned 503 on local production server because Supabase env vars are not configured locally.");
        continue;
      }

      if (localMissingSupabase && (isCompetitionRoute(route) || isRegisterRoute(route)) && response.status === 404) {
        warnings.push(`${route} returned 404 on local production server because Supabase env vars are not configured locally.`);
        continue;
      }
      failures.push(`${route} returned HTTP ${response.status}.`);
      continue;
    }

    if (route === "/api/health/razorpay") {
      const health = await response.json();
      expectType(health.checkoutReady, "boolean", "Razorpay health exposes checkoutReady boolean.");
      expectType(health.webhookReady, "boolean", "Razorpay health exposes webhookReady boolean.");
      continue;
    }

    if (route === "/api/health/supabase") {
      const health = await response.json();
      expectType(health.ok, "boolean", "Supabase health exposes ok boolean.");
      expectType(health.env?.urlConfigured, "boolean", "Supabase health exposes URL config boolean.");
      expectType(health.env?.publishableKeyConfigured, "boolean", "Supabase health exposes publishable key config boolean.");
      continue;
    }

    const html = await response.text();
    if (/!PEOPLE!|!FUN!|!PRIZES!|!STAKES!|â‚|â‚‘â‚“|examples are/i.test(html)) {
      failures.push(`${route} renders old unprofessional prize copy.`);
    }

    if (/LockIn Points|Lock-in Points|XP meter|1\s+LockIn Point/i.test(html)) {
      failures.push(`${route} renders public LockIn Points copy while launch mode is disabled.`);
    }

    if (isRegisterRoute(route)) {
      if (localMissingSupabase && /Missing Supabase environment variables|not found|404/i.test(html)) {
        warnings.push(`${route} register HTML check skipped on local production server because Supabase env vars are not configured locally.`);
        continue;
      }

      if (!/Please Log In or Create an Account Before Registering for a Competition|Register for/i.test(html)) {
        failures.push(`${route} does not render the expected registration/login-gate content.`);
      }
    }

    if (isCompetitionRoute(route)) {
      if (localMissingSupabase && /Missing Supabase environment variables|No Live Competitions Yet|could not load|not found|404/i.test(html)) {
        warnings.push(`${route} prize pool HTML check skipped on local production server because Supabase env vars are not configured locally.`);
        continue;
      }

      if (/Current Prize Pool:\s*(?:₹|â‚¹)0/i.test(html)) {
        failures.push(`${route} publicly shows Current Prize Pool: ₹0.`);
      }

      if (/INR 199\.99|₹199\.99/i.test(html)) {
        failures.push(`${route} still shows old public INR 199.99 launch pricing.`);
      }

      if (/Entry Fee/i.test(html) && !/More participants = bigger prize pool/i.test(html)) {
        failures.push(`${route} shows entry fee copy without the bigger-prize-pool explanation.`);
      }
    }
  }

  await smokeUnauthenticatedCheckoutEndpoint(origin);
  await smokeInvalidCheckoutPayload(origin);
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);
}

function isCompetitionRoute(route) {
  return route === "/competitions" || route.startsWith("/competitions/");
}

function isRegisterRoute(route) {
  return route.startsWith("/register/");
}

function checkAdminRegistrationReview() {
  const adminPageSource = readFileSync("app/admin/registrations/page.tsx", "utf8");
  const managerSource = readFileSync("components/admin/registration-manager.tsx", "utf8");
  const adminPatchSource = readFileSync("app/api/admin/registrations/[id]/route.ts", "utf8");
  const exportSource = readFileSync("app/api/admin/registrations/export/route.ts", "utf8");
  const schemaSource = readFileSync("supabase/schema.sql", "utf8");

  expectMatch(adminPageSource, /\.in\("payment_status",\s*\["captured",\s*"paid"\]\)/, "Admin registrations page loads only paid/captured rows.");
  expectMatch(exportSource, /\.in\("payment_status",\s*\["captured",\s*"paid"\]\)/, "Admin registrations CSV export includes only paid/captured rows.");
  expectNotMatch(exportSource, /points_redeemed|points_discount_amount/, "Admin paid CSV export does not expose hidden LockIn Points fields.");
  expectMatch(managerSource, /No successful paid registrations yet\./, "Admin registrations empty state is paid-only.");
  expectMatch(managerSource, /confirmation_email_sent/, "Admin registration manager displays confirmation email tracking.");
  expectMatch(managerSource, /Mark Email Sent/, "Admin registration manager can mark confirmation email sent.");
  expectMatch(managerSource, /Mark Email Not Sent/, "Admin registration manager can mark confirmation email not sent.");
  expectMatch(adminPatchSource, /confirmation_email_sent/, "Admin registration PATCH route updates only confirmation email tracking.");
  expectMatch(adminPatchSource, /\.in\("payment_status",\s*\["captured",\s*"paid"\]\)/, "Admin registration PATCH route only updates paid/captured rows.");
  expectNotMatch(managerSource, /paymentStatuses|<select/i, "Admin registration manager no longer exposes manual payment/status dropdowns.");
  expectNotMatch(adminPatchSource, /syncLockInPointsForRegistration|updates\.payment_status|paymentStatus\s*=/, "Admin registration PATCH route does not manually change payment status or reward state.");
  expectMatch(schemaSource, /confirmation_email_sent boolean not null default false/, "Schema includes confirmation email sent column.");
  expectMatch(schemaSource, /confirmation_email_sent_at timestamptz/, "Schema includes confirmation email sent timestamp column.");
  expectMatch(schemaSource, /confirmation_email_sent_by uuid/, "Schema includes confirmation email sent by column.");
}

async function smokeUnauthenticatedCheckoutEndpoint(origin) {
  const response = await fetch(`${origin}/api/registrations/create-checkout`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      competitionSlug: "idol-talk",
      studentName: "Smoke Test",
      studentAge: 12,
      guardianName: "Smoke Guardian",
      guardianEmail: "smoke@example.com",
      city: "Test City",
      country: "India"
    })
  });
  const cacheControl = response.headers.get("cache-control") || "";
  const body = await response.json().catch(() => null);

  if (response.status !== 401) {
    failures.push(`/api/registrations/create-checkout missing-auth smoke returned HTTP ${response.status}, expected 401.`);
  }

  if (!cacheControl.toLowerCase().includes("no-store")) {
    failures.push("/api/registrations/create-checkout missing-auth smoke is missing no-store cache headers.");
  }

  if (body?.errorCode !== "AUTH_MISSING") {
    failures.push("/api/registrations/create-checkout missing-auth smoke did not return AUTH_MISSING.");
  }
}

async function smokeInvalidCheckoutPayload(origin) {
  const response = await fetch(`${origin}/api/registrations/create-checkout`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      competitionSlug: "idol-talk",
      studentAge: 12,
      guardianName: "Smoke Guardian",
      guardianEmail: "smoke@example.com",
      city: "Test City",
      country: "India"
    })
  });
  const cacheControl = response.headers.get("cache-control") || "";
  const body = await response.json().catch(() => null);

  if (response.status !== 400) {
    failures.push(`/api/registrations/create-checkout invalid-payload smoke returned HTTP ${response.status}, expected 400.`);
  }

  if (!cacheControl.toLowerCase().includes("no-store")) {
    failures.push("/api/registrations/create-checkout invalid-payload smoke is missing no-store cache headers.");
  }

  if (body?.errorCode !== "REGISTRATION_CREATE_FAILED" || body?.detailsCode !== "MISSING_STUDENT_NAME") {
    failures.push("/api/registrations/create-checkout invalid-payload smoke did not return MISSING_STUDENT_NAME details.");
  }
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if ([".next", "node_modules"].includes(entry.name)) continue;
      files.push(...walk(absolute));
    } else if (/\.(ts|tsx|md|sql)$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
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

function expectType(actual, expectedType, label) {
  if (typeof actual !== expectedType) {
    failures.push(`${label} Expected ${expectedType}, received ${typeof actual}.`);
  }
}

function expectAtLeast(actual, expectedMinimum, label) {
  if (actual < expectedMinimum) {
    failures.push(`${label} Expected at least ${expectedMinimum}, received ${actual}.`);
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
