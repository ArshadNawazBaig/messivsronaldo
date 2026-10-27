// Convert the three reviewed article editions to the existing CMS document
// format. This prepares files locally and makes no network requests or writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { commandSchema, documentText, validatePublication } from '../../src/lib/blog/model.ts';
import { articleWordCount } from '../../src/lib/blog/word-count.ts';

const release = path.dirname(fileURLToPath(import.meta.url));
const metadata = JSON.parse(fs.readFileSync(path.join(release, 'metadata.json'), 'utf8'));
const sources = JSON.parse(fs.readFileSync(path.join(release, 'sources.json'), 'utf8'));
const usedReferences = new Set();
const origin = 'https://messivsronaldo17.com';

function inline(text) {
  const result = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\[([a-z-]+)\]/g;
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) result.push({ type: 'text', text: text.slice(end, match.index) });
    if (match[1]) result.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }] });
    else {
      assert(sources[match[3]], `Unknown source: ${match[3]}`);
      usedReferences.add(match[3]);
      result.push({ type: 'text', text: match[2], marks: [{ type: 'link', attrs: { href: sources[match[3]].url } }] });
    }
    end = match.index + match[0].length;
  }
  if (end < text.length) result.push({ type: 'text', text: text.slice(end) });
  return result;
}

function paragraph(text) { return { type: 'paragraph', content: inline(text) }; }
function document(markdown) {
  return { type: 'doc', content: markdown.trim().split(/\n\s*\n/).map(block => {
    if (block.startsWith('|')) {
      const rows = block.split('\n').map(line => line.split('|').slice(1, -1).map(value => value.trim()));
      assert(rows.length > 2 && rows.every(row => row.length === 2), 'Invalid table');
      assert(rows[1].every(cell => /^-+$/.test(cell)), 'Invalid table separator');
      return { type: 'table', content: [rows[0], ...rows.slice(2)].map((row, index) => ({
        type: 'tableRow', content: row.map(cell => ({ type: index === 0 ? 'tableHeader' : 'tableCell', content: [paragraph(cell)] })),
      })) };
    }
    if (/^1\. /.test(block)) return { type: 'orderedList', attrs: { start: 1 }, content: block.split('\n').map(line => ({ type: 'listItem', content: [paragraph(line.replace(/^\d+\. /, ''))] })) };
    return paragraph(block.replace(/\n/g, ' '));
  }) };
}

function idFor(locale) {
  const hash = crypto.createHash('sha256').update(`the-rivalry:kane-ballon-dor-2026:${locale}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const checks = [];
const commands = Object.entries(metadata.editions).map(([locale, edition]) => {
  usedReferences.clear();
  const body = document(fs.readFileSync(path.join(release, `${locale}.md`), 'utf8'));
  const citations = [...usedReferences].map(key => ({ title: sources[key][locale], url: sources[key].url }));
  const command = commandSchema.parse({ action: 'publish', id: idFor(locale), revision: 0, locale, slug: metadata.slug, draft: { ...edition, body, image: null, citations } });
  validatePublication(command.draft);
  const text = documentText(command.draft.body);
  const words = articleWordCount(text, locale);
  assert(words >= 1200, `${locale} is below 1,200 words`);
  assert(!/\*\*|\]\[|\| ---/.test(text), 'Unconverted Markdown');
  assert.equal(body.content.filter(node => node.type === 'table').length, 3);
  assert.equal(citations.length, 13);
  const tables = command.draft.body.content.filter(node => node.type === 'table');
  assert.deepEqual(tables[0].content.slice(1).map(row => documentText(row.content[1])), ['73', '65', '61', '51', '36', '10', '14', '12', '6']);
  assert.deepEqual(tables[1].content.slice(1).map(row => documentText(row.content[1])), ['15', '12', '10', '8', '7', '5', '4', '3', '2', '1']);
  assert.deepEqual(tables[2].content.slice(1).map(row => documentText(row.content[1])), ['Harry Kane', 'Kylian Mbappé', 'Lamine Yamal', 'Rodri', 'Lionel Messi', 'Khvicha Kvaratskhelia', 'Ousmane Dembélé', 'Erling Haaland', 'Michael Olise', 'Fabián Ruiz']);
  checks.push({ locale, words, sourceCount: citations.length, tables: tables.length, title: edition.title, descriptionLength: edition.description.length, url: `${origin}${locale === 'en' ? '' : `/${locale}`}/insights/${metadata.slug}`, draftHash: crypto.createHash('sha256').update(JSON.stringify(command.draft)).digest('hex') });
  return command;
});
fs.writeFileSync(path.join(release, 'cms-payloads.json'), JSON.stringify({ researchDate: metadata.researchDate, commands }, null, 2) + '\n');
fs.writeFileSync(path.join(release, 'validation.json'), JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
