import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { castVote, readVote } from "../../src/lib/voting/store";
import { voteLimit, voteLimitWindow } from "../../src/lib/voting/model";

export const voteTestHash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function checkVotingStore(db?: Database.Database) {
  const first = voteTestHash("first-voter"), second = voteTestHash("second-voter"), network = voteTestHash("first-network");
  assert.deepEqual(await readVote(first, db), { choice: null, visitors: { messi: 0, ronaldo: 0 }, totals: { messi: 4021, ronaldo: 3810 } });
  const now = Date.now();
  const firstVote = await castVote({ player: "messi" }, first, network, db, now);
  assert.equal(firstVote.accepted, true);
  assert.deepEqual(firstVote.totals, { messi: 4022, ronaldo: 3810 });
  const retry = await castVote({ player: "ronaldo" }, first, network, db, now);
  assert.equal(retry.accepted, false);
  assert.equal(retry.choice, "messi");
  assert.deepEqual(retry.totals, firstVote.totals);
  const racing = await Promise.all(Array.from({ length: 10 }, (_, i) => castVote({ player: i % 2 ? "messi" : "ronaldo" }, second, network, db, now)));
  assert.equal(racing.filter(result => result.accepted).length, 1);
  assert.equal(new Set(racing.map(result => result.choice)).size, 1);
  const voted = await readVote(second, db);
  assert.equal(voted.visitors.messi + voted.visitors.ronaldo, 2);
  assert.equal((await readVote(voteTestHash("fresh-browser"), db)).choice, null);
  for (const input of [{ player: "other" }, { player: "messi", votes: 5000 }, {}, null]) {
    await assert.rejects(castVote(input, voteTestHash("invalid-browser"), network, db, now), /invalid/);
  }
  assert.deepEqual(await readVote(second, db), voted);
  const limitedNetwork = voteTestHash("limited-network");
  const attempts = await Promise.allSettled(Array.from({ length: voteLimit + 3 }, (_, i) => castVote({ player: "ronaldo" }, voteTestHash(`limited-voter-${i}`), limitedNetwork, db, now)));
  assert.equal(attempts.filter(result => result.status === "fulfilled").length, voteLimit);
  const rejectedIndex = attempts.findIndex(result => result.status === "rejected");
  const rejectedBrowser = voteTestHash(`limited-voter-${rejectedIndex}`);
  assert.equal((await readVote(rejectedBrowser, db)).choice, null, "rate limit rolls back the inserted vote");
  assert.equal((await readVote(first, db)).visitors.ronaldo, voted.visitors.ronaldo + voteLimit);
  assert.equal((await castVote({ player: "messi" }, rejectedBrowser, limitedNetwork, db, now + voteLimitWindow + 1)).accepted, true);
  assert.equal((await castVote({ player: "ronaldo" }, first, network, db, now + voteLimitWindow + 1)).accepted, false, "vote restriction does not expire with the rate limit");
}
