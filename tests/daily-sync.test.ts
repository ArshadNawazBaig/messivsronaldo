import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { runDailySync, dailySyncDates } from "../src/lib/admin/daily-sync";
import { readDailySyncState, saveDailySyncState } from "../src/lib/admin/daily-sync-state";
import { AdminError } from "../src/lib/admin/model";
import { getAdminState } from "../src/lib/admin/service";
import { store, saveConnection, history, readRecords, revision, commitRecords, undoLast } from "../src/lib/admin/store";
import type { ProviderFetch } from "../src/lib/admin/provider-client";
import { buildPublishedData } from "../src/lib/published-data";

// This file runs in its own Node test process. All mutations stay in memory.
process.env.ADMIN_DATABASE_PATH = ":memory:";
process.env.ADMIN_SESSION_SECRET = "daily-sync-test-secret-at-least-32-characters";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const connection = { key: "synthetic-key", messi: { player: 154, club: 9568, country: 26 }, ronaldo: { player: 874, club: 2939, country: 27 } };
const now = new Date("2026-09-26T08:00:00Z");
function provider(calls: string[] = [], status = "FT"): ProviderFetch {
  return async (path, params) => {
    if (path === "fixtures") {
      calls.push(String(params.date));
      return params.date === "2026-09-22" ? [{
        fixture: { id: 100, date: "2026-09-22T20:00:00Z", status: { short: status } },
        goals: { home: 1, away: 0 }, league: { id: 253, name: "Major League Soccer", type: "League", round: "Regular Season - 30" },
        teams: { home: { id: 9568, name: "Inter Miami" }, away: { id: 1000, name: "Synthetic opponent" } },
      }] : [];
    }
    if (path === "fixtures/players") return [{ team: { id: 9568 }, players: [{ player: { id: 154 }, statistics: [{ games: { minutes: 90 }, goals: { total: 1, assists: 0 } }] }] }];
    if (path === "fixtures/events") return [{ type: "Goal", detail: "Normal Goal", player: { id: 154 }, assist: { id: null } }];
    throw new Error(`Unexpected endpoint ${path}`);
  };
}
beforeEach(() => {
  for (const table of ["settings", "matches", "runs", "locks"]) store().prepare(`DELETE FROM ${table}`).run();
  store().prepare("UPDATE state SET revision=0").run();
  saveConnection(connection);
});

test("daily run catches up completed UTC dates and publishes consistent totals only once", async () => {
  const calls: string[] = [];
  const result = await runDailySync({ now, fetcher: provider(calls) });
  assert.equal(result.status, "success");
  assert.equal(result.scannedThrough, "2026-09-25");
  assert.deepEqual(calls, ["2026-09-25", "2026-09-24", "2026-09-22", "2026-09-23"]);
  assert.equal(readRecords().length, 1);
  assert.equal(revision(), 1);
  const published = buildPublishedData(readRecords(), revision());
  for (const scope of ["career", "club", "current-clubs", "league", "2026"] as const) {
    assert.equal(published.scopes[scope].goals.messi, buildPublishedData().scopes[scope].goals.messi + 1);
  }
  const repeat = await runDailySync({ now, fetcher: provider(calls) });
  assert.equal(repeat.skipped, true);
  assert.equal(calls.length, 4);
  assert.equal(revision(), 1);
  assert.equal((await getAdminState()).automaticUpdates.lastRunDate, "2026-09-26");
  assert.ok(history().some(run => run.action === "daily" && run.status === "success"));
  undoLast(1);
  assert.deepEqual(readRecords(), []);
});

test("next day checks recent dates for corrections without double-counting or overwriting manual edits", async () => {
  await runDailySync({ now: new Date("2026-09-23T08:00:00Z"), fetcher: provider() });
  const [original] = readRecords();
  commitRecords(1, [{ ...original, goals: 2, provider: "manual", locked: true }], original.date, "manual", "Verified correction");
  const calls: string[] = [];
  await runDailySync({ now: new Date("2026-09-24T08:00:00Z"), fetcher: provider(calls) });
  assert.deepEqual(calls, ["2026-09-23", "2026-09-22"]);
  assert.equal(readRecords()[0].goals, 2);
  assert.equal(revision(), 2);
});

test("failed or postponed fixtures are retried after they leave the recent-date window", async () => {
  for (const status of ["PST", "NS", "SUSP", "PEN"]) {
    store().prepare("DELETE FROM settings WHERE key='daily-sync'").run();
    const result = await runDailySync({ now, fetcher: provider([], status) });
    assert.equal(result.status, "partial", status);
    assert.deepEqual(result.pendingDates, ["2026-09-22"], status);
  }
  const calls: string[] = [];
  const next = await runDailySync({ now: new Date("2026-09-27T08:00:00Z"), fetcher: provider(calls) });
  assert.ok(calls.includes("2026-09-22"));
  assert.equal(next.status, "success");
  assert.deepEqual(next.pendingDates, []);
  assert.equal(readRecords().length, 1);
});

test("provider quota exhaustion stops the batch and persists work for tomorrow", async () => {
  let calls = 0;
  const result = await runDailySync({ now, fetcher: async () => { calls++; throw new AdminError("Daily quota reached", 429); } });
  assert.equal(result.status, "failed");
  assert.equal(calls, 1);
  assert.deepEqual(result.pendingDates, ["2026-09-25"]);
  assert.equal(result.scannedThrough, "2026-09-21");
  assert.deepEqual(readRecords(), []);
  assert.equal((await runDailySync({ now, fetcher: provider() })).skipped, true);
  assert.equal((await runDailySync({ now: new Date("2026-09-27T08:00:00Z"), fetcher: provider() })).status, "success");
});

test("valid dates still publish when another date needs review", async () => {
  const valid = provider();
  const result = await runDailySync({ now, fetcher: async (path, params) => {
    if (params.date === "2026-09-25") throw new AdminError("Match still live", 409);
    return valid(path, params);
  } });
  assert.equal(result.status, "partial");
  assert.equal(readRecords().length, 1);
  assert.deepEqual(result.pendingDates, ["2026-09-25"]);
});

test("large backlogs are bounded and advance on following days", async () => {
  const calls: string[] = [];
  const result = await runDailySync({ now: new Date("2026-10-10T08:00:00Z"), fetcher: provider(calls) });
  assert.equal(calls.length, 7);
  assert.equal(result.scannedThrough, "2026-09-26");
  assert.equal(result.status, "partial");
  const next = await runDailySync({ now: new Date("2026-10-11T08:00:00Z"), fetcher: provider() });
  assert.equal(next.scannedThrough, "2026-10-01");
  assert.ok(dailySyncDates("2026-09-22", { ...result, scannedThrough: "2026-09-21", pendingDates: [] }).length === 0);
});

test("concurrent requests cannot fetch or publish together; the lock is released", async () => {
  let finish!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const pending = new Promise<void>(resolve => { finish = resolve; });
  const running = runDailySync({ now, fetcher: async () => { entered(); await pending; return []; } });
  await started;
  await assert.rejects(() => runDailySync({ now, fetcher: provider() }), /already running/);
  finish();
  await running;
  assert.equal((await runDailySync({ now, fetcher: provider() })).skipped, true);
  assert.equal(store().prepare("SELECT * FROM locks").all().length, 0);
});

test("interrupted work survives in stored state; missing provider records a useful failure", async () => {
  const initial = await readDailySyncState();
  await saveDailySyncState({ ...initial, lastRunDate: "2026-09-25", status: "running", scannedThrough: "2026-09-24", pendingDates: ["2026-09-22"] });
  const result = await runDailySync({ now, fetcher: provider() });
  assert.equal(result.status, "success");
  assert.equal(readRecords().length, 1);
  store().prepare("DELETE FROM settings").run();
  const missing = await runDailySync({ now, fetcher: provider() });
  assert.equal(missing.status, "failed");
  assert.match(missing.message, /Connect API-Football/);
  assert.equal(readRecords().length, 1);
});
