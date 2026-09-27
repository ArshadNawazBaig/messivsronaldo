import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarSummaryRows, seasonSummaryRows } from "../src/lib/archive-summary";
import { calendarYears } from "../src/lib/data";
import { seasons } from "../src/lib/seasons";

test("year summaries retain zero counts and distinguish unavailable rates", () => {
  const first = calendarSummaryRows(calendarYears[0].career);
  assert.equal(first.find(row => row.label === "Goals")!.values.messi, 0);
  assert.equal(first.find(row => row.label === "Goals per 90 minutes")!.values.messi, null);
  const year = calendarYears.find(item => item.year === 2012)!;
  const rows = calendarSummaryRows(year.career);
  assert.equal(rows.find(row => row.label === "Goals")!.values.messi, 91);
  assert.equal(rows.find(row => row.label === "Assists")!.values.messi, year.career.assists.messi);
  assert.equal(rows.find(row => row.label === "Goals + assists per 90")!.values.ronaldo,
    (year.career.goals.ronaldo + year.career.assists.ronaldo) * 90 / year.career.minutes.ronaldo);
});

test("season summaries keep league and Champions League figures separate", () => {
  const season = seasons.find(item => item.slug === "2011-12")!;
  assert.deepEqual(seasonSummaryRows(season.league)[0].values, { messi: 50, ronaldo: 46 });
  assert.deepEqual(seasonSummaryRows(season.ucl)[0].values, { messi: 14, ronaldo: 10 });
  assert.equal(seasonSummaryRows(season.league)[2].values.messi, 50 / 37);
});
