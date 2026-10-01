import assert from "node:assert/strict";
import { test } from "node:test";
import { scoringComparison } from "../src/lib/scoring-comparison";

test("analysis distinguishes total and rate leaders using the actual exposure", () => {
  const result = scoringComparison({ messi: 129, ronaldo: 140 }, { messi: 163, ronaldo: 183 });
  assert.equal(result.goalLeader, "ronaldo");
  assert.equal(result.goalGap, 11);
  assert.equal(result.rateLeader, "messi");
  assert.equal(result.basis, "appearances");
  const per90 = scoringComparison({ messi: 2, ronaldo: 3 }, { messi: 2, ronaldo: 2 }, { messi: 90, ronaldo: 180 });
  assert.equal(per90.rateLeader, "messi");
  assert.deepEqual(per90.rates, { messi: 2, ronaldo: 1.5 });
});

test("zero exposure is unavailable, while zero goals and equal rates remain valid", () => {
  const missing = scoringComparison({ messi: 0, ronaldo: 2 }, { messi: 0, ronaldo: 2 }, { messi: 0, ronaldo: 180 });
  assert.equal(missing.comparable, false);
  assert.equal(missing.rates.messi, null);
  assert.equal(missing.rateLeader, null);
  const zero = scoringComparison({ messi: 0, ronaldo: 0 }, { messi: 1, ronaldo: 2 });
  assert.equal(zero.comparable, true);
  assert.equal(zero.goalLeader, null);
  assert.deepEqual(zero.rates, { messi: 0, ronaldo: 0 });
  assert.equal(scoringComparison({ messi: 1, ronaldo: 2 }, { messi: 2, ronaldo: 4 }).rateLeader, null);
});

test("a rounded tie does not replace the unrounded comparison", () => {
  const comparison = scoringComparison({ messi: 100, ronaldo: 101 }, { messi: 200, ronaldo: 201 });
  assert.equal(comparison.rates.messi?.toFixed(2), comparison.rates.ronaldo?.toFixed(2));
  assert.equal(comparison.rateLeader, "ronaldo");
});
