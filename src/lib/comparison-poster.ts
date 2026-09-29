import { z } from "zod";
import { awardTotals, awardsReviewed } from "./awards";
import { type ScopeId, ratio } from "./data";
import type { PublishedData } from "./published-data";
import { getPlayerPoster, playerPosterSchema, posterNumber } from "./player-poster";
import { teamTrophyTotals, teamHonoursDate } from "./team-honours";
import type { ImageFormat } from "./stat-image";

const metricIds = ["goals", "appearances", "contributions", "assists", "team-trophies", "ballon-dor", "golden-shoes", "minutes", "goals-per-game", "goals-per-90", "hatTricks", "freeKicks"] as const;
export const comparisonPosterSchema = playerPosterSchema.omit({ player: true }).extend({
  design: z.literal("comparison"),
  showBars: z.boolean().optional(),
  metrics: z.array(z.enum(metricIds)).min(4).max(9).refine(ids => new Set(ids).size === ids.length).optional(),
}).strict();
export type ComparisonPosterRequest = z.infer<typeof comparisonPosterSchema>;
export type ComparisonRow = {
  id: string;
  label: string;
  values: { messi: number | null; ronaldo: number | null };
  decimals?: number;
  date: string;
};

export function comparisonScopeLabel(data: PublishedData, scope: ScopeId) {
  return scope === "world-cup" ? "World Cup stats" : data.scopes[scope].label;
}

export function getComparisonPoster(data: PublishedData, { scope: id }: Pick<ComparisonPosterRequest, "scope">) {
  const scope = data.scopes[id];
  const metricRow = (metricId: string, label: string): ComparisonRow => {
    const metric = scope.metrics.find(item => item.id === metricId);
    return {
      id: metricId, label, values: metric?.values ?? { messi: null, ronaldo: null },
      decimals: metric?.decimals ?? 0,
      date: metric?.updatedThrough ?? (metric?.group === "scoring" ? data.baselineDate : scope.updatedThrough),
    };
  };
  const rows: ComparisonRow[] = [
    metricRow("appearances", "Games played"),
    metricRow("contributions", "Goals + assists"),
    metricRow("goals", "Goals"),
    metricRow("assists", "Assists"),
  ];
  if (id === "career") {
    rows.push(
      { id: "team-trophies", label: "Team trophies", values: teamTrophyTotals, date: teamHonoursDate },
      { id: "ballon-dor", label: "Ballon d’Or", values: awardTotals("ballon-dor"), date: awardsReviewed },
      { id: "golden-shoes", label: "European Golden Shoes", values: awardTotals("golden-boots"), date: awardsReviewed },
    );
  } else {
    rows.push(metricRow("minutes", "Minutes played"));
    for (const [metricId, label, denominator, multiplier] of [
      ["goals-per-game", "Goals per game", scope.appearances, 1],
      ["goals-per-90", "Goals per 90", scope.minutes, 90],
    ] as const) rows.push({
      id: metricId, label, decimals: 2, date: scope.updatedThrough,
      values: { messi: ratio(scope.goals.messi * multiplier, denominator.messi), ronaldo: ratio(scope.goals.ronaldo * multiplier, denominator.ronaldo) },
    });
  }
  for (const [metricId, label] of [["hatTricks", "Hat-tricks"], ["freeKicks", "Free-kick goals"]]) {
    if (scope.metrics.some(metric => metric.id === metricId)) rows.push(metricRow(metricId, label));
  }
  const coverage = getPlayerPoster(data, { scope: id, player: "messi" }).coverage;
  const freeKicks = scope.metrics.find(metric => metric.id === "freeKicks");
  const hatTricksDate = scope.metrics.find(metric => metric.id === "hatTricks")?.updatedThrough ?? data.baselineDate;
  const freeKickNote = freeKicks?.updatedThrough ? `Free kicks: ${freeKicks.updatedThrough}.` : `Free kicks: ${data.baselineDate}.`;
  const notes = id === "career" ? [
    "Senior club + internationals. Club friendlies and shootouts excluded.",
    "Team trophies include youth/Olympic and MLS conference honours; counting rules: /honours.",
    "Ballon d’Or: completed editions through 2025. Golden Shoes: European award only.",
    `Hat-tricks: ${hatTricksDate}. ${freeKickNote} Team trophies: ${teamHonoursDate}.`,
  ] : [
    id === "copa-euros" || id === "current-clubs" ? scope.description : coverage,
    ...(rows.some(row => row.id === "hatTricks" || row.id === "freeKicks")
      ? [`Hat-tricks: ${hatTricksDate}. ${freeKickNote}`] : []),
  ];
  return { competition: comparisonScopeLabel(data, id), date: scope.updatedThrough, rows, notes };
}
export type ComparisonPoster = ReturnType<typeof getComparisonPoster>;

// Shared coordinates keep the interactive preview aligned with the exported PNG.
export const comparisonBrandHeaderHeight = 76;
export const comparisonLayouts = {
  square: { photoTop: 32 + comparisonBrandHeaderHeight, headTop: 44 + comparisonBrandHeaderHeight, photoScale: 1, tableHeaderTop: 344 + comparisonBrandHeaderHeight, headingSize: 60, tableTop: 522 + comparisonBrandHeaderHeight, valueSize: 32, labelSize: 21, footerHeight: 200 - comparisonBrandHeaderHeight },
  portrait: { photoTop: 40 + comparisonBrandHeaderHeight, headTop: 60 + comparisonBrandHeaderHeight, photoScale: 1.36, tableHeaderTop: 478 + comparisonBrandHeaderHeight, headingSize: 76, tableTop: 684 + comparisonBrandHeaderHeight, valueSize: 38, labelSize: 23, footerHeight: 206 - comparisonBrandHeaderHeight },
  story: { photoTop: 56 + comparisonBrandHeaderHeight, headTop: 80 + comparisonBrandHeaderHeight, photoScale: 1.94, tableHeaderTop: 724 + comparisonBrandHeaderHeight, headingSize: 94, tableTop: 984 + comparisonBrandHeaderHeight, valueSize: 48, labelSize: 29, footerHeight: 228 - comparisonBrandHeaderHeight },
} satisfies Record<ImageFormat, object>;

export function comparisonRows(poster: ComparisonPoster, metrics?: readonly string[]) {
  if (metrics) return metrics.map(id => {
    const row = poster.rows.find(row => row.id === id);
    if (!row) throw new RangeError("Statistic is unavailable for this competition.");
    return row;
  });
  return [...poster.rows].sort((a, b) => a.id === "goals" ? -1 : b.id === "goals" ? 1 : 0);
}

export function comparisonDifference(row: ComparisonRow) {
  const { messi, ronaldo } = row.values;
  if (messi === null || ronaldo === null) return { player: null, difference: null };
  // Compare the displayed precision so visually identical rates are treated as ties.
  const factor = 10 ** (row.decimals ?? 0);
  const difference = (Math.round(messi * factor) - Math.round(ronaldo * factor)) / factor;
  return { player: difference === 0 ? null : difference > 0 ? "messi" as const : "ronaldo" as const, difference: Math.abs(difference) };
}

export function comparisonRowValue(row: ComparisonRow, player: "messi" | "ronaldo") {
  return posterNumber(row.values[player], row.decimals);
}

export function comparisonBarShare(row: ComparisonRow) {
  const { messi, ronaldo } = row.values;
  return messi === null || ronaldo === null || messi + ronaldo <= 0 ? 0.5 : messi / (messi + ronaldo);
}

export function comparisonPosterFilename(request: ComparisonPosterRequest, poster: ComparisonPoster) {
  return `messi-vs-ronaldo-${request.scope === "world-cup" ? "world-cup-stats" : request.scope}-comparison-${poster.date}-${request.theme}-${request.format}.png`;
}
