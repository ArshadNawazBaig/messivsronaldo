import assert from "node:assert/strict";
import test from "node:test";
import response from "./fixtures/api-football-2026-09-20.json";
import { fetchDate, type ProviderFetch } from "../src/lib/admin/provider";
import { AdminError } from "../src/lib/admin/model";

const connection = {key:"test-only-key",messi:{player:154,club:9568,country:26},ronaldo:{player:874,club:2939,country:27}};
const fetcher: ProviderFetch = async path => response[path as keyof typeof response];

test("September 20 live response validates including league lookup and complete match events", async () => {
  // Minimal public fields captured from the provider; no key or database publication.
  const result = await fetchDate("2026-09-20", connection, fetcher);
  assert.equal(result.fixtures, 1);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, "api:1490495:messi");
  assert.equal(result.records[0].category, "league");
  assert.equal(result.records[0].opponent, "San Diego");
  const statistics = response["fixtures/players"].find(row => row.team.id === 9568)!.players.find(row => row.player.id === 154)!.statistics[0];
  assert.equal(result.records[0].goals, statistics.goals.total);
  assert.equal(result.records[0].minutes, statistics.games.minutes);
});

test("invalid player data explains the fixture and field instead of blaming the admin form", async () => {
  await assert.rejects(() => fetchDate("2026-09-20", connection, async (path, params) => {
    if (path === "fixtures/players") return [{team:{id:9568},players:[{player:{id:154},statistics:[{games:{minutes:"unknown"},goals:{total:0,assists:0}}]}]}];
    return fetcher(path, params);
  }), (error: unknown) => {
    assert.ok(error instanceof AdminError);
    assert.equal(error.status, 422);
    assert.match(error.message, /player statistics for fixture 1490495 on 2026-09-20/);
    assert.match(error.message, /games.minutes/);
    assert.doesNotMatch(error.message, /evidence URL/);
    return true;
  });
});
