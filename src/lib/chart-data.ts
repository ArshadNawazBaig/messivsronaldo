import { ratio, type PlayerId, type Stats } from "./football";

export type ChartValues = Record<PlayerId, number | null>;
export type ChartMetric = { id: string; label: string; decimals?: number; unit?: string; lowerIsBetter?: boolean; explanation?: string; coverage?: string };
export type ChartRecord = { id: string; label: string; values: Record<string, ChartValues>; note?: string; href?: string };

export const chartMetrics: ChartMetric[] = [
  { id: "goals", label: "Goals", explanation: "Goals within the selected scope. Penalty-shootout kicks and club friendlies are excluded." },
  { id: "assists", label: "Assists", explanation: "Conventional assists as published by the named source. Secondary, fantasy and penalty-won assists are not added. Providers may classify incidents differently." },
  { id: "contributions", label: "Goals + assists", explanation: "Goals plus assists from the same scope and assist definition." },
  { id: "appearances", label: "Appearances", explanation: "Matches in which the player appeared; a substitute appearance counts as one game." },
  { id: "minutes", label: "Minutes played", explanation: "Published playing time for the selected scope, including extra time where applicable." },
  { id: "goals-per-game", label: "Goals per appearance", decimals: 2, explanation: "Goals divided by appearances. A short substitute appearance still counts as one game." },
  { id: "goals-per-90", label: "Goals per 90 minutes", decimals: 2, explanation: "Goals × 90 ÷ minutes played within this same scope." },
  { id: "contributions-per-90", label: "Goals + assists per 90", decimals: 2, explanation: "(Goals + assists) × 90 ÷ minutes played within this same scope." },
];

export function statsChartValues(stats: Stats): ChartRecord["values"] {
  const pair = (calculate: (player: PlayerId) => number | null): ChartValues => ({ messi: calculate("messi"), ronaldo: calculate("ronaldo") });
  return {
    goals: stats.goals, assists: stats.assists, appearances: stats.appearances, minutes: stats.minutes,
    contributions: pair(player => stats.goals[player] + stats.assists[player]),
    "goals-per-game": pair(player => ratio(stats.goals[player], stats.appearances[player])),
    "goals-per-90": pair(player => ratio(stats.goals[player] * 90, stats.minutes[player])),
    "contributions-per-90": pair(player => ratio((stats.goals[player] + stats.assists[player]) * 90, stats.minutes[player])),
  };
}

// A missing record breaks the line. Never render an unavailable rate as zero.
export function chartPath(values: (number | null)[], x: (index: number) => number, y: (value: number) => number) {
  let connected = false;
  return values.map((value, index) => {
    if (value === null || !Number.isFinite(value)) { connected = false; return ""; }
    const command = `${connected ? "L" : "M"} ${x(index)} ${y(value)}`;
    connected = true;
    return command;
  }).filter(Boolean).join(" ");
}

export function chartMaximum(values: (number | null)[]) {
  const maximum = Math.max(0, ...values.filter((value): value is number => value !== null && Number.isFinite(value)));
  if (!maximum) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  const interval = maximum / 4 / magnitude;
  const step = [1, 2, 2.5, 5, 10].find(value => value >= interval) ?? 10;
  return step * magnitude * 4;
}
