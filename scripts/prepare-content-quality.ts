import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { seedArticles } from "../src/lib/articles";
import { sources } from "../src/lib/data";
import { seedDraft, draftSchema, commandSchema, validatePublication, documentText, type BlogPost, type RichNode } from "../src/lib/blog/model";
import { createTranslator } from "../src/lib/i18n/translate";
import { locales, type Locale } from "../src/lib/i18n/config";
import { customRevisions } from "../content/content-quality-2026-10-15/revisions";
import { sourceLabels } from "../content/content-quality-2026-10-15/source-labels";

const input = process.argv[2] ?? ".artifacts/content-quality-2026-10-15";
const output = process.argv[3] ?? "content/content-quality-2026-10-15";
mkdirSync(output, { recursive: true });
const commands = [], decisions = [];
const missing = new Set<string>();
const p = (text: string): RichNode => ({ type: "paragraph", content: [{ type: "text", text }] });
const h = (text: string): RichNode => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
function links(node: RichNode): { title: string; url: string }[] {
  return [...(node.marks ?? []).filter(mark => mark.type === "link" && /^https?:/.test(String(mark.attrs?.href))).map(mark => ({ title: node.text ?? "Source", url: String(mark.attrs?.href) })), ...(node.content ?? []).flatMap(links)];
}
function table(rows: (string | number)[][]): RichNode {
  return { type: "table", content: rows.map((row, r) => ({ type: "tableRow", content: row.map((cell, c) => ({ type: r === 0 || c === 0 ? "tableHeader" : "tableCell", content: [p(String(cell))] })) })) };
}
// The published localized features were edited independently. These ranges
// select their reviewed match sections from the revision-checked snapshots.
const peakRanges: Record<Locale, Record<string, [number, number]>> = {
  en: { years: [26,45], league: [20,36], europe: [24,40] },
  es: { years: [20,37], league: [21,36], europe: [21,37] },
  pt: { years: [20,38], league: [21,37], europe: [24,40] },
  nl: { years: [28,49], league: [25,44], europe: [27,50] },
  fr: { years: [23,42], league: [22,38], europe: [22,38] },
  de: { years: [27,48], league: [27,47], europe: [27,48] },
  ar: { years: [25,45], league: [25,44], europe: [25,44] },
  hi: { years: [23,43], league: [25,43], europe: [25,43] },
  th: { years: [19,32], league: [18,31], europe: [18,31] },
};
for (const locale of locales) {
  const messages = { ...JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8")), ...JSON.parse(readFileSync(`src/lib/i18n/article-messages/${locale}.json`, "utf8")), ...sourceLabels[locale] };
  const translate = createTranslator(locale as Locale, messages);
  const t = (value: string | number) => {
    const text = String(value), result = String(translate(text));
    if (locale !== "en" && result === text && /[a-z]{4}/i.test(text) && !Object.hasOwn(messages, text) && !/^(Lionel Messi|Cristiano Ronaldo|Harry Kane|Kylian Mbappé|Khvicha Kvaratskhelia|Ousmane Dembélé|Michael Olise|Lamine Yamal|Rodri|London Palladium Theatre)$/.test(text)) missing.add(`${locale}: ${text}`);
    return result;
  };
  const posts: BlogPost[] = JSON.parse(readFileSync(`${input}/${locale}-before.json`, "utf8")).posts;
  for (const post of posts.filter(post => post.published && !post.deleted)) {
    if (post.draftChanged) throw new Error(`Pending draft: ${locale}/${post.slug}`);
    let draft = structuredClone(post.draft);
    let reason = "";
    const base = seedArticles.find(article => article.slug === post.slug);
    const custom = customRevisions[`${locale}/${post.slug}`];
    if (base) {
      const prepared = seedDraft(base, t);
      draft.summary = t(base.summary ?? base.sections[0].text);
      draft.description = prepared.description;
      draft.body = prepared.body;
      // Put the scope-labelled evidence before the interpretation.
      const tableIndex = draft.body.content!.findIndex(node => node.type === "table");
      if (tableIndex > 0) {
        const before = draft.body.content!.slice(0, tableIndex - 1);
        draft.body.content = [...draft.body.content!.slice(tableIndex - 1), ...before];
      }
      draft.citations = [...base.sourceIds.map(id => ({ title: t(sources[id].title), url: sources[id].url })), ...prepared.citations];
      if (base.preset) {
        const [start, end] = peakRanges[locale][base.preset];
        const content = post.draft.body.content!;
        if (content[start].type !== "heading" || content[end].type !== "heading" || content.slice(start, end).filter(n => n.type === "heading").length !== 3) throw new Error(`Unexpected feature structure: ${locale}/${post.slug}`);
        draft.body.content!.push(...structuredClone(content.slice(start, end)));
        draft.citations.push(...post.draft.citations);
        if (base.preset !== "years") {
          const league = base.preset === "league";
          draft.body.content!.unshift(h(t(league ? "La Liga" : "Champions League")), table([
            [t("Statistic"), `Messi · 2011/12`, `Ronaldo · ${league ? "2014/15" : "2013/14"}`],
            [t("Goals"), league ? 50 : 14, league ? 48 : 17],
            [t("Appearances"), league ? 37 : 11, league ? 35 : 11],
            [t("Goals per appearance"), league ? (50 / 37).toFixed(2) : (14 / 11).toFixed(2), league ? (48 / 35).toFixed(2) : (17 / 11).toFixed(2)],
          ]));
        }
        reason = "Replace generic tactical/longevity framing with exact scope, input counts, reproducible rate arithmetic and limitations; retain three specific match analyses and their sources.";
      } else {
        reason = post.slug.includes("2026") ? "Replace repeated Messi/Ronaldo legacy essay with the actual 2026 award facts, scope-labelled evidence, official rules and answers to the article’s question." : "Replace broad tactical essay with counting definitions, an original worked example, source reconciliation and practical interpretation rules.";
      }
      if (locale === "en") draft.title = prepared.title;
      if (locale === "en" && post.slug === "why-assist-totals-differ") draft.title = "Why Messi and Ronaldo Assist Totals Differ";
      if (locale === "en" && post.slug === "totals-vs-scoring-rates") draft.title = "Goals per Game vs Goals per 90: Messi and Ronaldo";
      if (locale === "en" && post.slug === "what-counts-as-a-career-goal") draft.title = "What Counts as a Career Goal? Rules and Examples";
      if (locale === "nl" && post.slug === "ballon-dor-2026-date-voting-rules") {
        draft.title = post.draft.title;
        draft.summary = post.draft.summary;
        // Preserve the already corrected Dutch factual introduction and its check date.
        draft.body.content!.splice(0, 3, ...structuredClone(post.draft.body.content!.slice(0, 3)));
      }
      if (locale === "en" && post.slug === "messi-2012-vs-ronaldo-2013-goals") draft.title = "Messi 2012 vs Ronaldo 2013: Goals and Scoring Rates";
    } else if (custom) {
      if (custom.title) draft.title = custom.title;
      if (custom.description) draft.description = custom.description;
      draft.summary = custom.summary;
      draft.body.content = [
        ...custom.opening.flatMap(block => "rows" in block ? [table(block.rows)] : "heading" in block ? [h(block.heading)] : "link" in block ? [{ type: "paragraph", content: [{ type: "text", text: block.link[0], marks: [{ type: "link", attrs: { href: block.link[1] } }] }] } as RichNode] : [p(block.text)]),
        ...(custom.keep ?? []).flatMap(([start, end]) => structuredClone(post.draft.body.content!.slice(start, end))),
      ];
      if (custom.replaceSources) draft.citations = custom.sources ?? [];
      else draft.citations.push(...custom.sources ?? []);
      reason = custom.reason;
    } else {
      throw new Error(`No editorial decision for ${locale}/${post.slug}`);
    }
    draft.citations.push(...links(draft.body));
    draft.citations = [...new Map(draft.citations.map(source => [source.url, source])).values()];
    draft = draftSchema.parse(draft);
    validatePublication(draft);
    const command = commandSchema.parse({ action: "publish", id: post.id, revision: post.revision, locale, slug: post.slug, draft });
    commands.push(command);
    decisions.push({ locale, slug: post.slug, url: `https://messivsronaldo17.com${locale === "en" ? "" : `/${locale}`}/insights/${post.slug}`, revision: post.revision, reason, beforeCharacters: documentText(post.draft.body).length, afterCharacters: documentText(draft.body).length, beforeSummary: post.draft.summary, afterSummary: draft.summary, sourceCount: draft.citations.length });
  }
}
writeFileSync(`${output}/translation-review.json`, JSON.stringify([...missing], null, 2) + "\n");
writeFileSync(`${output}/commands.json`, JSON.stringify({ preparedAt: new Date().toISOString(), commands }, null, 2) + "\n");
writeFileSync(`${output}/decisions.json`, JSON.stringify(decisions, null, 2) + "\n");
console.log(`Prepared ${commands.length} reviewed publications. No CMS writes. ${missing.size} translation entries require review.`);
