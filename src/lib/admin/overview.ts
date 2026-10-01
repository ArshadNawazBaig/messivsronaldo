import "server-only";
import { cache } from "react";
import { postgresStore } from "./database";
import { store } from "./store";
import { readArticleIndex } from "../blog/public-store";
import { mergeArticleIndex } from "../blog/store";
import { locales } from "../i18n/config";
import { supportRetentionMs } from "../support/model";

export const getAdminSummary = cache(async () => {
  const pg = await postgresStore();
  const cutoff = new Date(Date.now() - supportRetentionMs).toISOString();
  const [index, drafts, support] = await Promise.all([
    readArticleIndex(),
    pg ? pg`SELECT COUNT(*)::integer AS count FROM blog_posts WHERE NOT COALESCE((data::jsonb->>'deleted')::boolean,false) AND ((data::jsonb->'published') IS NULL OR (data::jsonb->'published')='null'::jsonb OR (data::jsonb->>'draftChanged')::boolean)`
      : Promise.resolve([store().prepare("SELECT COUNT(*) AS count FROM blog_posts WHERE NOT json_extract(data,'$.deleted') AND (json_extract(data,'$.published') IS NULL OR json_extract(data,'$.draftChanged'))").get() as {count: number}]),
    pg ? pg`SELECT COUNT(*)::integer AS count FROM support_tickets WHERE created_at > ${cutoff} AND status IN ('new','reviewing')`
      : Promise.resolve([store().prepare("SELECT COUNT(*) AS count FROM support_tickets WHERE created_at > ? AND status IN ('new','reviewing')").get(cutoff) as {count: number}]),
  ]);
  return { articles: locales.reduce((total, locale) => total + mergeArticleIndex(locale, index).length, 0), drafts: Number(drafts[0].count), support: Number(support[0].count), languages: locales.length };
});
