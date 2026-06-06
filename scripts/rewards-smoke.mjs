#!/usr/bin/env node

import { readFileSync } from "node:fs";
import Module from "node:module";
import ts from "typescript";

const failures = [];
const checkout = loadTsModule("lib/rewards/checkout.ts");
const feature = loadTsModule("lib/rewards/feature.ts");
const levels = loadTsModule("lib/rewards/levels.ts");
const prizePool = loadTsModule("lib/rewards/prize-pool.ts");
const paymentStatus = loadTsModule("lib/payment/status.ts");
const pointsSource = readFileSync("lib/rewards/points.ts", "utf8");

expectEqual(feature.areLockInPointsEnabled(), false, "Internal rewards feature is disabled by default for launch.");
expectMatch(pointsSource, /export const participationPoints = 7;/, "Internal participation reward constant is preserved for future use.");
expectMatch(pointsSource, /first:\s*77/, "Internal first-place reward constant is preserved for future use.");
expectMatch(pointsSource, /second:\s*47/, "Internal second-place reward constant is preserved for future use.");
expectMatch(pointsSource, /third:\s*27/, "Internal third-place reward constant is preserved for future use.");

const storyTalksCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 19999,
  requestedPoints: 999,
  availablePoints: 999
});

expectEqual(storyTalksCheckout.maxUsablePoints, 99, "Internal checkout math caps points at 99 for INR 199.99.");
expectEqual(storyTalksCheckout.appliedPoints, 99, "Checkout applies no more than 50% of entry fee.");
expectEqual(storyTalksCheckout.discountAmountPaise, 9900, "99 points creates INR 99 discount.");
expectEqual(storyTalksCheckout.payableAmountPaise, 10099, "Final payable amount never goes negative.");

const limitedBalanceCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 19999,
  requestedPoints: 99,
  availablePoints: 7
});

expectEqual(limitedBalanceCheckout.appliedPoints, 7, "Checkout cannot apply more points than the user owns.");

expectEqual(prizePool.calculatePrizePool({ paidParticipants: 0 }).amount, 0, "Zero verified paid participants creates no prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 4 }).amount, 0, "Four verified paid participants creates no prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 5 }).amount, 500, "Five verified paid participants creates INR 500 prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 9 }).amount, 500, "Nine verified paid participants still creates INR 500 prize pool.");
expectEqual(prizePool.calculatePrizePool({ paidParticipants: 10 }).amount, 1000, "Ten verified paid participants creates INR 1,000 prize pool.");

const belowThreshold = prizePool.calculatePrizePool({ paidParticipants: 9, perPaidParticipant: 100, displayThreshold: 1000 });
expectEqual(belowThreshold.amount, 500, "Prize pool increases by INR 500 for each full block of 5 verified paid participants.");
expectEqual(belowThreshold.showBadge, false, "Prize pool badge stays hidden below INR 1,000.");

const atThreshold = prizePool.calculatePrizePool({ paidParticipants: 10, perPaidParticipant: 100, displayThreshold: 1000 });
expectEqual(atThreshold.amount, 1000, "Prize pool reaches INR 1,000 at 10 paid participants.");
expectEqual(atThreshold.showBadge, true, "Prize pool badge appears at INR 1,000 or above.");
expectEqual(atThreshold.distribution.first, 450, "1st place receives 45% of prize pool.");
expectEqual(atThreshold.distribution.second, 300, "2nd place receives 30% of prize pool.");
expectEqual(atThreshold.distribution.third, 250, "3rd place receives remaining 25% of prize pool.");
expectEqual(prizePool.formatPrizePoolBadge(1000), "LIVE PRIZE POOL: INR 1,000", "Prize pool badge shows an exact INR amount without fake plus signs.");

expectEqual(paymentStatus.isSeatConfirmed("captured"), true, "Captured payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("paid"), true, "Paid payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("pending"), false, "Pending payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("failed"), false, "Failed payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("cancelled"), false, "Cancelled payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("refunded"), false, "Refunded payments do not count as verified.");

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
