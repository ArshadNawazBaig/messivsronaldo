import { z } from "zod";
import { awardTotals, awardsReviewed } from "./awards";
import { type ScopeId, ratio } from "./data";
import type { PublishedData } from "./published-data";
import { getPlayerPoster, playerPosterSchema, posterNumber } from "./player-poster";
import { teamTrophyTotals, teamHonoursDate } from "./team-honours";

export const comparisonPosterSchema = playerPosterSchema.omit({ player: true }).extend({ design: z.literal("comparison") }).strict();
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
      date: metric?.group === "scoring" ? data.baselineDate : scope.updatedThrough,
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
  const notes = id === "career" ? [
    "Senior club + internationals. Club friendlies and shootouts excluded.",
    "Team trophies include youth/Olympic and MLS conference honours; counting rules: /honours.",
    "Ballon d’Or: completed editions through 2025. Golden Shoes: European award only.",
    `Goal-type stats: ${data.baselineDate}. Team trophies: ${teamHonoursDate}. Awards reviewed: ${awardsReviewed}.`,
  ] : [
    id === "copa-euros" || id === "current-clubs" ? scope.description : coverage,
    ...(rows.some(row => row.id === "hatTricks" || row.id === "freeKicks")
      ? [`Hat-tricks and free-kick goals through ${data.baselineDate}.`] : []),
  ];
  return { competition: comparisonScopeLabel(data, id), date: scope.updatedThrough, rows, notes };
}
export type ComparisonPoster = ReturnType<typeof getComparisonPoster>;

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
