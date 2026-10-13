import assert from "node:assert/strict";
import test from "node:test";
import { readSnapshot } from "../src/lib/admin/database";
import type { MatchRecord } from "../src/lib/admin/model";
import { saveMatch } from "../src/lib/admin/service";
import { commitRecords, logRun, openStore, undoLast } from "../src/lib/admin/store";
import { buildPublishedData } from "../src/lib/published-data";
import { createPublishedDataCache } from "../src/lib/published-data-cache";

const match: MatchRecord = {
  id: "manual:freshness", player: "messi", date: "2026-09-22", team: "Inter Miami",
  opponent: "Synthetic opponent", competition: "Test only", category: "league",
  goals: 1, assists: 0, appearances: 1, minutes: 90, headToHead: false,
  source: "https://example.com/test", provider: "manual", note: "Synthetic freshness test", locked: true,
};

test("a single-stat correction advances publication freshness without advancing match coverage", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-28T08:00:00.000Z") });
  const db = openStore(":memory:");
  const read = createPublishedDataCache();
  try {
    const newerMatch = { ...match, id: "manual:newer-match", date: "2026-09-27" };
    commitRecords(0, [match, newerMatch], newerMatch.date, "sync", "Initial publication", db);
    const initial = read(await readSnapshot(db));
    assert.equal(initial.lastUpdatedLabel, "28 September 2026");
    assert.equal(initial.snapshotDate, "2026-09-27");

    t.mock.timers.setTime(new Date("2026-10-13T06:08:00.000Z").getTime());
    await saveMatch({ ...match, assists: 1 }, 1, db, "2026-10-13");
    const snapshot = await readSnapshot(db);
    const updated = read(snapshot);
    assert.equal(snapshot.publishedAt, "2026-10-13T06:08:00.000Z");
    assert.equal(updated.lastUpdatedAt, snapshot.publishedAt);
    assert.equal(updated.lastUpdatedLabel, "13 October 2026");
    assert.equal(updated.snapshotDate, initial.snapshotDate);
    assert.equal(updated.scopes.career.updatedThrough, initial.scopes.career.updatedThrough);
    assert.deepEqual(updated.scopes.career.goals, initial.scopes.career.goals);
    assert.equal(updated.scopes.career.metrics.find(metric => metric.id === "assists")!.values.messi,
      initial.scopes.career.metrics.find(metric => metric.id === "assists")!.values.messi + 1);
    assert.strictEqual(read(await readSnapshot(db)), updated);

    t.mock.timers.setTime(new Date("2026-10-14T08:00:00.000Z").getTime());
    // Publication dates must survive more than the admin history's 100-row limit.
    for (let i = 0; i < 105; i++) logRun("2026-10-14", "check", "unchanged", "No changed records", [], db);
    logRun("2026-10-14", "sync", "failed", "Provider unavailable", [], db);
    logRun("2026-10-14", "connection", "success", "Unrelated settings change", [], db);
    assert.throws(() => commitRecords(1, [], match.date, "remove", "Stale write", db), /Data changed/);
    assert.throws(() => commitRecords(2, [match, match], match.date, "manual", "Duplicate IDs", db));
    assert.deepEqual(await readSnapshot(db), snapshot);
  } finally { db.close(); }
});

test("removing the final match and undoing it each retain their publication date", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-12T08:00:00.000Z") });
  const db = openStore(":memory:");
  const read = createPublishedDataCache();
  try {
    commitRecords(0, [match], match.date, "manual", "Initial publication", db);
    t.mock.timers.setTime(new Date("2026-10-13T08:00:00.000Z").getTime());
    commitRecords(1, [], match.date, "remove", "Remove match", db);
    const removed = read(await readSnapshot(db));
    assert.equal(removed.lastUpdatedLabel, "13 October 2026");
    assert.equal(removed.snapshotDate, removed.baselineDate);
    t.mock.timers.setTime(new Date("2026-10-14T08:00:00.000Z").getTime());
    undoLast(2, db);
    const restored = read(await readSnapshot(db));
    assert.equal(restored.lastUpdatedLabel, "14 October 2026");
    assert.equal(restored.snapshotDate, match.date);
  } finally { db.close(); }
});

test("unpublished data keeps its recorded baseline date instead of the request date", async () => {
  const db = openStore(":memory:");
  try {
    const snapshot = await readSnapshot(db);
    assert.deepEqual(snapshot, { revision: 0, records: [], publishedAt: null });
    const baseline = createPublishedDataCache()(snapshot);
    assert.equal(baseline.lastUpdatedAt.slice(0, 10), baseline.baselineDate);
    assert.equal(baseline.lastUpdatedLabel, baseline.snapshotLabel);
    assert.deepEqual(baseline, buildPublishedData());
  } finally { db.close(); }
});
