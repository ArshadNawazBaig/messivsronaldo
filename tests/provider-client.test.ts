import assert from "node:assert/strict";
import test from "node:test";
import { apiClient } from "../src/lib/admin/provider-client";
import { AdminError } from "../src/lib/admin/model";

const key = "test-only-private-key+value";
const page = (response: unknown[], current = 1, total = 1) => ({ errors: [], response, paging: { current, total } });
const transport = (handler: (url: URL, init?: RequestInit) => Response | Promise<Response>): typeof fetch =>
  async (input, init) => handler(new URL(String(input)), init);

test("provider client follows every page and preserves the lookup filters", async () => {
  const seen: string[] = [];
  const client = apiClient(key, transport((url, init) => {
    assert.equal(url.origin, "https://v3.football.api-sports.io");
    assert.equal(url.searchParams.get("search"), "Ronaldo");
    assert.equal(new Headers(init?.headers).get("x-apisports-key"), key);
    assert.equal(init?.redirect, "error");
    seen.push(url.search);
    return Response.json(page([{ id: seen.length }], seen.length, 2));
  }));
  assert.deepEqual(await client("players/profiles", { search: "Ronaldo" }), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(seen, ["?search=Ronaldo", "?search=Ronaldo&page=2"]);
});

test("provider errors distinguish subscription and request-parameter failures even with HTTP 200", async () => {
  for (const [errors, expected] of [
    [{ plan: "Free plans do not have access to this season." }, /Access restricted.*Free plans/],
    [{ search: "Search cannot be combined with country." }, /Request rejected.*Search cannot be combined/],
  ] as const) {
    const client = apiClient(key, transport(() => Response.json({ errors, response: [] })));
    await assert.rejects(() => client("teams", { search: "Nassr" }), expected);
  }
});

test("authentication messages redact raw and URL-encoded keys", async () => {
  const client = apiClient(key, transport(() => Response.json({ errors: { token: `Invalid key ${key}; encoded ${encodeURIComponent(key)}` } })));
  await assert.rejects(() => client("teams", {}), (error: unknown) => {
    assert.ok(error instanceof AdminError);
    assert.match(error.message, /Key rejected.*\[redacted\]/);
    assert.equal(error.message.includes(key), false);
    assert.equal(error.message.includes(encodeURIComponent(key)), false);
    return true;
  });
});

test("rate limits identify minute and daily quotas without automatic retries", async () => {
  for (const [errors, headers, expected] of [
    [{ rateLimit: "Too many requests per minute." }, { "retry-after": "30" }, /Wait 30 seconds/],
    [{ requests: "Request limit for the day reached." }, {}, /Daily request quota/],
  ] as const) {
    let calls = 0;
    const client = apiClient(key, transport(() => {
      calls++;
      return Response.json({ errors, response: [] }, { status: 429, headers });
    }));
    await assert.rejects(() => client("players/profiles", {}), (error: unknown) => {
      assert.ok(error instanceof AdminError);
      assert.equal(error.status, 429);
      assert.match(error.message, expected);
      return true;
    });
    assert.equal(calls, 1);
  }
});

test("exhausted quota headers stop additional pages and never return partial results", async () => {
  for (const header of ["x-ratelimit-requests-remaining", "x-ratelimit-remaining"]) {
    let calls = 0;
    const client = apiClient(key, transport(() => {
      calls++;
      return Response.json(page([{ id: 1 }], 1, 2), { headers: { [header]: "0" } });
    }));
    await assert.rejects(() => client("players/profiles", {}), /quota|rate limit/);
    assert.equal(calls, 1);
  }
});

test("failed or inconsistent later pages reject the entire result", async () => {
  for (const second of [
    { errors: { plan: "Subscription expired" }, response: [] },
    page([{ id: 2 }], 1, 2),
    page([{ id: 2 }], 2, 3),
    page([], 2, 2),
  ]) {
    let calls = 0;
    const client = apiClient(key, transport(() => Response.json(++calls === 1 ? page([{ id: 1 }], 1, 2) : second)));
    await assert.rejects(() => client("players/profiles", {}), /No changes were saved/);
    assert.equal(calls, 2);
  }
});

test("malformed responses and oversized pagination fail clearly and stop requests", async () => {
  for (const response of [
    new Response("<html>Unavailable</html>"),
    Response.json({ errors: [], response: null }),
    Response.json(page([{ id: 1 }], 1, 1000)),
    new Response("rate limited", { status: 429 }),
  ]) {
    let calls = 0;
    const client = apiClient(key, transport(() => { calls++; return response; }));
    await assert.rejects(() => client("teams", {}), /API-Football \/teams:.*No changes were saved/);
    assert.equal(calls, 1);
  }
});
