import type { Article } from "./article-types";
import { articles } from "./articles";
import { contentPages } from "./content-pages";
import { calendarYears } from "./data";
import { seasons } from "./seasons";
import { calendarYearTitle } from "./archive-summary";
import { clubSeasons, clubSeasonTitle } from "./club-seasons";

export const discoveryUpdated = "2026-10-06";
// CMS articles only become destinations in a language where they are published.
// These relationships connect their explanations to the maintained record pages.
export const articleTopicLinks: Record<string, readonly string[]> = {
  "messi-ronaldo-free-kick-records": ["/free-kicks", "/glossary", "/insights/what-counts-as-a-career-goal"],
  "messi-ronaldo-penalty-records": ["/penalties", "/goals", "/insights/what-counts-as-a-career-goal"],
  "messi-ronaldo-hat-tricks": ["/hat-tricks", "/international", "/champions-league"],
  "messi-ronaldo-la-liga-records": ["/la-liga", "/seasons/2017-18", "/club-stats"],
  "messi-ronaldo-individual-awards": ["/ballon-dor", "/golden-boots", "/honours"],
  "messi-ronaldo-team-trophies": ["/honours", "/ballon-dor", "/methodology"],
  "messi-ronaldo-career-appearances": ["/compare", "/scoring-calculator", "/glossary"],
  "messi-ronaldo-2017-stats": ["/seasons/2017", "/club-stats/2017-2018", "/seasons"],
  "messi-goals-2009": ["/seasons/2009", "/club-stats/2008-2009", "/players/messi"],
  "messi-ronaldo-2026-goals-comparison": ["/2026", "/seasons/2026", "/goals"],
  "messi-career-goals": ["/players/messi", "/goals", "/insights/what-counts-as-a-career-goal"],
  "messi-stats-career-guide": ["/players/messi", "/goals", "/assists"],
  "ronaldo-stats-career-guide": ["/players/ronaldo", "/goals", "/assists"],
  "messi-vs-ronaldo-stats-guide": ["/compare", "/goals", "/assists", "/methodology"],
  "messi-final-match-argentina-2026": ["/players/messi", "/international", "/insights/messi-retirement-argentina-inter-miami-future"],
  "messi-retirement-argentina-inter-miami-future": ["/players/messi", "/international", "/clubs", "/insights/messi-final-match-argentina-2026"],
  "cristiano-ronaldo-retirement-portugal-al-nassr-future": ["/players/ronaldo", "/international", "/clubs"],
};
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
  ["/club-stats", "/seasons", "/clubs", "/league"],
] as const;
export type RelatedContent = { path: string; title: string; kind: "article" | "comparison" };
const destinations = (entries: readonly Article[]): RelatedContent[] => [
  { path: "/players/messi", title: "Lionel Messi profile", kind: "comparison" },
  { path: "/players/ronaldo", title: "Cristiano Ronaldo profile", kind: "comparison" },
  ...Object.entries(contentPages).map(([slug, page]) => ({ path: `/${slug}`, title: page.title, kind: "comparison" as const })),
  { path: "/seasons", title: "All years & seasons", kind: "comparison" },
  { path: "/club-stats", title: "All club seasons", kind: "comparison" },
  ...clubSeasons.map(season => ({ path: `/club-stats/${season.slug}`, title: clubSeasonTitle(season), kind: "comparison" as const })),
  ...calendarYears.map(({ year }) => ({ path: `/seasons/${year}`, title: calendarYearTitle(year), kind: "comparison" as const })),
  ...seasons.map(season => ({ path: `/seasons/${season.slug}`, title: `Messi vs Ronaldo, ${season.label}`, kind: "comparison" as const })),
  ...entries.map(article => ({ path: `/insights/${article.slug}`, title: article.title, kind: "article" as const })),
];
export function relatedContent(path: string, limit = 4, entries: readonly Article[] = articles): RelatedContent[] {
  const topicPath = path.startsWith("/seasons/") && !contentTopics.some(topic => (topic as readonly string[]).includes(path)) ? "/seasons" : path;
  const topics: readonly string[][] = [
    ...contentTopics.map(topic => [...topic]),
    ...entries.filter(article => articleTopicLinks[article.slug]).map(article => [`/insights/${article.slug}`, ...articleTopicLinks[article.slug]]),
  ].filter(topic => topic.includes(topicPath));
  const editorial = entries.find(article => path === `/insights/${article.slug}`)?.relatedSlugs ?? [];
  const candidates = destinations(entries).filter(item => item.path !== path).map(item => ({
    ...item, score: topics.filter(topic => (topic as readonly string[]).includes(item.path)).length
      + (editorial.includes(item.path.replace("/insights/", "")) ? 10 : 0)
      + (articleTopicLinks[item.path.replace("/insights/", "")]?.includes(path) ? 4 : 0)
      + (articleTopicLinks[path.replace("/insights/", "")]?.includes(item.path) ? 4 : 0),
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const first = candidates[0];
  const otherKind = candidates.find(item => item.kind !== first?.kind);
  const ordered = [...(first ? [first] : []), ...(otherKind ? [otherKind] : []), ...candidates.filter(item => item !== first && item !== otherKind)];
  const fallback = path.startsWith("/insights/") && !ordered.length ? destinations(entries).filter(item => ["/compare", "/methodology", "/glossary"].includes(item.path)) : [];
  return [...ordered, ...fallback].slice(0, Math.max(0, limit)).map(({ path, title, kind }) => ({ path, title, kind }));
}
