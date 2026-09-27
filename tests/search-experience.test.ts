import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { buildPublishedData } from "../src/lib/published-data";
import { buildRecordAnswers, filterRecordAnswers } from "../src/lib/record-answers";
import { createTranslator } from "../src/lib/i18n/translate";
import { locales } from "../src/lib/i18n/config";
import { contentTopics, relatedContent } from "../src/lib/content-discovery";
import { contentReview } from "../src/lib/content-review";
import { getPublicPages } from "../src/lib/public-pages";
import { comparisonDataset } from "../src/lib/comparison-schema";
import { articles } from "../src/lib/articles";
import type { MatchRecord } from "../src/lib/admin/model";

const t = createTranslator("en", {});
const baseline = buildPublishedData();
const match: MatchRecord = { id: "manual:answer-test", player: "messi", date: "2026-09-25", team: "Inter Miami", opponent: "Synthetic opponent", competition: "Synthetic league", category: "league", goals: 2, assists: 1, appearances: 1, minutes: 90, headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic fixture, never production data", locked: true };

test("answers advance only the scope and statistic covered by a published match", () => {
  const data = buildPublishedData([match], 1);
  const answers = buildRecordAnswers(data, t);
  assert.match(answers.find(a => a.id === "career-goals")!.answer, /932/);
  assert.equal(answers.find(a => a.id === "career-goals")!.date, "2026-09-25");
  for (const id of ["free-kicks", "penalties", "international", "la-liga"]) assert.equal(answers.find(a => a.id === id)!.date, baseline.baselineDate);
  data.scopes.career.metrics = data.scopes.career.metrics.filter(metric => metric.id !== "freeKicks");
  assert.ok(!buildRecordAnswers(data, t).some(answer => answer.id === "free-kicks"));
});

test("every language has dated numeric answers and accent-insensitive search", () => {
  for (const locale of locales) {
    const translate = createTranslator(locale, JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8")));
    const answers = buildRecordAnswers(baseline, translate);
    assert.equal(answers.length, 10);
    assert.ok(answers.every(a => !/\{\d+\}/.test(`${a.question}${a.answer}`)));
    if (locale !== "en") assert.notEqual(answers[0].question, buildRecordAnswers(baseline, t)[0].question);
    assert.equal(filterRecordAnswers(answers, "").length, 10);
    assert.equal(filterRecordAnswers(answers, "nonexistent-query").length, 0);
  }
  const answers = buildRecordAnswers(baseline, t);
  assert.equal(filterRecordAnswers(answers, "Frée KÍCKS")[0].id, "free-kicks");
});

test("topic links resolve to canonical pages, exclude the current page and keep explicit article choices", () => {
  const pages = new Set(getPublicPages(baseline.calendarYears, baseline.snapshotDate).map(p => p.path));
  for (const path of new Set(contentTopics.flat())) {
    assert.ok(pages.has(path), path);
    const related = relatedContent(path);
    assert.ok(related.length > 0 && related.length <= 4);
    assert.equal(new Set(related.map(item => item.path)).size, related.length);
    for (const item of related) { assert.notEqual(item.path, path); assert.ok(pages.has(item.path)); }
  }
  assert.ok(relatedContent("/insights/ballon-dor-2026-contenders-stats").some(item => item.path === "/insights/ballon-dor-2026-date-voting-rules"));
});

test("structured data retains cutoff, definitions, localized identities and actual displayed precision", () => {
  const data = buildPublishedData([match], 1);
  const core = comparisonDataset(data, "career", "/goals", "fr", "https://example.com", t);
  const types = comparisonDataset(data, "career", "/free-kicks", "fr", "https://example.com", t, true);
  assert.equal(core.dateModified, "2026-09-25");
  assert.equal(types.dateModified, "2026-09-21");
  assert.equal(core.url, "https://example.com/fr/goals#comparison");
  assert.equal(core.license, "https://example.com/fr/terms#using-the-content");
  assert.equal(types.license, core.license);
  assert.ok(core.citation.every(url => url.startsWith("https://")));
  assert.equal(core.variableMeasured.find(v => v.name === "Lionel Messi · Goals")!.value, 932);
  const rate = core.variableMeasured.find(v => v.name === "Lionel Messi · Goals per appearance")!.value;
  assert.equal(rate, Number((932 / 1177).toFixed(2)));
  assert.match(core.about[0]["@id"], /players\/messi#person$/);
});

test("content checks identify missing evidence, broken links and due reviews without changing publication dates", () => {
  const input = [{ ...articles[0], summary: undefined, sourceIds: [], citations: [], relatedSlugs: ["missing-article"], reviewAfter: "2026-09-28" }];
  const before = JSON.stringify(input);
  const report = contentReview(baseline, "2026-09-27", input);
  assert.ok(report.issues.some(issue => issue.reason.includes("supporting references")));
  assert.ok(report.issues.some(issue => issue.reason.includes("does not exist")));
  assert.ok(!report.issues.some(issue => issue.reason.includes("Scheduled editorial review")));
  assert.ok(contentReview(baseline, "2026-09-28", input).issues.some(issue => issue.reason.includes("Scheduled editorial review")));
  assert.equal(JSON.stringify(input), before);
});
