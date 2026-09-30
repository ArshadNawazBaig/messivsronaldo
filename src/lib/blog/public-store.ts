import type Database from "better-sqlite3";
import type { Article } from "../article-types";
import { postgresStore } from "../admin/database";
import { store } from "../admin/store";
import type { Locale } from "../i18n/config";
import type { ArticleSummary, PublishedPost } from "./store";

// Keep unpublished/deleted overrides so built-in articles do not reappear.
// Project inside SQL: private drafts never leave Postgres for public reads.
export async function readPublicPosts(locale: Locale, db?: Database.Database): Promise<PublishedPost[]> {
  const pg = db ? null : await postgresStore();
  const rows = pg
    ? await pg`SELECT locale,slug,(data::jsonb->>'deleted')::boolean AS deleted,
        CASE WHEN (data::jsonb->>'deleted')::boolean THEN NULL ELSE data::jsonb->'published' END AS published
        FROM blog_posts WHERE locale=${locale} ORDER BY id`
    : (db ?? store()).prepare(`SELECT locale,slug,json_extract(data,'$.deleted') AS deleted,
        CASE WHEN json_extract(data,'$.deleted') THEN NULL ELSE json_extract(data,'$.published') END AS published
        FROM blog_posts WHERE locale=? ORDER BY id`).all(locale) as { locale: Locale; slug: string; deleted: number; published: string | null }[];
  return rows.map(row => ({ locale: row.locale as Locale, slug: row.slug, deleted: !!row.deleted,
    published: (typeof row.published === "string" ? JSON.parse(row.published) : row.published) as Article | null }));
}

// Navigation and language links only need titles, slugs and publication order.
export async function readArticleIndex(db?: Database.Database): Promise<PublishedPost<ArticleSummary>[]> {
  const pg = db ? null : await postgresStore();
  const rows = pg
    ? await pg`SELECT locale,slug,(data::jsonb->>'deleted')::boolean AS deleted,
        data::jsonb #>> '{published,title}' AS title, data::jsonb #>> '{published,published}' AS published_at,
        (data::jsonb #>> '{published,managed}')::boolean AS managed FROM blog_posts ORDER BY id`
    : (db ?? store()).prepare(`SELECT locale,slug,json_extract(data,'$.deleted') AS deleted,
        json_extract(data,'$.published.title') AS title, json_extract(data,'$.published.published') AS published_at,
        json_extract(data,'$.published.managed') AS managed FROM blog_posts ORDER BY id`).all() as {
          locale: Locale; slug: string; deleted: number; title: string | null; published_at: string | null; managed: number | null;
        }[];
  return rows.map(row => ({ locale: row.locale as Locale, slug: row.slug, deleted: !!row.deleted,
    published: row.deleted || row.title === null ? null : { slug: row.slug, title: row.title,
      ...(row.published_at ? { published: row.published_at } : {}), managed: !!row.managed } }));
}

// Return a boolean instead of downloading every article body to check one image.
export async function readMediaVisibility(id: string, db?: Database.Database): Promise<boolean> {
  const path = `/media/blog/${id}`;
  const pg = db ? null : await postgresStore();
  if (pg) {
    const [row] = await pg`SELECT EXISTS(SELECT 1 FROM blog_posts
      WHERE NOT (data::jsonb->>'deleted')::boolean AND (
        data::jsonb #>> '{published,image,path}' = ${path}
        OR jsonb_path_exists(data::jsonb, '$.published.body.** ? (@.type == "image" && @.attrs.src == $path)',
          jsonb_build_object('path',${path}::text)))) AS visible`;
    return row.visible;
  }
  const row = (db ?? store()).prepare(`SELECT EXISTS(SELECT 1 FROM blog_posts
    WHERE NOT json_extract(data,'$.deleted') AND (
      json_extract(data,'$.published.image.path') = ? OR EXISTS(
        SELECT 1 FROM json_tree(blog_posts.data,'$.published.body') AS node
        WHERE CASE WHEN node.type='object' THEN
          json_extract(node.value,'$.type')='image' AND json_extract(node.value,'$.attrs.src')=?
          ELSE 0 END))) AS visible`).get(path, path) as { visible: number };
  return !!row.visible;
}
