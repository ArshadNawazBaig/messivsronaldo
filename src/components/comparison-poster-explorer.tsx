"use client";

import { useState, type MouseEvent, type PointerEvent } from "react";
import { X } from "lucide-react";
import { comparisonDifference, comparisonLayouts, comparisonRowValue, type ComparisonRow } from "@/lib/comparison-poster";
import { imageFormats, type ImageFormat } from "@/lib/stat-image";
import { useI18n } from "./i18n-provider";
import styles from "./stat-image-dialog.module.css";

export function ComparisonPosterHotspots({ rows, format, scale, selected, onSelect }: {
  rows: ComparisonRow[]; format: ImageFormat; scale: number; selected: string | null; onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);
  const layout = comparisonLayouts[format];
  const height = imageFormats[format].height - layout.footerHeight - layout.tableTop;
  const selectedIndex = rows.findIndex(row => row.id === selected);
  const active = hovered ?? selectedIndex;
  function rowAt(event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(rows.length - 1, Math.floor((event.clientY - rect.top) / rect.height * rows.length)));
  }
  function step(offset: number) { onSelect(rows[selectedIndex < 0 ? offset > 0 ? 0 : rows.length - 1 : (selectedIndex + offset + rows.length) % rows.length].id); }
  return <button type="button" className={styles.posterHotspots}
    style={{ left: 56 * scale, top: layout.tableTop * scale, width: 968 * scale, height: height * scale }}
    aria-label={t("Explore poster statistics")}
    title={t("Select a row. Use arrow keys to explore.")}
    aria-keyshortcuts="ArrowUp ArrowDown"
    onPointerMove={event => { if (event.pointerType === "mouse") setHovered(rowAt(event)); }}
    onPointerLeave={() => setHovered(null)}
    onClick={event => event.detail === 0 ? step(1) : onSelect(rows[rowAt(event)].id)}
    onKeyDown={event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        step(event.key === "ArrowDown" ? 1 : -1);
      }
    }}>
    {active >= 0 && <span className={styles.posterRowHighlight} style={{ top: active * height / rows.length * scale, height: height / rows.length * scale }} />}
  </button>;
}

export function ComparisonPosterInsight({ row, onClose }: { row: ComparisonRow; onClose: () => void }) {
  const { t } = useI18n();
  const { player, difference } = comparisonDifference(row);
  const differenceLabel = difference === null ? t("Comparison unavailable") : difference === 0 ? t("Level on this statistic") : t("{0} more for {1}", { "0": difference.toLocaleString("en-US", { minimumFractionDigits: row.decimals ?? 0, maximumFractionDigits: row.decimals ?? 0 }), "1": player === "messi" ? "Messi" : "Ronaldo" });
  return <div className={styles.posterInsight} role="status" aria-label={t(row.label)}>
    <div className={styles.insightHeader}><strong>{t(row.label)}</strong><button type="button" onClick={onClose} aria-label={t("Close statistic details")}><X size={14} /></button></div>
    <div className={styles.insightValues}>
      <span><small>Messi</small><b>{comparisonRowValue(row, "messi")}</b></span>
      <span className={styles.insightDifference}>{differenceLabel}</span>
      <span><small>Ronaldo</small><b>{comparisonRowValue(row, "ronaldo")}</b></span>
    </div>
    <p>{t("Stats through {0}", { "0": row.date })}</p>
  </div>;
}
