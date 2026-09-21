import assert from "node:assert/strict";
import test from "node:test";
import { awardHistory, comparisonCsv, getGoalValues, isScope, players, calendarYears, clubs, snapshotDate, ratio, scopeIds, scopes, sources } from "../src/lib/data";
import { seasons, seasonTotals } from "../src/lib/seasons";

test("club and international goals reconcile with the 2026 career snapshot", () => {
  for (const player of ["messi", "ronaldo"] as const) {
    assert.equal(scopes.club.goals[player] + scopes.international.goals[player], scopes.career.goals[player]);
    assert.equal(clubs.filter(c => c.player === player).reduce((n, c) => n + c.goals, 0), scopes.club.goals[player]);
  }
});
test("rates use the same competition's denominator and preserve nulls", () => {
  assert.equal(ratio(null, 90), null);
  assert.equal(ratio(3, null), null);
  assert.equal(ratio(3, 0), null);
  assert.equal(ratio(0, 10), 0);
  const ucl = scopes["champions-league"];
  assert.equal(getGoalValues(ucl, "per-game").messi, 129 / 163);
  assert.equal(getGoalValues(ucl, "per-game").ronaldo, 140 / 183);
  assert.equal(getGoalValues(scopes.career, "per-game").messi, 930 / 1176);
  assert.equal(getGoalValues(scopes.career, "per-90").ronaldo, 979 * 90 / 109295);
});
test("all published metrics have resolvable source references and finite numbers", () => {
  for (const id of scopeIds) for (const metric of scopes[id].metrics) {
    assert.ok(metric.source.length > 0);
    assert.ok(metric.explanation.length > 15);
    for (const source of metric.source) assert.ok(new URL(sources[source].url).protocol === "https:");
    for (const value of Object.values(metric.values)) assert.ok(Number.isFinite(value) && value >= 0);
  }
});
test("award chronology handles the cancelled 2020 award and reconciles winners", () => {
  assert.deepEqual(awardHistory.at(-1), { year: 2025, messi: 8, ronaldo: 5 });
  assert.equal(awardHistory.find(d => d.year === 2020)?.messi, awardHistory.find(d => d.year === 2019)?.messi);
  assert.equal(awardHistory.find(d => d.year === 2020)?.ronaldo, awardHistory.find(d => d.year === 2019)?.ronaldo);
  const ronaldoYears: readonly number[] = players.ronaldo.awards;
  assert.equal(players.messi.awards.filter(year => ronaldoYears.includes(year)).length, 0);
});
test("CSV exports retain coverage, precision, source and definition", () => {
  const csv = comparisonCsv(scopes["champions-league"]);
  assert.ok(csv.includes('"Goals per appearance","0.79","0.77"'));
  assert.ok(csv.includes("21 September 2026"));
  assert.ok(csv.includes("https://www.uefa.com/"));
  assert.equal(csv.split("\r\n").length, scopes["champions-league"].metrics.length + 1);
});
test("untrusted scope input cannot select arbitrary object properties", () => {
  assert.equal(isScope("career"), true);
  assert.equal(isScope("__proto__"), false);
  assert.equal(isScope(null), false);
  assert.equal(isScope("<script>"), false);
});
test("season rows reconcile to the published shared-era league and European totals", () => {
  assert.deepEqual(seasonTotals(seasons, "league"), { messi: { goals: 329, appearances: 309 }, ronaldo: { goals: 311, appearances: 292 } });
  assert.deepEqual(seasonTotals(seasons, "ucl"), { messi: { goals: 83, appearances: 92 }, ronaldo: { goals: 105, appearances: 101 } });
  assert.equal(new Set(seasons.map(s => s.slug)).size, 9);
  assert.equal(seasonTotals(seasons.filter(s => s.slug === "2011-12"), "league").messi.goals, 50);
});


test("all 25 calendar years reconcile goals, assists, appearances and minutes with career and club records", () => {
  assert.equal(calendarYears.length, 25);
  assert.equal(calendarYears.at(-1)?.year, Number(snapshotDate.slice(0, 4)));
  assert.equal(new Set(calendarYears.map(y => y.year)).size, calendarYears.length);
  for (const field of ["goals", "assists", "appearances", "minutes"] as const) {
    for (const player of ["messi", "ronaldo"] as const) {
      const careerMetric = scopes.career.metrics.find(m => m.id === field)!;
      assert.equal(calendarYears.reduce((n, y) => n + y.career[field][player], 0), careerMetric.values[player], field);
      for (const y of calendarYears) assert.equal(y.club[field][player] + y.international[field][player], y.career[field][player], `${y.year} ${field} ${player}`);
      const clubMetric = scopes.club.metrics.find(m => m.id === field)!;
      assert.equal(clubs.filter(c => c.player === player).reduce((n, c) => n + c[field], 0), clubMetric.values[player], `club ${field}`);
    }
  }
});
test("scoring categories reconcile and penalty conversions use attempts, not appearances", () => {
  for (const scope of Object.values(scopes)) {
    const find = (id: string) => scope.metrics.find(m => m.id === id);
    for (const player of ["messi", "ronaldo"] as const) {
      const body = ["leftFoot", "rightFoot", "headers", "otherBody"].map(find);
      assert.equal(body.reduce((n, m) => n + m!.values[player], 0), scope.goals[player], `${scope.id} body parts`);
      const penalties = find("penalties");
      if (penalties) {
        assert.equal(find("non-penalty-goals")!.values[player] + penalties.values[player], scope.goals[player]);
        assert.equal(find("penalty-conversion")!.values[player], penalties.values[player] / find("penaltyAttempts")!.values[player] * 100);
        assert.equal(["insideBox", "outsideBox", "freeKicks", "penalties"].reduce((n, id) => n + find(id)!.values[player], 0), scope.goals[player], `${scope.id} goal types`);
      }
    }
  }
});
test("UEFA's assist convention stays distinct and latest year is a partial-year comparison", () => {
  assert.equal(scopes["champions-league"].metrics.find(m => m.id === "assists")!.values.ronaldo, 42);
  assert.deepEqual(scopes["champions-league"].metrics.find(m => m.id === "assists")!.source, ["uefa"]);
  assert.equal(scopes.career.metrics.find(m => m.id === "assists")!.values.ronaldo, 261);
  assert.deepEqual(scopes["2026"].goals, { messi: 34, ronaldo: 22 });
  assert.match(scopes["2026"].description, /not a completed year/);
});
