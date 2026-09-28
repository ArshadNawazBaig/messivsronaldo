import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { commandSchema, documentText, validatePublication, type RichNode } from "../../src/lib/blog/model";

// Local conversion only. This script never authenticates, saves or publishes.
const base = "content/keyword-guides-2026-09-28";
const output = ".artifacts/keyword-guides-2026-09-28";
type Entry = {
  locale: "en"; slug: string; file: string; category: string;
  description: string; summary: string; keywords: string[]; intent: string;
};

function inline(value: string): RichNode[] {
  const result: RichNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index > cursor) result.push({ type: "text", text: value.slice(cursor, match.index) });
    result.push(match[1]
      ? { type: "text", text: match[1], marks: [{ type: "bold" }] }
      : { type: "text", text: match[2], marks: [{ type: "link", attrs: { href: match[3] } }] });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) result.push({ type: "text", text: value.slice(cursor) });
  return result;
}

const paragraph = (value: string): RichNode => ({ type: "paragraph", content: inline(value) });

function document(markdown: string): RichNode {
  return { type: "doc", content: markdown.trim().split(/\n\s*\n/).map(block => {
    if (block.startsWith("## ")) return { type: "heading", attrs: { level: 2 }, content: inline(block.slice(3)) };
    if (block.startsWith("|")) {
      const lines = block.split("\n");
      if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1] ?? "")) throw new Error("Invalid table separator");
      const rows = lines.filter((_, index) => index !== 1).map((line, index) => ({
        type: "tableRow", content: line.split("|").slice(1, -1).map(cell => ({
          type: index === 0 ? "tableHeader" : "tableCell", content: [paragraph(cell.trim())],
        })),
      }));
      if (rows.some(row => row.content.length !== rows[0].content.length)) throw new Error("Unequal table columns");
      return { type: "table", content: rows };
    }
    if (block.startsWith("- ")) {
      if (block.split("\n").some(line => !line.startsWith("- "))) throw new Error("Unsupported list continuation");
      return { type: "bulletList", content: block.split("\n").map(line => ({ type: "listItem", content: [paragraph(line.slice(2))] })) };
    }
    if (/^[#<>]/.test(block)) throw new Error("Unsupported Markdown block");
    return paragraph(block.replace(/\n/g, " "));
  }) };
}

async function main() {
  const manifest: Entry[] = JSON.parse(await readFile(join(base, "manifest.json"), "utf8"));
  const slugs = new Set<string>();
  const drafts = [];
  const report = [];
  for (const entry of manifest) {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate slug: ${entry.slug}`);
    slugs.add(entry.slug);
    const raw = await readFile(join(base, entry.file), "utf8");
    const [title, ...lines] = raw.split("\n");
    if (!title.startsWith("# ")) throw new Error(`Missing title: ${entry.file}`);
    const body = document(lines.join("\n"));
    const citations = [...raw.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
      .map(match => ({ title: match[1], url: match[2] }))
      .filter((link, index, all) => all.findIndex(item => item.url === link.url) === index);
    const hash = createHash("sha256").update(`keyword-guides-2026-09-28:${entry.locale}:${entry.slug}`).digest("hex").slice(0, 32);
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
    const command = commandSchema.parse({ action: "save", id, revision: 0, locale: entry.locale, slug: entry.slug, draft: {
      title: title.slice(2), category: entry.category, description: entry.description, summary: entry.summary, body, citations, image: null,
    } });
    validatePublication(command.draft!);
    const words = documentText(command.draft!.body).split(/\s+/).length;
    drafts.push({ command });
    report.push({ slug: entry.slug, title: title.slice(2), words, descriptionCharacters: entry.description.length,
      headings: body.content!.filter(node => node.type === "heading").length,
      tables: body.content!.filter(node => node.type === "table").length,
      citations: citations.length, keywords: entry.keywords, intent: entry.intent,
      internalLinks: [...new Set([...raw.matchAll(/\]\((\/[^)]+)\)/g)].map(match => match[1]))],
      contentHash: createHash("sha256").update(JSON.stringify(command.draft)).digest("hex"),
    });
  }
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "drafts.json"), JSON.stringify(drafts, null, 2) + "\n");
  await writeFile(join(base, "editorial-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ articles: drafts.length, words: report.reduce((total, entry) => total + entry.words, 0), report }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
