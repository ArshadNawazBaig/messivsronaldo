import { ratio, type Pair, type Stats } from "./data";
import type { SeasonRecord } from "./seasons";

export const archiveContentUpdated = "2026-09-27";
export type SummaryRow = { label: string; values: { messi: number | null; ronaldo: number | null }; decimals?: number };

export function calendarSummaryRows(stats: Stats): SummaryRow[] {
  const contributions: Pair = { messi: stats.goals.messi + stats.assists.messi, ronaldo: stats.goals.ronaldo + stats.assists.ronaldo };
  return [
    { label: "Goals", values: stats.goals },
    { label: "Assists", values: stats.assists },
    { label: "Goals + assists", values: contributions },
    { label: "Appearances", values: stats.appearances },
    { label: "Minutes played", values: stats.minutes },
    { label: "Goals per appearance", values: { messi: ratio(stats.goals.messi, stats.appearances.messi), ronaldo: ratio(stats.goals.ronaldo, stats.appearances.ronaldo) }, decimals: 2 },
    { label: "Goals per 90 minutes", values: { messi: ratio(stats.goals.messi * 90, stats.minutes.messi), ronaldo: ratio(stats.goals.ronaldo * 90, stats.minutes.ronaldo) }, decimals: 2 },
    { label: "Goals + assists per 90", values: { messi: ratio(contributions.messi * 90, stats.minutes.messi), ronaldo: ratio(contributions.ronaldo * 90, stats.minutes.ronaldo) }, decimals: 2 },
  ];
}

export function seasonSummaryRows(stats: SeasonRecord["league"]): SummaryRow[] {
  return [
    { label: "Goals", values: { messi: stats.messi.goals, ronaldo: stats.ronaldo.goals } },
    { label: "Appearances", values: { messi: stats.messi.appearances, ronaldo: stats.ronaldo.appearances } },
    { label: "Goals per appearance", values: { messi: ratio(stats.messi.goals, stats.messi.appearances), ronaldo: ratio(stats.ronaldo.goals, stats.ronaldo.appearances) }, decimals: 2 },
  ];
}
