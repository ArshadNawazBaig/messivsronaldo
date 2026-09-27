import type { Article } from "./article-types";
import { articles } from "./articles";
import { contentPages } from "./content-pages";
import { calendarYears } from "./data";
import { seasons } from "./seasons";

export const discoveryUpdated = "2026-09-27";
// Editorial relationships drive navigation without generating article claims.
export const contentTopics = [
  ["/goals", "/compare", "/answers", "/records", "/international", "/insights/what-counts-as-a-career-goal"],
  ["/assists", "/champions-league", "/methodology", "/insights/why-assist-totals-differ"],
  ["/scoring-calculator", "/goals", "/milestone-planner", "/insights/totals-vs-scoring-rates"],
  ["/seasons", "/seasons/2012", "/seasons/2013", "/career-timeline", "/scoring-calculator", "/insights/messi-2012-vs-ronaldo-2013-goals"],
  ["/seasons/2012", "/seasons/2013", "/insights/messi-2012-vs-ronaldo-2013-goals"],
  ["/la-liga", "/league", "/scoring-calculator", "/insights/messi-2011-12-vs-ronaldo-2014-15-la-liga"],
  ["/champions-league", "/european-clubs", "/scoring-calculator", "/insights/messi-2011-12-vs-ronaldo-2013-14-champions-league"],
  ["/free-kicks", "/penalties", "/hat-tricks", "/answers", "/insights/what-counts-as-a-career-goal"],
  ["/world-cup", "/international", "/copa-america-vs-euros", "/insights/what-counts-as-a-career-goal"],
  ["/ballon-dor", "/honours", "/golden-boots", "/fifa-awards", "/uefa-awards", "/man-of-the-match", "/insights/ballon-dor-2026-contenders-stats", "/insights/kane-vs-mbappe-ballon-dor-2026-stats", "/insights/ballon-dor-2026-date-voting-rules"],
  ["/clubs", "/league", "/european-clubs", "/insights/what-counts-as-a-career-goal"],
  ["/2026", "/seasons", "/career-timeline", "/goals"],
  ["/head-to-head", "/compare", "/international"],
  ["/glossary", "/methodology", "/assists", "/scoring-calculator", "/insights/why-assist-totals-differ", "/insights/totals-vs-scoring-rates"],
  ["/seasons/2011-12", "/seasons/2014-15", "/la-liga", "/insights/messi-2011-12-vs-ronaldo-2014-15-la-liga"],
  ["/seasons/2011-12", "/seasons/2013-14", "/champions-league", "/insights/messi-2011-12-vs-ronaldo-2013-14-champions-league"],
] as const;
export type RelatedContent = { path: string; title: string; kind: "article" | "comparison" };
const destinations = (entries: readonly Article[]): RelatedContent[] => [
  ...Object.entries(contentPages).map(([slug, page]) => ({ path: `/${slug}`, title: page.title, kind: "comparison" as const })),
  { path: "/seasons", title: "All years & seasons", kind: "comparison" },
  ...calendarYears.map(({ year }) => ({ path: `/seasons/${year}`, title: `Messi vs Ronaldo, ${year}`, kind: "comparison" as const })),
  ...seasons.map(season => ({ path: `/seasons/${season.slug}`, title: `Messi vs Ronaldo, ${season.label}`, kind: "comparison" as const })),
  ...entries.map(article => ({ path: `/insights/${article.slug}`, title: article.title, kind: "article" as const })),
];
export function relatedContent(path: string, limit = 4, entries: readonly Article[] = articles): RelatedContent[] {
  const topicPath = path.startsWith("/seasons/") && !contentTopics.some(topic => (topic as readonly string[]).includes(path)) ? "/seasons" : path;
  const topics = contentTopics.filter(topic => (topic as readonly string[]).includes(topicPath));
  const editorial = entries.find(article => path === `/insights/${article.slug}`)?.relatedSlugs ?? [];
  const candidates = destinations(entries).filter(item => item.path !== path).map(item => ({
    ...item, score: topics.filter(topic => (topic as readonly string[]).includes(item.path)).length + (editorial.includes(item.path.replace("/insights/", "")) ? 10 : 0),
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const first = candidates[0];
  const otherKind = candidates.find(item => item.kind !== first?.kind);
  const ordered = [...(first ? [first] : []), ...(otherKind ? [otherKind] : []), ...candidates.filter(item => item !== first && item !== otherKind)];
  const fallback = path.startsWith("/insights/") && !ordered.length ? destinations(entries).filter(item => item.path !== path && (item.kind === "article" || item.path === "/compare")) : [];
  return [...ordered, ...fallback].slice(0, Math.max(0, limit)).map(({ path, title, kind }) => ({ path, title, kind }));
}
