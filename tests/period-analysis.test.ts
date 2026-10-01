import assert from "node:assert/strict";
import test from "node:test";
import { clubSeasons } from "../src/lib/club-seasons";
import { clubSeasonNotes, periodAnalysis, type PeriodSample } from "../src/lib/period-analysis";

const sample = (goals: [number, number], minutes: [number, number]): PeriodSample => ({
  goals: { messi: goals[0], ronaldo: goals[1] }, minutes: { messi: minutes[0], ronaldo: minutes[1] },
  assists: { messi: 0, ronaldo: 0 }, appearances: { messi: 1, ronaldo: 1 },
});
const season = (slug: string) => clubSeasons.find(item => item.slug === slug)!.stats;

test("absent playing samples have no rate or equal-time comparison, unlike a genuine zero", () => {
  const missing = periodAnalysis(sample([0, 1], [0, 90]), sample([0, 0], [0, 90]));
  assert.equal(missing.rates.messi, null);
  assert.equal(missing.equalMinutes, null);
  assert.equal(missing.changes!.messi.rate, null);
  const zero = periodAnalysis(sample([0, 1], [90, 90]));
  assert.equal(zero.rates.messi, 0);
  assert.deepEqual(zero.equalMinutes, { messi: 0, ronaldo: 1 });
});

test("equal time uses the smaller actual sample and never rounds intermediate rates", () => {
  const result = periodAnalysis(sample([1, 2], [333, 500]), sample([1, 1], [334, 500]));
  assert.equal(result.commonMinutes, 333);
  assert.deepEqual(result.equalMinutes, { messi: 1, ronaldo: 1.332 });
  assert.equal(result.changes!.messi.rate, 90 / 333 - 90 / 334);
  assert.ok(result.changes!.messi.rate! > 0);
  assert.equal(result.changes!.messi.minutes, -1);
});

test("editorial findings agree with the published season samples", () => {
  const reversedRate = periodAnalysis(season("2017-2018"));
  assert.equal(reversedRate.goalsGap, 1);
  assert.ok(reversedRate.rates.messi! < reversedRate.rates.ronaldo!);
  assert.ok(reversedRate.equalMinutes!.messi < reversedRate.equalMinutes!.ronaldo);
  const reversedContributions = periodAnalysis(season("2014-2015"));
  assert.equal(reversedContributions.goalsGap, -3);
  assert.equal(reversedContributions.contributionGap, 3);
  const fallingTotal = periodAnalysis(season("2012-2013"), season("2011-2012"));
  assert.ok(fallingTotal.changes!.messi.goals < 0);
  assert.ok(fallingTotal.changes!.messi.rate! > 0);
  assert.equal(periodAnalysis(season("2026-2027")).changes, undefined);
});

test("every published club season has its own editorial observation", () => {
  assert.deepEqual(Object.keys(clubSeasonNotes).sort(), clubSeasons.map(item => item.slug).sort());
  assert.equal(new Set(Object.values(clubSeasonNotes)).size, clubSeasons.length);
});
