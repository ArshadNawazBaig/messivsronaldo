import assert from "node:assert/strict";
import test from "node:test";
import { connectProvider, type ProviderFetch } from "../src/lib/admin/provider";

type Team = { id: number; name: string; country?: string; national: boolean };
const saudiClub: Team = { id: 2939, name: "Al-Nassr", country: "Saudi-Arabia", national: false };
const otherTeams: Team[] = [
  { id: 9568, name: "Inter Miami", country: "USA", national: false },
  { id: 26, name: "Argentina", country: "Argentina", national: true },
  { id: 27, name: "Portugal", country: "Portugal", national: true },
];

// Simulate a provider whose substring search preserves spaces and hyphens.
// Return other-country candidates too, to exercise validation of the response.
function provider(clubs: Team[]): ProviderFetch {
  return async (path, params) => {
    if (path === "players/profiles") {
      const messi = params.search === "Messi";
      return [{ player: { id: messi ? 154 : 874, birth: { date: messi ? "1987-06-24" : "1985-02-05" } } }];
    }
    assert.equal(path, "teams");
    assert.equal(params.country, undefined, "API-Football rejects country combined with search");
    return [...otherTeams, ...clubs]
      .filter(team => team.name.toLowerCase().includes(String(params.search).toLowerCase()))
      .map(team => ({ team }));
  };
}

test("connection finds the Saudi Al-Nassr despite hyphens and same-name foreign clubs", async () => {
  const requests: { path: string; params: Record<string, string | number> }[] = [];
  const fetcher = provider([
    { ...saudiClub, id: 9001, country: "Kuwait" },
    { ...saudiClub, id: 9002, name: "Al-Nassr U21" },
    saudiClub,
  ]);
  const result = await connectProvider("test-only-api-key", async (path, params) => {
    requests.push({ path, params });
    return fetcher(path, params);
  });
  assert.deepEqual(result.ronaldo, { player: 874, club: 2939, country: 27 });
  const lookup = requests.find(request => request.params.search === "Nassr");
  assert.ok(lookup);
  assert.equal(lookup.params.country, undefined);
  assert.equal(requests.length, 6, "Connecting should not add fallback requests to the free quota");
});

test("connection accepts known Al Nassr aliases and normalized country punctuation", async () => {
  for (const name of ["Al Nassr", "Al-Nassr", "Al Nassr FC", "Al-Nassr FC"]) {
    const result = await connectProvider("test-only-api-key", provider([{ ...saudiClub, name, country: "Saudi Arabia" }]));
    assert.equal(result.ronaldo.club, 2939);
  }
});

test("connection rejects missing, foreign, youth, national and ambiguous Al Nassr candidates", async () => {
  for (const clubs of [
    [],
    [{ ...saudiClub, country: "Kuwait" }],
    [{ ...saudiClub, country: undefined }],
    [{ ...saudiClub, name: "Al-Nassr U21" }],
    [{ ...saudiClub, national: true }],
    [saudiClub, { ...saudiClub, id: 9003, name: "Al Nassr FC" }],
  ]) {
    await assert.rejects(
      () => connectProvider("test-only-api-key", provider(clubs)),
      /Could not uniquely verify Al Nassr.*No connection was saved/,
    );
  }
});
