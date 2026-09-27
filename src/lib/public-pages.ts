import { archiveContentUpdated } from "./archive-summary";
import { articles } from "./articles";
import { contentPages } from "./content-pages";
import { policies, policyUpdated } from "./policies";
import { seasons } from "./seasons";
import { awardsReviewed, isAwardSlug } from "./awards";
import { toolPages, toolsUpdated } from "./tools";
import { comparisonContentUpdated, refreshedComparisons } from "./comparison-copy";
import { ballonReviewed } from "./ballon-articles";
import { discoveryUpdated } from "./content-discovery";
import { socialProfilesUpdated } from "./social-profiles";
import { semanticContentUpdated } from "./page-semantics";

export type PublicPage = { path: string; title: string; group: string; updated?: string };

// Shared by the visitor directory and XML sitemap. System responses, private
// admin routes, APIs and filter variants are not canonical content pages.
export function getPublicPages(years: readonly { year: number }[], snapshotDate: string): PublicPage[] {
  const latestArticle = articles.map(article => article.updated ?? article.published ?? "2026-09-21").sort().at(-1)!;
  return [
    { path: "/", title: "Messi vs Ronaldo overview", group: "Comparisons", updated: [snapshotDate, toolsUpdated, latestArticle, discoveryUpdated].sort().at(-1) },
    ...Object.entries(contentPages).map(([slug, page]) => {
      let updated = slug === "glossary" ? semanticContentUpdated : slug === "about" || slug === "contact" ? socialProfilesUpdated
        : slug === "ballon-dor" ? [awardsReviewed, ballonReviewed].sort().at(-1)
        : refreshedComparisons.has(slug) ? [comparisonContentUpdated, snapshotDate].sort().at(-1)
        : Object.hasOwn(toolPages, slug) || slug === "scoring-calculator" ? [toolsUpdated, snapshotDate].sort().at(-1)
        : isAwardSlug(slug) ? awardsReviewed
        : Object.hasOwn(policies, slug) ? policyUpdated
        : page.scope || slug === "honours" || slug === "methodology" ? snapshotDate : undefined;
      if (slug === "answers" || page.scope || slug === "honours" || isAwardSlug(slug)) {
        updated = [updated ?? snapshotDate, discoveryUpdated].sort().at(-1);
      }
      return {
        path: `/${slug}`, title: page.title,
        group: slug === "answers" ? "Comparisons" : Object.hasOwn(toolPages, slug) || slug === "scoring-calculator" ? "Tools & games" : page.scope || slug === "honours" || isAwardSlug(slug) ? "Comparisons" : "About & policies",
        updated,
      };
    }),
    { path: "/players/messi", title: "Lionel Messi profile", group: "Player profiles", updated: snapshotDate },
    { path: "/players/ronaldo", title: "Cristiano Ronaldo profile", group: "Player profiles", updated: snapshotDate },
    { path: "/seasons", title: "All years & seasons", group: "Calendar years", updated: [snapshotDate, semanticContentUpdated, archiveContentUpdated].sort().at(-1) },
    ...years.map(({ year }) => ({ path: `/seasons/${year}`, title: `Messi vs Ronaldo, ${year}`, group: "Calendar years", updated: [snapshotDate, semanticContentUpdated, archiveContentUpdated].sort().at(-1) })),
    ...seasons.map(season => ({ path: `/seasons/${season.slug}`, title: `Messi vs Ronaldo, ${season.label}`, group: "Spanish-season archive", updated: [semanticContentUpdated, archiveContentUpdated].sort().at(-1) })),
    { path: "/insights", title: "The reading room", group: "Articles", updated: latestArticle },
    ...articles.map(article => ({ path: `/insights/${article.slug}`, title: article.title, group: "Articles", updated: [discoveryUpdated, article.updated ?? "2026-09-21"].sort().at(-1) })),
    { path: "/updates", title: "Public update log", group: "About & policies", updated: snapshotDate },
    { path: "/sitemap", title: "Site map", group: "About & policies" },
  ];
}

export const pageGroups = ["Comparisons", "Tools & games", "Player profiles", "Calendar years", "Spanish-season archive", "Articles", "About & policies"];
