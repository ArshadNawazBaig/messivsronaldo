import { z } from "zod";
import type { Article } from "../article-types";
import { locales, type Locale } from "../i18n/config";
import { articleWordCount } from "./word-count";

export type RichNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: RichNode[] };
export const emptyDocument: RichNode = { type: "doc", content: [{ type: "paragraph" }] };
export function safeLink(value: string): boolean {
  return !/[\s\\\u0000-\u001f\u007f]/.test(value) && (/^https?:\/\//i.test(value) || /^mailto:[^@]+@[^@]+$/i.test(value) || /^\/(?!\/)/.test(value) || /^#[\w-]+$/.test(value));
}
export function safeImage(value: string): boolean {
  return !value.includes("..") && (/^\/media\/blog\/[a-f0-9-]{36}\.webp$/.test(value) || /^\/images\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif)$/.test(value));
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const blocks = ["paragraph", "heading", "bulletList", "orderedList", "blockquote", "codeBlock", "horizontalRule", "image", "table"];
const children: Record<string, string[]> = {
  doc: blocks, paragraph: ["text", "hardBreak"], heading: ["text", "hardBreak"], codeBlock: ["text"],
  bulletList: ["listItem"], orderedList: ["listItem"], listItem: blocks.filter(type => type !== "table"),
  blockquote: blocks, table: ["tableRow"], tableRow: ["tableCell", "tableHeader"], tableCell: blocks.filter(type => type !== "table"), tableHeader: blocks.filter(type => type !== "table"),
  text: [], hardBreak: [], horizontalRule: [], image: [],
};
// Only these nodes and attributes ever reach the editor or public renderer. HTML
// pasted into the editor cannot add scripts, event handlers, styles or iframes.
export function cleanDocument(value: unknown): RichNode {
  let count = 0;
  function node(value: unknown, depth: number, parent?: string): RichNode {
    if (++count > 12000 || depth > 24 || !object(value) || typeof value.type !== "string" || !Object.hasOwn(children, value.type)) throw new Error("The article contains unsupported or overly complex formatting.");
    const type = value.type;
    if (parent ? !children[parent].includes(type) : type !== "doc") throw new Error("The article has invalid document structure.");
    const result: RichNode = { type };
    if (type === "text") {
      if (typeof value.text !== "string" || !value.text.length) throw new Error("Invalid text in article.");
      result.text = value.text;
      if (value.marks !== undefined) {
        if (!Array.isArray(value.marks) || value.marks.length > 8) throw new Error("Invalid text formatting.");
        result.marks = value.marks.map(mark => {
          if (!object(mark) || typeof mark.type !== "string" || !["bold", "italic", "underline", "strike", "code", "link"].includes(mark.type)) throw new Error("Unsupported text formatting.");
          if (mark.type !== "link") return { type: mark.type };
          if (!object(mark.attrs) || typeof mark.attrs.href !== "string" || mark.attrs.href.length > 2000 || !safeLink(mark.attrs.href)) throw new Error("Use a valid HTTP, HTTPS, email or site link.");
          return { type: "link", attrs: { href: mark.attrs.href } };
        });
      }
    }
    const attrs = object(value.attrs) ? value.attrs : {};
    if (type === "heading") result.attrs = { level: [2, 3, 4].includes(Number(attrs.level)) ? Number(attrs.level) : 2 };
    if (type === "orderedList") result.attrs = { start: Number.isInteger(attrs.start) && Number(attrs.start) > 0 && Number(attrs.start) < 10000 ? attrs.start : 1 };
    if (type === "tableCell" || type === "tableHeader") result.attrs = { colspan: Math.max(1, Math.min(12, Number(attrs.colspan) || 1)), rowspan: Math.max(1, Math.min(100, Number(attrs.rowspan) || 1)) };
    if (type === "image") {
      if (typeof attrs.src !== "string" || !safeImage(attrs.src)) throw new Error("Upload images using the image button.");
      result.attrs = { src: attrs.src, alt: typeof attrs.alt === "string" ? attrs.alt.slice(0, 500) : "", title: typeof attrs.title === "string" ? attrs.title.slice(0, 500) : null };
    }
    if (value.content !== undefined) {
      if (!Array.isArray(value.content)) throw new Error("Invalid article content.");
      result.content = value.content.map(child => node(child, depth + 1, type));
    }
    return result;
  }
  return node(value, 0);
}
export function documentText(node: RichNode): string { return [node.text ?? "", ...(node.content ?? []).map(documentText)].join(" ").trim(); }
export function documentImages(node: RichNode): string[] { return [...(node.type === "image" ? [String(node.attrs?.src)] : []), ...(node.content ?? []).flatMap(documentImages)]; }
function missingAlt(node: RichNode): boolean { return (node.type === "image" && !String(node.attrs?.alt ?? "").trim()) || !!node.content?.some(missingAlt); }
const bodySchema = z.unknown().transform((value, ctx): RichNode => {
  try { return cleanDocument(value); } catch (error) { ctx.addIssue({ code: "custom", message: (error as Error).message }); return z.NEVER; }
});
export const draftSchema = z.object({
  title: z.string().trim().max(180), description: z.string().trim().max(500), category: z.string().trim().max(80),
  summary: z.string().trim().max(2000).default(""), body: bodySchema,
  image: z.object({ path: z.string().refine(safeImage, "Upload a cover image using the image button."), alt: z.string().trim().max(500), caption: z.string().trim().max(500).optional() }).nullable().default(null),
  citations: z.array(z.object({ title: z.string().trim().min(1).max(200), url: z.string().max(2000).refine(value => /^https?:\/\//i.test(value) && safeLink(value), "Use a valid source URL.") })).max(100).default([]),
});
export type BlogDraft = z.infer<typeof draftSchema>;
export type BlogPost = { id: string; locale: Locale; slug: string; revision: number; draft: BlogDraft; published: Article | null; deleted: boolean; createdAt: string; updatedAt: string; draftChanged: boolean };
export const commandSchema = z.object({
  action: z.enum(["save", "publish", "unpublish", "delete", "restore"]),
  id: z.string().min(1).max(180), revision: z.number().int().nonnegative(), locale: z.enum(locales),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the URL."),
  draft: draftSchema.optional(),
});
export type BlogCommand = z.infer<typeof commandSchema>;
export function validatePublication(draft: BlogDraft) {
  if (!draft.title || !draft.description || !draft.category || !documentText(draft.body)) throw new Error("Add a title, excerpt, category and article text before publishing.");
  if ((draft.image && !draft.image.alt) || missingAlt(draft.body)) throw new Error("Add descriptive alt text to every image before publishing.");
}
export function publishedArticle(post: BlogPost, at: string, original?: Article): Article {
  const draft = post.draft;
  return { ...original, slug: post.slug, title: draft.title, description: draft.description, category: draft.category,
    summary: draft.summary || undefined, sections: [], tables: undefined, sourceIds: [], citations: draft.citations,
    image: draft.image ?? undefined, body: draft.body, managed: true, readTime: `${Math.max(1, Math.ceil(articleWordCount(documentText(draft.body), post.locale) / 200))} min read`,
    color: original?.color ?? "blue", number: original?.number ?? "01", published: post.published?.published ?? original?.published ?? at, updated: at,
  };
}
export function seedDraft(article: Article, t: (value: string | number) => string = String): BlogDraft {
  const paragraph = (text: string): RichNode => ({ type: "paragraph", content: text ? [{ type: "text", text: t(text) }] : [] });
  const heading = (text: string): RichNode => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t(text) }] });
  const links = (items: readonly { title: string; url: string }[] = []): RichNode[] => items.map(item => ({ type: "paragraph", content: [{ type: "text", text: t(item.title), marks: [{ type: "link", attrs: { href: item.url } }] }] }));
  return { title: t(article.title), description: t(article.description), category: t(article.category), summary: t(article.summary ?? ""), image: article.image ? { ...article.image, alt: t(article.image.alt) } : null,
    citations: (article.citations ?? []).map(item => ({ ...item, title: t(item.title) })), body: { type: "doc", content: [
      ...article.sections.flatMap(section => [heading(section.heading), ...t(section.text).split(/\n\s*\n/).filter(Boolean).map(text => ({ type: "paragraph", content: [{ type: "text", text }] } as RichNode)), ...links(section.citations)]),
      ...(article.tables ?? []).flatMap(table => [heading(table.caption), { type: "table", content: [{ type: "tableRow", content: table.columns.map(text => ({ type: "tableHeader", content: [paragraph(text)] })) }, ...table.rows.map(row => ({ type: "tableRow", content: row.cells.map((cell, index) => ({ type: "tableCell", content: [paragraph(String(cell)), ...(index === 0 ? links(row.citations) : [])] })) }))] } as RichNode, ...(table.note ? [paragraph(table.note)] : [])]),
    ] },
  };
}
