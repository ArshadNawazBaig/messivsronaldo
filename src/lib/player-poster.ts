import { z } from "zod";
import { type PlayerId, type ScopeId, ratio } from "./football";
import type { PublishedData } from "./published-data";

// Only published scopes can be exported; clients never supply poster statistics.
export const posterScopeIds = [
  "career", "champions-league", "world-cup", "copa-euros", "la-liga",
  "international", "club", "current-clubs", "league", "2026",
  "european-clubs", "career-europe", "head-to-head",
] as const satisfies readonly ScopeId[];

export const playerPosterSchema = z.object({
  design: z.literal("poster"),
  player: z.enum(["messi", "ronaldo"]),
  scope: z.enum(posterScopeIds),
  format: z.enum(["square", "portrait", "story"]),
  theme: z.enum(["dark", "light"]).default("dark"),
}).strict();
export type PlayerPosterRequest = z.infer<typeof playerPosterSchema>;

export function posterScopeLabel(data: PublishedData, scope: ScopeId, player: PlayerId) {
  if (scope === "world-cup") return "World Cup stats";
  if (scope === "copa-euros") return player === "messi" ? "Copa América" : "UEFA European Championship";
  if (scope === "current-clubs") return player === "messi" ? "Inter Miami" : "Al Nassr";
  return data.scopes[scope].label;
}

export function posterNumber(value: number | null, decimals = 0) {
  return value === null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

export function getPlayerPoster(data: PublishedData, request: Pick<PlayerPosterRequest, "scope" | "player">) {
  const { scope: id, player } = request;
  const scope = data.scopes[id];
  const goals = scope.goals[player];
  const appearances = scope.appearances[player];
  const assists = scope.metrics.find(metric => metric.id === "assists")?.values[player] ?? null;
  const coverage = id === "copa-euros"
    ? `${player === "messi" ? "Copa América" : "UEFA European Championship"} final tournaments. Qualifiers and penalty shootouts excluded.`
    : id === "current-clubs"
      ? `All competitive ${player === "messi" ? "Inter Miami" : "Al Nassr"} matches since joining in 2023. Club friendlies excluded.`
      : id === "champions-league"
        ? "UEFA Champions League main competition. Assists use UEFA's definition; minutes follow the secondary statistical reference."
        : id === "world-cup"
          ? scope.description.replace("FIFA World Cup final tournaments", "FIFA World Cup matches across all tournament rounds")
          : scope.description;
  return {
    player,
    competition: posterScopeLabel(data, id, player),
    goals: posterNumber(goals),
    date: scope.updatedThrough,
    coverage,
    metrics: [
      { label: "Matches", value: posterNumber(appearances) },
      { label: "Assists", value: posterNumber(assists) },
      { label: "Minutes", value: posterNumber(scope.minutes[player]) },
      { label: "Goals / game", value: posterNumber(ratio(goals, appearances), 2) },
    ],
  };
}
export type PlayerPoster = ReturnType<typeof getPlayerPoster>;

export function posterFilename(request: PlayerPosterRequest, poster: PlayerPoster) {
  const competition = poster.competition.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${request.player}-${competition}-poster-${poster.date}-${request.theme}-${request.format}.png`;
}
