import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { getPlayerPoster, playerPosterSchema, posterFilename, posterScopeIds } from "../src/lib/player-poster";
import type { MatchRecord } from "../src/lib/admin/model";

const request = { design: "poster", player: "messi", scope: "champions-league", format: "portrait" } as const;

test("posters accept only supported players and published scopes, never supplied totals or image URLs", () => {
  assert.equal(playerPosterSchema.parse(request).theme, "dark");
  for (const change of [
    { player: "both" }, { scope: "nonexistent" }, { format: "huge" }, { theme: "unknown" },
    { goals: 9999 }, { imageUrl: "https://example.com/photo.png" }, { date: "2030-01-01" }, { width: 99999 },
  ]) assert.equal(playerPosterSchema.safeParse({ ...request, ...change }).success, false);
});

test("poster figures and labels keep the player's actual competition and assist convention", () => {
  const data = buildPublishedData();
  for (const player of ["messi", "ronaldo"] as const) {
    const poster = getPlayerPoster(data, { ...request, player });
    assert.equal(poster.metrics.find(metric => metric.label === "Assists")?.value, player === "messi" ? "40" : "42");
    const continental = getPlayerPoster(data, { player, scope: "copa-euros" });
    assert.equal(continental.competition, player === "messi" ? "Copa América" : "UEFA European Championship");
    assert.ok(!continental.coverage.includes(player === "messi" ? "European" : "Copa"));
    assert.equal(getPlayerPoster(data, { player, scope: "current-clubs" }).competition, player === "messi" ? "Inter Miami" : "Al Nassr");
    const worldCup = getPlayerPoster(data, { player, scope: "world-cup" });
    assert.equal(worldCup.competition, "World Cup stats");
    assert.equal(worldCup.goals, String(data.scopes["world-cup"].goals[player]));
    assert.match(worldCup.coverage, /Qualifiers and shootouts excluded/);
    for (const scope of posterScopeIds) {
      const result = getPlayerPoster(data, { player, scope });
      assert.equal(result.metrics.length, 4);
      assert.ok(result.metrics.every(metric => !/NaN|Infinity|undefined/.test(metric.value)));
      assert.equal(result.date, data.scopes[scope].updatedThrough);
    }
  }
  assert.equal(posterFilename(playerPosterSchema.parse({ ...request, scope: "copa-euros" }), getPlayerPoster(data, { player: "messi", scope: "copa-euros" })), "messi-copa-america-poster-2026-09-21-dark-portrait.png");
});

test("poster totals follow publications while unrelated tournaments retain their own cutoff", () => {
  const record: MatchRecord = {
    id: "manual:poster-test", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Test opponent",
    competition: "Test league", category: "league", goals: 2, assists: 1, minutes: 90, appearances: 1,
    headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic test only", locked: true,
  };
  const before = buildPublishedData();
  const after = buildPublishedData([record], 1);
  const career = getPlayerPoster(after, { scope: "career", player: "messi" });
  assert.equal(career.goals, "932");
  assert.equal(career.date, "2026-09-22");
  assert.equal(career.metrics.find(metric => metric.label === "Goals / game")?.value, (932 / after.scopes.career.appearances.messi).toFixed(2));
  assert.deepEqual(getPlayerPoster(after, request), getPlayerPoster(before, request));
  // A missing assist figure is not reported as zero, and no appearances cannot yield a rate.
  const empty = structuredClone(before);
  empty.scopes.career.metrics = empty.scopes.career.metrics.filter(metric => metric.id !== "assists");
  empty.scopes.career.appearances.messi = 0;
  const missing = getPlayerPoster(empty, { scope: "career", player: "messi" });
  assert.equal(missing.metrics.find(metric => metric.label === "Assists")?.value, "—");
  assert.equal(missing.metrics.find(metric => metric.label === "Goals / game")?.value, "—");
});
