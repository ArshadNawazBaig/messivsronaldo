import { calendarYears as baselineYears, clubs as baselineClubs, scopes as baselineScopes, snapshotDate as baselineDate, snapshotLabel as baselineLabel, reviewedDate as baselineReviewed, datasetVersion as baselineVersion, makeScope, type Stats, type ScopeId, type Scope } from "./data";
import type { MatchRecord } from "./admin/model";
import { matchScoring, scoringFields, type ScoringField } from "./match-scoring";
const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`));
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
  const scopeRecords = new Map<ScopeId, MatchRecord[]>();
  const unique = new Set<string>();
  let latest = baselineDate;
  function add(target: Stats, record: MatchRecord) {
    for (const field of fields) target[field][record.player] += record[field];
    const scoring = matchScoring(record);
    for (const field of [...Object.keys(scoringFields), "hatTricks"] as (ScoringField | "hatTricks")[]) {
      if (target[field] && scoring[field] !== undefined) target[field]![record.player] += scoring[field]!;
    }
  }
  for (const record of records) {
    if (record.date <= baselineDate || unique.has(record.id)) continue;
    unique.add(record.id); if (record.date > latest) latest = record.date;
    const international = ["international","world-cup","copa-euros"].includes(record.category);
    const ids: ScopeId[] = ["career", international ? "international" : "club", international ? "career-europe" : "current-clubs"];
    if (record.category === "league") ids.push("league");
    if (record.category === "world-cup" || record.category === "copa-euros") ids.push(record.category);
    if (record.headToHead) ids.push("head-to-head");
    if (record.date.startsWith("2026-")) ids.push("2026");
    for (const id of ids) {
      add(stats[id], record);
      changed.set(id, [changed.get(id) || baselineDate, record.date].sort().at(-1)!);
      scopeRecords.set(id, [...(scopeRecords.get(id) ?? []), record]);
    }
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
    const period = `Updated ${dateLabel(date)}`;
    const description = id === "head-to-head"
      ? "Recorded meetings in which both players appeared: competitive club games and senior international friendlies. Exhibitions are excluded. See the update log for post-baseline records."
      : id === "2026"
        ? `Calendar year to date: 1 January to ${dateLabel(date)}. Includes senior club and country; 2026 is not a completed year. See the update log for coverage.`
        : `${old.description} Post-baseline matches and provider definitions are listed in the public update log. Scoring breakdowns have individual coverage notes.`;
    const updated: Scope = makeScope(id,old.label,old.shortLabel,stats[id],[...old.source,"updates"],description,period);
    updated.updatedThrough = date;
    const matches = scopeRecords.get(id)!.map(record => ({record, scoring:matchScoring(record)}));
    updated.metrics.push(...old.metrics.filter(m => m.group === "scoring").map(m => {
      const metricId = m.id as keyof ReturnType<typeof matchScoring>;
      const conversion = m.id === "penalty-conversion";
      const verified = matches.filter(({scoring}) => conversion
        ? scoring.penalties !== undefined && scoring.penaltyAttempts !== undefined
        : scoring[metricId] !== undefined);
      if (!verified.length) return {...m,coverage:`Through ${baselineLabel}`,explanation:`${m.explanation} Newer match records still need this classification; this figure retains its reviewed cutoff.`};
      const values = {...m.values};
      if (conversion) {
        // Both parts of the ratio must cover the same matches.
        const penalties = {...old.metrics.find(metric => metric.id === "penalties")!.values};
        const attempts = {...old.metrics.find(metric => metric.id === "penaltyAttempts")!.values};
        for (const {record,scoring} of verified) {
          penalties[record.player] += scoring.penalties!;
          attempts[record.player] += scoring.penaltyAttempts!;
        }
        for (const player of ["messi","ronaldo"] as const) values[player] = penalties[player] / attempts[player] * 100;
      } else {
        for (const {record,scoring} of verified) values[record.player] += scoring[metricId]!;
      }
      const updatedThrough = verified.map(({record}) => record.date).sort().at(-1)!;
      const unclassified = matches.length - verified.length;
      return {...m,values,source:[...m.source,"updates" as const],updatedThrough,
        coverage:unclassified ? `Verified records to ${dateLabel(updatedThrough)} · partial coverage` : `Updated ${dateLabel(updatedThrough)}`,
        explanation:`${m.explanation} Reviewed baseline plus verified match details in the public update log.${unclassified ? ` ${unclassified} match record(s) still need this classification and are not included in this breakdown.` : " All published match records in this scope are included."}`};
    }));
    updated.answer = `${updated.answer} Check each scoring breakdown's individual coverage notes.`;
    scopes[id] = updated;
  }
  return {scopes,calendarYears:calendarYears.sort((a,b)=>a.year-b.year),clubs,snapshotDate:latest,snapshotLabel:dateLabel(latest),reviewedDate:baselineReviewed,datasetVersion:revision ? `${baselineVersion}+r${revision}` : baselineVersion,coverageNote:records.length ? `Reviewed baseline: ${baselineLabel}. Later totals include the dated matches in the update log; unlisted dates have not been verified. Scoring breakdowns include verified match details; incomplete classifications are marked separately. Assist definitions may differ between providers.` : "",baselineDate};
}
export type PublishedData = ReturnType<typeof buildPublishedData>;
