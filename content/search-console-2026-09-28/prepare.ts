import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { commandSchema, documentText, validatePublication, type RichNode } from "../../src/lib/blog/model";

// This deliberately accepts only the Markdown constructs used in this batch.
// It prepares validated drafts locally and never calls the production API.
const base = "content/search-console-2026-09-28";
const out = ".artifacts/search-console-2026-09-28";
type Entry = { locale: string; slug: string; file: string; category: string; description: string; summary: string; queryPattern: string; queryLanguage: string; cover: { heading: string; left: string; right: string; label: string; date: string; alt: string } };
type Query = { query: string; clicks: number; impressions: number };
function inline(text: string): RichNode[] {
  const nodes: RichNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > cursor) nodes.push({ type: "text", text: text.slice(cursor, match.index) });
    nodes.push(match[1] ? { type: "text", text: match[1], marks: [{ type: "bold" }] } : { type: "text", text: match[2], marks: [{ type: "link", attrs: { href: match[3] } }] });
    cursor = match.index! + match[0].length;
  }
  if (cursor < text.length) nodes.push({ type: "text", text: text.slice(cursor) });
  return nodes;
}
const paragraph = (text: string): RichNode => ({ type: "paragraph", content: inline(text) });
function document(markdown: string): RichNode {
  const blocks = markdown.trim().split(/\n\s*\n/);
  return { type: "doc", content: blocks.map(block => {
    if (block.startsWith("## ")) return { type: "heading", attrs: { level: 2 }, content: inline(block.slice(3)) };
    if (block.startsWith("|")) {
      const lines = block.split("\n");
      if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1])) throw new Error("Invalid table separator");
      const rows = lines.filter((_, i) => i !== 1).map((line, i) => ({ type: "tableRow", content: line.split("|").slice(1, -1).map(cell => ({ type: i === 0 ? "tableHeader" : "tableCell", content: [paragraph(cell.trim())] })) }));
      if (rows.some(row => row.content.length !== rows[0].content.length)) throw new Error("Unequal table columns");
      return { type: "table", content: rows };
    }
    if (/^[#<>]/.test(block)) throw new Error("Unsupported Markdown block");
    return paragraph(block.replace(/\n/g, " "));
  }) };
}
function language(query: string) {
  if (/\p{Script=Arabic}/u.test(query)) return "ar";
  if (/freisto|freistö|wer |wie viele|zählt|insgesamt|ronaldo und/i.test(query)) return "de";
  if (/coup franc|nombre de|total de but|et ronaldo|statistiques|but de/i.test(query)) return "fr";
  if (/golos|gols|quantos|bolas de ouro|estatísticas/i.test(query)) return "pt";
  if (/wie heeft|wie is|prijzen|hoeveel|aantal/i.test(query)) return "nl";
  if (/es una|cuantos|tiros libres|goles|hat tricks de/i.test(query)) return "es";
  return "en";
}
async function main() {
  const manifest: Entry[] = JSON.parse(await readFile(join(base, "manifest.json"), "utf8"));
  const queries: Query[] = JSON.parse(await readFile(join(base, "queries.json"), "utf8"));
  const existing: { locale: string; slug: string }[] = JSON.parse(await readFile(join(out, "existing-posts.json"), "utf8"));
  const drafts = [];
  const report = [];
  const keys = new Set<string>();
  for (const entry of manifest) {
    const raw = await readFile(join(base, entry.file), "utf8");
    const [heading, ...lines] = raw.split("\n");
    if (!heading.startsWith("# ")) throw new Error(`Missing title: ${entry.file}`);
    const key = `${entry.locale}:${entry.slug}`;
    if (keys.has(key) || existing.some(p => `${p.locale}:${p.slug}` === key)) throw new Error(`Duplicate article: ${key}`);
    keys.add(key);
    const citations = [...raw.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(match => ({ title: match[1], url: match[2] })).filter((link, i, all) => all.findIndex(item => item.url === link.url) === i);
    const hash = createHash("sha256").update(`search-console-2026-09-28:${key}`).digest("hex").slice(0, 32);
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
    const command = commandSchema.parse({ action: "save", id, revision: 0, locale: entry.locale, slug: entry.slug, draft: { title: heading.slice(2), category: entry.category, description: entry.description, summary: entry.summary, body: document(lines.join("\n")), citations, image: null } });
    validatePublication(command.draft!);
    const words = documentText(command.draft!.body).split(/\s+/).length;
    if (words < 500) throw new Error(`Incomplete article: ${entry.file}`);
    const matched = queries.filter(q => language(q.query) === entry.queryLanguage && new RegExp(entry.queryPattern, "i").test(q.query));
    if (!matched.length) throw new Error(`No supplied queries support ${entry.file}`);
    const internalLinks = [...raw.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)].map(match => match[1]);
    const expectedPrefix = entry.locale === "en" ? "/" : `/${entry.locale}/`;
    if (internalLinks.some(link => !link.startsWith(expectedPrefix))) throw new Error(`Wrong-language link: ${entry.file}`);
    drafts.push({ command, cover: entry.cover, sourceFile: entry.file });
    report.push({ file: entry.file, locale: entry.locale, slug: entry.slug, title: heading.slice(2), words, headings: command.draft!.body.content!.filter(n => n.type === "heading").length, tables: command.draft!.body.content!.filter(n => n.type === "table").length, citations: citations.length, internalLinks, queries: matched, impressions: matched.reduce((n, q) => n + q.impressions, 0), clicks: matched.reduce((n, q) => n + q.clicks, 0) });
  }
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "drafts.json"), JSON.stringify(drafts, null, 2) + "\n");
  await writeFile(join(base, "editorial-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ articles: drafts.length, words: report.reduce((n, r) => n + r.words, 0), languages: [...new Set(report.map(r => r.locale))], rows: report.map(r => ({ locale: r.locale, slug: r.slug, words: r.words, queryImpressions: r.impressions })) }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
