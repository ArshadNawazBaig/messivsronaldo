import assert from "node:assert/strict";
import test from "node:test";
import { productionOrigin, siteConfiguration } from "../src/lib/site-config";

test("only an explicitly enabled production site permits indexing", () => {
  assert.equal(siteConfiguration({ SITE_INDEXABLE: "true", VERCEL_ENV: "production" }).indexable, true);
  for (const env of [{}, { SITE_INDEXABLE: "false" }, { SITE_INDEXABLE: "true", VERCEL_ENV: "preview" }, { SITE_INDEXABLE: "true", VERCEL_ENV: "development" }, { SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: "http://localhost:3001" }, { SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: "https://preview.vercel.app" }]) {
    assert.equal(siteConfiguration(env).indexable, false);
  }
  assert.equal(siteConfiguration({}).siteUrl, productionOrigin);
});
