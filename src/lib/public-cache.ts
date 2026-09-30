import "server-only";
import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { revision } from "./admin/database";
import type { Locale } from "./i18n/config";

export const statisticsTag = "rivalry-statistics-v2";
export const articleIndexTag = "rivalry-article-index-v2";
export const mediaVisibilityTag = "rivalry-media-visibility-v2";
export const articleTag = (locale: Locale) => `rivalry-articles-v2-${locale}`;
export const publicDataRevalidate = 3600;
// Separate caches when switching providers or running isolated local databases.
// Only the digest becomes part of a cache key; credentials are never stored in it.
export const publicDatabaseCacheKey = createHash("sha256")
  .update(process.env.DATABASE_URL || process.env.ADMIN_DATABASE_PATH || ".data/admin.sqlite")
  .digest("hex");

export function revalidateArticles(locale: Locale) {
  for (const tag of [articleTag(locale), articleIndexTag, mediaVisibilityTag]) revalidateTag(tag, { expire: 0 });
}

// Compare lightweight revisions so no-op syncs do not flush the cache. Finally
// covers batches that publish some dates before a later date fails.
export async function withStatisticsRevalidation<T>(operation: () => Promise<T>): Promise<T> {
  const before = await revision();
  try { return await operation(); }
  finally {
    let changed = true;
    try { changed = await revision() !== before; } catch { /* A completed write may precede a database outage. */ }
    if (changed) revalidateTag(statisticsTag, { expire: 0 });
  }
}
