import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { draftSchema, documentText, validatePublication, type RichNode } from "../../src/lib/blog/model";
import { articleWordCount } from "../../src/lib/blog/word-count";
import { isLocale, type Locale } from "../../src/lib/i18n/config";

// Validate and export content locally. This script does not save or publish posts.
const root = path.dirname(new URL(import.meta.url).pathname);
const output = path.resolve(".artifacts/retirement-features-2026-10-01");
const slugs: Record<string, string> = {
  "messi-retirement": "messi-retirement-argentina-inter-miami-future",
  "ronaldo-retirement": "cristiano-ronaldo-retirement-portugal-al-nassr-future",
};
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
function render(node: RichNode): string {
  if (node.type === "text") {
    let text = escape(node.text ?? "");
    for (const mark of node.marks ?? []) {
      if (mark.type === "link") {
        const href = String(mark.attrs?.href ?? "");
        text = `<a href="${escape(href.startsWith("/") ? "https://messivsronaldo17.com" + href : href)}">${text}</a>`;
      }
      if (mark.type === "bold") text = `<strong>${text}</strong>`;
      if (mark.type === "italic") text = `<em>${text}</em>`;
    }
    return text;
  }
  const children = (node.content ?? []).map(render).join("");
  const tag = ({ paragraph: "p", bulletList: "ul", orderedList: "ol", listItem: "li", blockquote: "blockquote" } as Record<string, string>)[node.type];
  if (tag) return `<${tag}>${children}</${tag}>`;
  if (node.type === "heading") return `<h${node.attrs?.level}>${children}</h${node.attrs?.level}>`;
  if (node.type === "hardBreak") return "<br>";
  return children;
}
const drafts = [];
const reports = [];
const paragraphsSeen = new Map<string, string>();
fs.mkdirSync(output, { recursive: true });
for (const locale of fs.readdirSync(root).filter(isLocale) as Locale[]) {
  for (const [name, slug] of Object.entries(slugs)) {
    const file = path.join(root, locale, name + ".json");
    if (!fs.existsSync(file)) throw Error(`Missing ${locale}/${name}`);
    const draft = draftSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
    validatePublication(draft);
    const paragraphs: string[] = [];
    const headings: { level: number; title: string }[] = [];
    const internalLinks = new Set<string>();
    let lists = 0;
    function walk(node: RichNode) {
      if (node.type === "paragraph") paragraphs.push(documentText(node));
      if (node.type === "heading") headings.push({ level: Number(node.attrs?.level), title: documentText(node) });
      if (node.type === "bulletList") lists++;
      for (const mark of node.marks ?? []) if (mark.type === "link" && String(mark.attrs?.href).startsWith("/")) internalLinks.add(String(mark.attrs?.href));
      for (const child of node.content ?? []) walk(child);
    }
    walk(draft.body);
    const proseWords = paragraphs.reduce((total, value) => total + articleWordCount(value, locale), 0);
    const sentences = paragraphs.map(value => [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value)].length);
    const errors: string[] = [];
    if (proseWords < 2000) errors.push(`Only ${proseWords} prose words`);
    if (Math.max(...sentences) > 4) errors.push("Paragraph exceeds four sentences");
    if (!headings.some(h => h.level === 2) || !headings.some(h => h.level === 3)) errors.push("Missing H2/H3");
    if (!lists || draft.citations.length < 4) errors.push("Missing tactical bullets or source coverage");
    if (locale === "en" && /\b(delve|tapestry|testament|in conclusion|furthermore|dynamic landscape|it['’]s important to note|undeniably|ultimate debate)\b/i.test(documentText(draft.body))) errors.push("Banned wording");
    for (const paragraph of paragraphs.filter(p => articleWordCount(p, locale) > 35)) {
      const key = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
      if (paragraphsSeen.has(key)) errors.push(`Duplicate paragraph with ${paragraphsSeen.get(key)}`);
      paragraphsSeen.set(key, `${locale}/${slug}`);
    }
    const hash = createHash("sha256").update(`retirement-features-2026-10-01:${locale}:${slug}`).digest("hex");
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
    drafts.push({ action: "save", id, revision: 0, locale, slug, draft });
    reports.push({ locale, slug, title: draft.title, proseWords, paragraphs: paragraphs.length, maxSentences: Math.max(...sentences), headings, lists, citations: draft.citations.length, internalLinks: [...internalLinks], errors });
    const cover = draft.image ? `<figure><img src="https://messivsronaldo17.com${escape(draft.image.path)}" alt="${escape(draft.image.alt)}"><figcaption>${escape(draft.image.caption ?? "")}</figcaption></figure>` : "";
    fs.writeFileSync(path.join(output, `${locale}-${name}.html`), `<!doctype html><html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(draft.title)}</title><style>body{margin:0;background:#fbfcfa;color:#1d3026;font:18px/1.8 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:48px 24px 80px}h1{font-size:clamp(32px,6vw,48px);line-height:1.13;letter-spacing:-.025em}h2{font-size:29px;line-height:1.3;margin-top:56px}h3{font-size:23px;line-height:1.4;margin-top:32px}p{margin:0 0 24px}a{color:#216986}li{margin:12px 0}small,figcaption{font-size:14px;color:#53685b}.intro{font-size:21px}.summary{padding:24px;background:#edf3ed;border-radius:12px;margin:32px 0}figure{margin:28px 0}img{width:100%;max-height:460px;object-fit:contain}footer{border-top:1px solid #ced9cf;margin-top:48px;padding-top:24px}footer a{display:block;margin:10px 0}</style></head><body><main><small>THE RIVALRY · EDITORIAL DRAFT · 1 OCTOBER 2026</small><h1>${escape(draft.title)}</h1><p class="intro">${escape(draft.description)}</p>${cover}<aside class="summary">${escape(draft.summary)}</aside>${render(draft.body)}<footer><h2>Sources & further reading</h2>${draft.citations.map(c => `<a href="${escape(c.url)}">${escape(c.title)}</a>`).join("")}</footer></main></body></html>`);
  }
}
fs.writeFileSync(path.join(output, "drafts.json"), JSON.stringify(drafts, null, 2) + "\n");
fs.writeFileSync(path.join(root, "editorial-report.json"), JSON.stringify(reports, null, 2) + "\n");
console.log(JSON.stringify(reports.map(({ locale, slug, proseWords, errors }) => ({ locale, slug, proseWords, errors })), null, 2));
if (!reports.length || reports.some(r => r.errors.length)) process.exitCode = 1;
