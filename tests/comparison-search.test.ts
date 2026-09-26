import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { comparisonFocus } from "../src/lib/comparison-focus";
import { comparisonIntro, comparisonQuestions } from "../src/lib/comparison-copy";
import { buildPublishedData } from "../src/lib/published-data";
import { createTranslator } from "../src/lib/i18n/translate";
import { locales } from "../src/lib/i18n/config";
import { getPublicPages } from "../src/lib/public-pages";
import type { MatchRecord } from "../src/lib/admin/model";

const match: MatchRecord = { id: "manual:seo-test", player: "messi", date: "2026-09-24", team: "Inter Miami", opponent: "Synthetic opponent", competition: "Synthetic league", category: "league", goals: 2, assists: 1, appearances: 1, minutes: 90, headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic test fixture", locked: true };
const english = createTranslator("en", {});

test("featured cards and copy keep old goal-type dates after newer career updates", () => {
  const before = buildPublishedData();
  const after = buildPublishedData([match], 1);
  const focus = comparisonFocus(after.scopes.career, "freeKicks", after.baselineDate, after.snapshotDate);
  assert.deepEqual(focus.values, { messi: 75, ronaldo: 65 });
  assert.equal(focus.date, "2026-09-21");
  assert.match(focus.period, /21 September 2026/);
  assert.doesNotMatch(comparisonIntro("free-kicks", after, english)!, /24 September|2026-09-24|932/);
  assert.equal(comparisonIntro("free-kicks", before, english), comparisonIntro("free-kicks", after, english));
  assert.match(comparisonIntro("goals", after, english)!, /932/);
  assert.match(comparisonIntro("goals", after, english)!, /recorded matches to 2026-09-24/);
  assert.equal(comparisonFocus(after.scopes.career, "assists", after.baselineDate, after.snapshotDate).values.messi, 425);
  assert.equal(comparisonFocus(after.scopes.career, "assists", after.baselineDate, after.snapshotDate).date, "2026-09-24");
});

test("missing breakdowns stay unavailable while genuine zeros remain zero", () => {
  const data = buildPublishedData();
  const scope = structuredClone(data.scopes.career);
  scope.metrics = scope.metrics.filter(metric => metric.id !== "freeKicks");
  assert.deepEqual(comparisonFocus(scope, "freeKicks", data.baselineDate, data.snapshotDate).values, { messi: null, ronaldo: null });
  scope.metrics.push({ ...data.scopes.career.metrics.find(metric => metric.id === "freeKicks")!, values: { messi: 0, ronaldo: 0 } });
  assert.deepEqual(comparisonFocus(scope, "freeKicks", data.baselineDate, data.snapshotDate).values, { messi: 0, ronaldo: 0 });
});

test("visible answers and metadata are translated with the same published values", () => {
  const data = buildPublishedData();
  for (const locale of locales) {
    const t = createTranslator(locale, JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8")));
    for (const slug of ["goals", "free-kicks", "la-liga", "honours"]) {
      const intro = comparisonIntro(slug, data, t, { messi: 48, ronaldo: 36 })!;
      assert.ok(intro.length > 50, `${locale}/${slug}`);
      assert.doesNotMatch(intro, /\{\d+\}/);
      if (locale !== "en") assert.notEqual(intro, comparisonIntro(slug, data, english, { messi: 48, ronaldo: 36 }));
      for (const item of comparisonQuestions(slug, data, t)) {
        assert.ok(item.answer.length > 20);
        assert.doesNotMatch(item.answer, /\{\d+\}/);
      }
    }
  }
  assert.match(comparisonIntro("la-liga", data, english)!, /474.*520.*311.*292/);
  const answers = comparisonQuestions("goals", data, english);
  assert.match(answers[0].answer, /1176.*1337/);
  assert.match(answers[2].answer, /international friendlies.*Club friendlies.*excluded/);
});

test("sitemap records the content revision separately from the statistic cutoff", () => {
  const data = buildPublishedData();
  const pages = getPublicPages(data.calendarYears, data.snapshotDate);
  for (const slug of ["goals", "free-kicks", "la-liga", "honours"]) assert.equal(pages.find(page => page.path === `/${slug}`)!.updated, "2026-09-26");
  assert.equal(data.snapshotDate, "2026-09-21");
  assert.equal(getPublicPages(data.calendarYears, "2026-10-01").find(page => page.path === "/goals")!.updated, "2026-10-01");
});
