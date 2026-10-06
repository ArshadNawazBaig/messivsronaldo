import type { Article } from "./article-types";
import assists from "./article-features/why-assist-totals-differ.json";
import rates from "./article-features/totals-vs-scoring-rates.json";
import counting from "./article-features/what-counts-as-a-career-goal.json";
import calendar from "./article-features/messi-2012-vs-ronaldo-2013-goals.json";
import league from "./article-features/messi-2011-12-vs-ronaldo-2014-15-la-liga.json";
import europe from "./article-features/messi-2011-12-vs-ronaldo-2013-14-champions-league.json";
import contenders from "./article-features/ballon-dor-2026-contenders-stats.json";
import strikers from "./article-features/kane-vs-mbappe-ballon-dor-2026-stats.json";
import voting from "./article-features/ballon-dor-2026-date-voting-rules.json";

const features = [assists, rates, counting, calendar, league, europe, contenders, strikers, voting];

/** Keep established URLs, calculators and publication dates when revising a feature. */
export function withArticleFeature(article: Article): Article {
  const feature = features.find(item => item.slug === article.slug);
  if (!feature) return article;
  const citations = Array.from(new Map([...(article.citations ?? []), ...feature.citations].map(source => [source.url, source])).values());
  const updated = "updated" in feature && typeof feature.updated === "string" ? feature.updated : "2026-10-01";
  return { ...article, ...feature, citations, updated };
}
