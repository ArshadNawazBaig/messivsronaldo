# Dutch Ballon d’Or page: published correction, 10 October 2026

The [affected page](https://messivsronaldo17.com/nl/insights/ballon-dor-2026-date-voting-rules) now uses the date-focused Dutch title and description, an explicit ceremony-date summary, and the sourced facts table before the analysis. Published through the production CMS at **2026-10-10 08:19:11 UTC** (13:19 Pakistan time), revision **1 → 2**. No application deployment was needed.

## Evidence and limits

The supplied exports compare **23–29 September** with **30 September–6 October 2026**, filtered to this exact URL and Web search.

| Page metric | Earlier week | Later week |
| --- | ---: | ---: |
| Impressions | 668 | 3 |
| Clicks | 3 | 0 |
| CTR | 0.45% | 0% |
| Average position | 8.33 | 10.33 |

The impression decline is **99.55%**, displayed as 100% in the recommendation. The later position is based on only three impressions; it cannot establish a uniform two-position ranking decline across the lost queries.

The 32 query rows total 526 earlier impressions and zero later impressions. Countries and Devices also total 526 earlier impressions and zero later impressions, so these breakdowns do **not** reconcile with Pages.csv. They are useful for understanding the visible demand, not a replacement for page totals. Search appearance.csv contains no data rows; there is no daily chart in this export.

The two leading queries, “wanneer is ballon d or uitreiking 2026” and “wanneer is de ballon d or uitreiking 2026”, account for 349 of the visible earlier impressions. The Netherlands contributes 438 and Belgium 77; mobile contributes 488. The clear search intent is the ceremony date.

The owner confirmed that URL Inspection reports **“URL is on Google.”** Live checks found HTTP 200, index/follow, a self-referencing Dutch canonical, nine language alternates plus x-default, an allowed robots path and an existing sitemap entry. This is not evidence of a current noindex or missing-page problem. A request using a Googlebot user-agent also received the corrected HTML; this does not substitute for Google's own crawl report.

## Verified publishing problem

The repository already contained a better Dutch title and description from 7 October. Production was serving a **CMS override published on 1 October**, with the older title “Ballon d’Or 2026 uitgelegd: datum, stemregels en het beoordelen van voetbal” and a description about tactical analysis. `mergePublished` correctly gives a saved CMS publication precedence over the built-in article; changing the seed alone cannot update this published version.

The ceremony date was present in the summary, but the detailed facts table followed 77 document blocks. On a 390 × 844 mobile viewport without JavaScript, its top was approximately **13,484 px** down the page. It now starts at approximately **1,575 px**, ahead of the long analysis.

This content mismatch was a concrete issue to correct. The exports do not prove that it caused the entire impression drop or identify the day the decline began. Impression recovery has not yet been measured.

## Published changes

- Title/H1: **Wanneer is de Ballon d’Or 2026? Datum en stemregels**. This matches the corrected Dutch repository title.
- Description: **De Ballon d’Or 2026 wordt op 26 oktober in Londen uitgereikt. Bekijk de datum, beoordelingsperiode en stemregels met officiële bronnen.**
- Summary now explicitly states Monday 26 October 2026, London Palladium Theatre, the judging window and the journalists' vote.
- Moved the existing facts heading, table and review note to the beginning of the body. Rechecked the facts and dated that note 10 October.

The URL, original publication date of 27 September, every analysis block, all table cells and source links, and the cover image were preserved. The normal CMS API enforced the expected revision and invalidated article/index caches. Article structured data and sitemap lastmod now show the actual publication update time. All **100 other CMS records** were unchanged at verification.

Date, venue and voting details were checked against [UEFA's ceremony announcement](https://www.uefa.com/ballondor/news/02a5-20bba5196317-e0e34001e13b-1000--2026-ballon-d-or-ceremony-date-and-host-city-announced/), [UEFA's nominees and venue announcement](https://www.uefa.com/uefachampionsleague/news/02a9-218b019cbca5-cb4b9be51c4b-1000--2026-ballon-d-or-awards-nominees-revealed/) and [France Football's regulations](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy).

## Validation and records

Production browser checks passed on desktop and mobile without JavaScript and on mobile with JavaScript: status, Dutch language, title/H1, description, social descriptions, canonical, language alternates, Article schema, publication dates, summary, sourced table, table order, contents anchor and viewport width. The Dutch article index and both related Ballon d’Or articles link to this URL with its corrected title. The sitemap contains the URL once with `2026-10-10T08:19:11.192Z` as lastmod.

The [reviewed content patch](../content/search-console-2026-10-10/nl-ballon-dor-recovery.json) is tracked. Before/after CMS content, the prepared publication command, API receipt, verification scripts/results and screenshots are retained locally under `.artifacts/nl-ballon-recovery-2026-10-10/`. The temporary publisher session was revoked. To reverse the editorial change, republish the backed-up draft through the CMS using the current revision; do not restore an old database wholesale.

Future changes to this page should be made in the CMS. Editing only `src/lib/article-features/` or translation catalogs will not replace its saved CMS publication.

## Search Console follow-up

Use URL Inspection on the same URL and select **Request indexing** once to ask Google to recrawl the revised page. This account action was not performed here. Google's [recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) says crawling can take days to weeks and repeated requests do not accelerate it.

After Google has recrawled, compare complete seven-day periods for this exact page, its Dutch date queries, the Netherlands/Belgium and mobile. Export the daily chart as well as dimensions if the decline persists. Do not compare a partial current day with a complete week. Recovery is not guaranteed; Google's [traffic-drop guidance](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops) recommends assessing changes over subsequent weeks.
