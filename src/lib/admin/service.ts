import { snapshotDate } from "@/lib/data";
import { AdminError, checkDate, matchSchema, type AdminState, type MatchRecord } from "./model";
import { acquireSync, commitRecords, getConnection, history, logRun, readRecords, revision, store } from "./store";
import { fetchDate } from "./provider";
export function getAdminState(): AdminState {
  const connection = getConnection();
  return {revision:revision(),records:readRecords(),history:history(),providerConnected:!!connection,baseline:snapshotDate,today:new Date().toISOString().slice(0,10),connection:connection ? {messi:connection.messi,ronaldo:connection.ronaldo} : null};
}
export function mergeDate(existing: MatchRecord[], incoming: MatchRecord[], date: string, withdrawnIds: string[] = []) {
  const missing = existing.filter(r => r.date === date && !r.locked && r.provider === "api-football" && !incoming.some(n => n.id === r.id) && !withdrawnIds.includes(r.id));
  if (missing.length) throw new AdminError("A previously published match is missing from the provider response. Existing data was retained; review the provider or remove the record manually.", 422);
  const preserved = existing.filter(r => r.date !== date || r.locked || r.provider === "manual");
  const protectedPlayers = new Set(preserved.filter(r => r.date === date).map(r => r.player));
  const fresh = incoming.filter(r => !protectedPlayers.has(r.player));
  if (new Set(fresh.map(r=>r.player)).size !== fresh.length) throw new AdminError("More than one match for a tracked player on this date requires manual review.");
  return [...preserved, ...fresh];
}
export async function syncDate(date: string, expected: number) {
  checkDate(date);
  const connection = getConnection();
  if (!connection) throw new AdminError("Connect API-Football in Settings before fetching statistics.", 409);
  const release = acquireSync();
  try {
    if (revision() !== expected) throw new AdminError("Refresh the dashboard before syncing; another update was published.", 409);
    const result = await fetchDate(date,connection);
    if (date <= snapshotDate) {
      const message = `Checked ${result.fixtures} tracked fixture(s); ${result.records.length} player record(s) available. This date is already in the reviewed baseline, so no totals were changed.`;
      logRun(date,"check","checked",message); return message;
    }
    const existing = readRecords(); const next = mergeDate(existing,result.records,date,result.withdrawnIds);
    const unchanged = JSON.stringify([...existing].sort((a,b)=>a.id.localeCompare(b.id))) === JSON.stringify([...next].sort((a,b)=>a.id.localeCompare(b.id)));
    const protectedCount = existing.filter(r => r.date === date && (r.locked || r.provider === "manual")).length;
    const message = `${result.records.length} player record(s) fetched; ${result.skipped} unplayed/excluded fixture(s). ${protectedCount ? `${protectedCount} manual correction(s) preserved. ` : ""}${unchanged ? "No changes to publish." : "Totals published across the website."}`;
    if (unchanged) logRun(date,"check","unchanged",message);
    else commitRecords(expected,next,date,"sync",message);
    return message;
  } catch (error) {
    logRun(date,"sync","failed",error instanceof AdminError ? error.message : "The provider response could not be verified. No data was published.");
    throw error;
  } finally { release(); }
}
export function saveMatch(input: unknown, expected: number, db = store(), today?: string) {
  const record = matchSchema.parse(input); checkDate(record.date,today,true);
  record.locked = true; record.provider = "manual";
  record.team = ["league","club-cup"].includes(record.category) ? record.player === "messi" ? "Inter Miami" : "Al Nassr" : record.player === "messi" ? "Argentina" : "Portugal";
  const records = readRecords(db);
  if (records.some(r => r.date === record.date && r.player === record.player && r.id !== record.id)) throw new AdminError("A record for this player and date already exists. Edit that record to avoid counting the match twice.",409);
  commitRecords(expected,[...records.filter(r=>r.id !== record.id),record],record.date,"manual",`Saved verified ${record.player} record: ${record.goals} goals, ${record.assists} assists. Manual edits are protected from sync.`,db);
}
export function removeMatch(id: string, expected: number) {
  const records = readRecords(); const record = records.find(r=>r.id === id);
  if (!record) throw new AdminError("Match record not found.",404);
  commitRecords(expected,records.filter(r=>r.id !== id),record.date,"remove",`Removed ${record.player} vs ${record.opponent}. Totals recalculated.`);
}
export function backup() { return {format:"the-rivalry-admin-v1",exportedAt:new Date().toISOString(),baseline:snapshotDate,revision:revision(),records:readRecords(),history:store().prepare("SELECT id,at,date,action,status,message,before_data FROM runs ORDER BY id").all()}; }
