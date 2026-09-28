"use client";

import { ArrowDown, ArrowUp, ChartNoAxesCombined, ChevronDown, List } from "lucide-react";
import { comparisonRows, type ComparisonPoster } from "@/lib/comparison-poster";
import { useI18n } from "./i18n-provider";
import styles from "./stat-image-dialog.module.css";

export function ComparisonPosterControls({ poster, metrics, showBars, onMetricsChange, onBarsChange }: {
  poster: ComparisonPoster;
  metrics?: string[];
  showBars: boolean;
  onMetricsChange: (metrics: string[] | undefined) => void;
  onBarsChange: (show: boolean) => void;
}) {
  const { t } = useI18n();
  const selected = comparisonRows(poster, metrics);
  const ids = selected.map(row => row.id);
  const available = comparisonRows(poster);
  const essentials = available.filter(row => ["goals", "appearances", "contributions", "assists", "hatTricks", "freeKicks"].includes(row.id)).map(row => row.id);
  const ordered = [...selected, ...available.filter(row => !ids.includes(row.id))];
  function move(index: number, offset: number) {
    const next = [...ids];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onMetricsChange(next);
  }
  return <div className={styles.posterControls}>
    <fieldset className={styles.fieldset}>
      <legend>{t("Comparison style")}</legend>
      <div className={styles.themes}>
        <button type="button" aria-pressed={showBars} onClick={() => onBarsChange(true)}><ChartNoAxesCombined size={16} aria-hidden="true" />{t("Visual bars")}</button>
        <button type="button" aria-pressed={!showBars} onClick={() => onBarsChange(false)}><List size={16} aria-hidden="true" />{t("Clean table")}</button>
      </div>
    </fieldset>
    <details className={styles.statistics}>
      <summary><span>{t("Choose statistics")} <span className={styles.statCount}>{selected.length}</span></span><ChevronDown size={15} aria-hidden="true" /></summary>
      <div className={styles.metricPresets}>
        <button type="button" aria-pressed={!metrics} onClick={() => onMetricsChange(undefined)}>{t("All stats")}</button>
        <button type="button" aria-pressed={ids.join() === essentials.join()} onClick={() => onMetricsChange(essentials)}>{t("Essentials")}</button>
      </div>
      <p className={styles.help}>{t("Choose at least four stats. Use the arrows to change their order.")}</p>
      <div className={styles.metricChoices}>
        {ordered.map(row => {
          const index = ids.indexOf(row.id);
          const included = index !== -1;
          return <div className={styles.metricChoice} key={row.id}>
            <label><input type="checkbox" checked={included} disabled={included && ids.length === 4} onChange={() => onMetricsChange(included ? ids.filter(id => id !== row.id) : [...ids, row.id])} /><span>{t(row.label)}</span></label>
            {included && <div className={styles.metricMove}>
              <button type="button" aria-label={t("Move {0} up", { "0": t(row.label) })} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14} /></button>
              <button type="button" aria-label={t("Move {0} down", { "0": t(row.label) })} disabled={index === ids.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14} /></button>
            </div>}
          </div>;
        })}
      </div>
    </details>
  </div>;
}
