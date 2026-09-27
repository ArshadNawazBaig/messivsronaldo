# Search and answer experience

The public `/answers` page provides ten searchable, server-rendered answers in
all eight languages. Values come from the published match ledger. A missing
statistic is omitted, not changed to zero. Each answer identifies its scope,
cutoff, underlying references, and full comparison.

`Scope.updatedThrough` advances only for scopes affected by a new published
match. Goal-type answers retain the baseline date. Comparison Dataset markup
uses the same visible metrics, rounding, definitions, and source references.
Player entities share stable IDs across language variants.

Topic relationships in `src/lib/content-discovery.ts` supply related comparisons
and articles. Explicit `Article.relatedSlugs` take priority; links to the current
page are excluded. Article contents links are available on every article.

## Editorial maintenance

Admin → Content review checks the current published dataset on each page load.
It identifies missing article references, invalid related slugs, missing topic
links, optional opening-summary improvements, and scheduled review deadlines.
Match coverage older than seven days is a review prompt, not proof of an error.
Core-stat and goal-type cutoffs are reported separately.

Set `Article.reviewAfter` when a known event warrants another editorial review.
The Ballon d’Or 2026 articles are scheduled for review on 26 October 2026.
Checks do not publish prose, change source-review dates, call an AI service, or
modify match records. Review claims and sources before changing article dates.

## Discovery and measurement

The shared public-page registry includes `/answers` in the visitor directory and
XML sitemap, with eight localized URLs and reciprocal language alternates.
Sitemap content revisions are separate from the statistics' coverage dates.
Private admin pages remain excluded.

Measure outcomes with Search Console queries, impressions, clicks, CTR, and
position; compare comparable reporting periods. Bing's AI Performance report can
help monitor citations if the site is verified there. No ranking, featured
snippet, or AI citation is guaranteed. These changes implement search experience,
editorial automation, and clear answers; they do not add an AI publishing agent.

References: [Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
and [Bing AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c).
Google does not require special AI markup or use `llms.txt` for search ranking.
