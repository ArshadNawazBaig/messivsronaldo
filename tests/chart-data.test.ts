import assert from "node:assert/strict";
import { test } from "node:test";
import { chartMaximum, chartPath, statsChartValues } from "../src/lib/chart-data";

test("chart rates keep missing exposure separate from a genuine zero", () => {
  const values = statsChartValues({ goals: { messi: 0, ronaldo: 0 }, assists: { messi: 0, ronaldo: 1 }, appearances: { messi: 0, ronaldo: 2 }, minutes: { messi: 0, ronaldo: 180 } });
  assert.deepEqual(values["goals-per-90"], { messi: null, ronaldo: 0 });
  assert.deepEqual(values["goals-per-game"], { messi: null, ronaldo: 0 });
  assert.deepEqual(values["contributions-per-90"], { messi: null, ronaldo: .5 });
  assert.deepEqual(values.contributions, { messi: 0, ronaldo: 1 });
});

test("unrounded per-90 chart values use minutes rather than appearances", () => {
  const values = statsChartValues({ goals: { messi: 3, ronaldo: 4 }, assists: { messi: 1, ronaldo: 2 }, appearances: { messi: 2, ronaldo: 2 }, minutes: { messi: 101, ronaldo: 180 } });
  assert.equal(values["goals-per-90"].messi, 270 / 101);
  assert.equal(values["goals-per-game"].messi, 1.5);
  assert.equal(values["contributions-per-90"].ronaldo, 3);
});

test("missing points break a plotted series without erasing valid zeroes", () => {
  assert.equal(chartPath([0, 2, null, 4, 5, NaN, 0], i => i * 10, value => 100 - value), "M 0 100 L 10 98 M 30 96 L 40 95 M 60 100");
  assert.equal(chartPath([null, null], i => i, value => value), "");
});

test("zero-based chart scales contain the data and handle empty samples", () => {
  for (const values of [[null, 0], [0, 140], [.05, .73], [931, 979], [null, null]]) {
    const maximum = chartMaximum(values);
    assert.ok(Number.isFinite(maximum) && maximum > 0);
    assert.ok(maximum >= Math.max(...values.map(value => value ?? 0)));
  }
});
