import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPublishedData } from "@/lib/server-data";
import { getPublicPages } from "@/lib/public-pages";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { calendarYears, snapshotDate } = await getPublishedData();
  return getPublicPages(calendarYears, snapshotDate).map(page => ({
    url: page.path === "/" ? siteUrl : new URL(page.path, siteUrl).href,
    ...(page.updated ? { lastModified: page.updated } : {}),
  }));
}
