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
const pointsSource = readFileSync("lib/rewards/points.ts", "utf8");

expectMatch(pointsSource, /export const participationPoints = 7;/, "Participation reward is 7 LockIn Points.");
expectMatch(pointsSource, /first:\s*77/, "First-place reward is 77 LockIn Points.");
expectMatch(pointsSource, /second:\s*47/, "Second-place reward is 47 LockIn Points.");
expectMatch(pointsSource, /third:\s*27/, "Third-place reward is 27 LockIn Points.");

for (const [paidParticipants, expectedAmount] of [
  [0, 0],
  [4, 0],
  [5, 500],
  [9, 500],
  [10, 1000]
]) {
  expectEqual(
    prizePool.calculatePrizePool({ paidParticipants }).amount,
    expectedAmount,
    `${paidParticipants} paid participants maps to INR ${expectedAmount} prize pool.`
  );
}

expectEqual(paymentStatus.isSeatConfirmed("captured"), true, "Captured payments confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("paid"), true, "Paid payments confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("failed"), false, "Failed payments do not confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("cancelled"), false, "Cancelled payments do not confirm seats.");
expectEqual(paymentStatus.isSeatConfirmed("refunded"), false, "Refunded payments do not confirm seats.");

const essayKnowledge = faqEssay.getFAQEssayKnowledge();
expectAtLeast(essayKnowledge.wordCount, 7000, "FAQ essay knowledge base is at least 7,000 words.");
expectAtLeast(essayKnowledge.chunks.length, 20, "FAQ essay produces enough safe searchable context sections.");

for (const question of [
  "My child is 7. Can they join?",
  "Can I speak about football or my role model?",
  "How does the prize pool increase every five paid participants?",
  "What are LockIn Points?",
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
    ...walk("app"),
    ...walk("components"),
    ...walk("lib"),
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
    /₍|ₑₓ/i,
    /examples are/i,
    /lorem ipsum/i,
    /support@lockintalks/i,
    /hello@lockintalks/i
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
  const publicRoutes = [
    "/",
    "/competitions",
    "/competitions/story-talks",
    "/competitions/idol-talk",
    "/competitions/power-talk",
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
    "/api/health/razorpay"
  ];

  for (const route of publicRoutes) {
    const response = await fetch(`${origin}${route}`, { cache: "no-store" });
    if (!response.ok) {
      failures.push(`${route} returned HTTP ${response.status}.`);
      continue;
    }

    if (route === "/api/health/razorpay") {
      const health = await response.json();
      expectType(health.checkoutReady, "boolean", "Razorpay health exposes checkoutReady boolean.");
      expectType(health.webhookReady, "boolean", "Razorpay health exposes webhookReady boolean.");
      continue;
    }

    const html = await response.text();
    if (/!PEOPLE!|!FUN!|!PRIZES!|!STAKES!|₍|ₑₓ|examples are/i.test(html)) {
      failures.push(`${route} renders old unprofessional prize copy.`);
    }
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
