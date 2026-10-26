import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { commandSchema, draftSchema, validatePublication, type BlogCommand, type RichNode } from "../../src/lib/blog/model";

// Local preparation only: no environment, credentials, network, or database access.
// This deliberately bounded converter rejects unhandled Markdown. It is not a
// general CommonMark parser. Every accepted document must round-trip exactly.
const directory = dirname(fileURLToPath(import.meta.url));
const outputPath = join(directory, "cms-payloads.json");
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
type Metadata = Record<string, unknown> & { language: "en" | "th"; suggested_slug: string };
type Source = { file: string; metadataFile: string; text: string; metadataText: string; metadata: Metadata; path: string };
const sources: Source[] = readdirSync(directory).filter(file => /^0[1-4]-.+(?:\.en)?\.md$/.test(file)).sort().map(file => {
  const metadataFile = file.replace(/\.md$/, ".metadata.json");
  const metadataText = readFileSync(join(directory, metadataFile), "utf8");
  const metadata = JSON.parse(metadataText) as Metadata;
  assert(["en", "th"].includes(metadata.language), `Unsupported locale in ${file}`);
  assert.equal(file.endsWith(".en.md"), metadata.language === "en", `Locale mismatch in ${file}`);
  return { file, metadataFile, metadataText, metadata, text: readFileSync(join(directory, file), "utf8"), path: `${metadata.language === "en" ? "" : "/th"}/insights/${metadata.suggested_slug}` };
});
assert.equal(sources.length, 8, "Expected exactly eight release drafts.");
assert.equal(new Set(sources.map(source => source.path)).size, 8, "Duplicate locale/slug.");
for (const slug of new Set(sources.map(source => source.metadata.suggested_slug))) {
  assert.deepEqual(sources.filter(source => source.metadata.suggested_slug === slug).map(source => source.metadata.language).sort(), ["en", "th"], `Missing language pair: ${slug}`);
}

function inline(text: string): RichNode[] {
  const nodes: RichNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const tail = text.slice(cursor);
    if (tail.startsWith("`")) {
      const end = text.indexOf("`", cursor + 1);
      assert(end > cursor + 1 && text[end + 1] !== "`", "Only nonempty single-backtick inline code is supported.");
      nodes.push({ type: "text", text: text.slice(cursor + 1, end), marks: [{ type: "code" }] });
      cursor = end + 1;
    } else if (tail.startsWith("[")) {
      const labelEnd = text.indexOf("](", cursor + 1);
      assert(labelEnd > cursor + 1, "Expected an inline Markdown link.");
      let end = labelEnd + 2;
      let depth = 1;
      for (; end < text.length; end++) {
        if (text[end] === "(") depth++;
        if (text[end] === ")" && --depth === 0) break;
      }
      assert(depth === 0, "Unclosed link target.");
      const label = text.slice(cursor + 1, labelEnd);
      assert(!/[`\[\]*_<>\\]/.test(label), "Formatted or escaped link labels require an explicit converter extension.");
      const href = text.slice(labelEnd + 2, end);
      assert(href && !/[\s\\]/.test(href), "Link titles or escaped targets are not supported.");
      nodes.push({ type: "text", text: label, marks: [{ type: "link", attrs: { href } }] });
      cursor = end + 1;
    } else {
      const next = tail.search(/[`\[]/);
      const literal = next === -1 ? tail : tail.slice(0, next);
      assert(literal && !/[\]*_<>\\]/.test(literal), "Unhandled Markdown syntax; extend the converter before preparing this draft.");
      nodes.push({ type: "text", text: literal });
      cursor += literal.length;
    }
  }
  return nodes;
}

function inlineMarkdown(nodes: RichNode[] = []): string {
  return nodes.map(node => {
    assert.equal(node.type, "text");
    assert((node.marks?.length ?? 0) <= 1, "Unexpected combined inline marks.");
    const mark = node.marks?.[0];
    if (!mark) return node.text ?? "";
    if (mark.type === "code") return `\`${node.text}\``;
    assert.equal(mark.type, "link");
    return `[${node.text}](${mark.attrs?.href})`;
  }).join("");
}

function tableCells(line: string): string[] {
  assert(line.startsWith("|") && line.endsWith("|"), "Tables require explicit outer pipes.");
  const cells: string[] = [];
  let start = 1;
  let code = false;
  for (let index = 1; index < line.length; index++) {
    if (line[index] === "`") code = !code;
    if (line[index] === "|" && !code) { cells.push(line.slice(start, index).trim()); start = index + 1; }
  }
  assert(!code && start === line.length, "Invalid table row.");
  return cells;
}

function convert(source: string): { title: string; summary: string; body: RichNode } {
  const lines = source.trim().split("\n");
  assert(/^# [^#]/.test(lines[0]), "Expected a single opening H1.");
  const title = lines.shift()!.slice(2);
  assert.equal(inlineMarkdown(inline(title)), title);
  assert(!/[`\[]/.test(title), "CMS title cannot retain inline formatting.");
  const blocks: RichNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line) { index++; continue; }
    const heading = /^(#{2,4}) (.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", attrs: { level: heading[1].length }, content: inline(heading[2]) });
      index++;
    } else if (line.startsWith("|")) {
      const header = tableCells(line);
      const delimiter = tableCells(lines[index + 1] ?? "");
      assert.equal(delimiter.length, header.length);
      assert(delimiter.every(cell => /^-{3,}$/.test(cell)), "Table alignment is not supported by the CMS; do not silently discard it.");
      const rows = [header];
      index += 2;
      while (index < lines.length && lines[index].startsWith("|")) {
        const cells = tableCells(lines[index++]);
        assert.equal(cells.length, header.length, "Unequal table column counts.");
        rows.push(cells);
      }
      blocks.push({ type: "table", content: rows.map((row, rowIndex) => ({ type: "tableRow", content: row.map(cell => ({
        type: rowIndex === 0 ? "tableHeader" : "tableCell", attrs: { colspan: 1, rowspan: 1 },
        content: [{ type: "paragraph", content: inline(cell) }],
      })) })) });
    } else {
      const paragraph: string[] = [];
      while (index < lines.length && lines[index] && !/^(#{1,6} |\|)/.test(lines[index])) {
        assert(!/^(?:[-+*] |\d+[.)] |>|```|~~~|!\[|<)/.test(lines[index]), "Lists, quotations, fences, images or HTML require an explicit converter extension.");
        assert(!/ {2}$/.test(lines[index]), "Explicit Markdown hard breaks require a converter extension.");
        paragraph.push(lines[index++]);
      }
      assert(paragraph.length, `Unsupported block: ${line}`);
      blocks.push({ type: "paragraph", content: inline(paragraph.join("\n")) });
    }
  }
  assert.equal(blocks[0]?.type, "paragraph", "Expected a direct opening answer.");
  assert.equal(blocks[0].content?.length, 1, "Plain-text CMS summary cannot contain rich formatting.");
  assert(!blocks[0].content?.[0].marks, "Plain-text CMS summary cannot contain rich formatting.");
  const summary = blocks.shift()!.content![0].text!;
  const body = { type: "doc", content: blocks };
  assert.equal(`# ${title}\n\n${summary}\n\n${blocks.map(blockMarkdown).join("\n\n")}`, source.trim(), "Markdown round-trip lost or changed content/formatting.");
  return { title, summary, body };
}

function blockMarkdown(node: RichNode): string {
  if (node.type === "paragraph") return inlineMarkdown(node.content);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level))} ${inlineMarkdown(node.content)}`;
  assert.equal(node.type, "table");
  const rows = node.content!.map(row => `| ${row.content!.map(cell => inlineMarkdown(cell.content![0].content)).join(" | ")} |`);
  rows.splice(1, 0, `|${node.content![0].content!.map(() => "---").join("|")}|`);
  return rows.join("\n");
}

function walk(node: RichNode, visit: (node: RichNode) => void) { visit(node); node.content?.forEach(child => walk(child, visit)); }
function counts(body: RichNode) {
  const totals = { h2: 0, h3: 0, tables: 0, tableRows: 0, tableCells: 0, paragraphs: 0, inlineCode: 0, externalLinks: 0, internalLinks: 0 };
  walk(body, node => {
    if (node.type === "heading" && node.attrs?.level === 2) totals.h2++;
    if (node.type === "heading" && node.attrs?.level === 3) totals.h3++;
    if (node.type === "table") totals.tables++;
    if (node.type === "tableRow") totals.tableRows++;
    if (["tableCell", "tableHeader"].includes(node.type)) totals.tableCells++;
    if (node.type === "paragraph") totals.paragraphs++;
    for (const mark of node.marks ?? []) {
      if (mark.type === "code") totals.inlineCode++;
      if (mark.type === "link") {
        if (/^https?:\/\//.test(String(mark.attrs?.href))) totals.externalLinks++;
        else totals.internalLinks++;
      }
    }
  });
  return totals;
}

const previous = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf8")) as { commands: BlogCommand[] } : { commands: [] };
const commands: BlogCommand[] = [];
const validation = sources.map(source => {
  const converted = convert(source.text);
  const originalBody = structuredClone(converted.body);
  const rewrites: { from: string; to: string }[] = [];
  const citations = new Map<string, { title: string; url: string }>();
  walk(converted.body, node => {
    for (const mark of node.marks ?? []) {
      if (mark.type !== "link") continue;
      const href = String(mark.attrs?.href);
      if (/^https?:\/\//.test(href)) {
        if (!citations.has(href)) citations.set(href, { title: node.text!, url: href });
      } else {
        const target = sources.find(item => item.file === href);
        assert(target, `Unknown cross-article link: ${href}`);
        assert.equal(target.metadata.language, source.metadata.language, "Unexpected cross-locale link.");
        rewrites.push({ from: href, to: target.path });
        mark.attrs = { href: target.path };
      }
    }
  });
  // Reverse only the deliberate URL rewrites and require byte-for-byte AST equality.
  const reversed = structuredClone(converted.body);
  walk(reversed, node => { for (const mark of node.marks ?? []) if (mark.type === "link") {
    const rewrite = rewrites.find(item => item.to === mark.attrs?.href);
    if (rewrite) mark.attrs = { href: rewrite.from };
  } });
  assert.deepEqual(reversed, originalBody, "Unexpected content change during link rewrite.");
  const description = source.metadata[`meta_description_${source.metadata.language}`];
  assert.equal(typeof description, "string");
  const draftInput = { ...converted, description, category: source.metadata.language === "th" ? "ความรู้เท่าทันดิจิทัล" : "Digital literacy", image: null, citations: [...citations.values()] };
  const draft = draftSchema.parse(draftInput);
  assert.deepEqual(draft, draftInput, "CMS validation normalized or discarded draft content.");
  validatePublication(draft);
  const prior = previous.commands.filter(command => command.locale === source.metadata.language && command.slug === source.metadata.suggested_slug);
  assert(prior.length <= 1, "Duplicate previous release command.");
  const id = prior[0]?.id ?? randomUUID();
  assert(/^[a-f0-9-]{36}$/.test(id), "New CMS articles require UUID IDs.");
  const input = { action: "save", id, revision: 0, locale: source.metadata.language, slug: source.metadata.suggested_slug, draft };
  const command = commandSchema.parse(input);
  assert.deepEqual(command, input, "CMS command validation discarded fields.");
  const bytes = Buffer.byteLength(JSON.stringify(command), "utf8");
  assert(bytes < 750_000, "CMS request size exceeded.");
  const actualCounts = counts(draft.body);
  assert.equal(actualCounts.h3, 3, "Expected three FAQs.");
  const article = Number(source.file.slice(0, 2));
  assert.equal(actualCounts.h2, article <= 2 ? 5 : 6);
  assert.equal(actualCounts.tables, [1, 4].includes(article) ? 1 : 0);
  assert.equal(actualCounts.tableRows, article === 1 ? 4 : article === 4 ? 5 : 0);
  assert.equal(actualCounts.tableCells, actualCounts.tableRows * 3);
  assert.equal(actualCounts.externalLinks, [5, 3, 3, 2][article - 1]);
  assert.equal(actualCounts.internalLinks, [1, 4].includes(article) ? 1 : 0);
  assert.equal(actualCounts.inlineCode, article === 1 ? 9 : article === 3 ? source.metadata.language === "th" ? 5 : 3 : article === 4 ? 1 : 0);
  commands.push(command);
  return {
    source: source.file, metadataSource: source.metadataFile, locale: command.locale, slug: command.slug, id, canonicalPath: source.path,
    sourceSha256: digest(source.text), metadataSha256: digest(source.metadataText), draftSha256: digest(JSON.stringify(draft)), requestBytes: bytes,
    title: draft.title, proposedSeoTitle: source.metadata[`seo_title_${source.metadata.language}`], seoTitleOverrideSupported: false,
    seoDescriptionMappedToDescription: true, description: draft.description, summary: draft.summary, category: draft.category,
    primaryQueryContext: source.metadata.primary_query_context, actualIntentServed: source.metadata.actual_intent_served,
    citations: draft.citations, rewrittenLinks: rewrites, preservedFormatting: actualCounts,
    checks: { exactMarkdownRoundTripBeforeLinkRewrite: true, onlyIntendedLinkChanges: true, draftSchema: true, commandSchema: true, publicationValidation: true, noSchemaNormalizationLoss: true, requestSize: true, threeFaqs: true },
  };
});
assert.equal(new Set(commands.map(command => command.id)).size, 8, "Duplicate CMS IDs.");
assert.equal(validation.reduce((sum, item) => sum + item.preservedFormatting.externalLinks, 0), 26);
assert.equal(validation.reduce((sum, item) => sum + item.rewrittenLinks.length, 0), 4);
const preparedAt = new Date().toISOString();
const limitations = [
  "The CMS has no separate seoTitle or seoDescription fields. The exact source H1 maps to title (also the search/social headline); the proposed SEO title remains in this validation manifest. The supplied meta description maps to description (also the visible excerpt).",
  "The plain opening answer maps to summary and is removed from the body to avoid duplication. The source H1 maps to title and is removed from the body. All remaining text, heading levels, tables, code marks and links are preserved.",
  "Editorial metadata, query context, translation notes and prepared/reviewed dates are not CMS draft fields. Source dates are not used as publication dates; the CMS assigns real publication timestamps when published.",
  "Covers are optional. image is null; no author, cover or credentials are invented. The existing public template supplies its standard image/organization fallback.",
  "All formatting actually present is supported. The bounded converter rejects unhandled Markdown including emphasis, lists, blockquotes, images, fenced code, raw HTML, hard breaks and aligned table columns; none occurs in these eight sources.",
  "This bundle contains local SAVE commands only. It performs no API or database write. Publication must preflight current locale/slug/revision state; regenerate with this file present to retain each UUID.",
];
writeFileSync(outputPath, JSON.stringify({ preparedAt, status: "Validated local payloads; no CMS writes performed by preparation", commands }, null, 2) + "\n");
writeFileSync(join(directory, "cms-validation.json"), JSON.stringify({ preparedAt, sourceCount: 8, commandCount: 8, allChecksPassed: true, publicationDatesAssignedByServer: true, limitations, articles: validation }, null, 2) + "\n");
console.log(JSON.stringify({ prepared: commands.length, output: outputPath, maxRequestBytes: Math.max(...validation.map(item => item.requestBytes)), sourceLinks: 26, rewrittenInternalLinks: 4, checks: "All source round-trips, CMS schema/publication validations and formatting checks passed." }, null, 2));
