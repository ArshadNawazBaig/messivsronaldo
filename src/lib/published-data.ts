import { calendarYears as baselineYears, clubs as baselineClubs, scopes as baselineScopes, snapshotDate as baselineDate, snapshotLabel as baselineLabel, reviewedDate as baselineReviewed, datasetVersion as baselineVersion, makeScope, type Stats, type ScopeId, type Scope } from "./data";
import type { MatchRecord } from "./admin/model";
export type CalendarYear = { year: number; source: string; career: Stats; club: Stats; international: Stats; league: Stats };
const fields = ["goals", "assists", "appearances", "minutes"] as const;
const blank = (): Stats => ({goals:{messi:0,ronaldo:0},assists:{messi:0,ronaldo:0},appearances:{messi:0,ronaldo:0},minutes:{messi:0,ronaldo:0}});
export function buildPublishedData(records: MatchRecord[] = [], revision = 0) {
  const scopes = structuredClone(baselineScopes);
  const calendarYears: CalendarYear[] = structuredClone(baselineYears);
  const clubs = structuredClone(baselineClubs);
  const stats = Object.fromEntries(Object.entries(scopes).map(([id, scope]) => {
    const core = blank();
    for (const field of fields) core[field] = {...scope.metrics.find(m => m.id === field)!.values};
    return [id, core];
  })) as Record<ScopeId, Stats>;
  const changed = new Map<ScopeId, string>();
  const unique = new Set<string>();
  let latest = baselineDate;
  function add(target: Stats, record: MatchRecord) { for (const field of fields) target[field][record.player] += record[field]; }
  for (const record of records) {
    if (record.date <= baselineDate || unique.has(record.id)) continue;
    unique.add(record.id); if (record.date > latest) latest = record.date;
    const international = ["international","world-cup","copa-euros"].includes(record.category);
    const ids: ScopeId[] = ["career", international ? "international" : "club", international ? "career-europe" : "current-clubs"];
    if (record.category === "league") ids.push("league");
    if (record.category === "world-cup" || record.category === "copa-euros") ids.push(record.category);
    if (record.headToHead) ids.push("head-to-head");
    if (record.date.startsWith("2026-")) ids.push("2026");
    for (const id of ids) { add(stats[id], record); changed.set(id, [changed.get(id) || baselineDate, record.date].sort().at(-1)!); }
    const yearNumber = Number(record.date.slice(0,4));
    let year = calendarYears.find(y => y.year === yearNumber);
    if (!year) { year = {year:yearNumber,source:"/updates",career:blank(),club:blank(),international:blank(),league:blank()}; calendarYears.push(year); }
    add(year.career,record); add(international ? year.international : year.club,record);
    if (record.category === "league") add(year.league,record);
    year.source = "/updates";
    if (!international) {
      const club = clubs.find(c => c.id === (record.player === "messi" ? "messi-miami" : "ronaldo-nassr"))!;
      for (const field of fields) club[field] += record[field];
      club.hatTricks += record.goals >= 3 ? 1 : 0; club.source = "/updates";
    }
  }
  for (const [id,date] of changed) {
    const old = scopes[id];
    const period = `Baseline ${baselineLabel} + recorded matches to ${date}`;
    const updated: Scope = makeScope(id,old.label,old.shortLabel,stats[id],[...old.source,"updates"],`${old.description} Post-baseline matches and provider definitions are listed in the public update log. Goal-type figures retain their own earlier cutoff.`,period);
    if (id === "head-to-head") updated.description = "Recorded meetings in which both players appeared: competitive club games and senior international friendlies. Exhibitions are excluded. See the update log for post-baseline records.";
    if (id === "2026") updated.description = `2026 is not a completed year. Reviewed baseline through ${baselineLabel}, plus recorded matches to ${date}. See the update log for coverage.`;
    updated.metrics.push(...old.metrics.filter(m => m.group === "scoring").map(m => ({...m,coverage:`Through ${baselineLabel}`,explanation:`${m.explanation} Coverage ends ${baselineLabel}; newer matches are not included in this goal-type figure.`})));
    updated.answer = `${updated.answer} Goal-type details stop at ${baselineLabel}.`;
    scopes[id] = updated;
  }
  return {scopes,calendarYears:calendarYears.sort((a,b)=>a.year-b.year),clubs,snapshotDate:latest,snapshotLabel:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${latest}T00:00:00Z`)),reviewedDate:baselineReviewed,datasetVersion:revision ? `${baselineVersion}+r${revision}` : baselineVersion,coverageNote:records.length ? `Reviewed baseline: ${baselineLabel}. Later totals include the dated matches in the update log; unlisted dates have not been verified. Goal-type details keep their displayed cutoff. Assist definitions may differ between providers.` : "",baselineDate};
}
export type PublishedData = ReturnType<typeof buildPublishedData>;
