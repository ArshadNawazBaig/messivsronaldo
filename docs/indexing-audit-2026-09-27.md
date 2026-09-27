# Indexing audit — 27 September 2026

## Evidence and scope

The supplied Search Console export contains **97 “Crawled — currently not indexed”** URLs and **52 “Discovered — currently not indexed”** URLs. The exact 149 URLs are retained in [indexing-urls-2026-09-27.json](./indexing-urls-2026-09-27.json). The recorded last crawl for the first group is 22 September, before the site's later content changes.

A direct production audit of all **712 sitemap URLs** found no current HTTP errors, noindex directives, missing self-canonicals, missing titles, missing main content, incorrect HTML language, or missing sitemap/hreflang targets. Every reported URL was included. Production robots.txt allows public pages and excludes private admin/API routes. This is evidence of current technical eligibility, **not evidence that Google has indexed a page or selected its declared canonical**.

The statuses in the screenshot are not a diagnosis of a site bug. “Discovered” means Google knows the URL but has not crawled it; “Crawled” means it crawled the page but has not indexed it. Only Search Console URL Inspection can show Google's stored crawl and canonical decisions for each page. See [Google's Page indexing report documentation](https://support.google.com/webmasters/answer/7440203?hl=en).

## Changes

- **Language discovery:** the initial HTML previously contained language alternate annotations, but the language menu's links appeared only after interaction. Following ordinary HTML links from the homepage reached 89 English pages; the other 623 pages depended on other discovery mechanisms. Added visible, native-language footer links to each page's eight language versions. The existing self-canonicals, translations and reciprocal hreflang annotations are retained. [Google recommends links between language versions](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
- **Calendar-year content:** individual archive pages now include sourced, server-rendered tables for goals, assists, contributions, appearances, minutes and scoring rates in all four scopes. Previously the initial table displayed just one selected statistic. Each year now links to its own source and adjacent years, and explains which subtotals overlap. Zero appearances/minutes produce unavailable rates rather than fabricated zero rates.
- **Shared Spanish seasons:** both La Liga and Champions League figures now appear in the initial HTML with their own goals, appearances and scoring rates, sources and adjacent-season navigation. The interactive comparison still works.
- **Historical captions:** completed years no longer carry the unrelated “2026 is incomplete” table caption. The warning remains on the current year and all-years view. The year-to-date introduction follows the published snapshot year.
- **Translations:** new content is translated into all eight supported languages. Historical football totals and their data cutoff were preserved.
- **Regression checks:** added repeatable HTML indexability and link-reachability auditing, archive calculation checks and browser tests. Existing sitemap tests now derive the expected count from the public page catalog instead of stale fixed counts. Lint excludes generated local audit/preview artifacts.

No pages were removed or marked noindex to make the Search Console totals look smaller. No duplicate keyword pages, artificial publication dates or indexing-service submissions were added.

## Validation and deployment

Deployed to [messivsronaldo17.com](https://messivsronaldo17.com) on 27 September 2026 using production deployment `dpl_8KkvrwTvhcN3sqGYqNcin9CtkP5W`.

- Production build, TypeScript, lint and diff checks pass.
- Unit suite: 93 passed; one optional isolated-Postgres integration test skipped because its test database was not configured.
- 38 distinct desktop/mobile browser checks pass across the initial run and the corrective rerun. These cover initial HTML in all eight languages, language switching, filters, canonicals, structured content and accessibility. The accessibility check caught insufficient visual distinction for source links; explicit underlines fixed it, and all 16 affected browser checks passed on rerun.
- Local production-build audit: 712/712 pages pass; all 149 reported URLs included. Ordinary HTML links from the homepage reach 712/712 pages, up from 89/712 before the changes.
- **Final live audit at 14:19 UTC:** 712/712 URLs pass with no detected technical failures, and ordinary HTML links reach all 712 pages. All 149 supplied URLs pass; see the [per-URL verification CSV](./indexing-verification-2026-09-27.csv). Raw before/after reports are saved locally in `.artifacts/indexability-all-before.json` and `.artifacts/indexability-production-after.json`.
- Live browser smoke checks confirm the new summaries and eight language links on the canonical domain with no page errors. HTTP, www, English-prefix and trailing-slash aliases redirect permanently; an unknown URL returns 404.

## Repeat the audit

```sh
# The 149 supplied URLs
python3 scripts/audit-indexability.py --output .artifacts/indexability-reported.json

# Every canonical page, plus HTML-link reachability from the homepage
python3 scripts/audit-indexability.py --all --output .artifacts/indexability-all.json

# A local production build with production canonical/indexing settings
python3 scripts/audit-indexability.py --all --origin http://localhost:3012 \
  --output .artifacts/indexability-local.json
```

These commands only read public pages. Reports include HTTP status, canonical, robots directives, language, title, initial-HTML main text, internal links, response size and elapsed time. Response timing is from the audit client; it is not a Core Web Vitals measurement. Word counts describe the page and are not treated as an indexing threshold.

## Search Console follow-up

There is no authenticated Search Console connection in this workspace, so no sitemap submission, indexing request or validation action is claimed.

1. Confirm `https://messivsronaldo17.com/sitemap.xml` is submitted and its fetch status is **Success**. All 712 canonical language URLs are already in this sitemap; do not submit redirected aliases or fragment/filter variants.
2. Use **URL Inspection → Test live URL** on `/`, `/goals`, `/assists`, `/2026`, `/seasons`, `/seasons/2012`, `/seasons/2011-12` and representative translated URLs. Confirm Google's live fetch sees the new content and allows indexing, then request indexing for the highest-priority pages within the available quota.
3. The screenshot already shows validation **Started** for both groups. Let the existing run finish; Google says not to restart validation while it is running. If it fails, inspect the specific reported URLs before requesting another validation. [Validation instructions](https://support.google.com/webmasters/answer/7440203?hl=en).
4. Monitor Google's **last crawl date**, **Google-selected canonical**, **sitemap discovery**, and **Crawl stats / Host status**. A continuing “Discovered” status warrants checking crawl demand and host availability; a newly recrawled “Crawled” status warrants reviewing the particular page's usefulness and distinctness. Do not infer the reason from the status alone.
5. Maintain sourced updates and useful analysis. Search Console can take days or weeks to reflect recrawling; there is no guaranteed completion date or guarantee that every eligible page will be indexed. Repeated requests for the same URL do not speed crawling. [Google's recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

The Google Indexing API is not a bulk-indexing mechanism for this football site; it is restricted to eligible job-posting and livestream pages. Use the sitemap and URL Inspection workflow. [Supported Indexing API content](https://developers.google.com/search/apis/indexing-api/v3/using-api).

## Follow-up: Dataset license warning

The subsequent Search Console screenshot flags a non-critical missing `license` property in the homepage's Dataset markup. The shared `comparisonDataset` generator now points to the existing, localized `/terms#using-the-content` section. This applies to the homepage and comparison datasets in all eight languages (144 pages). The existing reuse permissions and third-party restrictions are retained; no Creative Commons license or new reuse rights were introduced. Google supports a license URL or a custom-license object in [Dataset structured data](https://developers.google.com/search/docs/appearance/structured-data/dataset#dataset).

The production build, lint, unit suite and two focused desktop/mobile browser checks pass. Both local and live rendered-HTML audits verified all 144 Dataset license references and all eight destination sections, with no failures. Production deployment: `dpl_5WUoZ7R1BbcHX7hHAaM6CVXqcLkp`. The live report is saved in `.artifacts/dataset-license-production.json`. Use **Data sets → Missing field 'license' → Validate fix** for this specific warning. This is separate from the page-indexing validations already running. The Search Console warning will require Google's reassessment; adding the property does not itself establish that the pages are indexed.
