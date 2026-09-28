import { articles } from "./articles";
import type { Article } from "./article-types";
import { contentTopics, relatedContent } from "./content-discovery";
import { getPublicPages } from "./public-pages";
import type { PublishedData } from "./published-data";

export type ContentReviewIssue = { path: string; title: string; reason: string; severity: "action" | "suggestion" };
export function contentReview(data: PublishedData, today: string, entries: readonly Article[] = articles) {
  const pages = getPublicPages(data.calendarYears, data.snapshotDate, entries);
  const paths = new Set(pages.map(page => page.path));
  const issues: ContentReviewIssue[] = [];
  const knownArticles = new Set(entries.map(article => article.slug));
  for (const article of entries) {
    const path = `/insights/${article.slug}`;
    const add = (reason: string, severity: ContentReviewIssue["severity"] = "suggestion") => issues.push({ path, title: article.title, reason, severity });
    if (!article.sourceIds.length && !article.citations?.length) add("Add supporting references before making statistical claims.", "action");
    if (!article.summary) add("Consider adding a concise opening answer to this article.");
    if (article.reviewAfter && article.reviewAfter <= today) add(`Scheduled editorial review due ${article.reviewAfter}. Verify claims and sources before changing its review date.`, "action");
    for (const slug of article.relatedSlugs ?? []) if (!knownArticles.has(slug)) add(`Related article does not exist: ${slug}.`, "action");
    if (!relatedContent(path, 4, entries).length) add("This article has no topic links. Add an editorial relationship.");
  }
  for (const path of new Set(contentTopics.flat())) if (!paths.has(path) && !path.startsWith("/insights/")) issues.push({ path, title: path, reason: "Topic navigation points to an unregistered page.", severity: "action" });
  const age = Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.snapshotDate}T00:00:00Z`)) / 86400000));
  if (age >= 7) issues.unshift({ path: "/updates", title: "Published match coverage", reason: `The latest recorded match cutoff is ${age} days old. Check for missing matches; this alone does not prove the data is wrong.`, severity: "action" });
  const scoring = data.scopes.career.metrics.filter(metric => metric.group === "scoring");
  const incomplete = scoring.filter(metric => (metric.updatedThrough ?? data.baselineDate) < data.snapshotDate || metric.coverage?.includes("partial coverage"));
  if (incomplete.length && data.snapshotDate > data.baselineDate) issues.unshift({path:"/updates",title:"Scoring details need verification",reason:`Review missing match classifications for: ${incomplete.map(metric => metric.label).join(", ")}. These breakdowns have not all reached the current match coverage.`,severity:"action"});
  const goalTypeDates = scoring.map(metric => metric.updatedThrough ?? data.baselineDate).sort();
  return { today, pageCount: pages.length, articleCount: entries.length, coreCutoff: data.snapshotDate, goalTypeCutoff: goalTypeDates[0] ?? data.baselineDate, goalTypeLatest: goalTypeDates.at(-1) ?? data.baselineDate, issues };
}
