import snapshot from "@/data/football.json";
import { type Pair, type Stats, type SourceId, type Metric, type Scope, type ScopeId } from "./football";

// Snapshot construction stays out of browser components. They receive published
// statistics from DataProvider and import small shared helpers from football.ts.
export * from "./football";
export const snapshotDate = snapshot.asOf;
export const reviewedDate = snapshot.reviewedAt;
export const datasetVersion = snapshot.version;
export const snapshotLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${snapshotDate}T00:00:00Z`));

const combine = (a: Pair, b: Pair, operation: (a: number, b: number) => number): Pair => ({ messi: operation(a.messi, b.messi), ronaldo: operation(a.ronaldo, b.ronaldo) });
export function makeScope(id: string, label: string, shortLabel: string, stats: Stats, source: SourceId[], description: string, period = `Updated ${snapshotLabel}`): Scope {
  const metric = (id: string, label: string, values: Pair, explanation: string, options: Partial<Metric> = {}): Metric => ({ id, label, values, source, explanation, group: "overview", ...options });
  const contributions = combine(stats.goals, stats.assists, (a, b) => a + b);
  const metrics: Metric[] = [
    metric("goals", "Goals", stats.goals, "Goals within the selected scope. Penalty-shootout kicks and club friendlies are excluded."),
    metric("assists", "Assists", stats.assists, "Conventional assists as published by the named source. Secondary, fantasy and penalty-won assists are not added. Providers may classify incidents differently."),
    metric("appearances", "Appearances", stats.appearances, "Matches in which the player appeared; a substitute appearance counts as one game."),
    metric("minutes", "Minutes played", stats.minutes, "Published playing time for the selected scope, including extra time where applicable."),
    metric("contributions", "Goals + assists", contributions, "Goals plus assists from the same scope and assist definition.", { derived: true }),
  ];
  if (stats.appearances.messi > 0 && stats.appearances.ronaldo > 0) metrics.push(metric("goals-per-game", "Goals per appearance", combine(stats.goals, stats.appearances, (a, b) => a / b), "Goals divided by appearances. A short substitute appearance still counts as one game.", { decimals: 2, derived: true }));
  if (stats.minutes.messi > 0 && stats.minutes.ronaldo > 0) {
    metrics.push(metric("goals-per-90", "Goals per 90 minutes", combine(stats.goals, stats.minutes, (a, b) => a * 90 / b), "Goals × 90 ÷ minutes played within this same scope.", { decimals: 2, derived: true }));
    metrics.push(metric("contributions-per-90", "Goals + assists per 90", combine(contributions, stats.minutes, (a, b) => a * 90 / b), "(Goals + assists) × 90 ÷ minutes played within this same scope.", { decimals: 2, derived: true }));
  }
  if (stats.goals.messi > 0 && stats.goals.ronaldo > 0) metrics.push(metric("minutes-per-goal", "Minutes per goal", combine(stats.minutes, stats.goals, (a, b) => a / b), "Playing minutes divided by goals. A lower value means goals were scored more frequently.", { decimals: 1, derived: true, lowerIsBetter: true }));
  const scoring: [keyof Stats, string, string][] = [
    ["hatTricks", "Hat-tricks", "Matches with at least three goals; a four- or five-goal match counts once."],
    ["penalties", "Penalty goals", "Successful penalties during the match or extra time. Shootouts excluded."],
    ["penaltyAttempts", "Penalties taken", "In-match penalty attempts, including misses and saves. Shootouts excluded."],
    ["freeKicks", "Direct free-kick goals", "Goals scored directly from a free kick, as classified by the source."],
    ["outsideBox", "Outside-box goals", "Goals from outside the penalty area, excluding direct free kicks."],
    ["insideBox", "Inside-box goals", "Goals from inside the penalty area, excluding penalty kicks."],
    ["leftFoot", "Left-foot goals", "Goals scored with the left foot; includes applicable set-piece goals."],
    ["rightFoot", "Right-foot goals", "Goals scored with the right foot; includes applicable set-piece goals."],
    ["headers", "Headed goals", "Goals scored with the head, as classified by the source."],
    ["otherBody", "Other body parts", "Goals not classified as left foot, right foot or header by the source."],
  ];
  for (const [key, label, explanation] of scoring) if (stats[key]) metrics.push(metric(key, label, stats[key]!, explanation, { group: "scoring" }));
  if (stats.penalties) metrics.push(metric("non-penalty-goals", "Non-penalty goals", combine(stats.goals, stats.penalties, (a, b) => a - b), "Total goals minus in-match penalty goals. Direct free kicks remain included.", { group: "scoring", derived: true }));
  if (stats.penalties && stats.penaltyAttempts && stats.penaltyAttempts.messi > 0 && stats.penaltyAttempts.ronaldo > 0) metrics.push(metric("penalty-conversion", "Penalty conversion", combine(stats.penalties, stats.penaltyAttempts, (a, b) => a / b * 100), "Successful in-match penalties ÷ attempts × 100. Shootout kicks excluded.", { group: "scoring", decimals: 1, unit: "%", derived: true }));
  return { id, label, shortLabel, description, period, updatedThrough: snapshotDate, goals: stats.goals, appearances: stats.appearances, minutes: stats.minutes, metrics, source, answer: `In this ${label.toLowerCase()} comparison, Messi has ${stats.goals.messi} goals and ${stats.assists.messi} assists in ${stats.appearances.messi} appearances. Ronaldo has ${stats.goals.ronaldo} goals and ${stats.assists.ronaldo} assists in ${stats.appearances.ronaldo} appearances. ${period}. ${description}` };
}
const raw = snapshot.scopes;
const careerRules = "Senior competitive club games and senior internationals, including A-international friendlies. Club friendlies, youth games and shootouts excluded.";
export const scopes: Record<ScopeId, Scope> = {
  career: makeScope("career", "Career overview", "Career", raw.career, ["reference"], careerRules),
  "2026": makeScope("2026", "2026 club and country", "2026", snapshot.calendar.at(-1)!.career, ["calendar"], "Calendar year to date: 1 January to 21 September 2026. Includes senior club and country; 2026 is not a completed year."),
  club: makeScope("club", "Club football", "Club", raw.club, ["reference"], "All senior competitive club games, including domestic and continental cups. Friendlies excluded."),
  international: makeScope("international", "International football", "International", raw.international, ["reference"], "Senior Argentina and Portugal games, including recognized A-international friendlies. Youth and Olympic teams excluded."),
  "champions-league": makeScope("champions-league", "Champions League", "Champions League", { ...raw["champions-league"], assists: { messi: 40, ronaldo: 42 } }, ["uefa", "reference"], "UEFA Champions League main competition only. Assists follow UEFA: 40 Messi, 42 Ronaldo. Minutes and goal types follow the secondary statistical reference."),
  "la-liga": makeScope("la-liga", "La Liga", "La Liga", raw["la-liga"], ["barcelonaStats", "madridStats"], "Complete Spanish top-flight league careers; not just the seasons both players spent in Spain."),
  "world-cup": makeScope("world-cup", "World Cup finals", "World Cup", raw["world-cup"], ["reference"], "FIFA World Cup final tournaments through 2026. Qualifiers and shootouts excluded."),
  "copa-euros": makeScope("copa-euros", "Copa América / Euros", "Copa / Euros", raw["copa-euros"], ["reference"], "Messi's Copa América finals versus Ronaldo's European Championship finals. Different tournaments and formats; qualifiers excluded."),
  "current-clubs": makeScope("current-clubs", "Inter Miami / Al Nassr", "Current clubs", raw["current-clubs"], ["miami", "nassr"], "Complete competitive records with Inter Miami and Al Nassr respectively. Both joined in 2023, at different dates."),
  league: makeScope("league", "Domestic league careers", "All leagues", raw.league, ["reference"], "Domestic top-flight league games across all clubs. MLS playoffs are counted separately from regular-season league matches by this source."),
  "european-clubs": makeScope("european-clubs", "European clubs", "European clubs", raw["european-clubs"], ["reference"], "Competitive club games before Inter Miami and Al Nassr. National-team games excluded."),
  "career-europe": makeScope("career-europe", "Career excluding Miami / Al Nassr", "Without USA / Saudi", raw["career-europe"], ["reference"], "European club records plus all senior internationals, including internationals played after joining Inter Miami and Al Nassr."),
  "head-to-head": makeScope("head-to-head", "Direct meetings", "Head to head", raw["head-to-head"], ["headToHead"], "36 matches in which both played: competitive club games and two senior international friendlies. The Riyadh exhibition is excluded."),
};
// Do not silently replace the career provider's assist convention with UEFA's.
for (const metric of scopes["champions-league"].metrics) {
  metric.source = ["goals", "assists", "appearances", "contributions", "goals-per-game"].includes(metric.id) ? ["uefa"] : ["reference"];
  if (["goals-per-90", "contributions-per-90", "minutes-per-goal"].includes(metric.id)) metric.source = ["uefa", "reference"];
  if (metric.id === "assists") metric.explanation = "UEFA reports Messi 40 and Ronaldo 42 Champions League assists. Our secondary career source reports Ronaldo 41. This competition view uses UEFA's definition, not the career provider's definition.";
}
export const calendarYears = snapshot.calendar;
export const clubs = snapshot.clubs;
