import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPublishedData } from "@/lib/server-data";
import { getPublicPages } from "@/lib/public-pages";
import { locales, languageAlternates, localizedUrl } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { calendarYears, snapshotDate } = await getPublishedData();
  return getPublicPages(calendarYears, snapshotDate).flatMap(page => locales.map(locale => ({
    url: localizedUrl(page.path, locale, siteUrl),
    alternates: { languages: languageAlternates(page.path, siteUrl) },
    ...(page.updated ? { lastModified: page.updated } : {}),
  })));
}
