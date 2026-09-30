import { timingSafeEqual } from "node:crypto";
import type { DailySyncState } from "./admin/daily-sync-state";

// Deliberately omit messages, SQL, headers, cookies and stacks: driver errors
// can contain credentials or article drafts. Codes still identify quota failures.
export function reportServerError(error: unknown, operation: string) {
  const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const code = typeof details.code === "string" && /^[A-Z0-9_]{1,40}$/.test(details.code) ? details.code : undefined;
  const digest = typeof details.digest === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(details.digest) ? details.digest : undefined;
  console.error(JSON.stringify({ event: "rivalry_server_error", operation, code, digest }));
}

export function monitorAuthorized(header: string | null, secret: string | undefined) {
  if (!secret) return false;
  const actual = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function dailySyncHealth(state: DailySyncState, now = new Date()) {
  // Hobby cron may start anywhere in the 08:00 hour. Allow an additional hour
  // before flagging a missed delivery, including the existing four-minute batch.
  const expected = new Date(now);
  if (now.getUTCHours() < 10) expected.setUTCDate(expected.getUTCDate() - 1);
  const expectedRunDate = expected.toISOString().slice(0, 10);
  const overdue = !state.lastRunDate || state.lastRunDate < expectedRunDate;
  const failed = state.status === "failed";
  const stalled = state.status === "running" && (state.lastRunDate !== now.toISOString().slice(0, 10) || now.getUTCHours() >= 10);
  return { healthy: !overdue && !failed && !stalled, status: state.status, lastRunDate: state.lastRunDate, expectedRunDate, overdue, failed, stalled };
}
