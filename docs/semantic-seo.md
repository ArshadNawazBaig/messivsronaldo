# Semantic SEO

Implemented 27 September 2026. The purpose is to make the existing football
content easier to understand and navigate, for readers and search engines.

## Page subjects and navigation

- Comparison H1s use descriptive, translated page titles. Each page identifies
  the players, statistic or competition instead of relying on an editorial slogan.
- `PageContext` emits a localized WebPage (or appropriate subtype) and visible
  breadcrumb navigation. Its BreadcrumbList uses exactly those visible labels and URLs.
- Player identities retain one canonical `#person` ID across languages; their
  profile links are localized. These are independent statistical profiles, not
  claims that the players own or endorse this publication.
- Datasets and articles link back to their WebPage; comparisons identify their
  actual players. Articles explicitly declare player subjects only where relevant.
  The Kane–Mbappé and Ballon d’Or contender articles are not mislabeled as
  Messi–Ronaldo comparisons.
- Article publication and evidence-review dates are preserved. Breadcrumb or
  schema changes do not claim that historical statistics have been freshly verified.

## Definitions and topic links

- `/glossary` explains all 21 career metrics using the same definitions as the
  comparison catalog. It contains no copied totals that can drift from the database.
- Its visible definition list and DefinedTermSet schema use the same translations.
  `Dataset.variableMeasured.propertyID` links each metric to its glossary definition.
  DefinedTermSet is descriptive vocabulary, not a promise of a Google rich result.
- Comparison footers link to the relevant definition. Methodology, the reading
  menu, footer, search and HTML sitemap also link to the glossary.
- Historical articles link to their corresponding calendar years and club-season
  archive pages. Related links are real HTML anchors, present without JavaScript.

## Indexing and maintenance

- All eight glossary URLs use self-canonicals, reciprocal language alternates and
  the existing XML sitemap. There are no new filter URLs or private indexable pages.
- Semantic markup uses the existing data and source cutoffs; it does not change
  totals, conceal evidence, fabricate author credentials or add keyword lists.
- Continue verifying new match records and reviewing date-sensitive articles.
  Good markup cannot compensate for inaccurate or outdated football information.

## Validation and measurement

Unit tests cover localized entity references, glossary definitions, topic links
and sitemap registration. Browser tests check no-JavaScript output in all eight
languages, matching visible/schema breadcrumbs, client navigation, responsive
layouts and accessibility in both themes.

After release, inspect `/glossary`, `/free-kicks`, a player profile and a year page
in Google Search Console URL Inspection. Use Google's Rich Results Test for
supported types such as BreadcrumbList and Article; a valid WebPage or
DefinedTermSet does not imply rich-result eligibility. Keep the existing
`https://messivsronaldo17.com/sitemap.xml` submission; its content updates automatically.

Measure non-brand impressions, clicks, CTR and average position by page, query,
country and language over comparable 28-day periods. Rankings, rich results and
AI citations are not guaranteed, and no Search Console submission is performed
by this code.

## Primary guidance consulted

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google breadcrumb guidance](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Google article guidance](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Schema.org DefinedTermSet](https://schema.org/DefinedTermSet)
