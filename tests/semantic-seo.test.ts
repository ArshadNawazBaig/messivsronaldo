import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { locales, localizedUrl } from "../src/lib/i18n/config";
import { createTranslator } from "../src/lib/i18n/translate";
import { pageSemantics, playerEntity } from "../src/lib/page-semantics";
import { glossarySchema, glossaryTerms } from "../src/lib/stat-glossary";
import { calendarYears, scopes, snapshotDate } from "../src/lib/data";
import { getPublicPages } from "../src/lib/public-pages";
import { articles } from "../src/lib/articles";
import { relatedContent } from "../src/lib/content-discovery";

const origin = "https://messivsronaldo17.com";

test("localized page, breadcrumb and player references form a consistent graph", () => {
  for (const locale of locales) {
    const url = localizedUrl("/free-kicks", locale, origin);
    const schema = pageSemantics({ path: "/free-kicks", title: "Free kicks", players: ["messi", "ronaldo"], mainEntityId: "#comparison-dataset", breadcrumbs: [{ path: "/", name: "Overview" }, { path: "/free-kicks", name: "Free kicks" }] }, locale, origin);
    assert.equal(schema.page["@id"], `${url}#webpage`);
    assert.equal(schema.page.mainEntity?.["@id"], `${url}#comparison-dataset`);
    assert.equal(schema.page.breadcrumb?.["@id"], schema.breadcrumb?.["@id"]);
    assert.deepEqual(schema.breadcrumb?.itemListElement.map(item => item.position), [1, 2]);
    assert.equal(schema.breadcrumb?.itemListElement.at(-1)?.item, url);
    assert.equal(schema.page.about?.[0]["@id"], `${origin}/players/messi#person`);
    assert.equal(schema.page.about?.[0].url, localizedUrl("/players/messi", locale, origin));
    const profile = pageSemantics({ path: "/players/messi", title: "Lionel Messi", players: ["messi"], mainEntityId: playerEntity("messi", locale, origin)["@id"], breadcrumbs: [] }, locale, origin);
    assert.equal(profile.page.about?.length, 1);
    assert.equal(profile.page.mainEntity?.["@id"], `${origin}/players/messi#person`);
    assert.equal(profile.breadcrumb, undefined);
  }
  const policy = pageSemantics({ path: "/privacy", title: "Privacy", breadcrumbs: [] }, "en", origin);
  assert.equal(policy.page.about, undefined, "policies must not be described as player comparisons");
});

test("glossary schemas use the displayed translated definitions and link to real comparisons", () => {
  const paths = new Set(getPublicPages(calendarYears, snapshotDate).map(page => page.path));
  assert.ok(paths.has("/glossary"));
  assert.equal(new Set(glossaryTerms.map(term => term.id)).size, glossaryTerms.length);
  for (const term of glossaryTerms) {
    assert.ok(paths.has(term.href), term.href);
    assert.equal(term.definition, scopes.career.metrics.find(metric => metric.id === term.id)?.explanation);
  }
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    const t = createTranslator(locale, messages);
    const schema = glossarySchema(locale, origin, t);
    assert.equal(schema.hasDefinedTerm.length, glossaryTerms.length);
    assert.equal(schema.mainEntityOfPage["@id"], `${localizedUrl("/glossary", locale, origin)}#webpage`);
    for (const [index, term] of glossaryTerms.entries()) {
      assert.equal(schema.hasDefinedTerm[index].description, t(term.definition));
      assert.ok(schema.hasDefinedTerm[index].url.endsWith(`#${term.id}`));
      if (locale !== "en") assert.notEqual(t(term.definition), term.definition, `${locale}: ${term.id}`);
    }
    for (const key of ["Breadcrumbs", "Football statistics glossary", "Jump to a statistic", "Compare {0}"]) {
      assert.ok(messages[key], `${locale}: ${key}`);
    }
  }
});

test("historical articles have relevant archive links and only declare their actual player subjects", () => {
  const links = relatedContent("/insights/messi-2012-vs-ronaldo-2013-goals", 12).map(item => item.path);
  assert.ok(links.includes("/seasons/2012"));
  assert.ok(links.includes("/seasons/2013"));
  assert.ok(relatedContent("/seasons/2012").some(item => item.path === "/insights/messi-2012-vs-ronaldo-2013-goals"));
  assert.ok(relatedContent("/seasons/2009").length > 0);
  assert.deepEqual(articles.find(article => article.slug === "why-assist-totals-differ")?.players, ["messi", "ronaldo"]);
  assert.equal(articles.find(article => article.slug === "kane-vs-mbappe-ballon-dor-2026-stats")?.players, undefined);
});
