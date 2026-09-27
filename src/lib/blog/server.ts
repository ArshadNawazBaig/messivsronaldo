import "server-only";
import { cache } from "react";
import { locales, localizedUrl, type Locale } from "../i18n/config";
import { mergePublished, readPosts } from "./store";

export const getPosts = cache(() => readPosts());
export const getPublishedArticles = cache(async (locale: Locale) => mergePublished(locale, await getPosts()));
export const getArticleLanguages = cache(async () => {
  const entries = await Promise.all(locales.map(async locale => ({ locale, articles: await getPublishedArticles(locale) })));
  const result: Record<string, Locale[]> = Object.create(null);
  for (const entry of entries) for (const article of entry.articles) (result[article.slug] ??= []).push(entry.locale);
  return { ...result };
});
export function articleAlternates(slug: string, available: readonly Locale[], origin: string) {
  return Object.fromEntries([...available.map(locale => [locale, localizedUrl(`/insights/${slug}`, locale, origin)]), ...(available.length ? [["x-default", localizedUrl(`/insights/${slug}`, available.includes("en") ? "en" : available[0], origin)]] : [])]);
}
