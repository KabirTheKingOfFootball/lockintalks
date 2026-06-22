#!/usr/bin/env node

import { readFileSync } from "node:fs";
import Module from "node:module";
import ts from "typescript";

const failures = [];
const checkout = loadTsModule("lib/rewards/checkout.ts");
const feature = loadTsModule("lib/rewards/feature.ts");
const levels = loadTsModule("lib/rewards/levels.ts");
const prizePool = loadTsModule("lib/rewards/prize-pool.ts");
const competitionPricing = loadTsModule("lib/competition-pricing.ts");
const paymentStatus = loadTsModule("lib/payment/status.ts");
const pointsSource = readFileSync("lib/rewards/points.ts", "utf8");

expectEqual(feature.areLockInPointsEnabled(), false, "Internal rewards feature is disabled by default for launch.");
expectMatch(pointsSource, /export const participationPoints = 7;/, "Internal participation reward constant is preserved for future use.");
expectMatch(pointsSource, /first:\s*77/, "Internal first-place reward constant is preserved for future use.");
expectMatch(pointsSource, /second:\s*47/, "Internal second-place reward constant is preserved for future use.");
expectMatch(pointsSource, /third:\s*27/, "Internal third-place reward constant is preserved for future use.");

const storyTalksCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 9999,
  requestedPoints: 499,
  availablePoints: 999
});

expectEqual(storyTalksCheckout.maxUsablePoints, 49, "Internal checkout math caps points at 49 for INR 99.99.");
expectEqual(storyTalksCheckout.appliedPoints, 49, "Checkout applies no more than roughly 50% of entry fee.");
expectEqual(storyTalksCheckout.discountAmountPaise, 4900, "49 points creates INR 49 discount.");
expectEqual(storyTalksCheckout.payableAmountPaise, 5099, "Final payable amount never goes negative.");

const limitedBalanceCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 9999,
  requestedPoints: 49,
  availablePoints: 7
});

expectEqual(limitedBalanceCheckout.appliedPoints, 7, "Checkout cannot apply more points than the user owns.");

expectEqual(prizePool.calculatePrizePool({ paidParticipants: 0 }).amount, 0, "Zero verified contestants creates INR 0 prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 0 }).showBadge, false, "Zero verified contestants hides the public prize pool badge.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 1 }).amount, 9999, "One verified contestant contributes 9999 paise to the prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 1 }).showBadge, true, "One verified contestant shows the public prize pool badge.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 5 }).amount, 49995, "Five verified contestants creates INR 499.95 prize pool with 9999 paise contribution.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 10 }).amount, 99990, "Ten verified contestants creates INR 999.90 prize pool with 9999 paise contribution.");

const lowerContribution = prizePool.calculatePrizePool({ paidParticipants: 1, perPaidParticipant: 5000 });
expectEqual(lowerContribution.amount, 5000, "Prize pool can use an admin-configured INR 50 contribution.");
expectEqual(competitionPricing.buildPrizePoolContributionCopy({ feeAmountPaise: 9999, prizePoolContributionPaise: 9999 }), "100% of entry fees go into the prize pool for this launch batch.", "Equal contribution shows 100% launch-batch wording.");
expectEqual(competitionPricing.buildPrizePoolContributionCopy({ feeAmountPaise: 9999, prizePoolContributionPaise: 5000 }), "₹50 from every verified entry goes into the prize pool.", "Lower contribution shows exact rupee amount from each entry.");

const belowThreshold = prizePool.calculatePrizePool({ paidParticipants: 9, perPaidParticipant: 9999, displayThreshold: 100000 });
expectEqual(belowThreshold.amount, 89991, "Prize pool increases by the configured paise amount for each verified paid participant.");
expectEqual(belowThreshold.showBadge, true, "Prize pool badge stays visible for any amount above INR 0.");

const atThreshold = prizePool.calculatePrizePool({ paidParticipants: 10, perPaidParticipant: 9999, displayThreshold: 100000 });
expectEqual(atThreshold.showBadge, true, "Prize pool badge appears for any positive prize pool.");
expectEqual(atThreshold.distribution.first, 44995, "1st place receives 45% of prize pool.");
expectEqual(atThreshold.distribution.second, 29997, "2nd place receives 30% of prize pool.");
expectEqual(atThreshold.distribution.third, 24998, "3rd place receives remaining 25% of prize pool.");
expectEqual(prizePool.formatPrizePoolBadge(9999), "Current Prize Pool: ₹99.99", "Prize pool badge shows INR 99.99 exactly.");
expectEqual(prizePool.formatPrizePoolBadge(49995), "Current Prize Pool: ₹499.95", "Prize pool badge shows exact paise-based amounts.");
expectEqual(prizePool.formatPrizePoolBadge(99990), "Current Prize Pool: ₹999.90", "Prize pool badge shows an exact amount without fake plus signs.");
expectEqual(paymentStatus.isSeatConfirmed("captured"), true, "Captured payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("paid"), true, "Paid payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("pending"), false, "Pending payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("failed"), false, "Failed payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("cancelled"), false, "Cancelled payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("refunded"), false, "Refunded payments do not count as verified.");

const nonVerifiedStatuses = ["pending", "failed", "cancelled", "refunded", "signature_verified", "order_created"];
const nonVerifiedCount = nonVerifiedStatuses.filter((status) => paymentStatus.isSeatConfirmed(status)).length;
expectEqual(prizePool.calculatePrizePool({ paidParticipants: nonVerifiedCount }).showBadge, false, "Failed, cancelled, refunded, pending, and unverified payments do not make the prize pool visible.");

expectEqual(levels.getNextLevelRequirement(1), 17, "Internal level 1 next requirement is 17.");
expectEqual(levels.getNextLevelRequirement(2), 27, "Internal level 2 next requirement is 27.");
expectEqual(levels.getNextLevelRequirement(20), 207, "Internal level 20 next requirement is 207.");

const levelOneProgress = levels.calculateLockInLevel(16);
expectEqual(levelOneProgress.currentLevel, 1, "16 points keeps user at Level 1.");
expectEqual(levelOneProgress.currentXP, 16, "16 points shows 16 internal progress.");
expectEqual(levelOneProgress.nextRequirement, 17, "Level 1 progress targets 17 internal progress.");

const levelTwoProgress = levels.calculateLockInLevel(17);
expectEqual(levelTwoProgress.currentLevel, 2, "17 points reaches Level 2.");
expectEqual(levelTwoProgress.currentXP, 0, "Fresh Level 2 starts at 0 internal progress.");
expectEqual(levelTwoProgress.nextRequirement, 27, "Level 2 progress targets 27 internal progress.");
expectEqual(levelTwoProgress.nextLevelBonus, 3, "Level 2 next level bonus target is 3.");

const levelSixProgress = levels.calculateLockInLevel(227);
expectEqual(levelSixProgress.currentLevel, 6, "227 points reaches Level 6.");
expectEqual(levelSixProgress.currentXP, 42, "227 points leaves 42 internal progress inside Level 6.");
expectEqual(levelSixProgress.nextRequirement, 67, "Level 6 needs 67 internal progress to reach Level 7.");
expectEqual(Math.round(levelSixProgress.progressPercent), 63, "42 of 67 internal progress is roughly 63 percent.");

if (failures.length > 0) {
  console.error("\n[rewards-smoke] Failed checks:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[rewards-smoke] Passed.");

function loadTsModule(path) {
  const source = readFileSync(path, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const loadedModule = new Module(path);
  loadedModule.paths = Module._nodeModulePaths(process.cwd());
  loadedModule._compile(output, path);
  return loadedModule.exports;
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
