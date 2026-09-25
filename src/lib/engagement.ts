import type { Pair, PlayerId } from "./data";
import type { CalendarYear, PublishedData } from "./published-data";
import { seasons } from "./seasons";

export type QuizAnswer = PlayerId | "tie";
export type QuizQuestion = { id: string; prompt: string; context: string; metric: string; values: Pair; decimals: number; lowerIsBetter?: boolean; href: string; explanation: string };
export function quizWinner(values: Pair, lowerIsBetter = false): QuizAnswer {
  if (values.messi === values.ronaldo) return "tie";
  return (lowerIsBetter ? values.messi < values.ronaldo : values.messi > values.ronaldo) ? "messi" : "ronaldo";
}
export function quizQuestions(data: PublishedData): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const [scopeId, metricId, prompt] of [
    ["career", "goals", "Who has more career goals in this published snapshot?"],
    ["career", "assists", "Who has more career assists in this published snapshot?"],
    ["champions-league", "minutes-per-goal", "Who needed fewer minutes per Champions League goal?"],
  ] as const) {
    const scope = data.scopes[scopeId];
    const metric = scope.metrics.find(item => item.id === metricId);
    if (metric) questions.push({ id: `${scopeId}:${metricId}`, prompt, context: scope.shortLabel, metric: metric.label, values: metric.values, decimals: metric.decimals ?? 0, lowerIsBetter: metric.lowerIsBetter, href: `/compare#scope=${scopeId}`, explanation: metric.explanation });
  }
  for (const yearNumber of [2012, 2013]) {
    const year = data.calendarYears.find(item => item.year === yearNumber);
    if (year) questions.push({ id: `year:${yearNumber}`, prompt: `Who scored more club and country goals in ${yearNumber}?`, context: String(yearNumber), metric: "Goals", values: year.career.goals, decimals: 0, href: `/seasons/${yearNumber}`, explanation: "A full January-to-December comparison." });
  }
  for (const [slug, competition, prompt] of [
    ["2011-12", "league", "Who scored more La Liga goals in 2011/12?"],
    ["2013-14", "ucl", "Who scored more Champions League goals in 2013/14?"],
    ["2014-15", "ucl", "Who scored more Champions League goals in 2014/15?"],
  ] as const) {
    const season = seasons.find(item => item.slug === slug)!;
    questions.push({ id: `${competition}:${slug}`, prompt, context: season.label, metric: "Goals", values: { messi: season[competition].messi.goals, ronaldo: season[competition].ronaldo.goals }, decimals: 0, href: `/seasons/${slug}#competition=${competition}`, explanation: "League and Champions League figures are kept separate." });
  }
  return questions;
}

export type TimelineMetric = "goals" | "assists" | "contributions";
export type TimelineState = { from: number; to: number; metric: TimelineMetric; cumulative: boolean };
export function normalizeTimeline(params: URLSearchParams, years: readonly CalendarYear[]): TimelineState {
  const first = years[0].year, last = years.at(-1)!.year;
  const parse = (key: string, fallback: number) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isInteger(value) && years.some(row => row.year === value) ? value : fallback;
  };
  const from = parse("from", first), to = parse("to", last);
  const metric = params.get("metric");
  return { from: Math.min(from, to), to: Math.max(from, to), metric: metric === "assists" || metric === "contributions" ? metric : "goals", cumulative: params.get("cumulative") === "1" };
}
export function timelineRows(years: readonly CalendarYear[], state: TimelineState) {
  const total: Pair = { messi: 0, ronaldo: 0 };
  return years.filter(row => row.year >= state.from && row.year <= state.to).map(row => {
    const annual = { messi: row.career.goals.messi, ronaldo: row.career.goals.ronaldo };
    for (const player of ["messi", "ronaldo"] as const) {
      annual[player] = state.metric === "assists" ? row.career.assists[player] : row.career.goals[player] + (state.metric === "contributions" ? row.career.assists[player] : 0);
      total[player] += annual[player];
    }
    return { year: row.year, annual, values: state.cumulative ? { ...total } : annual };
  });
}

export type MilestoneState = { target: number; messi: number; ronaldo: number };
export function normalizeMilestone(params: URLSearchParams): MilestoneState {
  const number = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key), value = raw?.trim() ? Number(raw) : NaN;
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  return { target: Math.round(number("target", 1000, 100, 2000)), messi: Math.round(number("messi", 0.8, 0, 3) * 100) / 100, ronaldo: Math.round(number("ronaldo", 0.8, 0, 3) * 100) / 100 };
}
export function milestoneGames(current: number, target: number, pace: number): number | null {
  if (![current, target, pace].every(Number.isFinite) || current < 0 || target < 0 || pace < 0) return null;
  const gap = Math.max(target - current, 0);
  if (!gap) return 0;
  const hundredths = Math.round(pace * 100);
  // Integer arithmetic avoids ceil(21 / 0.7) returning 31 from float drift.
  return hundredths > 0 ? Math.ceil(gap * 100 / hundredths) : null;
}

