import { sources, type PlayerId, type ScopeId } from "./data";
import type { PublishedData } from "./published-data";
import { seasons } from "./seasons";

export type ScoringSample = { goals: number; appearances: number; minutes: number | null };
export type CalculatorRecord = { id: string; label: string; coverage: string; href: string; sources: string[]; players: Record<PlayerId, ScoringSample> };
export type CalculatorState = { messi: string; ronaldo: string; basis: "minutes" | "appearances"; amount: number };
export const calculatorPresets = {
  career: { label: "Career scoring", state: { messi: "scope:career", ronaldo: "scope:career", basis: "minutes", amount: 900 } },
  years: { label: "Peak calendar years", state: { messi: "year:2012", ronaldo: "year:2013", basis: "appearances", amount: 50 } },
  league: { label: "50 vs 48 league goals", state: { messi: "league:2011-12", ronaldo: "league:2014-15", basis: "appearances", amount: 38 } },
  europe: { label: "14 vs 17 European goals", state: { messi: "ucl:2011-12", ronaldo: "ucl:2013-14", basis: "appearances", amount: 11 } },
} satisfies Record<string, { label: string; state: CalculatorState }>;
export type CalculatorPreset = keyof typeof calculatorPresets;

export function calculatorRecords(data: PublishedData): CalculatorRecord[] {
  const ids: ScopeId[] = ["career", "club", "international", "champions-league", "la-liga", "world-cup", "league"];
  return [
    ...ids.map(id => {
      const scope = data.scopes[id];
      return { id: `scope:${id}`, label: scope.shortLabel, coverage: scope.period, href: `/compare#scope=${id}`, sources: scope.source.map(key => sources[key].url), players: Object.fromEntries((["messi", "ronaldo"] as const).map(player => [player, { goals: scope.goals[player], appearances: scope.appearances[player], minutes: scope.minutes[player] }])) as Record<PlayerId, ScoringSample> };
    }),
    ...[...data.calendarYears].reverse().map(year => ({
      id: `year:${year.year}`, label: `${year.year} · Club + country`, coverage: year.year === Number(data.snapshotDate.slice(0, 4)) ? `Through ${data.snapshotDate}` : `January–December ${year.year}`, href: `/seasons/${year.year}`, sources: [year.source],
      players: Object.fromEntries((["messi", "ronaldo"] as const).map(player => [player, { goals: year.career.goals[player], appearances: year.career.appearances[player], minutes: year.career.minutes[player] }])) as Record<PlayerId, ScoringSample>,
    })),
    ...[...seasons].reverse().flatMap(season => (["league", "ucl"] as const).map(competition => ({
      id: `${competition}:${season.slug}`, label: `${season.label} · ${competition === "league" ? "La Liga" : "Champions League"}`, coverage: season.label,
      href: `/seasons/${season.slug}#competition=${competition}`, sources: [sources.liga.url],
      // This archive has no minutes. Never infer them from appearances.
      players: { messi: { ...season[competition].messi, minutes: null }, ronaldo: { ...season[competition].ronaldo, minutes: null } },
    }))),
  ];
}

export function scoringProjection(sample: ScoringSample, basis: CalculatorState["basis"], amount: number): number | null {
  const denominator = sample[basis];
  if (denominator === null || !Number.isFinite(denominator) || denominator <= 0 || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(sample.goals) || sample.goals < 0) return null;
  return sample.goals / denominator * amount;
}

export function normalizeCalculator(state: CalculatorState, records: CalculatorRecord[]): CalculatorState {
  const fallback = records.find(record => record.id === "scope:career") ?? records[0];
  const messi = records.find(record => record.id === state.messi) ?? fallback;
  const ronaldo = records.find(record => record.id === state.ronaldo) ?? fallback;
  const hasMinutes = messi.players.messi.minutes !== null && ronaldo.players.ronaldo.minutes !== null;
  const basis = state.basis === "minutes" && hasMinutes ? "minutes" : "appearances";
  const amount = basis !== state.basis ? 10 : state.amount;
  return { messi: messi.id, ronaldo: ronaldo.id, basis, amount: Number.isFinite(amount) ? Math.min(basis === "minutes" ? 9000 : 100, Math.max(basis === "minutes" ? 90 : 1, Math.round(amount))) : basis === "minutes" ? 900 : 10 };
}
export function calculatorHash(state: CalculatorState) {
  return `#${new URLSearchParams({ messi: state.messi, ronaldo: state.ronaldo, basis: state.basis, amount: String(state.amount) })}`;
}
export function parseCalculator(hash: string, records: CalculatorRecord[], fallback: CalculatorState): CalculatorState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return normalizeCalculator({ messi: params.get("messi") ?? fallback.messi, ronaldo: params.get("ronaldo") ?? fallback.ronaldo, basis: params.get("basis") === "minutes" ? "minutes" : params.get("basis") === "appearances" ? "appearances" : fallback.basis, amount: params.has("amount") ? Number(params.get("amount")) : fallback.amount }, records);
}
