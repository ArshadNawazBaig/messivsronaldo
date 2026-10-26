# Search visibility changes prepared on 26 October 2026

The local implementation makes annual goals explicit, separates annual and career questions, and routes explanatory articles to the exact maintained statistics they discuss. It preserves the published-data model, canonical URLs, existing schema, CMS bodies and historical publication dates. **No production deployment, CMS publication or AdSense setting change was performed.**

The full rationale and priorities are in [the audit](../seo-audit-2026-10-26.md). The complete source/test diff is [implementation.patch](implementation.patch). These changes are already applied to this workspace; do not apply the patch a second time here.

The later screenshot follow-up is recorded in [indexing-followup.json](indexing-followup.json) and the audit's indexing-evidence section. It confirms working canonicalization, functional preview images and valid sitemap XML. The two reported content pages pass live technical checks; their current Google indexing state still requires individual URL Inspection. Five French translation values were also corrected from pricing terminology (`tarif`/`tarifs`) to statistical ratios. This wording-only follow-up passed JSON parsing, the existing client-message consistency check and `git diff --check`; it postdates the full build/browser checks below and is not a diagnosed indexing remedy. No redirect or robots changes were made.

## Changes and risks

**Risk: an annual answer must not accidentally use lifetime totals or a different cutoff.** [comparison-copy.ts](../../src/lib/comparison-copy.ts) now reads the `/2026` intro and answer from `data.scopes["2026"]`, while the career explanation uses `data.scopes.career`. `/goals` and `/compare` add the annual question with a `/2026` link. `/2026` links back to career goals and the update log. No statistical values are hardcoded, and the new answer avoids an unconditional claim that 2026 is still underway.

**Risk: new copy can display untranslated keys or overflow on mobile.** All nine `src/lib/i18n/messages/*.json` catalogs contain the new answer keys and translations. `src/lib/i18n/client-message-keys.json` was regenerated through the existing build script. Native editorial review remains appropriate; the automated checks establish rendered values, links and layout rather than native fluency.

**Risk: an article link must retain its language and point to an existing page.** [content-discovery.ts](../../src/lib/content-discovery.ts) adds `articleComparisonLink`, resolving the first existing `articleTopicLinks` relationship against registered comparison destinations. The [article template](../../src/app/%5Blocale%5D/insights/%5Bslug%5D/page.tsx) places that link below the summary and uses it for the main CTA. Calculator-preset articles preserve their calculator CTA; unmapped articles retain their fallback. Published CMS article text, author, publication date and review date remain unchanged by this navigation edit.

**Risk: sitemap edits must not imply that every page or statistic was updated today.** [public-pages.ts](../../src/lib/public-pages.ts) considers the explicit October 26 editorial revision only for `/2026`, `/goals` and `/compare`, including their localized entries. A later published dataset date takes precedence. Unrelated page dates are preserved.

**Risk: performance classifications can be mistaken for Google's indexing verdict.** [analyze-search-console.py](../../scripts/analyze-search-console.py) preserves the prior CLI/output keys and adds an optional artifacts directory, complete performance buckets, query heuristics, concentration and period summaries. Every URL's current Google index status remains unknown from the CSVs alone. Candidate query-to-page mappings are explicitly editorial suggestions. Domain-style `messivsronaldo` queries are navigational candidates without being attributed to this site's brand.

## Verification completed

| Check | Result and scope |
|---|---|
| ESLint | Passed after final application changes |
| TypeScript | `npm run typecheck` passed; final production build also passed TypeScript checking |
| Full unit suite | 204 passed, 1 skipped, 0 failed, 205 total |
| Final focused regression run | 15 passed after removing the year-in-progress clause |
| Production build | Passed using an isolated local SQLite database and nonindexable localhost origin |
| Existing browser suites | 14 passed on desktop and mobile Chromium: comparison/search, localized SSR, sitemap dates and prior SEO fixes |
| Targeted browser smoke | 22 page/JavaScript combinations passed: `/2026` in nine languages and a managed free-kick article in English/French, each with JavaScript on/off |
| Smoke details | Three annual-page answer headings, correct language, localized reciprocal link, no raw template placeholders, correct article links near summary and in CTA, synthetic body preserved, no overflow or page errors |
| Audit artifacts | JSON parsed, CSV coverage/totals verified, internal report links checked and `git diff --check` passed |

The first `npm test` attempt stopped at the existing pretest guard because the generated client-message manifest was stale. The normal `i18n:client` generation corrected it; the full suite then passed. No failing test was suppressed.

[preview-smoke.json](preview-smoke.json) records the targeted browser results. Synthetic CMS content exists only in the ignored isolated preview database; it is not a published article. Local baseline statistics differ from live updated statistics by design. The tests validate scope binding and rendering, not the current football record.

Live evidence in this directory covers 46 sampled page requests, all sitemap alternate sets, all nine HTML directories, crawler user-agent simulations, and eight mobile performance observations. It does not claim a complete HTTP crawl, actual crawler-network access or field Core Web Vitals.

## Reproduce the analysis

```sh
python3 scripts/analyze-search-console.py \
  --input /Users/arshadnawaz/Downloads/messivsronaldo17 \
  --output .artifacts/seo-audit-2026-10-26/recalculated-summary.json \
  --artifacts-dir .artifacts/seo-audit-2026-10-26/recalculated
```

The source hashes in [summary.json](summary.json) identify the exact files used. A later export at the same Downloads path can contain different data; compare hashes before calling it the same baseline.

## Release and account actions

1. Review the patch and deploy through the existing project workflow using the production origin and intended indexability configuration. Preserve the production database and its secrets. Do not deploy the isolated preview database or localhost environment values.
2. Check `/2026`, `/fr/2026`, `/fr/goals`, `/compare` and a published localized free-kick/penalty article in production HTML. Verify answers match the same visible dataset cutoff, both article links retain the locale, and core canonical/indexability remains correct. Ensure `/sitemap.xml` reflects meaningful editorial dates on the changed comparison routes.
3. Review [content-briefs.json](content-briefs.json) for subsequent snippet/content experiments. These are drafts, not mass publication instructions. Edit actual CMS records where present; seed-file edits can be masked by managed records.
4. The [Dutch ceremony draft](nl-ceremony-content-draft.json) is immediately time-sensitive. Recheck the first-party sources and current event state before publication. Upcoming wording expires at October 26, 20:00 UTC. Preserve the existing article body and publication history; change its review date only when a substantive update is published.
5. Apply the AdSense excluded-area configuration below, then verify live placements. Record actual deployment, CMS publication and account changes separately in [change-log.csv](change-log.csv). The prepared date is not the release date.

## AdSense action requiring account access

Risk: excluding prominent ad areas can reduce revenue. The measured problem is displacement of the core comparison, so protect those specific regions first.

In AdSense → Ads → edit messivsronaldo17.com → Excluded areas, locate and protect:

| Layout | Existing selectors |
|---|---|
| Homepage and comparison pages | `#page-introduction`, `#comparison` including toolbar, player cards and table |
| Articles | `#page-introduction`, `#article-summary`, `#peak-year-study`, `#article-opening-table` where present |

Inspect the selector AdSense actually saves and apply to the site. These are existing stable elements, not code-based exclusion directives. Google's excluded areas cover in-page Auto ads; overlay formats have separate controls. [AdSense instructions](https://support.google.com/adsense/answer/12626543?hl=en).

Repeat the same experiment after the settings take effect:

```sh
node scripts/measure-page-performance.mjs \
  --origin https://messivsronaldo17.com --paths /,/international \
  --runs 2 --ads allow --output .artifacts/seo-after-ads-allowed.json
node scripts/measure-page-performance.mjs \
  --origin https://messivsronaldo17.com --paths /,/international \
  --runs 2 --ads block --output .artifacts/seo-after-ads-blocked.json
```

Compare with the included laboratory baseline, then review real-user data separately. A deployment of the content changes alone does not resolve this account-controlled placement issue.
