# Search Console indexing investigation — 7 October 2026

**No current technical indexing blocker was found on the 33 supplied URLs. Google's reason for excluding them remains unconfirmed.** The public-page checks below establish eligibility, not actual indexing, historical Googlebot responses, or Google's selected canonical.

The owner supplied `Table.csv` and `Metadata.csv` from `/Users/arshadnawaz/Downloads/messivsronaldo17-2/`. Their contents are diagnostic evidence. The metadata identifies “Crawled - currently not indexed” and the site's XML sitemap; all 33 table rows have validation status `Failed`. The screenshot shows validation started on 23 September and failed on 5 October. The table's crawl dates are newer for some rows: eight on 6 October, 22 on 5 October, one on 2 October and two on 29 September. These are distinct report observations, not a single synchronized snapshot.

[Google's definition](https://support.google.com/webmasters/answer/7440203?hl=en#crawled) means Google fetched the URL but did not index it. The status alone does not identify a defect or require repeated crawl submissions. Failed validation means the requested issue check did not clear; it is not evidence of a penalty.

## What is affected

| Page group | URLs | Review priority |
|---|---:|---|
| Club-season details | 16 | Inspect representative historical and recent periods. |
| Calendar-year details | 11 | Inspect historical and current-year pages separately. |
| Tools directories | 2 | Review `/tools` and `/hi/tools` as useful navigation pages. |
| Milestone planner | 1 | Inspect `/ar/milestone-planner` and its rendered calculation. |
| Fan vote | 1 | Lower search priority than statistical answers. |
| Privacy and credits | 2 | Lower search priority; retain their visitor-facing role. |

31 URLs use language prefixes: Arabic 9, German 8, Hindi 5, Spanish 3, French 2, Portuguese 2 and Thai 2. The English URLs are `/tools` and `/vote`. This describes the affected sample; there is no indexed-versus-excluded denominator by language here to establish a language-specific failure rate.

None of these exact URLs appears in the saved 27 September list of 149 URLs. Comparing the old and new headline counts therefore cannot prove that the earlier exclusions have all been resolved.

## Live verification

Audit completed at **2026-10-07 10:28:40 UTC** against `https://messivsronaldo17.com`. The current sitemap contains **1,073 URLs**; this investigation fetched the 33 affected pages, followed by 17 supporting pages to check incoming links. It did not repeat a complete site crawl.

All 33 affected URLs:

- Return HTTP 200 without a redirect and permit Googlebot in the fetched robots.txt.
- Have no detected meta/header `noindex`, exactly one self-referencing canonical, and an entry in the live sitemap.
- Have the expected HTML language, a self hreflang annotation and alternate targets present in the sitemap.
- Include a title, description, one H1 and substantive main content in the HTML received without executing JavaScript.
- Have a verified incoming HTML link from at least one different, successfully fetched site page.

No exact duplicate titles, descriptions or main-text hashes were found **within each language in this 33-page sample**. This does not rule out semantic similarity, duplicates elsewhere, or Google's grouping of pages. No JSON-LD syntax errors were detected; this is not a rich-result eligibility assessment.

Four additional requests used a Googlebot user agent with no Accept-Language header: `/fr/seasons/2004`, `/ar/club-stats/2025-2026`, `/tools` and `/vote`. Each returned 200 with the same main text as the ordinary audit request. A user-agent simulation is not an authenticated Google crawl or a Search Console live test.

Per-URL evidence is saved in [indexing-verification-2026-10-07.csv](indexing-verification-2026-10-07.csv); the repeatable target list is [indexing-urls-2026-10-07.json](indexing-urls-2026-10-07.json). Raw response analyses, incoming-link checks and user-agent results are in `.artifacts/indexing-2026-10-07/`.

## Content observations and local correction

The season pages already contain translated statistical tables, source references, period navigation and arithmetic interpretation. There is no evidence here to call them empty, untranslated copies or JavaScript-only shells. Their common templates and third-party statistical inputs remain relevant to an editorial review of distinct usefulness, but that is a hypothesis about Google's selection, not an established cause.

The tools directory contains its tool links and explanation in the initial HTML. The Arabic planner includes a default calculation and assumptions. `/vote` includes its purpose, rules and publisher-set starting totals; current visitor totals load through JavaScript. These pages serve different purposes, so their text lengths should not be used as an automatic indexing threshold.

One reproducible translation omission was corrected locally: historical charts displayed **“Completed calendar year”** in English on translated pages. Added the label to all nine language catalogs and regenerated the client-message manifest. Eleven existing translation/catalog/routing checks passed, as did the manifest freshness check and `git diff --check`. This is a minor content correction, not an established indexing remedy. It has **not been deployed**.

No URLs, canonicals, indexing directives, sitemap membership, historical statistics or publication dates were changed.

## Owner-supplied URL Inspection evidence

During this investigation the owner supplied the stored inspection for `/fr/seasons/2004`:

| Field | Reported value |
|---|---|
| Sitemaps | Temporary processing error |
| Referring pages | `/es/seasons/2004`, `/ar/seasons/2004` |
| Last crawl | 29 September 2026, 12:04:19; timezone not supplied with the copied result |
| Crawled as | Googlebot smartphone |
| Crawl allowed | Yes |
| Page fetch | Successful |
| Indexing allowed | N/A |
| User-declared canonical | N/A |
| Google-selected canonical | N/A |

This establishes successful historical fetching and known referring pages for this URL. The N/A fields do not establish an explicit noindex directive or prove that the current canonical is missing. They leave those stored decisions unavailable. The publicly fetched current document has a self-canonical and allows indexing.

Google specifically defines **Temporary processing error in URL Inspection's Sitemaps field** as a reporting-system problem retrieving sitemap data; rerunning inspection may resolve it. It is not, by itself, a diagnosis of invalid sitemap XML. See the [URL Inspection documentation](https://support.google.com/webmasters/answer/9012289?hl=en). Check the separate Sitemaps report before treating this as an actual sitemap fetch/parse failure.

An additional live sitemap check returned HTTP 200 with `application/xml`, parsed the sitemap namespace correctly, and found 1,073 unique entries in 1,172,296 uncompressed bytes. All listed language alternate targets exist in the sitemap, include themselves and link back reciprocally. The French page is present with lastmod `2026-10-01`, later than its stored 29 September crawl. This lastmod is a site declaration, not proof that Google has fetched the revision. No sitemap rewrite or splitting is indicated by these checks. Receipts: `.artifacts/indexing-2026-10-07/sitemap-validation.json` and `sitemap.xml`.

The owner's live URL test and the separate sitemap status/last-read date were requested and have not yet been provided.

## Next diagnostic step

In Search Console, inspect these exact URLs using the **stored Page indexing report first**, then compare with **Test live URL**:

1. `https://messivsronaldo17.com/fr/seasons/2004` — older reported crawl.
2. `https://messivsronaldo17.com/ar/club-stats/2025-2026` — recent club-season crawl.
3. `https://messivsronaldo17.com/de/seasons/2026` — current-year content.
4. `https://messivsronaldo17.com/tools` — English utility directory.

For the remaining examples, record last crawl, crawler type, crawl allowed, page fetch, indexing allowed, referring sitemap/page, and user-declared and Google-selected canonicals, including any unavailable fields. Inspect the crawled HTML when available. The stored report can reveal what Google previously saw; a successful live test does not establish indexing or reproduce Google's canonical selection.

If the stored crawl shows a fetch failure or missing content, investigate that specific historical response and the corresponding server logs. If Google selected a different canonical, compare those two pages before changing canonical annotations. If crawling and indexing are allowed and the stored content matches the current page, prioritize editorial usefulness on important archive pages and monitor subsequent crawl/index changes. Lower-priority privacy, credits and poll pages do not need forced indexing just to clear a report count.

Keep the existing sitemap submitted. Avoid restarting validation with no diagnosed change or repeatedly requesting the same unchanged URL. After a meaningful published correction, inspect the affected live page and use the normal Search Console workflow. [Google's recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) says repeated requests do not accelerate crawling and inclusion is not guaranteed.

No authenticated Search Console action, indexing request, sitemap submission or production deployment was performed during this investigation.

## Repeat this focused check

```sh
python3 scripts/audit-indexability.py \
  --input docs/indexing-urls-2026-10-07.json \
  --output .artifacts/indexing-2026-10-07/recheck.json
```

Source-file SHA-256 receipts:

- `Metadata.csv`: `090147639499d9fdca84e9c43a8785e45485b83c9d03f270b7989136045ccd81`
- `Table.csv`: `53e30dc697a9c7d31020a8205dbab15c36b06d11811119ce6f743d270e8855df`
