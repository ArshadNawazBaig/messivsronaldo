// Read-only production verification; no authentication or write requests.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, request } from '@playwright/test';

const release = path.dirname(fileURLToPath(import.meta.url));
const artifacts = path.resolve('.artifacts/kane-ballon-dor-2026');
const { commands } = JSON.parse(fs.readFileSync(path.join(release, 'cms-payloads.json'), 'utf8'));
const receipts = JSON.parse(fs.readFileSync(path.join(release, 'publication-receipts.json'), 'utf8'));
const urlFor = command => `https://messivsronaldo17.com${command.locale === 'en' ? '' : `/${command.locale}`}/insights/${command.slug}`;
fs.mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  for (const command of commands) {
    const context = await browser.newContext({ javaScriptEnabled: false, locale: ({ en: 'en-US', fr: 'fr-FR', es: 'es-ES' })[command.locale], viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).hostname !== 'messivsronaldo17.com') return route.abort();
      return route.continue();
    });
    try {
      const page = await context.newPage();
      const response = await page.goto(urlFor(command), { waitUntil: 'load', timeout: 60000 });
      assert.equal(response.status(), 200, `${command.locale}: public HTTP status`);
      assert.equal(await page.locator('html').getAttribute('lang'), command.locale);
      assert.equal(await page.locator('h1').innerText(), command.draft.title);
      assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), command.draft.description);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), urlFor(command));
      assert(!/noindex/i.test(await page.locator('meta[name="robots"]').getAttribute('content') ?? ''));
      for (const edition of commands) assert.equal(await page.locator(`link[rel="alternate"][hreflang="${edition.locale}"]`).getAttribute('href'), urlFor(edition));
      assert.equal(await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute('href'), urlFor(commands[0]));
      const article = page.locator('article .prose');
      assert.equal(await article.locator('table').count(), 3);
      assert.equal(await article.locator('.article-sources a').count(), 13);
      const tables = await article.locator('table').all();
      for (let index = 0; index < tables.length; index++) {
        const expected = command.draft.body.content.filter(node => node.type === 'table')[index].content.slice(1).map(row => row.content[1].content[0].content.map(node => node.text).join(''));
        const actual = await tables[index].locator('tr').evaluateAll(rows => rows.slice(1).map(row => row.cells[1].textContent));
        assert.deepEqual(actual, expected, `${command.locale}: table ${index + 1}`);
      }
      const expectedParagraphs = command.draft.body.content.filter(node => node.type === 'paragraph').map(node => node.content.map(child => child.text).join(''));
      const actualParagraphs = await article.locator('p').allTextContents();
      for (const paragraph of expectedParagraphs) assert(actualParagraphs.includes(paragraph), `${command.locale}: article paragraph missing`);
      const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).find(item => item['@type'] === 'Article'));
      assert(schema, 'Article structured data missing');
      assert.equal(schema.inLanguage, command.locale);
      assert.equal(schema.headline, command.draft.title);
      assert.equal(schema.url, urlFor(command));
      assert.equal(schema.datePublished, receipts.receipts.find(row => row.locale === command.locale).publishedAt);
      assert.equal(schema.citation.length, 13);
      const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      assert.equal(desktopOverflow, false, `${command.locale}: desktop overflow`);
      await page.screenshot({ path: path.join(artifacts, `${command.locale}-desktop.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      assert.equal(mobileOverflow, false, `${command.locale}: mobile overflow`);
      await page.screenshot({ path: path.join(artifacts, `${command.locale}-mobile.png`), fullPage: true });
      checks.push({ locale: command.locale, url: urlFor(command), status: response.status(), titleVerified: true, allArticleParagraphsVerified: true, tablesVerified: 3, sourcesVerified: 13, canonicalVerified: true, alternateLanguagesVerified: ['en', 'fr', 'es', 'x-default'], indexable: true, structuredDataVerified: true, desktopOverflow, mobileOverflow, renderedWithoutJavaScript: true });
      console.log(`Public article verified: ${command.locale}`);
    } finally { await context.close(); }
  }
  const api = await request.newContext({ extraHTTPHeaders: { 'accept-language': 'en' }, timeout: 60000 });
  try {
    const sitemap = await api.get('https://messivsronaldo17.com/sitemap.xml');
    assert.equal(sitemap.status(), 200);
    const xml = await sitemap.text();
    for (const command of commands) assert(xml.includes(`<loc>${urlFor(command)}</loc>`), `Sitemap missing ${command.locale} article`);
    for (const command of commands) {
      const prefix = command.locale === 'en' ? '' : `/${command.locale}`;
      const response = await api.get(`https://messivsronaldo17.com${prefix}/insights`, { headers: { 'accept-language': command.locale } });
      assert.equal(response.status(), 200);
      assert((await response.text()).includes(`${prefix}/insights/${command.slug}`), `Reading room missing ${command.locale} article`);
    }
  } finally { await api.dispose(); }
  const report = { verifiedAt: new Date().toISOString(), checks, sitemapIncludesAllThreeEditions: true, readingRoomsIncludeAllThreeEditions: true };
  fs.writeFileSync(path.join(release, 'public-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('All three public pages, reading rooms and sitemap entries passed.');
} finally { await browser.close(); }
