import assert from "node:assert/strict";
import test from "node:test";
import { createPublishedDataCache } from "../src/lib/published-data-cache";
import { buildPublishedData } from "../src/lib/published-data";
import type { MatchRecord } from "../src/lib/admin/model";

test("calculated statistics reuse a revision and refresh for edits, undo and independent databases", () => {
  const read = createPublishedDataCache();
  const baseline = read({ revision: 0, records: [] });
  assert.strictEqual(read({ revision: 0, records: [] }), baseline);
  const record: MatchRecord = { id: "manual:cache-test", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Synthetic opponent", competition: "Test", category: "league", goals: 1, assists: 0, minutes: 90, appearances: 1, headToHead: false, source: "https://example.com", provider: "manual", note: "Synthetic cache fixture", locked: true };
  const changed = read({ revision: 1, records: [record] });
  assert.deepEqual(changed, buildPublishedData([record], 1));
  assert.equal(changed.scopes.career.goals.messi, baseline.scopes.career.goals.messi + 1);
  assert.strictEqual(read({ revision: 1, records: structuredClone([record]) }), changed);
  const restored = read({ revision: 2, records: [] });
  assert.equal(restored.scopes.career.goals.messi, baseline.scopes.career.goals.messi);
  assert.notEqual(restored.datasetVersion, baseline.datasetVersion);
  const independent = createPublishedDataCache()({ revision: 1, records: [] });
  assert.equal(independent.scopes.career.goals.messi, baseline.scopes.career.goals.messi);
  // An older in-flight read must not receive values from a newer revision.
  assert.deepEqual(read({ revision: 0, records: [] }), baseline);
});
