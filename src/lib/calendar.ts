// Calendar dates are UTC strings, never local-midnight timestamps.
export const calendarDate = (value: string) => new Date(`${value}T00:00:00Z`);
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = calendarDate(value);
  return Number.isFinite(date.getTime()) && dateKey(date) === value;
}
export const inDateRange = (value: string, min: string, max: string) => isCalendarDate(value) && value >= min && value <= max;
export const clampDate = (value: string, min: string, max: string) => value < min ? min : value > max ? max : value;
export function addDays(value: string, days: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}
export function moveMonth(value: string, months: number) {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return dateKey(date);
}
export function monthDays(month: string) {
  const first = `${month.slice(0, 7)}-01`;
  const offset = (calendarDate(first).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => addDays(first, index - offset));
}
export function dateValidation(value: string, min: string, max: string, required: boolean) {
  if (!value) return required ? "Choose a date." : "";
  if (!isCalendarDate(value)) return "Choose a valid date.";
  if (min > max) return "No dates are available yet.";
  if (!inDateRange(value, min, max)) return `Choose a date from ${min} to ${max}.`;
  return "";
}
