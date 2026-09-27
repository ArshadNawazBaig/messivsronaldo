import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { postgresStore } from "../admin/database";
import { store } from "../admin/store";
import { AdminError } from "../admin/model";
import { articles } from "../articles";
import { sources } from "../data";
import type { Article } from "../article-types";
import type { Locale } from "../i18n/config";
import { commandSchema, documentImages, publishedArticle, seedDraft, validatePublication, type BlogPost } from "./model";

export async function readPosts(db?: Database.Database): Promise<BlogPost[]> {
  const pg = db ? null : await postgresStore();
  const rows = pg ? await pg`SELECT data FROM blog_posts ORDER BY id` : (db ?? store()).prepare("SELECT data FROM blog_posts ORDER BY id").all() as { data: string }[];
  return rows.map(row => JSON.parse(row.data));
}
export function seedPost(article: Article, locale: Locale, translate?: (value: string | number) => string): BlogPost {
  const draft = seedDraft(article, translate);
  draft.citations = [...article.sourceIds.map(id => ({ title: translate ? translate(sources[id].title) : sources[id].title, url: sources[id].url })), ...draft.citations];
  if (article.slug === "why-assist-totals-differ") draft.citations.push({ title: translate ? translate("Opta event definitions") : "Opta event definitions", url: "https://www.statsperform.com/opta-event-definitions/" });
  return { id: `seed:${locale}:${article.slug}`, locale, slug: article.slug, revision: 0, draft, published: article, deleted: false, createdAt: article.published ?? "2026-09-21", updatedAt: article.updated ?? "2026-09-21", draftChanged: false };
}
export function mergePublished(locale: Locale, posts: readonly BlogPost[], seeds: readonly Article[] = articles): Article[] {
  const localized = posts.filter(post => post.locale === locale);
  const overrides = new Map(localized.map(post => [post.slug, post]));
  const result = seeds.flatMap(article => {
    const post = overrides.get(article.slug);
    return post ? post.published && !post.deleted ? [post.published] : [] : [article];
  });
  const seedSlugs = new Set(seeds.map(article => article.slug));
  return [...result, ...localized.filter(post => !seedSlugs.has(post.slug) && !post.deleted && post.published).map(post => post.published!)].sort((a, b) => (b.published ?? "2026-09-21").localeCompare(a.published ?? "2026-09-21"));
}
export async function writePost(input: unknown, db?: Database.Database, translateSeed?: (value: string | number) => string): Promise<BlogPost> {
  const command = commandSchema.parse(input);
  const posts = await readPosts(db);
  const saved = posts.find(post => post.id === command.id);
  const original = articles.find(article => article.slug === command.slug);
  if (original && command.id !== `seed:${command.locale}:${command.slug}`) throw new AdminError("That URL belongs to an existing article. Open it from the article list.", 409);
  if (!original && !/^[a-f0-9-]{36}$/.test(command.id)) throw new AdminError("Invalid article ID.");
  const prior = saved ?? (original ? seedPost(original, command.locale, translateSeed) : undefined);
  if ((prior?.revision ?? 0) !== command.revision) throw new AdminError("This article changed in another session. Reload it before saving again.", 409);
  if (prior && (prior.locale !== command.locale || prior.slug !== command.slug)) throw new AdminError("The language and URL cannot change after the first save.");
  if (posts.some(post => post.id !== command.id && post.locale === command.locale && post.slug === command.slug)) throw new AdminError("An article already uses this URL in this language, including articles in Trash.", 409);
  if (!prior && !["save", "publish"].includes(command.action)) throw new AdminError("Save the article first.");
  if (prior?.deleted && command.action !== "restore") throw new AdminError("Restore this article from Trash before editing it.");
  if (["save", "publish"].includes(command.action) && !command.draft) throw new AdminError("Article content is required.");
  const now = new Date().toISOString();
  const post: BlogPost = { id: command.id, locale: command.locale, slug: command.slug, createdAt: now, draftChanged: false, deleted: false, published: null, ...prior, draft: ["save", "publish"].includes(command.action) ? command.draft! : prior!.draft, revision: command.revision + 1, updatedAt: now };
  if (command.action === "save" || command.action === "publish") {
    const imagePaths = [...documentImages(post.draft.body), ...(post.draft.image ? [post.draft.image.path] : [])];
    for (const path of new Set(imagePaths.filter(path => path.startsWith("/media/blog/")))) {
      if (!await readMedia(path.split("/").at(-1)!, db)) throw new AdminError("An image is missing. Upload it again before saving.");
    }
    post.draftChanged = true;
  }
  if (command.action === "publish") {
    try { validatePublication(post.draft); } catch (error) { throw new AdminError((error as Error).message, 422); }
    post.published = publishedArticle(post, now, original); post.draftChanged = false;
  }
  if (command.action === "delete" || command.action === "unpublish" || command.action === "restore") { post.published = null; post.deleted = command.action === "delete"; post.draftChanged = true; }
  const pg = db ? null : await postgresStore();
  try {
    let count: number;
    if (pg) {
      const rows = saved
        ? await pg`UPDATE blog_posts SET revision=${post.revision},data=${JSON.stringify(post)} WHERE id=${post.id} AND revision=${command.revision} RETURNING id`
        : await pg`INSERT INTO blog_posts (id,locale,slug,revision,data) VALUES (${post.id},${post.locale},${post.slug},${post.revision},${JSON.stringify(post)}) ON CONFLICT DO NOTHING RETURNING id`;
      count = rows.length;
    } else {
      const sqlite = db ?? store();
      count = saved ? sqlite.prepare("UPDATE blog_posts SET revision=?,data=? WHERE id=? AND revision=?").run(post.revision, JSON.stringify(post), post.id, command.revision).changes
        : sqlite.prepare("INSERT OR IGNORE INTO blog_posts (id,locale,slug,revision,data) VALUES (?,?,?,?,?)").run(post.id, post.locale, post.slug, post.revision, JSON.stringify(post)).changes;
    }
    if (!count) throw new AdminError("The article changed or its URL is already in use. Reload before trying again.", 409);
  } catch (error) { if (error instanceof AdminError) throw error; throw new AdminError("The article could not be saved. Your changes are still in the editor.", 503); }
  return post;
}
export async function saveMedia(data: Buffer, db?: Database.Database) {
  const id = `${randomUUID()}.webp`; const now = new Date().toISOString();
  const pg = db ? null : await postgresStore();
  if (pg) await pg`INSERT INTO blog_media (id,data,created_at) VALUES (${id},${data},${now})`;
  else (db ?? store()).prepare("INSERT INTO blog_media (id,data,created_at) VALUES (?,?,?)").run(id, data, now);
  return `/media/blog/${id}`;
}
export async function readMedia(id: string, db?: Database.Database): Promise<Buffer | null> {
  const pg = db ? null : await postgresStore();
  const row = pg ? (await pg`SELECT data FROM blog_media WHERE id=${id}`)[0] : (db ?? store()).prepare("SELECT data FROM blog_media WHERE id=?").get(id) as { data: Buffer } | undefined;
  return row?.data ?? null;
}
export function mediaIsPublic(id: string, posts: readonly BlogPost[]): boolean {
  const path = `/media/blog/${id}`;
  return posts.some(post => !post.deleted && post.published && (post.published.image?.path === path || (post.published.body && documentImages(post.published.body).includes(path))));
}
