import snapshot from "@/data/football.json";

export type PlayerId = "messi" | "ronaldo";
export type Pair = { messi: number; ronaldo: number };
export type GoalMode = "total" | "per-game" | "per-90";
export type MetricGroup = "overview" | "scoring";
export type ScopeId = "career" | "2026" | "club" | "international" | "champions-league" | "la-liga" | "world-cup" | "copa-euros" | "current-clubs" | "league" | "european-clubs" | "career-europe" | "head-to-head";
export const snapshotDate = snapshot.asOf;
export const reviewedDate = snapshot.reviewedAt;
export const datasetVersion = snapshot.version;
export const snapshotLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${snapshotDate}T00:00:00Z`));
export const sources = {
  updates: { name: "Published match updates", title: "Dated match records and provider definitions", url: "/updates", note: "Records published by the administrator after the reviewed baseline. API-Football assists use that provider’s convention; manual corrections include evidence and an explanation. Historical goal-type figures keep their own cutoff." },
  reference: { name: "Messi vs Ronaldo App", title: "Published career, club and international statistics", url: "https://www.messivsronaldo.app/", note: "Secondary statistical reference, reviewed 21 September 2026. Career assists and minutes follow this source's definitions; the figures are not represented as an official live feed." },
  calendar: { name: "Calendar-year records", title: "2026 goals, assists and appearances", url: "https://www.messivsronaldo.app/calendar-year-stats/2026/", note: "January–December comparisons for club and country. 2026 is a partial year through the snapshot date; every year in the explorer has its own source URL." },
  miami: { name: "Inter Miami statistics", title: "Messi's competitive Inter Miami record", url: "https://www.messivsronaldo.app/all-time-stats/messi-inter-miami-stats/", note: "Includes MLS regular season, playoffs and other competitive club tournaments; not just MLS goals." },
  nassr: { name: "Al Nassr statistics", title: "Ronaldo's competitive Al Nassr record", url: "https://www.messivsronaldo.app/all-time-stats/ronaldo-al-nassr-stats/", note: "Includes the Arab Club Champions Cup. Club friendlies are excluded." },
  headToHead: { name: "Head-to-head records", title: "Matches in which both players appeared", url: "https://www.messivsronaldo.app/all-time-stats/games-vs-each-other/", note: "36 meetings: senior competitive club games and two senior international friendlies. Excludes the 2023 Riyadh exhibition." },
  trophies: { name: "Trophy register", title: "Team honours with competition and participation notes", url: "https://www.messivsronaldo.app/honours-and-achievements/", note: "Published team honours through 21 September 2026. Youth titles and conference honours are shown separately. Some super cups were awarded without the player appearing." },
  uefa: { name: "UEFA", title: "Champions League goals, assists and appearances", url: "https://www.uefa.com/uefachampionsleague/news/0297-1d3e8b524832-5bf371ab86ce-1000--most-assists-in-the-champions-league-cristiano-ronaldo-lea/", note: "Main competition only. UEFA reports 42 Ronaldo assists and 40 Messi assists; our career reference reports 41 for Ronaldo in this competition. UEFA's definition is retained in the Champions League view." },
  barcelona: { name: "FC Barcelona", title: "Leo Messi, FC Barcelona's historic record breaker", url: "https://www.fcbarcelona.com/en/football/first-team/news/2070529/leo-messi-fc-barcelonas-historic-record-breaker", note: "Messi's completed La Liga record: 474 goals in 520 appearances." },
  barcelonaStats: { name: "Barcelona statistical record", title: "Messi at Barcelona, by competition", url: "https://www.messivsronaldo.app/all-time-stats/messi-barcelona-stats/", note: "Assists, minutes and scoring breakdowns for Barcelona and La Liga." },
  madridStats: { name: "Real Madrid statistical record", title: "Ronaldo at Real Madrid, by competition", url: "https://www.messivsronaldo.app/all-time-stats/ronaldo-real-madrid-stats/", note: "Uses the standard 450 competitive Madrid goals; the club's own 451 total assigns a disputed deflected goal differently." },
  liga: { name: "Turkish Football Federation", title: "TamSaha, July 2020 — the shared Spanish era", url: "https://www.tff.org/Resources/Tamsaha/188/files/assets/common/downloads/publication.pdf", note: "Historical season table used in the 2009/10–2017/18 archive. Ronaldo's completed La Liga career: 311 goals in 292 appearances." },
  ballon: { name: "UEFA / Ballon d'Or", title: "History of the Ballon d'Or: all the winners", url: "https://www.uefa.com/ballondor/news/0287-195e642735da-0594342b9554-1000--history-of-the-ballon-d-or-all-the-winners/", note: "Winners through the latest completed edition, 2025. The 2020 award was cancelled; the 2026 award has not been presented at this snapshot date." },
  iffhs: { name: "IFFHS archive", title: "World's best goalscorers — end of 2024", url: "https://iffhs.com/en/news/the-worlds-best-goalscorers-of-xxi-century-4198", note: "Historical cross-check: 850 Messi goals and 916 Ronaldo goals at the end of 2024. The 2025 and 2026 yearly additions reconcile with the new career totals." },
  ronaldoLatest: { name: "AS · Ronaldo", title: "Ronaldo reaches 979 career goals, 9 September 2026", url: "https://as.com/futbol/internacional/cristiano-lanzado-hacia-los-1000-goles-f202609-n/", note: "Independent news corroboration of the latest Ronaldo goal milestone." },
  messiLatest: { name: "AS · Messi", title: "Messi scores against San Diego, 20 September 2026", url: "https://as.com/us/futbol/messi-se-luce-con-golazo-en-el-duelo-entre-inter-miami-y-san-diego-fc-f202609-n/", note: "Independent report of the latest scoring match, published 21 September UTC." },
} as const;
export type SourceId = keyof typeof sources;
export interface Metric { id: string; label: string; values: Pair; unit?: string; decimals?: number; source: SourceId[]; explanation: string; derived?: boolean; group: MetricGroup; lowerIsBetter?: boolean; coverage?: string }
export interface Scope { id: string; label: string; shortLabel: string; description: string; period: string; goals: Pair; appearances: Pair; minutes: Pair; metrics: Metric[]; source: SourceId[]; answer: string }
export interface Stats { goals: Pair; assists: Pair; appearances: Pair; minutes: Pair; hatTricks?: Pair; freeKicks?: Pair; outsideBox?: Pair; insideBox?: Pair; leftFoot?: Pair; rightFoot?: Pair; headers?: Pair; otherBody?: Pair; penalties?: Pair; penaltyAttempts?: Pair }
export const players = {
  messi: { name: "Lionel Messi", short: "Messi", number: "10", country: "Argentina", countryCode: "ARG", born: "1987-06-24", birthplace: "Rosario, Argentina", image: "/images/argentina-portraits-fifa-world-cup-2026.jpg", imageWidth: 384, imageHeight: 594, imageAlt: "Lionel Messi in Argentina’s shirt for the 2026 World Cup portraits", tagline: "Argentina · Born in Rosario, 24 June 1987", awards: [2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023] },
  ronaldo: { name: "Cristiano Ronaldo", short: "Ronaldo", number: "7", country: "Portugal", countryCode: "POR", born: "1985-02-05", birthplace: "Funchal, Portugal", image: "/images/portugal-portraits-fifa-world-cup-2026.jpg", imageWidth: 396, imageHeight: 594, imageAlt: "Cristiano Ronaldo in Portugal’s red shirt for the 2026 World Cup portraits", tagline: "Portugal · Born in Funchal, 5 February 1985", awards: [2008, 2013, 2014, 2016, 2017] },
} as const;

export function ratio(numerator: number | null, denominator: number | null): number | null {
  return numerator === null || denominator === null || denominator <= 0 ? null : numerator / denominator;
}
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
  return { id, label, shortLabel, description, period, goals: stats.goals, appearances: stats.appearances, minutes: stats.minutes, metrics, source, answer: `In this ${label.toLowerCase()} comparison, Messi has ${stats.goals.messi} goals and ${stats.assists.messi} assists in ${stats.appearances.messi} appearances. Ronaldo has ${stats.goals.ronaldo} goals and ${stats.assists.ronaldo} assists in ${stats.appearances.ronaldo} appearances. ${period}. ${description}` };
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
export const scopeIds = Object.keys(scopes) as ScopeId[];
export function isScope(value: string | null): value is ScopeId { return value !== null && scopeIds.includes(value as ScopeId); }
export function getGoalValues(scope: Scope, mode: GoalMode): Pair {
  if (mode === "per-game") return combine(scope.goals, scope.appearances, (a, b) => a / b);
  if (mode === "per-90") return combine(scope.goals, scope.minutes, (a, b) => a * 90 / b);
  return scope.goals;
}
export const awardHistory = Array.from({ length: 18 }, (_, i) => { const year = 2008 + i; return { year, messi: players.messi.awards.filter(y => y <= year).length, ronaldo: players.ronaldo.awards.filter(y => y <= year).length }; });
export function comparisonCsv(scope: Scope): string {
  const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const rows = [["Metric", "Lionel Messi", "Cristiano Ronaldo", "Coverage", "Source", "Definition", "Unit"], ...scope.metrics.map(m => [m.label, m.values.messi.toFixed(m.decimals ?? 0), m.values.ronaldo.toFixed(m.decimals ?? 0), m.coverage ?? scope.period, m.source.map(s => sources[s].url).join(" | "), m.explanation, m.unit ?? "count or rate"])];
  return rows.map(row => row.map(quote).join(",")).join("\r\n");
}
export const calendarYears = snapshot.calendar;
export const clubs = snapshot.clubs;
