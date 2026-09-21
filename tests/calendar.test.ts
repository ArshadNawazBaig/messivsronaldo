import assert from "node:assert/strict";
import test from "node:test";
import { addDays, dateValidation, isCalendarDate, monthDays, moveMonth } from "../src/lib/calendar";

test("calendar math preserves real UTC dates across leap days and year boundaries", () => {
  assert.equal(isCalendarDate("2024-02-29"), true);
  assert.equal(isCalendarDate("2026-02-29"), false);
  assert.equal(isCalendarDate("2026-09-31"), false);
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(moveMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(moveMonth("2024-02-29", 12), "2025-02-28");
  assert.equal(moveMonth("2026-01-31", -1), "2025-12-31");
});
test("calendar grid includes each date once with Monday as the first weekday", () => {
  const days = monthDays("2026-09-01");
  assert.equal(days.length, 42);
  assert.equal(new Set(days).size, 42);
  assert.equal(days[0], "2026-08-31");
  assert.equal(days[41], "2026-10-11");
});
test("date limits reject invalid, future and unavailable ranges without changing the date", () => {
  assert.equal(dateValidation("", "2002-01-01", "2026-09-21", false), "");
  assert.match(dateValidation("", "2002-01-01", "2026-09-21", true), /Choose/);
  assert.match(dateValidation("2026-09-22", "2002-01-01", "2026-09-21", true), /from/);
  assert.match(dateValidation("2026-02-30", "2002-01-01", "2026-09-21", true), /valid/);
  assert.match(dateValidation("2026-09-21", "2026-09-22", "2026-09-21", true), /No dates/);
});
