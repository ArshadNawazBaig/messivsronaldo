import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import * as db from "../src/lib/admin/database";
import type { MatchRecord } from "../src/lib/admin/model";

// This suite only runs against an explicitly provided, isolated test database.
test("Postgres persists publications, serializes competing writers, and protects admin state", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  assert.match(url.pathname, /^\/rivalry_test_/);
  const previousUrl = process.env.DATABASE_URL;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.DATABASE_URL = url.href;
  process.env.ADMIN_SESSION_SECRET = "postgres-test-secret-only-at-least-32-characters";
  const sample: MatchRecord = { id: "test:messi", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Synthetic opponent", competition: "Test only", category: "league", goals: 1, assists: 0, minutes: 90, appearances: 1, headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic test only", locked: true };
  try {
    const pg = (await db.postgresStore())!;
    assert.deepEqual(await db.readSnapshot(), { revision: 0, records: [] });
    await db.commitRecords(0, [sample], sample.date, "manual", "test");
    await db.closeDatabase();
    assert.deepEqual(await db.readSnapshot(), { revision: 1, records: [sample] });
    await assert.rejects(() => db.commitRecords(0, [], sample.date, "remove", "stale"), /Data changed/);
    await assert.rejects(() => db.commitRecords(1, [sample, sample], sample.date, "manual", "duplicate"));
    assert.equal((await db.readSnapshot()).revision, 1);
    const writes = await Promise.allSettled([2, 3].map(goals => db.commitRecords(1, [{ ...sample, goals }], sample.date, "manual", "competing writer")));
    assert.equal(writes.filter(result => result.status === "fulfilled").length, 1);
    assert.equal((await db.readSnapshot()).revision, 2);
    await db.undoLast(2);
    assert.deepEqual(await db.readSnapshot(), { revision: 3, records: [sample] });
    assert.equal((await db.history()).length, 3);
    assert.equal((await db.fullHistory()).length, 3);
    const release = await db.acquireSync();
    await assert.rejects(() => db.acquireSync(), /already running/);
    await release();
    await (await db.acquireSync())();
    const connection = { key: "synthetic-provider-key", messi: { player: 1, club: 2, country: 3 }, ronaldo: { player: 4, club: 5, country: 6 } };
    await db.saveConnection(connection);
    await db.closeDatabase();
    assert.deepEqual(await db.getConnection(), connection);
    const fresh = (await db.postgresStore())!;
    const [encrypted] = await fresh`SELECT value FROM settings WHERE key='provider'`;
    assert.equal(encrypted.value.includes(connection.key), false);
    const attempts = await Promise.allSettled(Array.from({ length: 11 }, () => db.recordLoginAttempt(Date.now())));
    assert.equal(attempts.filter(result => result.status === "fulfilled").length, 10);
    const token = randomBytes(32).toString("hex");
    await db.saveSession(token, Date.now() + 60_000);
    assert.equal(await db.sessionValid(token), true);
    await db.deleteSession(token);
    assert.equal(await db.sessionValid(token), false);
    await db.recordLoginAttempt(Date.now());
    // The old connection was closed; all assertions above use fresh connections after restarts.
    assert.ok(pg);
  } finally {
    await db.closeDatabase();
    if (previousUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
});
