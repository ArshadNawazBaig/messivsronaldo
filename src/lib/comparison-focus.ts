import type { Scope } from "./data";

export type FocusMetric = "assists" | "freeKicks" | "penalties" | "hatTricks";
export const focusLabels: Record<FocusMetric, string> = {
  assists: "Assists", freeKicks: "Direct free-kick goals",
  penalties: "Penalty goals", hatTricks: "Hat-tricks",
};

// A scope without this breakdown is unknown, not zero or its total goals.
// Keep goal-type totals at their own cutoff rather than dividing them by
// appearances/minutes from newer match records.
export function comparisonFocus(scope: Scope, id: FocusMetric, baselineDate: string, snapshotDate: string) {
  const metric = scope.metrics.find(item => item.id === id);
  return {
    values: metric?.values ?? { messi: null, ronaldo: null },
    label: focusLabels[id],
    date: id === "assists" ? snapshotDate : baselineDate,
    period: metric?.coverage ?? scope.period,
    explanation: metric?.explanation,
    source: metric?.source ?? [],
  };
}
