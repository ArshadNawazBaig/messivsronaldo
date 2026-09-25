import { articles } from "./articles";
import { contentPages } from "./content-pages";
import { policies, policyUpdated } from "./policies";
import { seasons } from "./seasons";
import { awardsReviewed, isAwardSlug } from "./awards";

export type PublicPage = { path: string; title: string; group: string; updated?: string };

// Shared by the visitor directory and XML sitemap. System responses, private
// admin routes, APIs and filter variants are not canonical content pages.
export function getPublicPages(years: readonly { year: number }[], snapshotDate: string): PublicPage[] {
  return [
    { path: "/", title: "Messi vs Ronaldo overview", group: "Comparisons", updated: snapshotDate },
    ...Object.entries(contentPages).map(([slug, page]) => ({
      path: `/${slug}`, title: page.title,
      group: page.scope || slug === "scoring-calculator" || slug === "honours" || isAwardSlug(slug) ? "Comparisons" : "About & policies",
      updated: slug === "scoring-calculator" ? "2026-09-25" : isAwardSlug(slug) ? awardsReviewed : Object.hasOwn(policies, slug) ? policyUpdated : page.scope || slug === "honours" || slug === "methodology" ? snapshotDate : undefined,
    })),
    { path: "/players/messi", title: "Lionel Messi profile", group: "Player profiles", updated: snapshotDate },
    { path: "/players/ronaldo", title: "Cristiano Ronaldo profile", group: "Player profiles", updated: snapshotDate },
    { path: "/seasons", title: "All years & seasons", group: "Calendar years", updated: snapshotDate },
    ...years.map(({ year }) => ({ path: `/seasons/${year}`, title: `Messi vs Ronaldo, ${year}`, group: "Calendar years", updated: snapshotDate })),
    ...seasons.map(season => ({ path: `/seasons/${season.slug}`, title: `Messi vs Ronaldo, ${season.label}`, group: "Spanish-season archive" })),
    { path: "/insights", title: "The reading room", group: "Articles" },
    ...articles.map(article => ({ path: `/insights/${article.slug}`, title: article.title, group: "Articles", updated: article.updated ?? "2026-09-21" })),
    { path: "/updates", title: "Public update log", group: "About & policies", updated: snapshotDate },
    { path: "/sitemap", title: "Site map", group: "About & policies" },
  ];
}

export const pageGroups = ["Comparisons", "Player profiles", "Calendar years", "Spanish-season archive", "Articles", "About & policies"];
