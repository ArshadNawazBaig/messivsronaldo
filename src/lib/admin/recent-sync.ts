import { snapshotDate } from "@/lib/data";
import { acquireSync, getConnection, logRun, revision } from "./database";
import { AdminError } from "./model";
import { batchApiClient, type ProviderFetch } from "./provider-client";
import { syncDateUnderLock } from "./service";

export function recentSyncDates(today: string) {
  const date = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(date);
    day.setUTCDate(day.getUTCDate() - offset);
    return day.toISOString().slice(0, 10);
  }).filter(day => day > snapshotDate);
}

// Unlike the scheduled job, this can be run again when new results arrive today.
// Each date publishes atomically; an inaccessible older date cannot discard newer results.
export async function syncLatest(expected: number, options: { now?: Date; fetcher?: ProviderFetch } = {}) {
  const today = (options.now ?? new Date()).toISOString().slice(0, 10);
  const dates = recentSyncDates(today);
  const release = await acquireSync();
  try {
    if (await revision() !== expected) throw new AdminError("Refresh the dashboard before syncing; another update was published.", 409);
    const connection = await getConnection();
    if (!connection) throw new AdminError("Connect API-Football in Settings before fetching statistics.", 409);
    const deadline = Date.now() + 240_000;
    const fetcher = options.fetcher ?? batchApiClient(connection.key, deadline);
    const warnings: string[] = [];
    const restrictedDates: string[] = [];
    let restriction = "";
    let checked = 0;
    let changed = 0;
    let attempted = 0;
    let currentRevision = expected;
    for (const date of dates) {
      if (Date.now() >= deadline) {
        warnings.push("The update time limit was reached. Run Update latest stats again to finish checking.");
        break;
      }
      // Manual corrections may publish while provider requests are in flight. Do not
      // adopt an unrelated revision silently; retain it and stop this batch on conflict.
      if (await revision() !== currentRevision) {
        warnings.push("Another administrator published a change. Refresh the dashboard before continuing.");
        break;
      }
      attempted++;
      try {
        const result = await syncDateUnderLock(date, currentRevision, connection, fetcher);
        checked++;
        if (result.changed) { changed++; currentRevision++; }
        if (result.pending) warnings.push(`${date}: a fixture is awaiting completion. Check again after the match finishes.`);
      } catch (error) {
        if (error instanceof AdminError && error.status === 403) {
          restrictedDates.push(date);
          restriction = error.message;
        } else {
          warnings.push(`${date}: ${error instanceof AdminError ? error.message : "The provider response could not be verified. Review the activity log."}`);
        }
        if (!(error instanceof AdminError) || error.status === 429 || error.status >= 500) break;
      }
    }
    if (restrictedDates.length) warnings.push(`${restrictedDates.join(", ")}: ${restriction}`);
    const status = warnings.length ? checked ? "partial" : "failed" : "success";
    const message = `Recent match check: ${checked} of ${dates.length} UTC dates verified; ${changed} date(s) updated.${dates.length > attempted ? ` ${dates.length - attempted} date(s) not checked.` : ""} ${changed ? "Verified changes are live across the website." : "No new changes were published."}${warnings.length ? " Some results still need attention; see the details below." : ""}`;
    await logRun(today, "latest", status, `${message}${warnings.length ? ` ${warnings.join(" ")}` : ""}`);
    return { message, status, warnings };
  } finally {
    await release();
  }
}
