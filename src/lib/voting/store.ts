import type Database from "better-sqlite3";
import { postgresStore } from "../admin/database";
import { store } from "../admin/store";
import { startingVotes, voteLimit, voteLimitWindow, voteSubmission, VoteError, type VotePlayer, type VoteState } from "./model";

type CountRow = { player: VotePlayer; votes: number; choice: VotePlayer | null };
function stateFromRows(rows: CountRow[]): VoteState {
  if (rows.length !== 2 || new Set(rows.map(row => row.player)).size !== 2) throw new VoteError("unavailable", 503);
  const visitors = Object.fromEntries(rows.map(row => [row.player, Number(row.votes)])) as Record<VotePlayer, number>;
  return { choice: rows[0].choice ?? null, visitors, totals: { messi: startingVotes.messi + visitors.messi, ronaldo: startingVotes.ronaldo + visitors.ronaldo } };
}
const localState = (db: Database.Database, browserHash: string) => stateFromRows(db.prepare("SELECT player,votes,(SELECT player FROM fan_votes WHERE browser_hash=?) AS choice FROM fan_vote_counts ORDER BY player").all(browserHash) as CountRow[]);

export async function readVote(browserHash: string, db?: Database.Database): Promise<VoteState> {
  const pg = db ? null : await postgresStore();
  return pg ? stateFromRows(await pg`SELECT player,votes,(SELECT player FROM fan_votes WHERE browser_hash=${browserHash}) AS choice FROM fan_vote_counts ORDER BY player` as unknown as CountRow[])
    : localState(db ?? store(), browserHash);
}

export async function castVote(input: unknown, browserHash: string, clientKey: string, db?: Database.Database, now = Date.now()) {
  const parsed = voteSubmission.safeParse(input);
  if (!parsed.success || !/^[a-f0-9]{64}$/.test(browserHash) || !/^[a-f0-9]{64}$/.test(clientKey)) throw new VoteError("invalid", 400);
  const { player } = parsed.data;
  const pg = db ? null : await postgresStore();
  if (pg) return pg.begin(async tx => {
    // The primary key serializes submissions from the same browser, including
    // retries after an interrupted response and competing votes in other tabs.
    const inserted = await tx`INSERT INTO fan_votes (browser_hash,player,created_at) VALUES (${browserHash},${player},${new Date(now).toISOString()}) ON CONFLICT DO NOTHING RETURNING player`;
    if (inserted.length) {
      await tx`DELETE FROM fan_vote_limits WHERE expires <= ${now}`;
      const allowed = await tx`INSERT INTO fan_vote_limits (key,count,expires) VALUES (${clientKey},1,${now + voteLimitWindow}) ON CONFLICT (key) DO UPDATE SET count=fan_vote_limits.count+1 WHERE fan_vote_limits.count < ${voteLimit} RETURNING key`;
      if (!allowed.length) throw new VoteError("rate-limit", 429);
      const updated = await tx`UPDATE fan_vote_counts SET votes=votes+1 WHERE player=${player} RETURNING player`;
      if (!updated.length) throw new VoteError("unavailable", 503);
    }
    const state = stateFromRows(await tx`SELECT player,votes,(SELECT player FROM fan_votes WHERE browser_hash=${browserHash}) AS choice FROM fan_vote_counts ORDER BY player` as unknown as CountRow[]);
    return { ...state, accepted: inserted.length > 0 };
  });
  const sqlite = db ?? store();
  return sqlite.transaction(() => {
    const inserted = sqlite.prepare("INSERT INTO fan_votes (browser_hash,player,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING").run(browserHash, player, new Date(now).toISOString()).changes;
    if (inserted) {
      sqlite.prepare("DELETE FROM fan_vote_limits WHERE expires <= ?").run(now);
      const allowed = sqlite.prepare("INSERT INTO fan_vote_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=fan_vote_limits.count+1 WHERE fan_vote_limits.count < ?").run(clientKey, now + voteLimitWindow, voteLimit).changes;
      if (!allowed) throw new VoteError("rate-limit", 429);
      if (!sqlite.prepare("UPDATE fan_vote_counts SET votes=votes+1 WHERE player=?").run(player).changes) throw new VoteError("unavailable", 503);
    }
    return { ...localState(sqlite, browserHash), accepted: inserted > 0 };
  }).immediate();
}
