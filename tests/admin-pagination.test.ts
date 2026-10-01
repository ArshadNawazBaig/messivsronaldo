import assert from "node:assert/strict";
import test from "node:test";
import { paginationNumbers, paginationState } from "../src/lib/admin/pagination";
import { listActivity } from "../src/lib/admin/activity";
import { openStore } from "../src/lib/admin/store";

test("pagination handles empty results, partial pages and a deleted final page", () => {
  assert.deepEqual(paginationState(0, 3, 20), { page: 0, pages: 1, start: 0, end: 0 });
  assert.deepEqual(paginationState(41, 2, 20), { page: 2, pages: 3, start: 40, end: 41 });
  assert.deepEqual(paginationState(40, 2, 20), { page: 1, pages: 2, start: 20, end: 40 });
  assert.deepEqual(paginationNumbers(5, 12), [0, "gap", 4, 5, 6, "gap", 11]);
});
test("activity pagination reaches old records, searches literally, bounds queries and omits rollback data", async () => {
  const db = openStore(":memory:");
  try {
    const insert = db.prepare("INSERT INTO runs(at,date,action,status,message,before_data) VALUES (?,?,?,?,?,?)");
    for (let i = 0; i < 125; i++) insert.run("2026-10-01T10:00:00Z", "2026-09-25", "check", "success", i === 0 ? "Literal 10%_ query" : `Synthetic run ${i}`, '[{"private":"rollback-payload"}]');
    const first = await listActivity({ pageSize: 20 }, db);
    const old = await listActivity({ pageSize: 20, page: 6 }, db);
    assert.equal((await listActivity({}, db)).rows.length, 10);
    assert.equal(first.total, 125); assert.equal(first.rows.length, 20);
    assert.equal(old.rows.length, 5); assert.equal(old.rows.at(-1)?.id, 1);
    assert.equal("before_data" in first.rows[0], false);
    assert.equal((await listActivity({ query: "10%_" }, db)).total, 1);
    assert.equal((await listActivity({ page: 999 }, db)).page, 12);
    assert.equal((await listActivity({ query: "missing" }, db)).rows.length, 0);
    for (const invalid of [{ page: -1 }, { pageSize: 500 }, { query: "x".repeat(201) }]) await assert.rejects(listActivity(invalid, db));
  } finally { db.close(); }
});
