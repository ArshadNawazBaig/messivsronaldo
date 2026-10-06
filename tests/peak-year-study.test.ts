import assert from "node:assert/strict";
import test from "node:test";
import { peakYearStudy, peakYearStudyCsv } from "../src/lib/peak-year-study";
import { buildPublishedData } from "../src/lib/published-data";

test("the published peak-year example keeps years separate and reproduces rates without rounding inputs", () => {
  const data = buildPublishedData();
  const [messi, ronaldo] = peakYearStudy(data);
  assert.deepEqual([messi.goals, messi.appearances, ronaldo.goals, ronaldo.appearances], [91, 69, 69, 59]);
  assert.equal(messi.over50!.toFixed(2), "65.94");
  assert.equal(ronaldo.over50!.toFixed(2), "58.47");
  assert.ok(Math.abs(messi.over50! - 50 * messi.perAppearance!) < 1e-12);
  assert.match(peakYearStudyCsv(data), /"2012".*"91","69"/);
  assert.match(peakYearStudyCsv(data), /"2013".*"69","59"/);
  assert.match(peakYearStudyCsv(data), /not a forecast/);
  assert.ok(peakYearStudyCsv(data).includes(messi.source));
  assert.ok(peakYearStudyCsv(data).includes(ronaldo.source));
});

test("a missing or zero exposure is unavailable, while a genuine zero-goal sample stays zero", () => {
  const data = buildPublishedData();
  const year = data.calendarYears.find(row => row.year === 2012)!;
  year.career.appearances.messi = 0;
  assert.equal(peakYearStudy(data)[0].over50, null);
  year.career.appearances.messi = 10;
  year.career.goals.messi = 0;
  assert.equal(peakYearStudy(data)[0].over50, 0);
  data.calendarYears = data.calendarYears.filter(row => row.year !== 2013);
  assert.deepEqual(peakYearStudy(data).map(row => row.year), [2012]);
});
