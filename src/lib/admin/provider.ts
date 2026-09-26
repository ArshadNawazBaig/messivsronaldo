import { z } from "zod";
import { AdminError, matchSchema, type MatchRecord, type ProviderConnection } from "./model";
import { apiClient } from "./provider-client";
export { apiClient, type ProviderFetch } from "./provider-client";
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function providerData<T>(schema: z.ZodType<T>, input: unknown, context: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => issue.path.join(".")))].slice(0, 3).join(", ");
    throw new AdminError(`API-Football returned incomplete or invalid ${context}. Fields: ${fields || "response"}. No statistics were published.`, 422);
  }
  return parsed.data;
}
export async function connectProvider(key: string, fetcher = apiClient(key)): Promise<ProviderConnection> {
  async function player(search: string, born: string) {
    const rows = providerData(z.array(z.object({player:z.object({id:z.number().int().positive(),birth:z.object({date:z.string().nullable()})})})), await fetcher("players/profiles", {search}), `${search} player profiles`);
    const found = rows.filter(r => r.player.birth.date === born);
    if (found.length !== 1) throw new AdminError(`Could not uniquely verify ${search}'s provider identity. Check provider coverage.`, 502);
    return found[0].player.id;
  }
  async function team(search: string, names: string[], national: boolean, country: string) {
    // API-Football forbids combining search and country. Verify country locally.
    const rows = providerData(z.array(z.object({team:z.object({id:z.number().int().positive(),name:z.string(),national:z.boolean(),country:z.string().nullish()})})), await fetcher("teams", {search}), `${names[0]} team records`);
    const acceptedNames = new Set(names.map(normalize));
    const found = rows.filter(({team}) => team.national === national
      && normalize(team.country ?? "") === normalize(country)
      && acceptedNames.has(normalize(team.name)));
    if (found.length !== 1) throw new AdminError(`Could not uniquely verify ${names[0]} in ${country.replace(/-/g, " ")}. ${found.length ? "Multiple matching teams were returned." : "No matching team with a verified country was returned."} No connection was saved.`, 502);
    return found[0].team.id;
  }
  // Six sequential lookups, plus any extra result pages; IDs come from verified provider records.
  const messi = {player: await player("Messi", "1987-06-24"), club: await team("Inter Miami", ["Inter Miami", "Inter Miami CF"], false, "USA"), country: await team("Argentina", ["Argentina"], true, "Argentina")};
  // Search a punctuation-independent fragment, then verify the full name and country.
  const ronaldo = {player: await player("Ronaldo", "1985-02-05"), club: await team("Nassr", ["Al Nassr", "Al-Nassr", "Al-Nassr FC", "Al Nassr FC"], false, "Saudi-Arabia"), country: await team("Portugal", ["Portugal"], true, "Portugal")};
  return {key, messi, ronaldo};
}
const fixtureSchema = z.object({fixture:z.object({id:z.number().int().positive(),date:z.string(),status:z.object({short:z.string()})}),goals:z.object({home:z.number().nullable(),away:z.number().nullable()}),league:z.object({id:z.number().int().positive(),name:z.string(),type:z.enum(["League","Cup"]).optional(),round:z.string().nullable()}),teams:z.object({home:z.object({id:z.number(),name:z.string()}),away:z.object({id:z.number(),name:z.string()})})});
const statisticsSchema = z.array(z.object({team:z.object({id:z.number()}),players:z.array(z.object({player:z.object({id:z.number()}),statistics:z.array(z.object({games:z.object({minutes:z.number().nullable()}),goals:z.object({total:z.number().nullable(),assists:z.number().nullable()})}))}))}));
const eventSchema = z.array(z.object({type:z.string(),detail:z.string(),player:z.object({id:z.number().nullable()}),assist:z.object({id:z.number().nullable()})}));
export async function fetchDate(date: string, connection: ProviderConnection, fetcher = apiClient(connection.key)) {
  const all = providerData(z.array(fixtureSchema), await fetcher("fixtures", {date, timezone:"UTC"}), `fixtures for ${date}`);
  const tracked = new Set([connection.messi.club,connection.messi.country,connection.ronaldo.club,connection.ronaldo.country]);
  const fixtures = all.filter(f => tracked.has(f.teams.home.id) || tracked.has(f.teams.away.id));
  if (fixtures.length > 6) throw new AdminError("Unexpected number of tracked fixtures. Check provider identities.", 502);
  const records: MatchRecord[] = []; const withdrawnIds: string[] = []; let skipped = 0; let pending = 0;
  const leagueTypes = new Map<number, "League" | "Cup">();
  for (const f of fixtures) {
    if (f.fixture.date.slice(0,10) !== date) throw new AdminError("The provider returned a fixture outside the selected UTC date.", 502);
    const national = [connection.messi.country,connection.ronaldo.country].some(id => [f.teams.home.id,f.teams.away.id].includes(id));
    if ((!national && /friendly|friendlies|exhibition/i.test(f.league.name)) || f.fixture.status.short === "CANC") {
      withdrawnIds.push(`api:${f.fixture.id}:messi`, `api:${f.fixture.id}:ronaldo`); skipped++; continue;
    }
    if (["NS","TBD","PST"].includes(f.fixture.status.short)) { skipped++; pending++; continue; }
    if (!["FT","AET"].includes(f.fixture.status.short)) throw new AdminError("A tracked match is live, suspended, or needs shootout review. Retry after completion or add a verified manual record.", 409);
    // /fixtures supplies a league ID, but usually no competition type. Resolve it
    // only for tracked club games; never silently count an unknown league as a cup.
    let leagueType = f.league.type ?? leagueTypes.get(f.league.id);
    if (!national && !leagueType) {
      const details = z.array(z.object({league:z.object({id:z.number().int().positive(),type:z.enum(["League","Cup"])})})).safeParse(await fetcher("leagues", {id:f.league.id}));
      const matching = details.success ? details.data.filter(row => row.league.id === f.league.id) : [];
      if (matching.length !== 1) throw new AdminError(`API-Football /leagues: Could not verify competition ${f.league.id} as a league or cup. No statistics were published.`, 422);
      leagueType = matching[0].league.type;
      leagueTypes.set(f.league.id, leagueType);
    }
    const stats = providerData(statisticsSchema, await fetcher("fixtures/players", {fixture:f.fixture.id}), `player statistics for fixture ${f.fixture.id} on ${date}`);
    // Assist-less matches are often represented with null. Cross-check against explicit goal events.
    const events = providerData(eventSchema, await fetcher("fixtures/events", {fixture:f.fixture.id}), `events for fixture ${f.fixture.id} on ${date}`);
    const scoredEvents = events.filter(e => e.type === "Goal" && ["Normal Goal","Penalty","Own Goal"].includes(e.detail));
    if (f.goals.home === null || f.goals.away === null || scoredEvents.length !== f.goals.home + f.goals.away) throw new AdminError("Goal-event coverage does not reconcile with the final score. No updates published.", 422);
    for (const player of ["messi","ronaldo"] as const) {
      const ids = connection[player];
      const team = [f.teams.home,f.teams.away].find(t => t.id === ids.club || t.id === ids.country);
      if (!team) continue;
      const entry = stats.find(t => t.team.id === team.id)?.players.find(p => p.player.id === ids.player);
      // Missing records are not evidence of zero minutes or of a non-appearance.
      if (!entry || entry.statistics.length !== 1) throw new AdminError(`Missing player coverage for ${player} on ${date}. No changes published; review the match manually.`, 422);
      const s = entry.statistics[0];
      if (s.games.minutes === null) throw new AdminError(`Incomplete minutes/goals for ${player}. No changes published; review the match manually.`, 422);
      const eventGoals = scoredEvents.filter(e => e.detail !== "Own Goal" && e.player.id === ids.player).length;
      if (s.goals.total !== null && eventGoals !== s.goals.total) throw new AdminError("Player goals disagree with match events. Review before publishing.",422);
      const eventAssists = scoredEvents.filter(e => e.detail !== "Own Goal" && e.assist.id === ids.player).length;
      if (s.goals.assists !== null && eventAssists !== s.goals.assists) throw new AdminError("Provider assists disagree with match events. Review the match before publishing.", 422);
      const international = team.id === ids.country;
      const category = international ? (/^world cup$/i.test(f.league.name) ? "world-cup" : /^(copa america|euro championship|european championship)$/i.test(f.league.name) ? "copa-euros" : "international") : leagueType === "League" && !/play.?off|final|knockout/i.test(f.league.round || "") ? "league" : "club-cup";
      records.push(matchSchema.parse({id:`api:${f.fixture.id}:${player}`,player,date,team:team.name,opponent:(team.id === f.teams.home.id ? f.teams.away : f.teams.home).name,competition:f.league.name,category,goals:s.goals.total ?? eventGoals,assists:s.goals.assists ?? eventAssists,minutes:s.games.minutes,appearances:1,headToHead:false,source:`https://www.api-football.com/`,provider:"api-football",note:`API-Football fixture ${f.fixture.id}. Completed ${f.fixture.status.short}; conventional provider assists, checked against goal events.`,locked:false}));
    }
    const sameFixture = records.filter(r => r.id.startsWith(`api:${f.fixture.id}:`));
    if (sameFixture.length === 2) sameFixture.forEach(r => { r.headToHead = true; });
  }
  return {records, withdrawnIds, skipped, pending, fixtures: fixtures.length};
}
