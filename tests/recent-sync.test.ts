import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { syncLatest, recentSyncDates } from "../src/lib/admin/recent-sync";
import { AdminError } from "../src/lib/admin/model";
import { apiClient, type ProviderFetch } from "../src/lib/admin/provider-client";
import { store, saveConnection, history, readRecords, revision } from "../src/lib/admin/store";

process.env.ADMIN_DATABASE_PATH = ":memory:";
process.env.ADMIN_SESSION_SECRET = "recent-sync-test-secret-at-least-32-characters";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const connection = { key: "synthetic-key", messi: { player: 154, club: 9568, country: 26 }, ronaldo: { player: 874, club: 2939, country: 27 } };
const now = new Date("2026-09-28T07:19:04Z");
function provider(calls: string[] = []): ProviderFetch {
  return async (path, params) => {
    if (path === "fixtures") {
      calls.push(String(params.date));
      return params.date === "2026-09-27" ? [{
        fixture: { id: 100, date: "2026-09-27T23:00:00Z", status: { short: "FT" } },
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

test("latest update finds an overnight match by yesterday's kickoff, not just today's date", async () => {
  const calls: string[] = [];
  const result = await syncLatest(0, { now, fetcher: provider(calls) });
  assert.equal(result.status, "success");
  assert.deepEqual(calls, ["2026-09-28", "2026-09-27", "2026-09-26", "2026-09-25", "2026-09-24", "2026-09-23", "2026-09-22"]);
  assert.equal(readRecords()[0].goals, 1);
  assert.equal(revision(), 1);
  const empty = history().find(run => run.date === "2026-09-28" && run.action === "check")!;
  assert.equal(empty.status, "no-fixtures");
  assert.match(empty.message, /UTC kickoff date/);
  assert.equal((await syncLatest(1, { now, fetcher: provider() })).status, "success");
  assert.equal(revision(), 1, "repeat updates on the same day must not double-count");
  assert.deepEqual(recentSyncDates("2026-09-22"), ["2026-09-22"]);
});

test("real subscription errors surface as partial coverage while available matches still publish", async () => {
  const blocked = apiClient("synthetic-key", async () => Response.json({errors:{plan:"Free plans do not have access to this date."},response:[]}));
  const valid = provider();
  const calls: string[] = [];
  const result = await syncLatest(0, { now, fetcher: async (path, params) => {
    if (path === "fixtures") calls.push(String(params.date));
    return params.date === "2026-09-26" ? blocked(path, params) : valid(path, params);
  } });
  assert.equal(result.status, "partial");
  assert.match(result.warnings[0], /2026-09-26:.*subscription.*verified match manually/);
  assert.ok(calls.includes("2026-09-24"), "a blocked date must not prevent checking another date");
  assert.equal(readRecords().length, 1);
  assert.match(result.message, /6 of 7 UTC dates verified/);
});

test("quota failures stop requests, report unchecked dates and release the lock", async () => {
  let calls = 0;
  const result = await syncLatest(0, { now, fetcher: async () => { calls++; throw new AdminError("Daily request quota reached.", 429); } });
  assert.equal(calls, 1);
  assert.equal(result.status, "failed");
  assert.match(result.message, /6 date\(s\) not checked/);
  assert.equal(readRecords().length, 0);
  assert.equal(store().prepare("SELECT * FROM locks").all().length, 0);
});

test("stale revisions and concurrent updates cannot start another provider batch", async () => {
  let calls = 0;
  await assert.rejects(() => syncLatest(99, { now, fetcher: async () => { calls++; return []; } }), /Refresh the dashboard/);
  assert.equal(calls, 0);
  let entered!: () => void;
  let finish!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const pending = new Promise<void>(resolve => { finish = resolve; });
  const running = syncLatest(0, { now, fetcher: async () => { entered(); await pending; return []; } });
  await started;
  await assert.rejects(() => syncLatest(0, { now, fetcher: provider() }), /already running/);
  finish();
  await running;
});
