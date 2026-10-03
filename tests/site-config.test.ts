import assert from "node:assert/strict";
import test from "node:test";
import { canonicalHostRedirects, productionOrigin, siteConfiguration, wwwProductionOrigin } from "../src/lib/site-config";

test("only an explicitly enabled production site permits indexing", () => {
  assert.equal(siteConfiguration({ SITE_INDEXABLE: "true", VERCEL_ENV: "production" }).indexable, true);
  for (const env of [{}, { SITE_INDEXABLE: "false" }, { SITE_INDEXABLE: "true", VERCEL_ENV: "preview" }, { SITE_INDEXABLE: "true", VERCEL_ENV: "development" }, { SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: "http://localhost:3001" }, { SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: "https://preview.vercel.app" }]) {
    assert.equal(siteConfiguration(env).indexable, false);
  }
  assert.equal(siteConfiguration({}).siteUrl, productionOrigin);
});

test("www can be the production origin while previews remain non-indexable", () => {
  assert.deepEqual(siteConfiguration({ SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: wwwProductionOrigin }), {
    siteUrl: wwwProductionOrigin, indexable: true,
  });
  for (const origin of ["http://www.messivsronaldo17.com", "https://www.messivsronaldo17.com.example.com", "https://messivsronaldo-production.up.railway.app"]) {
    assert.equal(siteConfiguration({ SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: origin }).indexable, false);
  }
  assert.equal(siteConfiguration({ SITE_INDEXABLE: "true", NEXT_PUBLIC_SITE_URL: wwwProductionOrigin, VERCEL_ENV: "preview" }).indexable, false);
});

test("host redirects follow the configured canonical domain without a www loop", () => {
  const [original] = canonicalHostRedirects({});
  assert.equal(original.has[0].value, "www.messivsronaldo17.com");
  assert.equal(original.destination, productionOrigin + "/:path*");
  const [www] = canonicalHostRedirects({ NEXT_PUBLIC_SITE_URL: wwwProductionOrigin });
  assert.equal(www.has[0].value, "messivsronaldo17.com");
  assert.equal(www.destination, wwwProductionOrigin + "/:path*");
  assert.equal(www.permanent, true);
  assert.deepEqual(canonicalHostRedirects({ NEXT_PUBLIC_SITE_URL: "https://messivsronaldo-production.up.railway.app" }), []);
});
