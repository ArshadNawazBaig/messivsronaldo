import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { calculatorRecords, calculatorPresets, calculatorHash, normalizeCalculator, parseCalculator, scoringProjection } from "../src/lib/calculator";
import { interactiveGuides } from "../src/lib/interactive-guides";
import { getPublicPages } from "../src/lib/public-pages";
import { locales } from "../src/lib/i18n/config";

const data = buildPublishedData();
const records = calculatorRecords(data);
test("independent records preserve the actual samples and calculate from unrounded counts", () => {
  for (const [preset, expected] of [["years", [65.94, 58.47]], ["league", [51.35, 52.11]], ["europe", [14, 17]]] as const) {
    const state = calculatorPresets[preset].state;
    for (const [index, player] of (["messi", "ronaldo"] as const).entries()) {
      const sample = records.find(record => record.id === state[player])!.players[player];
      assert.equal(Number(scoringProjection(sample, state.basis, state.amount)!.toFixed(2)), expected[index]);
    }
  }
  const sample = records.find(record => record.id === "year:2012")!.players.messi;
  assert.equal(scoringProjection(sample, "minutes", 900), 91 / 5972 * 900);
  assert.equal(scoringProjection(sample, "appearances", 69), 91);
  assert.deepEqual(data, buildPublishedData(), "calculations must not change published records");
});
test("unavailable samples never become invented minutes, zero rates or non-finite results", () => {
  const archive = records.find(record => record.id === "league:2011-12")!;
  assert.equal(archive.players.messi.minutes, null);
  assert.equal(scoringProjection(archive.players.messi, "minutes", 900), null);
  const state = normalizeCalculator({ ...calculatorPresets.league.state, basis: "minutes", amount: 900 }, records);
  assert.equal(state.basis, "appearances"); assert.equal(state.amount, 10);
  for (const denominator of [0, -1, Infinity, NaN]) assert.equal(scoringProjection({ goals: 0, appearances: denominator, minutes: denominator }, "minutes", 90), null);
  assert.equal(scoringProjection({ goals: 0, appearances: 10, minutes: 900 }, "minutes", 90), 0);
});
test("share links round-trip and hostile or invalid hash values are bounded", () => {
  for (const preset of Object.values(calculatorPresets)) assert.deepEqual(parseCalculator(calculatorHash(preset.state), records, calculatorPresets.career.state), preset.state);
  for (const amount of ["NaN", "Infinity", "-123", "1000000000", ""]) {
    const state = parseCalculator(`#messi=__proto__&ronaldo=bad&basis=minutes&amount=${amount}`, records, calculatorPresets.career.state);
    assert.equal(state.messi, "scope:career"); assert.equal(state.ronaldo, "scope:career");
    assert.ok(Number.isFinite(state.amount) && state.amount >= 90 && state.amount <= 9000);
  }
});
test("all interactive guides have complete translations, real presets and dated sitemap entries", () => {
  const pages = getPublicPages(data.calendarYears, data.snapshotDate);
  assert.ok(pages.some(page => page.path === "/scoring-calculator"));
  for (const guide of interactiveGuides) {
    assert.ok(Object.hasOwn(calculatorPresets, guide.preset));
    assert.equal(pages.find(page => page.path === `/insights/${guide.slug}`)?.updated, guide.updated);
    for (const locale of locales) {
      const messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
      for (const key of [guide.title, guide.description, guide.category, ...guide.sections.flatMap(section => [section.heading, section.text])]) {
        assert.ok(messages[key], `${locale}: missing ${key}`);
        if (locale !== "en") assert.notEqual(messages[key], key, `${locale}: untranslated ${key}`);
      }
    }
  }
});
