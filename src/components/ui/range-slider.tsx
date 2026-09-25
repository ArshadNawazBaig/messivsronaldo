"use client";

import { useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "../i18n-provider";
import styles from "./range-slider.module.css";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type RangeSliderProps = {
  id: string;
  label: string;
  ariaLabel?: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  disabled?: boolean;
  direction?: "ltr" | "rtl";
  tone?: "neutral" | "messi" | "ronaldo";
  formatValue?: (value: number) => string;
  onValueChange: (value: number) => void;
};

export function RangeSlider({ id, label, ariaLabel, min, max, value, step = 1, disabled = false, direction, tone = "neutral", formatValue, onValueChange }: RangeSliderProps) {
  const { locale, numberLocale, t } = useI18n();
  // Keep native controls disabled until React can handle their input events.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const dir = direction ?? (locale === "ar" ? "rtl" : "ltr");
  const fixed = max <= min;
  const progress = fixed ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const format = formatValue ?? ((number: number) => number.toLocaleString(numberLocale));
  const unavailable = disabled || fixed || !ready;
  const fill = { "--range-progress": `${progress * 100}%` } as CSSProperties;

  function adjust(change: number) {
    const next = Number((min + (Math.round((value - min) / step) + change) * step).toFixed(10));
    onValueChange(Math.max(min, Math.min(max, next)));
  }

  function handleArrow(event: KeyboardEvent<HTMLInputElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    // Safari and Chromium disagree on native horizontal arrows in RTL.
    event.preventDefault();
    const change = (event.key === "ArrowRight" ? 1 : -1) * (dir === "rtl" ? -1 : 1);
    adjust(change);
  }

  return <div className={styles.range} data-tone={tone} data-disabled={unavailable}>
    <div className={styles.captionRow}>
      <label className={styles.caption} htmlFor={id}>{label}</label>
      <div className={styles.adjustments} dir="ltr">
        <button className={styles.adjust} type="button" aria-label={t("Decrease {0}", { "0": ariaLabel ?? label })} aria-controls={id} disabled={unavailable || value <= min} onClick={() => adjust(-1)}><Minus size={14} aria-hidden="true"/></button>
        <output className={styles.readout} htmlFor={id} aria-live="off"><bdi>{format(value)}</bdi></output>
        <button className={styles.adjust} type="button" aria-label={t("Increase {0}", { "0": ariaLabel ?? label })} aria-controls={id} disabled={unavailable || value >= max} onClick={() => adjust(1)}><Plus size={14} aria-hidden="true"/></button>
      </div>
    </div>
    <div className={styles.bed} dir={dir} style={fill}>
      <div className={styles.track} aria-hidden="true"><span className={styles.fill}/></div>
      <input id={id} className={styles.input} type="range" min={min} max={max} step={step} value={value} disabled={unavailable} aria-label={ariaLabel} aria-valuetext={format(value)} onKeyDown={handleArrow} onChange={event => onValueChange(Number(event.target.value))}/>
    </div>
    <div className={styles.limits} dir={dir} data-fixed={fixed} aria-hidden="true"><span>{format(min)}</span>{!fixed && <span>{format(max)}</span>}</div>
  </div>;
}
