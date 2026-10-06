import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clientMessages } from "../src/lib/i18n/client-messages";
import { locales } from "../src/lib/i18n/config";
import { createTranslator, type Messages } from "../src/lib/i18n/translate";
import { buildPublishedData } from "../src/lib/published-data";
import { calculatorRecords } from "../src/lib/calculator";
import type { MatchRecord } from "../src/lib/admin/model";

test("smaller client catalogs preserve dataset labels, date patterns, aliases and interactive record choices", () => {
  const inputs = new Set(["MESSI", "Ronaldo", "Updated 27 September 2026", "Winning editions", "Only editions won by either player are shown.", "{0} appearances · {1} minutes"]);
  function collect(value: unknown) {
    if (typeof value === "string") inputs.add(value);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  }
  const data = buildPublishedData();
  collect(data); collect(calculatorRecords(data));
  for (const locale of locales) {
    const full: Messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    const reduced = clientMessages(full);
    const before = createTranslator(locale, full), after = createTranslator(locale, reduced);
    for (const input of inputs) assert.equal(after(input, { 0: 69, 1: 5972 }), before(input, { 0: 69, 1: 5972 }), `${locale}: ${input}`);
    // Actual serialized bytes, rather than a hard-coded number of dictionary keys.
    assert.ok(Buffer.byteLength(JSON.stringify(reduced)) < Buffer.byteLength(JSON.stringify(full)) * 0.65, locale);
  }
});

test("published coverage and classification gaps stay explicit in every language", () => {
  const record: MatchRecord = { id: "manual:translation-fixture", player: "messi", date: "2026-09-24", team: "Example", opponent: "Example", competition: "Example", category: "league", goals: 1, assists: 0, appearances: 1, minutes: 90, headToHead: false, source: "https://example.com", provider: "manual", note: "Synthetic test fixture", locked: true };
  const data = buildPublishedData([{ ...record, freeKicks: 1 }, { ...record, id: "manual:translation-fixture-2", date: "2026-09-25" }]);
  const messages = [data.coverageNote, data.scopes.career.description, data.scopes["2026"].description,
    ...data.scopes.career.metrics.filter(metric => metric.group === "scoring").flatMap(metric => [metric.explanation, metric.coverage ?? ""])];
  for (const locale of locales.filter(locale => locale !== "en")) {
    const full: Messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    const t = createTranslator(locale, clientMessages(full));
    for (const value of messages.filter(Boolean)) {
      assert.notEqual(t(value), value, `${locale}: ${value}`);
      assert.doesNotMatch(t(value), /Reviewed baseline|match record\(s\)|unlisted dates|\{\d+\}/, locale);
    }
  }
});
