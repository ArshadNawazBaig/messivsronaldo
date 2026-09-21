import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { articles } from "@/lib/articles";
import { getPublishedData } from "@/lib/server-data";
export const dynamic = "force-dynamic";
import { seasons } from "@/lib/seasons";
export default function sitemap(): MetadataRoute.Sitemap {
  const { calendarYears, snapshotDate } = getPublishedData();
  const routes = ["", "/updates", "/compare", "/goals", "/champions-league", "/la-liga", "/international", "/honours", "/assists", "/methodology", "/about", "/insights", "/players/messi", "/players/ronaldo", ...articles.map(a => `/insights/${a.slug}`)];
  routes.push("/2026", "/world-cup", "/copa-america-vs-euros", "/head-to-head", "/clubs", "/penalties", "/free-kicks", "/hat-tricks", "/league", "/european-clubs", "/records", ...calendarYears.map(y => `/seasons/${y.year}`), "/seasons", ...seasons.map(s => `/seasons/${s.slug}`));
  return routes.map(route => ({ url: `${siteUrl}${route}`, lastModified: snapshotDate, changeFrequency: "weekly", priority: route === "" ? 1 : .7 }));
}
