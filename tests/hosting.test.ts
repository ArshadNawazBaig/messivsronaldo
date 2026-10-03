import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { clientAddress, dailySyncConfigured, requestOrigin } from "../src/lib/hosting";
import { checkOrigin } from "../src/lib/admin/auth";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";
import { postgresStore } from "../src/lib/admin/database";
import { openStore } from "../src/lib/admin/store";
import { supportClientKey } from "../src/lib/support/http";
import { votingClientKey } from "../src/lib/voting/http";

const request = (headers: Record<string, string> = {}) => new Request("https://example.com", { headers });

test("each host uses its own ingress IP and rejects missing or malformed values", () => {
  const railway = { RAILWAY_ENVIRONMENT_ID: "synthetic" };
  const headers = { "x-real-ip": "203.0.113.2", "x-vercel-forwarded-for": "203.0.113.3", "x-forwarded-for": "203.0.113.4" };
  assert.equal(clientAddress(request(headers), railway), "203.0.113.2");
  assert.equal(clientAddress(request(headers), { VERCEL: "1" }), "203.0.113.3");
  assert.equal(clientAddress(request(headers), {}), "local");
  for (const invalid of ["", "invalid", "203.0.113.2, 203.0.113.3", "203.0.113.2:1234"]) {
    assert.equal(clientAddress(request({ ...headers, "x-real-ip": invalid }), railway), null);
  }
  assert.equal(clientAddress(request({ "x-real-ip": "2001:db8::1" }), railway), "2001:db8::1");
  assert.equal(clientAddress(request({ "x-forwarded-for": "203.0.113.4" }), railway), null);
  assert.equal(clientAddress(request({ "x-real-ip": "203.0.113.4" }), { VERCEL: "1" }), null);
});

test("Railway rate keys distinguish visitors and storage never falls back to SQLite", async () => {
  const keys = ["VERCEL", "DATABASE_URL", "RAILWAY_ENVIRONMENT_ID", "ADMIN_SESSION_SECRET"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    delete process.env.VERCEL;
    delete process.env.DATABASE_URL;
    process.env.RAILWAY_ENVIRONMENT_ID = "synthetic";
    process.env.ADMIN_SESSION_SECRET = "synthetic-railway-secret-at-least-32-characters";
    for (const key of [supportClientKey, votingClientKey]) {
      const first = key(request({ "x-real-ip": "203.0.113.2" }));
      assert.match(first, /^[a-f0-9]{64}$/);
      assert.notEqual(first, key(request({ "x-real-ip": "203.0.113.3" })));
      assert.equal(first, key(request({ "x-real-ip": "203.0.113.2", "x-forwarded-for": "spoofed" })));
      assert.throws(() => key(request()), /unavailable/);
    }
    await assert.rejects(postgresStore(), /not configured/);
    assert.throws(() => openStore(":memory:"), /DATABASE_URL/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("Railway only advertises scheduling when explicitly enabled with a secret", () => {
  const railway = { RAILWAY_ENVIRONMENT_ID: "synthetic", CRON_SECRET: "test" };
  assert.equal(dailySyncConfigured(railway), false);
  assert.equal(dailySyncConfigured({ ...railway, DAILY_SYNC_ENABLED: "true" }), true);
  assert.equal(dailySyncConfigured({ ...railway, DAILY_SYNC_ENABLED: "true", CRON_SECRET: "" }), false);
  assert.equal(dailySyncConfigured({ VERCEL_ENV: "production", CRON_SECRET: "test" }), true);
  assert.equal(dailySyncConfigured({ VERCEL_ENV: "preview", CRON_SECRET: "test" }), false);
});

test("Railway validates the configured HTTPS origin and keeps redirects on the public domain", () => {
  const keys = ["RAILWAY_ENVIRONMENT_ID", "NEXT_PUBLIC_SITE_URL"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.RAILWAY_ENVIRONMENT_ID = "synthetic";
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example";
    const input = new NextRequest("http://0.0.0.0:3000/en/goals?q=1", { headers: { origin: "https://public.example", "x-forwarded-host": "attacker.example" } });
    assert.equal(requestOrigin(input), "https://public.example");
    assert.doesNotThrow(() => checkOrigin(input));
    assert.equal(proxy(input).headers.get("location"), "https://public.example/goals?q=1");
    assert.match(proxy(input).headers.get("set-cookie")!, /Secure/i);
    assert.throws(() => checkOrigin(request({ origin: "https://attacker.example", "x-forwarded-host": "attacker.example" })), /origin/);
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(requestOrigin(input), null);
    assert.throws(() => checkOrigin(input), /origin/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("startup validation never prints malformed database credentials", () => {
  const result = spawnSync(process.execPath, ["scripts/check-railway-env.mjs"], {
    encoding: "utf8", env: { NODE_ENV: "test", PATH: process.env.PATH, DATABASE_URL: "private-password-invalid-url", NEXT_PUBLIC_SITE_URL: "https://example.com", ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD_HASH: "synthetic", ADMIN_SESSION_SECRET: "synthetic-startup-secret-at-least-32-characters" },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL must be a valid URL/);
  assert.doesNotMatch(result.stdout + result.stderr, /private-password-invalid-url/);
});

test("cron exits without network access when disabled, authenticates and reports failures when enabled", () => {
  for (const scenario of ["disabled", "success", "partial", "failed", "http-error", "invalid-url"]) {
    const script = `
      import assert from 'node:assert/strict';
      let called = false;
      globalThis.fetch = async (url, options) => {
        called = true;
        assert.equal(String(url), 'https://example.com/api/admin/daily-sync');
        assert.equal(options.headers.authorization, 'Bearer synthetic-cron-secret');
        assert.equal(options.redirect, 'error');
        assert.ok(options.signal instanceof AbortSignal);
        return Response.json({status: ${JSON.stringify(scenario)}}, {status: ${scenario === "http-error" ? 503 : 200}});
      };
      await import('./scripts/run-daily-sync.mjs');
      assert.equal(called, ${!["disabled", "invalid-url"].includes(scenario)});
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8", env: { NODE_ENV: "test", PATH: process.env.PATH, DAILY_SYNC_ENABLED: scenario === "disabled" ? "false" : "true", SYNC_SITE_URL: scenario === "invalid-url" ? "http://example.com" : "https://example.com", CRON_SECRET: "synthetic-cron-secret" },
    });
    assert.equal(result.status, ["disabled", "success", "partial"].includes(scenario) ? 0 : 1, scenario + result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /synthetic-cron-secret/);
  }
});
