"use client";

import { useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Hash, RotateCcw, SlidersHorizontal, Timer, UserRound, X } from "lucide-react";
import type { GoalMode } from "@/lib/data";

const displays = [
  { value: "total", label: "Total goals", description: "Every goal in the selected comparison.", icon: Hash },
  { value: "per-game", label: "Goals per appearance", description: "Average goals for each match played.", icon: UserRound },
  { value: "per-90", label: "Goals per 90 minutes", description: "Scoring rate adjusted for playing time.", icon: Timer },
] as const;

export function ComparisonOptions({ mode, onlyDifferences, onChange }: {
  mode: GoalMode;
  onlyDifferences: boolean;
  onChange: (mode: GoalMode, onlyDifferences: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const choices = useRef<HTMLFieldSetElement>(null);
  const activeCount = Number(mode !== "total") + Number(onlyDifferences);

  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild>
      <button type="button" className="filter-button comparison-options-trigger" data-customized={activeCount > 0 || undefined} aria-label="Options" aria-describedby={activeCount ? `${uid}-active` : undefined}>
        <SlidersHorizontal size={16} aria-hidden="true" /><span className="options-trigger-label">Options</span>
        {activeCount > 0 && <><span className="options-count" aria-hidden="true">{activeCount}</span><span id={`${uid}-active`} className="sr-only">{activeCount} custom {activeCount === 1 ? "option" : "options"} applied</span></>}
        <ChevronDown size={13} className="options-chevron" aria-hidden="true" />
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="comparison-options-content" side="bottom" align="end" sideOffset={10} collisionPadding={12} aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-description`} onOpenAutoFocus={event => {
        event.preventDefault();
        choices.current?.querySelector<HTMLInputElement>("input:checked")?.focus({ preventScroll: true });
      }}>
        <div className="comparison-options-heading">
          <div><h2 id={`${uid}-title`}>Comparison options</h2><p id={`${uid}-description`}>Changes apply immediately.</p></div>
          <Popover.Close className="options-close" aria-label="Close options"><X size={18} aria-hidden="true" /></Popover.Close>
        </div>
        <div className="comparison-options-body">
          <fieldset ref={choices} className="options-display">
            <legend>Goal display</legend>
            <p className="options-section-note">Shown on the two player cards.</p>
            <div className="options-display-choices">{displays.map(({ value, label, description, icon: Icon }) => <label key={value} className="options-display-choice" data-selected={mode === value || undefined}>
              <input type="radio" className="options-native-control" name={`${uid}-goal-display`} value={value} checked={mode === value} onChange={() => onChange(value, onlyDifferences)} aria-label={label} aria-describedby={`${uid}-${value}-help`} />
              <span className="options-choice-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="options-choice-copy"><strong>{label}</strong><span id={`${uid}-${value}-help`}>{description}</span></span>
              <span className="options-radio-mark" aria-hidden="true">{mode === value && <Check size={11} strokeWidth={3} />}</span>
            </label>)}</div>
          </fieldset>
          <label className="options-tied-toggle">
            <span><strong>Hide tied metrics</strong><span id={`${uid}-ties-help`}>Only show stats where the totals differ.</span></span>
            <input type="checkbox" role="switch" className="options-native-control" aria-label="Hide tied metrics" aria-describedby={`${uid}-ties-help`} checked={onlyDifferences} onChange={event => onChange(mode, event.target.checked)} />
            <span className="options-switch-track" aria-hidden="true"><span /></span>
          </label>
        </div>
        <div className="comparison-options-footer">
          <button type="button" className="options-reset" disabled={!activeCount} onClick={() => onChange("total", false)}><RotateCcw size={14} aria-hidden="true" />Reset options</button>
          <Popover.Close className="options-done">Done<Check size={14} aria-hidden="true" /></Popover.Close>
        </div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
