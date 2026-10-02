"use client";

import { InteractiveChart } from "./interactive-chart";
import { useFootballData } from "./data-provider";
import { chartMetrics, statsChartValues, type ChartRecord } from "@/lib/chart-data";
import { clubSeasons } from "@/lib/club-seasons";
import type { PlayerId, Scope } from "@/lib/football";
import { useState } from "react";
import { useI18n } from "./i18n-provider";
import { ScoringAnalysis } from "./scoring-analysis";

export function ComparisonChart({ scope, metric }: { scope: Scope; metric?: string }) {
  const { calendarYears } = useFootballData();
  const { t } = useI18n();
  const [view, setView] = useState("years");
  const yearScope = scope.id === "career" || scope.id === "club" || scope.id === "international" || scope.id === "league" ? scope.id : undefined;
  const canShowYears = yearScope && (!metric || chartMetrics.some(item => item.id === metric));
  return <div className="record-explorer">
    {canShowYears && <div className="scope-tabs record-explorer-nav" role="group" aria-label={t("Chart coverage")}>
      <button type="button" aria-pressed={view === "years"} className={view === "years" ? "selected" : ""} onClick={() => setView("years")}>{t("Calendar-year statistics")}</button>
      <button type="button" aria-pressed={view === "comparison"} className={view === "comparison" ? "selected" : ""} onClick={() => setView("comparison")}>{t("All-time stats")}</button>
    </div>}
    {canShowYears && view === "years" ? <InteractiveChart key={`years-${scope.id}`} title={`${t("Career timeline")} · ${t(scope.shortLabel)}`} metrics={chartMetrics} initialMetric={metric}
      records={calendarYears.map((year, index) => ({ id: String(year.year), label: String(year.year), values: statsChartValues(year[yearScope]), href: `/seasons/${year.year}#scope=${yearScope}`, note: index === calendarYears.length - 1 ? "Year to date" : "Completed calendar year" }))}
      /> : <InteractiveChart key={scope.id} metrics={scope.metrics} initialMetric={metric}
    records={[{ id: scope.id, label: scope.label, values: Object.fromEntries(scope.metrics.map(item => [item.id, item.values])), note: scope.description }]}
    />}
    {!metric && <ScoringAnalysis goals={scope.goals} appearances={scope.appearances} minutes={scope.minutes} context={t(scope.label)}/>}
  </div>;
}

export function PlayerCareerChart({ player }: { player: PlayerId }) {
  const { calendarYears } = useFootballData();
  return <InteractiveChart title="Career timeline" players={[player]} metrics={chartMetrics}
    records={calendarYears.map((year, index) => ({ id: String(year.year), label: String(year.year), values: statsChartValues(year.career), href: `/seasons/${year.year}`, note: index === calendarYears.length - 1 ? "Year to date" : "Completed calendar year" }))}
    />;
}

export function ClubSeasonChart({ selected }: { selected?: string }) {
  const records: ChartRecord[] = clubSeasons.map(season => ({ id: season.slug, label: season.label, values: statsChartValues(season.stats), href: `/club-stats/${season.slug}`,
    note: season.inProgress ? "This season is incomplete. Figures are a reviewed snapshot and do not update automatically." : season.alignedPeriod ? "Messi’s club figures cover the same period as Ronaldo’s season. This is not a complete MLS calendar season." : "Club competitions only. National-team matches and club friendlies are excluded." }));
  return <InteractiveChart key={selected ?? "all"} title="Club season goals" records={records} metrics={chartMetrics} initialRecord={selected} />;
}
