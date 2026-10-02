import { playerPortraits } from "./player-artwork";

export type PlayerId = "messi" | "ronaldo";
export type Pair = { messi: number; ronaldo: number };
export type GoalMode = "total" | "per-game" | "per-90";
export type MetricGroup = "overview" | "scoring";
export type ScopeId = "career" | "2026" | "club" | "international" | "champions-league" | "la-liga" | "world-cup" | "copa-euros" | "current-clubs" | "league" | "european-clubs" | "career-europe" | "head-to-head";
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
export interface Metric { id: string; label: string; values: Pair; unit?: string; decimals?: number; source: SourceId[]; explanation: string; derived?: boolean; group: MetricGroup; lowerIsBetter?: boolean; coverage?: string; updatedThrough?: string }
export interface Scope { id: string; label: string; shortLabel: string; description: string; period: string; updatedThrough: string; goals: Pair; appearances: Pair; minutes: Pair; metrics: Metric[]; source: SourceId[]; answer: string }
export interface Stats { goals: Pair; assists: Pair; appearances: Pair; minutes: Pair; hatTricks?: Pair; freeKicks?: Pair; outsideBox?: Pair; insideBox?: Pair; leftFoot?: Pair; rightFoot?: Pair; headers?: Pair; otherBody?: Pair; penalties?: Pair; penaltyAttempts?: Pair }
export const players = {
  messi: { name: "Lionel Messi", short: "Messi", number: "10", country: "Argentina", countryCode: "ARG", born: "1987-06-24", birthplace: "Rosario, Argentina", image: playerPortraits.messi.src, imageWidth: playerPortraits.messi.width, imageHeight: playerPortraits.messi.height, imageAlt: playerPortraits.messi.alt, tagline: "Argentina · Born in Rosario, 24 June 1987", awards: [2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023] },
  ronaldo: { name: "Cristiano Ronaldo", short: "Ronaldo", number: "7", country: "Portugal", countryCode: "POR", born: "1985-02-05", birthplace: "Funchal, Portugal", image: playerPortraits.ronaldo.src, imageWidth: playerPortraits.ronaldo.width, imageHeight: playerPortraits.ronaldo.height, imageAlt: playerPortraits.ronaldo.alt, tagline: "Portugal · Born in Funchal, 5 February 1985", awards: [2008, 2013, 2014, 2016, 2017] },
} as const;

export function ratio(numerator: number | null, denominator: number | null): number | null {
  return numerator === null || denominator === null || denominator <= 0 ? null : numerator / denominator;
}
const combine = (a: Pair, b: Pair, operation: (a: number, b: number) => number): Pair => ({ messi: operation(a.messi, b.messi), ronaldo: operation(a.ronaldo, b.ronaldo) });
// Keep browser helpers independent of the historical snapshot and scope building.
export const scopeIds: ScopeId[] = ["2026", "career", "club", "international", "champions-league", "la-liga", "world-cup", "copa-euros", "current-clubs", "league", "european-clubs", "career-europe", "head-to-head"];
export function isScope(value: string | null): value is ScopeId { return value !== null && scopeIds.includes(value as ScopeId); }
export function getGoalValues(scope: Scope, mode: GoalMode): Pair {
  if (mode === "per-game") return combine(scope.goals, scope.appearances, (a, b) => a / b);
  if (mode === "per-90") return combine(scope.goals, scope.minutes, (a, b) => a * 90 / b);
  return scope.goals;
}
export const awardHistory = Array.from({ length: 18 }, (_, i) => { const year = 2008 + i; return { year, messi: players.messi.awards.filter(y => y <= year).length, ronaldo: players.ronaldo.awards.filter(y => y <= year).length }; });
