"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Select } from "./select";
import { addDays, calendarDate, clampDate, dateValidation, inDateRange, isCalendarDate, monthDays, moveMonth } from "@/lib/calendar";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" });

interface DatePickerProps {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  today: string;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export function DatePicker({ id, label, value, onValueChange, today, min = "1900-01-01", max = "2100-12-31", placeholder = "Choose a date", clearable = false, required = false, disabled = false, name }: DatePickerProps) {
  const uid = useId();
  const triggerId = id ?? `${uid}-trigger`;
  const [open, setOpen] = useState(false);
  const initial = clampDate(isCalendarDate(value) ? value : today, min, max);
  const [focused, setFocused] = useState(initial);
  const [month, setMonth] = useState(`${initial.slice(0, 7)}-01`);
  const [showError, setShowError] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const validation = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLTableElement>(null);
  const unavailable = min > max;
  const error = dateValidation(value, min, max, required);
  useEffect(() => { validation.current?.setCustomValidity(error); }, [error]);

  // Radix manages focus; inert also keeps background controls out of navigation.
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const changed: HTMLElement[] = [];
    let branch: HTMLElement = node;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of parent.children) {
        if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {
          sibling.inert = true;
          changed.push(sibling);
        }
      }
      if (parent === document.body) break;
      branch = parent;
    }
    return () => { for (const element of changed) element.inert = false; };
  }, []);

  function changeOpen(next: boolean) {
    if (next && (disabled || unavailable)) return;
    if (next) {
      const nextDate = clampDate(isCalendarDate(value) ? value : today, min, max);
      setFocused(nextDate);
      setMonth(`${nextDate.slice(0, 7)}-01`);
      // If neither side has room, bring the field up before positioning the calendar.
      // This keeps the last week and footer visible instead of clipping the popup.
      const bounds = trigger.current?.getBoundingClientRect();
      if (bounds && window.innerHeight > 524 && Math.max(bounds.top - 12, window.innerHeight - bounds.bottom - 12) < 460) {
        window.scrollBy({ top: bounds.top - 48, behavior: "instant" });
      }
    }
    setOpen(next);
  }
  function focusDay(date: string) {
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus());
  }
  function choose(next: string) {
    if (next ? !inDateRange(next, min, max) : !clearable || required) return;
    onValueChange(next);
    setShowError(false);
    setOpen(false);
  }
  function navigate(next: string, focus = false) {
    const date = clampDate(next, min, max);
    setMonth(`${date.slice(0, 7)}-01`);
    setFocused(date);
    if (focus) focusDay(date);
  }
  function dayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    let next: string | undefined;
    const weekday = (calendarDate(date).getUTCDay() + 6) % 7;
    switch (event.key) {
      case "ArrowLeft": next = addDays(date, -1); break;
      case "ArrowRight": next = addDays(date, 1); break;
      case "ArrowUp": next = addDays(date, -7); break;
      case "ArrowDown": next = addDays(date, 7); break;
      case "Home": next = addDays(date, -weekday); break;
      case "End": next = addDays(date, 6 - weekday); break;
      case "PageUp": next = moveMonth(date, event.shiftKey ? -12 : -1); break;
      case "PageDown": next = moveMonth(date, event.shiftKey ? 12 : 1); break;
    }
    if (next) { event.preventDefault(); navigate(next, true); }
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const monthLabel = `${months[monthIndex]} ${year}`;
  const days = monthDays(month);
  const years = Array.from({ length: Math.max(0, Number(max.slice(0, 4)) - Number(min.slice(0, 4)) + 1) }, (_, i) => Number(max.slice(0, 4)) - i);
  return <div className="date-picker">
    <Popover.Root open={open && !disabled && !unavailable} onOpenChange={changeOpen} modal>
      <Popover.Trigger asChild>
        <button ref={trigger} id={triggerId} type="button" className="date-picker-trigger" disabled={disabled || unavailable} aria-label={label} data-invalid={showError && !!error || undefined} aria-describedby={showError && error ? `${uid}-error` : undefined}>
          <CalendarDays size={17} aria-hidden="true" />
          <span className={value && !unavailable ? "" : "date-picker-placeholder"}>{unavailable ? "No dates available yet" : isCalendarDate(value) ? shortDate.format(calendarDate(value)) : placeholder}</span>
          <ChevronDown size={15} aria-hidden="true" className="date-picker-chevron" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content ref={contentRef} className="date-picker-content" sideOffset={10} align="start" collisionPadding={12} aria-label={`${label} calendar`} aria-describedby={`${uid}-help`} onOpenAutoFocus={event => { event.preventDefault(); focusDay(focused); }}>
          <div className="date-picker-heading"><span><CalendarDays size={14} aria-hidden="true" />{label}</span><Popover.Close className="date-picker-icon" aria-label="Close calendar"><X size={16} /></Popover.Close></div>
          <div className="date-picker-navigation">
            <button type="button" className="date-picker-icon" aria-label="Previous month" disabled={month.slice(0, 7) <= min.slice(0, 7)} onClick={() => navigate(moveMonth(focused, -1))}><ChevronLeft size={17} /></button>
            <div className="date-picker-selects">
              <Select label="Calendar month" value={String(monthIndex)} onValueChange={next => navigate(moveMonth(focused, Number(next) - monthIndex))} options={months.map((name, index) => { const prefix = `${year}-${String(index + 1).padStart(2, "0")}`; return { value: String(index), label: name, disabled: prefix < min.slice(0, 7) || prefix > max.slice(0, 7) }; })} />
              <Select label="Calendar year" value={String(year)} onValueChange={next => navigate(moveMonth(focused, (Number(next) - year) * 12))} options={years.map(year => ({ value: String(year), label: String(year) }))} />
            </div>
            <button type="button" className="date-picker-icon" aria-label="Next month" disabled={month.slice(0, 7) >= max.slice(0, 7)} onClick={() => navigate(moveMonth(focused, 1))}><ChevronRight size={17} /></button>
          </div>
          <span className="sr-only" aria-live="polite" aria-atomic="true">{monthLabel}</span>
          <table ref={grid} className="date-picker-grid" role="grid" aria-label={monthLabel}>
            <thead><tr>{weekdays.map(day => <th key={day} scope="col" abbr={day}>{day.slice(0, 2)}</th>)}</tr></thead>
            <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map(date => {
              const selected = value === date;
              return <td key={date} role="gridcell" aria-selected={selected}><button type="button" className="date-picker-day" data-date={date} data-selected={selected || undefined} data-outside={date.slice(0, 7) !== month.slice(0, 7) || undefined} aria-current={date === today ? "date" : undefined} aria-label={fullDate.format(calendarDate(date))} disabled={!inDateRange(date, min, max)} tabIndex={date === focused ? 0 : -1} onFocus={() => setFocused(date)} onClick={() => choose(date)} onKeyDown={event => dayKey(event, date)}>{Number(date.slice(8))}</button></td>;
            })}</tr>)}</tbody>
          </table>
          <div className="date-picker-footer"><span><i />UTC dates</span><div>{clearable && !required && <button type="button" disabled={!value} onClick={() => choose("")}>Clear</button>}<button type="button" disabled={!inDateRange(today, min, max)} onClick={() => choose(today)}>Today</button></div></div>
          <p id={`${uid}-help`} className="sr-only">Use arrow keys to move between dates, Page Up or Page Down to change month, and Enter to select. Escape closes the calendar.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    <input ref={validation} className="date-picker-validation" type="text" name={name} value={value} onChange={() => {}} tabIndex={-1} aria-hidden="true" disabled={disabled} required={required} onInvalid={event => { event.preventDefault(); setShowError(true); trigger.current?.focus(); }} />
    {showError && error && <span id={`${uid}-error`} className="date-picker-error" role="alert">{error}</span>}
  </div>;
}
