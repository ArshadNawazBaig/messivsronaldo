import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { awardComparisons, awardRows, awardSlugs, awardTotals, honoursNavigation } from "../src/lib/awards";
import { calendarYears, snapshotDate } from "../src/lib/data";
import { getPublicPages } from "../src/lib/public-pages";
import { locales } from "../src/lib/i18n/config";

test("award editions reconcile with card totals and remain separate from match awards", () => {
  const expected = { "ballon-dor": [8, 5], "golden-boots": [6, 4], "fifa-awards": [3, 2], "uefa-awards": [2, 3] } as const;
  for (const [slug, values] of Object.entries(expected)) {
    const key = slug as keyof typeof expected;
    const rows = awardRows(key);
    assert.deepEqual(awardTotals(key), { messi: values[0], ronaldo: values[1] });
    for (const player of ["messi", "ronaldo"] as const) assert.equal(rows.reduce((sum, row) => sum + row.values[player], 0), awardTotals(key)[player]);
    assert.equal(new Set(rows.map(row => row.label)).size, rows.length);
  }
  assert.ok(!awardRows("ballon-dor").some(row => ["2020", "2026"].includes(row.label)));
  assert.deepEqual(awardTotals("man-of-the-match"), { messi: 333, ronaldo: 168 });
  assert.equal(awardRows("man-of-the-match")[1].percent, true);
  assert.match(awardComparisons["man-of-the-match"].note, /partial career coverage/);
});

test("every award destination has metadata, a sitemap entry and complete translations", () => {
  const pages = getPublicPages(calendarYears, snapshotDate);
  for (const { href } of honoursNavigation) assert.equal(pages.filter(page => page.path === href).length, 1, href);
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    for (const slug of awardSlugs) {
      const award = awardComparisons[slug];
      const page = pages.find(page => page.path === `/${slug}`)!;
      assert.equal(page.group, "Comparisons");
      for (const message of [page.title, award.label, award.description, award.cardLabel, award.context, award.note]) assert.ok(messages[message], `${locale}: ${message}`);
      for (const source of award.sources) assert.equal(new URL(source.url).protocol, "https:");
    }
  }
});
