import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { locales, localizedUrl, type Locale } from "../i18n/config";
import { mediaChunkBytes, mergeArticleIndex, mergePublished, readMediaChunk, readMediaSize } from "./store";
import { readArticleIndex, readMediaVisibility, readPublicPosts } from "./public-store";
import { articleIndexTag, articleTag, mediaVisibilityTag, publicDatabaseCacheKey, publicDataRevalidate } from "../public-cache";

const getPublicPosts = cache((locale: Locale) => unstable_cache(
  () => readPublicPosts(locale), ["public-blog-posts-v3", publicDatabaseCacheKey, locale],
  { revalidate: publicDataRevalidate, tags: [articleTag(locale)] },
)());
const getArticleIndex = cache(unstable_cache(
  () => readArticleIndex(), ["public-blog-index-v2", publicDatabaseCacheKey],
  { revalidate: publicDataRevalidate, tags: [articleIndexTag] },
));
export const getPublishedArticles = cache(async (locale: Locale) => mergePublished(locale, await getPublicPosts(locale)));
export const getArticleNavigation = cache(async (locale: Locale) => mergeArticleIndex(locale, await getArticleIndex()));
export const getArticleLanguages = cache(async () => {
  const posts = await getArticleIndex();
  const result: Record<string, Locale[]> = Object.create(null);
  for (const locale of locales) for (const article of mergeArticleIndex(locale, posts)) (result[article.slug] ??= []).push(locale);
  return { ...result };
});

export const getMediaVisibility = unstable_cache(
  (id: string) => readMediaVisibility(id), ["public-blog-media-visibility-v2", publicDatabaseCacheKey],
  { revalidate: publicDataRevalidate, tags: [mediaVisibilityTag] },
);
const getMediaSize = unstable_cache(
  (id: string) => readMediaSize(id), ["blog-media-size-v2", publicDatabaseCacheKey],
  { revalidate: 86400 },
);
// Bounded, JSON-safe chunks keep larger uploads under the cache entry limit.
// The route checks visibility/admin access before reading any cached bytes.
const getMediaChunk = unstable_cache(
  async (id: string, offset: number) => (await readMediaChunk(id, offset))?.toString("base64") ?? null,
  ["blog-media-chunk-v2", publicDatabaseCacheKey],
  { revalidate: 86400 },
);
export async function getMediaBytes(id: string): Promise<Buffer | null> {
  const size = await getMediaSize(id);
  if (size === null) return null;
  const chunks = await Promise.all(Array.from({ length: Math.ceil(size / mediaChunkBytes) },
    (_, index) => getMediaChunk(id, index * mediaChunkBytes)));
  if (chunks.some(chunk => chunk === null)) return null;
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk!, "base64")));
}
export function articleAlternates(slug: string, available: readonly Locale[], origin: string) {
  return Object.fromEntries([...available.map(locale => [locale, localizedUrl(`/insights/${slug}`, locale, origin)]), ...(available.length ? [["x-default", localizedUrl(`/insights/${slug}`, available.includes("en") ? "en" : available[0], origin)]] : [])]);
}
