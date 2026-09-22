import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { locales, localizedPath, languageAlternates, stripLocale } from "../src/lib/i18n/config";
import { createTranslator, type Messages } from "../src/lib/i18n/translate";
import { proxy } from "../src/proxy";

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
