import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { comparisonBarShare, comparisonDifference, comparisonPosterFilename, comparisonPosterSchema, comparisonRows, comparisonRowValue, getComparisonPoster } from "../src/lib/comparison-poster";
import { posterScopeIds } from "../src/lib/player-poster";
import { teamTrophyTotals } from "../src/lib/team-honours";
import type { MatchRecord } from "../src/lib/admin/model";

const request = { design: "comparison", scope: "career", format: "portrait", theme: "dark" } as const;
test("comparison exports accept only a published scope and bounded render options", () => {
  assert.equal(comparisonPosterSchema.safeParse(request).success, true);
  for (const change of [{ scope: "unknown" }, { player: "messi" }, { values: { messi: 10000 } }, { imageUrl: "https://example.com" }, { width: 100000 }, { format: "banner" }]) {
    assert.equal(comparisonPosterSchema.safeParse({ ...request, ...change }).success, false);
  }
});

test("career comparison combines the same published match, award and trophy registers", () => {
  const poster = getComparisonPoster(buildPublishedData(), request);
  const row = (id: string) => poster.rows.find(item => item.id === id)!;
  assert.equal(poster.rows.length, 9);
  assert.deepEqual(row("goals").values, { messi: 930, ronaldo: 979 });
  assert.deepEqual(row("contributions").values, { messi: 1354, ronaldo: 1240 });
  assert.deepEqual(row("team-trophies").values, teamTrophyTotals);
  assert.deepEqual(teamTrophyTotals, { messi: 49, ronaldo: 37 });
  assert.deepEqual(row("ballon-dor").values, { messi: 8, ronaldo: 5 });
  assert.deepEqual(row("golden-shoes").values, { messi: 6, ronaldo: 4 });
  assert.match(poster.notes.join(" "), /youth\/Olympic/);
  assert.match(poster.notes.join(" "), /completed editions through 2025/);
  assert.ok(!poster.rows.some(item => /dribbl/i.test(item.label)));
  assert.equal(comparisonPosterFilename(request, poster), "messi-vs-ronaldo-career-comparison-2026-09-21-dark-portrait.png");
});

test("competition views never reuse career trophies, awards or mismatched assist definitions", () => {
  const data = buildPublishedData();
  for (const scope of posterScopeIds.filter(id => id !== "career")) {
    const poster = getComparisonPoster(data, { scope });
    assert.ok(poster.rows.length >= 7 && poster.rows.length <= 9);
    assert.ok(!poster.rows.some(row => ["team-trophies", "ballon-dor", "golden-shoes"].includes(row.id)));
  }
  assert.deepEqual(getComparisonPoster(data, { scope: "champions-league" }).rows.find(row => row.id === "assists")!.values, { messi: 40, ronaldo: 42 });
  const continental = getComparisonPoster(data, { scope: "copa-euros" });
  assert.equal(continental.competition, "Copa América / Euros");
  assert.match(continental.notes.join(" "), /Different tournaments/);
  assert.equal(getComparisonPoster(data, { scope: "world-cup" }).competition, "World Cup stats");
});

test("new match publications update core stats without advancing awards or unverified goal types", () => {
  const record: MatchRecord = {
    id: "manual:comparison-test", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Test only", competition: "Test",
    category: "league", goals: 2, assists: 1, appearances: 1, minutes: 90, headToHead: false,
    source: "https://example.com", provider: "manual", note: "Synthetic fixture", locked: true,
  };
  const before = getComparisonPoster(buildPublishedData(), request);
  const after = getComparisonPoster(buildPublishedData([record], 1), request);
  assert.equal(after.date, "2026-09-22");
  assert.equal(after.rows.find(row => row.id === "contributions")!.values.messi, 1357);
  for (const id of ["team-trophies", "ballon-dor", "golden-shoes", "freeKicks"]) {
    assert.deepEqual(after.rows.find(row => row.id === id), before.rows.find(row => row.id === id));
  }
});

test("comparison bars and rates handle zero and unavailable data without inventing a lead", () => {
  const row = { id: "test", label: "Test", values: { messi: 0, ronaldo: 0 }, date: "2026-09-21" };
  assert.equal(comparisonBarShare(row), .5);
  assert.equal(comparisonBarShare({ ...row, values: { messi: 3, ronaldo: 1 } }), .75);
  assert.equal(comparisonBarShare({ ...row, values: { messi: null, ronaldo: 1 } }), .5);
  assert.equal(comparisonRowValue({ ...row, values: { messi: null, ronaldo: 1 } }, "messi"), "—");
  const data = buildPublishedData();
  data.scopes["world-cup"].appearances.messi = 0;
  const rate = getComparisonPoster(data, { scope: "world-cup" }).rows.find(item => item.id === "goals-per-game")!;
  assert.equal(rate.values.messi, null);
  assert.ok(rate.values.ronaldo! > 0);
});

test("comparison posters use verified free-kick additions and the metric's own date",()=>{
  const record:MatchRecord={id:"manual:free-kick-test",player:"messi",date:"2026-09-27",team:"Inter Miami",opponent:"Test only",competition:"Test",category:"league",goals:1,freeKicks:1,assists:0,appearances:1,minutes:90,headToHead:false,source:"https://example.com/evidence",provider:"manual",note:"Synthetic verified free-kick fixture",locked:true};
  const poster=getComparisonPoster(buildPublishedData([record],1),request);
  const row=poster.rows.find(r=>r.id==="freeKicks")!;
  assert.deepEqual(row.values,{messi:76,ronaldo:65});
  assert.equal(row.date,"2026-09-27");
  assert.match(poster.notes.join(" "),/Free kicks: 2026-09-27/);
  assert.equal(poster.rows.find(r=>r.id==="hatTricks")!.date,"2026-09-27");
});

test("custom posters preserve the requested order using only available published statistics", () => {
  const poster = getComparisonPoster(buildPublishedData(), request);
  const metrics = ["assists", "goals", "appearances", "contributions"];
  assert.ok(comparisonPosterSchema.safeParse({ ...request, metrics, showBars: false }).success);
  const rows = comparisonRows(poster, metrics);
  assert.deepEqual(rows.map(row => row.id), metrics);
  assert.deepEqual(rows[0].values, { messi: 424, ronaldo: 261 });
  assert.equal(poster.rows.length, 9);
  assert.equal(comparisonRows(poster)[0].id, "goals");
  assert.throws(() => comparisonRows(poster, ["minutes"]), RangeError);
  for (const change of [
    { metrics: [] }, { metrics: ["goals", "assists", "appearances"] },
    { metrics: [...metrics, "goals"] }, { metrics: [...metrics, "made-up"] }, { showBars: "true" },
  ]) assert.equal(comparisonPosterSchema.safeParse({ ...request, ...change }).success, false);
});

test("the interactive breakdown uses displayed precision, ties and unavailable values", () => {
  const row = { id: "rate", label: "Rate", values: { messi: .624, ronaldo: .623 }, decimals: 2, date: "2026-09-21" };
  assert.deepEqual(comparisonDifference(row), { player: null, difference: 0 });
  assert.deepEqual(comparisonDifference({ ...row, values: { messi: .644, ronaldo: .623 } }), { player: "messi", difference: .02 });
  assert.deepEqual(comparisonDifference({ ...row, values: { messi: 0, ronaldo: 1 } }), { player: "ronaldo", difference: 1 });
  assert.deepEqual(comparisonDifference({ ...row, values: { messi: null, ronaldo: 1 } }), { player: null, difference: null });
});
