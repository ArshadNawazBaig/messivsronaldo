import assert from "node:assert/strict";
import { test } from "node:test";
import { clubSeasons, clubSeasonRows, clubSeasonsReviewed } from "../src/lib/club-seasons";
import { calendarYears, snapshotDate } from "../src/lib/data";
import { getPublicPages } from "../src/lib/public-pages";

test("club seasons have consecutive two-year periods, complete sourced counts and explicit coverage", () => {
  assert.equal(clubSeasons.length, 25);
  assert.equal(new Set(clubSeasons.map(season => season.slug)).size, 25);
  for (const [index, season] of clubSeasons.entries()) {
    const year = 2002 + index;
    assert.equal(season.slug, `${year}-${year + 1}`);
    assert.equal(season.label, `${year}/${year + 1}`);
    assert.equal(season.source, `https://www.messivsronaldo.app/club-stats/${season.slug}/`);
    assert.equal(season.inProgress, year === 2026);
    assert.equal(season.alignedPeriod, year >= 2023);
    for (const player of ["messi", "ronaldo"] as const) {
      for (const pair of Object.values(season.stats)) assert.ok(Number.isInteger(pair[player]) && pair[player] >= 0);
      assert.ok(season.stats.minutes[player] <= season.stats.appearances[player] * 130);
    }
  }
});

test("2012/2013 uses all-competition club totals rather than calendar-year or league totals", () => {
  const season = clubSeasons.find(item => item.slug === "2012-2013")!;
  assert.deepEqual(season.stats, {
    goals: { messi: 60, ronaldo: 55 }, assists: { messi: 15, ronaldo: 12 },
    appearances: { messi: 50, ronaldo: 55 }, minutes: { messi: 4067, ronaldo: 4634 },
  });
  assert.notDeepEqual(season.stats.goals, calendarYears.find(year => year.year === 2012)!.career.goals);
  const rows = clubSeasonRows(season);
  assert.equal(rows.find(row => row.label === "Goals + assists")!.values.messi, 75);
  assert.equal(rows.find(row => row.label === "Goals per 90 minutes")!.values.ronaldo, 55 * 90 / 4634);
  assert.equal(rows.find(row => row.label === "Minutes per goal")!.values.messi, 4067 / 60);
});

test("pre-debut seasons retain real zero counts and unavailable rates", () => {
  const rows = clubSeasonRows(clubSeasons[0]);
  assert.equal(rows.find(row => row.label === "Goals")!.values.messi, 0);
  for (const label of ["Goals per appearance", "Goals per 90 minutes", "Goals + assists per 90", "Minutes per goal"]) {
    assert.equal(rows.find(row => row.label === label)!.values.messi, null);
  }
});

test("club-season URLs are registered once and keep the calendar and competition archives", () => {
  const pages = getPublicPages(calendarYears, snapshotDate);
  const clubPages = pages.filter(page => page.group === "Club seasons");
  assert.equal(clubPages.length, 26);
  for (const season of clubSeasons) {
    const page = clubPages.find(page => page.path === `/club-stats/${season.slug}`)!;
    assert.ok(page.title.includes(season.label));
    assert.ok(page.updated! >= clubSeasonsReviewed, "the page date includes later editorial changes without changing the source review date");
  }
  assert.equal(new Set(pages.map(page => page.path)).size, pages.length);
  assert.ok(pages.some(page => page.path === "/seasons/2012"));
  assert.ok(pages.some(page => page.path === "/seasons/2012-13"));
});
