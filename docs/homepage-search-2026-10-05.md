# Homepage search work — 5 October 2026

The target audience is worldwide English searches, confirmed by the owner. The
homepage at https://messivsronaldo17.com is the primary destination for both
**messi vs ronaldo** and **ronaldo vs messi**. Both queries ask for the same player
comparison; the existing goals, assists, competition and awards pages serve more
specific questions.

## Evidence and baseline

- The live homepage returns HTTP 200, allows indexing, has a self-referencing
  canonical URL, one H1, reciprocal language alternatives, server-rendered
  statistics and structured data. Its robots file permits public crawling.
- The XML sitemap contains 1,072 public URLs. The existing indexability audit
  passed on 149 sampled URLs. These checks establish technical eligibility;
  they do not establish Google's selected canonical, indexing or ranking.
- The [26 September report](seo-research-2026-09-26.md) records four impressions
  for `messi vs ronaldo` at average position 70.5 in a supplied seven-day export.
  Exact dates and page/country/device dimensions were unavailable. This is a
  small historical observation, not a current rank. The separate 28 September
  query export lacks average positions and a reporting period.
- Current search research surfaced dedicated statistical comparisons, including
  [Messi vs Ronaldo App](https://www.messivsronaldo.app/). Career output,
  competition splits and scoring rates are established expectations. Existing
  specialist coverage means that changing a title alone is unlikely to make
  this site distinctive. Search-tool results were not treated as Google ranks.

## Implemented

- Homepage title: **Messi vs Ronaldo: Career Stats, Goals & Trophies**. The
  description uses the actual published statistical cutoff. The title remains
  accurate across calendar years.
- A visible **Ronaldo vs Messi: how do their records compare?** section, placed
  before tools and articles, adds an HTML summary of career goals, assists,
  goals per appearance, Champions League goals, World Cup goals and Ballon d'Or
  awards. Each statistic links to its detailed comparison. Competition rows
  retain their own coverage dates; awards retain their edition boundary.
- The explanation shows both scoring rates and explains the effect of match
  count and the remaining limits of the comparison. Values come from the same
  published data as the main comparison and API.
- Related-reading sections link to the homepage using its descriptive title.
  The existing keyword-specific pages retain their own identities and URLs.
- The homepage sitemap modification date includes this editorial revision,
  separately from the statistical cutoff. All nine language catalogs include
  the new text.
- The sitemap browser check validates every baseline URL and rejects duplicate
  URLs while permitting additional articles from the publishing database.

## Measure next

1. In the owner's [Search Console](https://search.google.com/search-console),
   inspect `https://messivsronaldo17.com/`. Record index status, Google's selected
   canonical, last crawl, and the live-test result. Confirm the submitted sitemap
   is `https://messivsronaldo17.com/sitemap.xml`. Request a homepage recrawl after
   the deployment if the inspected copy is old.
2. In Performance → Search results, choose Web and compare the most recent
   complete 28 days with the preceding 28 days. Keep countries unrestricted for
   the worldwide goal. Use this query regex for the two exact phrases:

   ```text
   (?i)^(messi vs ronaldo|ronaldo vs messi)$
   ```

   Export clicks, impressions, CTR and average position; inspect Pages to learn
   which URL appears. Save the date range, search type, country/device filters
   and export date alongside the file. Review countries and devices separately
   when volume supports it. A global average is not a fixed position everywhere.
3. Review a separate broader phrase report with
   `(?i)(messi.*ronaldo|ronaldo.*messi)` to identify specific questions already
   earning impressions. Match goals queries to `/goals`, assists to `/assists`,
   trophies to `/honours`, and tournament queries to the corresponding page.
   Inspect query-level page overlap before merging pages or changing canonicals.
4. Check Search Console's mobile Core Web Vitals and Page indexing reports.
   Test live ad behavior as part of performance work. Local browser and
   accessibility checks are not real-user Core Web Vitals measurements.

Current Search Console access or a fresh export is required to complete that
measurement. No indexing submission or ranking increase is claimed by this
code change.

## Editorial and promotion priorities

Keep match updates and source corrections reliable. Use the existing scoring
calculator and historical comparisons to publish useful original analysis:
equal minutes versus career totals, full La Liga careers versus their shared
Spanish seasons, or the impact of assist definitions. Prefer a sourced answer
to an observed reader question over another generic comparison article.

Prepare a small outreach list of football writers, fan publications and data
creators who could use a specific calculation or chart. Share the relevant
comparison and its counting rules when outreach is authorized. Earn editorial
citations through useful work; do not buy ranking links or mass-publish
keyword variants. No outreach was sent during this task.

Review progress after several weeks of new data, then choose the next change
from indexing status, query/page performance and reader needs. There is no
fixed timetable or guaranteed position for these competitive phrases.

## References

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): crawlable content, useful pages, promotion and variable time to impact.
- [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link): concise, descriptive titles that agree with visible content.
- [Google Search Console guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start): URL inspection, sitemap status and query/page/country reporting.
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies): keyword stuffing, doorway abuse and link spam.

Validation receipts are kept in `.artifacts/home-search-2026-10-05/`. See the
deployment record in `RAILWAY_DEPLOYMENT.md` for production status.
