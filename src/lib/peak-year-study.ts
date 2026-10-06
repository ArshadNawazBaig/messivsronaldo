import type { PublishedData } from "./published-data";
import { scoringProjection } from "./calculator";

export const peakYearStudyUpdated = "2026-10-07";
export const peakYearStudyPath = "/insights/messi-2012-vs-ronaldo-2013-goals";
export const peakYearStudyDownload = "/api/research/peak-calendar-years";
export const peakYearSources = {
  messi: "https://www.uefa.com/news/026c-12f331da0b70-64b0980c3700-1000--messi-leaves-barca-a-salute/",
  ronaldo: "https://www.uefa.com/uefachampionsleague/news/0211-0e8866833d94-86d200f75b0a-1000--cristiano-ronaldo-takes-2013-by-storm/",
};

// Both samples use January–December senior club + country appearances. Rates
// are derived from unrounded inputs; scaling a rate is not a prediction.
export function peakYearStudy(data: PublishedData) {
  return ([{ player: "messi", name: "Lionel Messi", year: 2012 }, { player: "ronaldo", name: "Cristiano Ronaldo", year: 2013 }] as const).flatMap(sample => {
    const year = data.calendarYears.find(record => record.year === sample.year);
    if (!year) return [];
    const record = { goals: year.career.goals[sample.player], appearances: year.career.appearances[sample.player], minutes: null };
    return [{ ...sample, ...record, perAppearance: scoringProjection(record, "appearances", 1),
      over50: scoringProjection(record, "appearances", 50), source: peakYearSources[sample.player], recordSource: year.source }];
  });
}

export function peakYearStudyCsv(data: PublishedData) {
  const rows = peakYearStudy(data);
  const fields = ["player", "calendar_year", "scope", "goals", "appearances", "goals_per_appearance", "scenario_appearances", "scenario_goals", "formula", "primary_reference", "dataset_reference", "analysis_updated", "limitation"];
  const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [fields, ...rows.map(row => [row.name, row.year, "Senior club + country; January–December", row.goals, row.appearances, row.perAppearance, 50, row.over50, "goals / appearances * 50", row.source, row.recordSource, peakYearStudyUpdated, "Arithmetic scenario; not a forecast or an adjustment for opposition, team strength or minutes per appearance."])].map(row => row.map(escape).join(",")).join("\r\n") + "\r\n";
}
