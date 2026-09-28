import { snapshotDate } from "@/lib/data";
import { acquireSync, getConnection, logRun, revision } from "./database";
import { readDailySyncState, saveDailySyncState, type DailySyncState } from "./daily-sync-state";
import { AdminError } from "./model";
import { batchApiClient, type ProviderFetch } from "./provider-client";
import { syncDateUnderLock } from "./service";

const maxDates = 7;
const timeBudgetMs = 240_000; // Leave time to persist progress before the 300-second function/lock limit.
function offsetDate(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function dailySyncDates(today: string, state: DailySyncState) {
  const yesterday = offsetDate(today, -1);
  const dates = new Set([yesterday, offsetDate(today, -2), ...state.pendingDates.slice(0, 2)]
    .filter(date => date > snapshotDate && date <= yesterday));
  // Recent results always get checked, even if an older fixture needs manual review.
  for (let date = offsetDate(state.scannedThrough, 1); date <= yesterday && dates.size < maxDates; date = offsetDate(date, 1)) {
    dates.add(date);
  }
  return [...dates];
}

export async function runDailySync(options: { now?: Date; fetcher?: ProviderFetch } = {}) {
  const today = (options.now ?? new Date()).toISOString().slice(0, 10);
  const deadline = Date.now() + timeBudgetMs;
  const release = await acquireSync();
  try {
    const state = await readDailySyncState();
    // Persisted under the shared lock: duplicate deliveries and new instances cannot run twice.
    if (state.lastRunDate && state.lastRunDate >= today) return { ...state, skipped: true };
    const dates = dailySyncDates(today, state);
    state.lastRunDate = today;
    state.status = "running";
    state.message = "Automatic daily update started.";
    await saveDailySyncState(state);
    await logRun(today, "daily", "running", state.message);
    let completed = 0;
    let failed = 0;
    let accessRestricted = false;
    const attempted = new Set<string>();
    try {
      const connection = await getConnection();
      if (!connection) throw new AdminError("Connect API-Football in Settings to enable automatic updates.", 409);
      // One client shares quota counters across every date in the batch.
      const fetcher = options.fetcher ?? batchApiClient(connection.key, deadline);
      for (const date of dates) {
        if (Date.now() >= deadline) break;
        // Remember an in-flight date before fetching, so an interrupted run retries it tomorrow.
        state.pendingDates = [...state.pendingDates.filter(value => value !== date), date];
        await saveDailySyncState(state);
        let stop = false;
        try {
          const result = await syncDateUnderLock(date, await revision(), connection, fetcher);
          if (!result.pending) state.pendingDates = state.pendingDates.filter(value => value !== date);
          completed++;
        } catch (error) {
          failed++;
          if (error instanceof AdminError && error.status === 403) accessRestricted = true;
          // Live/disputed dates can wait while other valid dates publish. Provider outages and
          // quota exhaustion stop the batch instead of burning more requests.
          stop = !(error instanceof AdminError) || error.status === 429 || error.status >= 500;
        }
        attempted.add(date);
        while (attempted.has(offsetDate(state.scannedThrough, 1))) state.scannedThrough = offsetDate(state.scannedThrough, 1);
        await saveDailySyncState(state);
        if (stop) break;
      }
      const caughtUp = state.scannedThrough >= offsetDate(today, -1);
      state.status = failed && !completed ? "failed" : state.pendingDates.length || !caughtUp ? "partial" : "success";
      state.message = `${completed} date(s) checked; ${failed} failed; ${state.pendingDates.length} awaiting retry.${caughtUp ? "" : ` Catch-up checked through ${state.scannedThrough}.`} ${state.status === "success" ? "All verified changes published." : accessRestricted ? "Some dates are blocked by your API-Football subscription. Use a plan covering those dates or add verified matches manually; retrying alone cannot resolve access restrictions. See the activity log." : "Remaining dates will be checked in the next daily run. See the activity log for details."}`;
    } catch (error) {
      state.status = "failed";
      state.message = error instanceof AdminError ? error.message : "Automatic update could not finish. Review the provider connection and activity log.";
    }
    await saveDailySyncState(state);
    await logRun(today, "daily", state.status, state.message);
    return { ...state, skipped: false };
  } finally {
    await release();
  }
}
