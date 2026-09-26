import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ballonArticles, ballonSources } from "../src/lib/ballon-articles";
import { articles } from "../src/lib/articles";
import { locales } from "../src/lib/i18n/config";
import { getPublicPages } from "../src/lib/public-pages";

test("award articles keep club and European scoring samples separate and calculate rates from the same sample", () => {
  const rows = ballonArticles[1].tables![0].rows;
  const [clubGoals, clubApps, clubRates, uclGoals, uclApps, uclRates] = rows;
  for (const player of [1, 2]) {
    assert.equal(clubRates.cells[player], (Number(clubGoals.cells[player]) / Number(clubApps.cells[player])).toFixed(2));
    assert.equal(uclRates.cells[player], (Number(uclGoals.cells[player]) / Number(uclApps.cells[player])).toFixed(2));
    assert.ok(Number(clubGoals.cells[player]) > Number(uclGoals.cells[player]));
  }
  assert.ok(Number(clubGoals.cells[1]) > Number(clubGoals.cells[2]));
  assert.ok(Number(uclGoals.cells[1]) < Number(uclGoals.cells[2]));
  assert.match(ballonArticles[1].tables![0].note!, /already included/);
  for (const article of ballonArticles) {
    const urls = new Set(article.citations!.map(source => source.url));
    for (const row of article.tables![0].rows) {
      assert.ok(row.citations?.length, `uncited row: ${row.cells[0]}`);
      for (const citation of row.citations!) assert.ok(urls.has(citation.url));
    }
  }
});

test("all localized article prose, tables and metadata have translations rather than English fallbacks", () => {
  const collect = (article: typeof ballonArticles[number]) => [
    article.title, article.description, article.category, article.readTime, article.summary!, article.image!.alt,
    ...article.sections.flatMap(section => [section.heading, section.text]),
    ...article.tables!.flatMap(table => [table.caption, table.note!, ...table.columns, ...table.rows.flatMap(row => row.cells.filter((cell): cell is string => typeof cell === "string" && !/^[\d,.\s]+$/.test(cell)))]),
  ];
  const english = JSON.parse(readFileSync("src/lib/i18n/article-messages/en.json", "utf8"));
  for (const locale of locales) {
    const body = JSON.parse(readFileSync(`src/lib/i18n/article-messages/${locale}.json`, "utf8"));
    const shared = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    assert.deepEqual(Object.keys(body).sort(), Object.keys(english).sort(), locale);
    for (const key of ballonArticles.flatMap(collect)) assert.ok((body[key] ?? shared[key])?.trim(), `${locale}: ${key}`);
    if (locale !== "en") {
      for (const article of ballonArticles) {
        for (const key of [article.title, article.description, article.summary!, ...article.sections.flatMap(s => [s.heading, s.text])]) {
          assert.notEqual(body[key] ?? shared[key], key, `${locale}: untranslated ${key}`);
        }
      }
    }
  }
});

test("articles have valid primary citations, related pages, original share images and dated sitemap entries", () => {
  const hosts = new Set(["www.uefa.com", "ballondor.com", "fcbayern.com", "www.realmadrid.com", "www.fcbarcelona.com", "inside.fifa.com"]);
  for (const source of Object.values(ballonSources)) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:"); assert.ok(hosts.has(url.hostname));
  }
  assert.equal(new Set(articles.map(article => article.slug)).size, articles.length);
  const sitemap = getPublicPages([], "2026-09-21");
  for (const article of ballonArticles) {
    for (const slug of article.relatedSlugs!) assert.ok(articles.some(item => item.slug === slug));
    const image = readFileSync(`public${article.image!.path}`);
    assert.equal(image.subarray(1, 4).toString(), "PNG");
    assert.equal(image.readUInt32BE(16), 1200); assert.equal(image.readUInt32BE(20), 630);
    assert.equal(sitemap.find(page => page.path === `/insights/${article.slug}`)?.updated, article.updated);
    assert.ok(article.published! <= article.updated!);
  }
  assert.equal(sitemap.find(page => page.path === "/insights")?.updated, "2026-09-27");
});
