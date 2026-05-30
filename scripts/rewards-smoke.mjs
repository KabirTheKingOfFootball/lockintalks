#!/usr/bin/env node

import { readFileSync } from "node:fs";
import Module from "node:module";
import ts from "typescript";

const failures = [];
const checkout = loadTsModule("lib/rewards/checkout.ts");
const prizePool = loadTsModule("lib/rewards/prize-pool.ts");
const paymentStatus = loadTsModule("lib/payment/status.ts");

const storyTalksCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 19900,
  requestedPoints: 999,
  availablePoints: 999
});

expectEqual(storyTalksCheckout.maxUsablePoints, 99, "INR 199 checkout caps Lock-in Points at 99.");
expectEqual(storyTalksCheckout.appliedPoints, 99, "Checkout applies no more than 50% of entry fee.");
expectEqual(storyTalksCheckout.discountAmountPaise, 9900, "99 points creates INR 99 discount.");
expectEqual(storyTalksCheckout.payableAmountPaise, 10000, "Final payable amount never goes negative.");

const limitedBalanceCheckout = checkout.calculateLockInPointCheckout({
  feeAmountPaise: 19900,
  requestedPoints: 99,
  availablePoints: 17
});

expectEqual(limitedBalanceCheckout.appliedPoints, 17, "Checkout cannot apply more points than the user owns.");

const belowThreshold = prizePool.calculatePrizePool({ paidParticipants: 9, perPaidParticipant: 100, displayThreshold: 1000 });
expectEqual(belowThreshold.amount, 900, "Prize pool counts INR 100 per verified paid participant.");
expectEqual(belowThreshold.showBadge, false, "Prize pool badge stays hidden below INR 1,000.");

const atThreshold = prizePool.calculatePrizePool({ paidParticipants: 10, perPaidParticipant: 100, displayThreshold: 1000 });
expectEqual(atThreshold.amount, 1000, "Prize pool reaches INR 1,000 at 10 paid participants.");
expectEqual(atThreshold.showBadge, true, "Prize pool badge appears at INR 1,000 or above.");
expectEqual(atThreshold.distribution.first, 450, "1st place receives 45% of prize pool.");
expectEqual(atThreshold.distribution.second, 300, "2nd place receives 30% of prize pool.");
expectEqual(atThreshold.distribution.third, 250, "3rd place receives remaining 25% of prize pool.");

expectEqual(paymentStatus.isSeatConfirmed("captured"), true, "Captured payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("paid"), true, "Paid payments count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("pending"), false, "Pending payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("failed"), false, "Failed payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("cancelled"), false, "Cancelled payments do not count as verified.");
expectEqual(paymentStatus.isSeatConfirmed("refunded"), false, "Refunded payments do not count as verified.");

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
