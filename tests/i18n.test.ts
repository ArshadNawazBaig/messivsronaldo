import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { locales, localizedPath, languageAlternates, stripLocale } from "../src/lib/i18n/config";
import { createTranslator, type Messages } from "../src/lib/i18n/translate";
import { proxy } from "../src/proxy";
import { browserLocale, preferredLocale, languageCookie } from "../src/lib/i18n/detection";

test("browser language matching handles regions, weights, exclusions and invalid headers", () => {
  for (const [header, expected] of [
    ["es-MX,es;q=0.9,en;q=0.8", "es"], ["pt-BR,pt;q=0.9", "pt"],
    ["fr-CA;q=0.7,nl-NL;q=0.9,en;q=0.5", "nl"], ["zh-CN,hi-IN;q=0.7", "hi"],
    ["ar-SA,en-US;q=0.8", "ar"], ["DE-de;q=0.8,fr;q=0.8", "de"],
    ["es;q=0,en;q=0.8", "en"], ["en;q=0,*;q=0.5", "es"],
    ["es;q=NaN,pt;q=2,de;q=-1,fr;q=0.6", "fr"],
    ["zh-CN,ja;q=0.9", "en"], ["*", "en"], ["", "en"],
  ]) assert.equal(browserLocale(header), expected, header);
  assert.equal(browserLocale(null), "en");
  assert.equal(preferredLocale("en", "es-MX"), "en");
  assert.equal(preferredLocale("pt", "es-MX"), "pt");
  assert.equal(preferredLocale("not-a-locale", "es-MX"), "es");
});

test("automatic redirects honor manual choices, preserve query state and are never shared-cacheable", () => {
  const request = (path: string, cookie?: string) => new NextRequest(`https://example.com${path}`, { headers: { "accept-language": "es-MX,es;q=0.9", ...(cookie ? { cookie: `${languageCookie}=${cookie}` } : {}) } });
  const detected = proxy(request("/seasons/2026?ref=shared"));
  assert.equal(detected.status, 307);
  assert.equal(detected.headers.get("location"), "https://example.com/es/seasons/2026?ref=shared");
  assert.match(detected.headers.get("Cache-Control")!, /private, no-store/);
  for (const header of ["Accept-Language", "Cookie", "User-Agent"]) assert.ok(detected.headers.get("Vary")!.includes(header));
  assert.equal(detected.headers.get("set-cookie"), null, "detection should not set a preference");
  assert.equal(proxy(request("/compare", "pt")).headers.get("location"), "https://example.com/pt/compare");
  assert.equal(proxy(request("/compare", "en")).headers.get("x-middleware-rewrite"), "https://example.com/en/compare");
  assert.equal(proxy(request("/fr/compare", "pt")).headers.get("x-middleware-next"), "1", "explicit language URL wins");
  const english = proxy(request("/en/compare", "pt"));
  assert.equal(english.headers.get("location"), "https://example.com/compare");
  assert.match(english.headers.get("set-cookie")!, new RegExp(`^${languageCookie}=en;`), "English alias cannot bounce to detected language");
  assert.match(english.headers.get("set-cookie")!, /Secure/);
});

test("language detection leaves crawlers, prefetches, mutations and non-page endpoints untouched", () => {
  const base = { "accept-language": "es-MX,es;q=0.9", cookie: `${languageCookie}=fr` };
  for (const agent of ["Googlebot", "Google-InspectionTool", "bingbot", "facebookexternalhit/1.1", "Twitterbot", "WhatsApp", "ClaudeBot"]) {
    const response = proxy(new NextRequest("https://example.com/compare", { headers: { ...base, "user-agent": agent } }));
    assert.equal(response.headers.get("x-middleware-rewrite"), "https://example.com/en/compare", agent);
  }
  const prefetchHeaders: Record<string, string>[] = [{ rsc: "1" }, { "next-router-prefetch": "1" }, { purpose: "prefetch" }, { "sec-purpose": "prefetch;prerender" }];
  for (const extra of prefetchHeaders) {
    assert.equal(proxy(new NextRequest("https://example.com/compare", { headers: { ...base, ...extra } })).headers.get("location"), null);
  }
  assert.equal(proxy(new NextRequest("https://example.com/compare", { method: "POST", headers: base })).headers.get("location"), null);
  for (const path of ["/admin", "/api/comparison/career", "/sitemap.xml", "/robots.txt", "/llms.txt", "/opengraph-image", "/images/photo.jpg", "/fonts/i18n/noto-sans-arabic.woff2", "/maintenance"]) {
    const response = proxy(new NextRequest(`https://example.com${path}`, { headers: base }));
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("x-middleware-next"), "1", path);
  }
});

test("localized links retain comparison state and leave assets, APIs and admin alone", () => {
  assert.equal(localizedPath("/seasons/2026?ref=share#scope=club&metric=assists", "pt"), "/pt/seasons/2026?ref=share#scope=club&metric=assists");
  assert.equal(localizedPath("/es/compare#mode=per-90", "de"), "/de/compare#mode=per-90");
  assert.equal(localizedPath("/ar", "en"), "/");
  assert.equal(localizedPath("/es?ref=home", "en"), "/?ref=home");
  for (const href of ["/admin", "/api/comparison/career", "/sitemap.xml", "/images/portrait.jpg", "#comparison", "https://example.com", "//example.com"]) assert.equal(localizedPath(href, "es"), href);
  assert.equal(localizedPath("/es/admin", "fr"), "/admin");
  assert.equal(stripLocale("/espanol"), "/espanol");
});

test("locale routing uses the URL, keeps English URLs, and cannot be spoofed by a header", () => {
  const english = proxy(new NextRequest("https://example.com/compare?test=1", { headers: { "x-rivalry-locale": "es" } }));
  assert.equal(english.headers.get("x-middleware-rewrite"), "https://example.com/en/compare?test=1");
  assert.equal(english.headers.get("x-middleware-request-x-rivalry-locale"), "en");
  const spanish = proxy(new NextRequest("https://example.com/es/compare"));
  assert.equal(spanish.headers.get("x-middleware-request-x-rivalry-locale"), "es");
  const duplicate = proxy(new NextRequest("https://example.com/en/seasons?ref=1"));
  assert.equal(duplicate.status, 308);
  assert.equal(duplicate.headers.get("location"), "https://example.com/seasons?ref=1");
  assert.equal(proxy(new NextRequest("https://example.com/api/comparison/career")).headers.get("x-middleware-next"), "1");
});

test("search alternates are reciprocal and include the original English fallback", () => {
  const expected = languageAlternates("/seasons/2026", "https://example.com");
  assert.equal(Object.keys(expected).length, 9);
  assert.equal(expected["x-default"], "https://example.com/seasons/2026");
  for (const locale of locales) assert.deepEqual(languageAlternates(localizedPath("/seasons/2026", locale), "https://example.com"), expected);
});

test("every language has complete messages and preserves live-statistic placeholders", () => {
  const english: Messages = JSON.parse(readFileSync("src/lib/i18n/messages/en.json", "utf8"));
  const placeholders = (value: string) => [...value.matchAll(/\{(\d+)\}/g)].map(match => match[1]).sort();
  for (const locale of locales) {
    const messages: Messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(english).sort(), locale);
    for (const [key, value] of Object.entries(messages)) {
      assert.ok(value.trim(), `${locale}: empty ${key}`);
      assert.deepEqual(placeholders(value), placeholders(key), `${locale}: interpolation changed in ${key}`);
    }
    const t = createTranslator(locale, messages);
    assert.equal(t(930), 930);
    assert.equal(t("Lionel Messi"), "Lionel Messi");
    assert.ok(t("All years · {0}", { "0": "2002–2026" }).includes("2002–2026"));
    if (locale !== "en") assert.notEqual(t("Goals"), "Goals");
  }
});

test("rendering translates composed messages, live dates and numbers without changing data", () => {
  const es: Messages = JSON.parse(readFileSync("src/lib/i18n/messages/es.json", "utf8"));
  const t = createTranslator("es", es);
  assert.equal(t("Goals"), "Goles");
  assert.equal(t("GOALS"), "GOLES");
  assert.equal(t("All years · 2002–2026"), "Todos los años · 2002–2026");
  assert.equal(t("21 September 2026"), "21 de septiembre de 2026");
  assert.match(t("Updated 22 September 2026"), /22 de septiembre de 2026/);
  assert.equal(t("{0} appearances · {1} minutes", { "0": "39", "1": "3.304" }), "39 partidos · 3.304 minutos");
});
