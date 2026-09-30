import assert from "node:assert/strict";
import test from "node:test";
import { dailySyncHealth, monitorAuthorized, reportServerError } from "../src/lib/operations";
import type { DailySyncState } from "../src/lib/admin/daily-sync-state";

const state: DailySyncState = { lastRunDate: "2026-09-29", scannedThrough: "2026-09-28", pendingDates: [], status: "success", message: "Done" };
test("monitor accepts only the configured secret", () => {
  assert.equal(monitorAuthorized(null, undefined), false);
  assert.equal(monitorAuthorized("Bearer undefined", undefined), false);
  assert.equal(monitorAuthorized("Bearer wrong", "right"), false);
  assert.equal(monitorAuthorized("Bearer right", "right"), true);
});
test("daily monitoring allows cron jitter and identifies missed, failed and stuck runs", () => {
  assert.equal(dailySyncHealth(state, new Date("2026-09-30T09:59:59Z")).healthy, true);
  assert.equal(dailySyncHealth(state, new Date("2026-09-30T10:00:00Z")).overdue, true);
  assert.equal(dailySyncHealth({ ...state, lastRunDate: "2026-09-30", status: "partial" }, new Date("2026-09-30T10:00:00Z")).healthy, true);
  assert.equal(dailySyncHealth({ ...state, status: "failed" }, new Date("2026-09-30T09:00:00Z")).healthy, false);
  assert.equal(dailySyncHealth({ ...state, status: "running" }, new Date("2026-09-30T09:00:00Z")).stalled, true);
  assert.equal(dailySyncHealth({ ...state, lastRunDate: "2026-09-30", status: "running" }, new Date("2026-09-30T09:00:00Z")).healthy, true);
  assert.equal(dailySyncHealth({ ...state, lastRunDate: "2026-09-30", status: "running" }, new Date("2026-09-30T10:00:00Z")).stalled, true);
  assert.equal(dailySyncHealth({ ...state, lastRunDate: null, status: "waiting" }, new Date("2026-09-30T09:00:00Z")).healthy, false);
});
test("operational logging retains error codes without leaking error payloads", () => {
  const messages: string[] = [];
  const original = console.error;
  console.error = message => { messages.push(String(message)); };
  try {
    reportServerError({ code: "53000", digest: "123456", message: "secret password", query: "private SQL", stack: "private stack" }, "health-check");
    assert.deepEqual(JSON.parse(messages[0]), { event: "rivalry_server_error", operation: "health-check", code: "53000", digest: "123456" });
  } finally { console.error = original; }
});
