import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPublishedData } from "@/lib/server-data";
import { getPublicPages } from "@/lib/public-pages";
import { locales, languageAlternates, localizedUrl } from "@/lib/i18n/config";
import { getPublishedArticles, getArticleLanguages, articleAlternates } from "@/lib/blog/server";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { calendarYears, snapshotDate } = await getPublishedData();
  const languages = await getArticleLanguages();
  const entries = await Promise.all(locales.map(async locale => getPublicPages(calendarYears, snapshotDate, await getPublishedArticles(locale)).map(page => ({
    url: localizedUrl(page.path, locale, siteUrl),
    alternates: { languages: page.path.startsWith("/insights/") ? articleAlternates(page.path.slice(10), languages[page.path.slice(10)] ?? [], siteUrl) : languageAlternates(page.path, siteUrl) },
    ...(page.updated ? { lastModified: page.updated } : {}),
  }))));
  return entries.flat();
}
