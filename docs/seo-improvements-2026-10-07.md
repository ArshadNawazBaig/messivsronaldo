# The Rivalry SEO implementation progress

7 October 2026, Asia/Karachi. This follows the [production audit](seo-audit-2026-10-06.md) and the [owner’s Search Console baseline](search-console-analysis-2026-10-06.md). The changes below are implemented locally and have not been deployed. The original 74/100 assessment describes the earlier production version; it is not replaced with an unsupported 100/100.

## Improvements implemented

| Priority | Change | Reader and search benefit |
|---|---|---|
| HIGH | Ship the translations used by client components while retaining complete server catalogs. A generated manifest runs before development/build and is checked before tests. | Smaller localized documents without removing server-rendered content, translations, filters or language switching. |
| HIGH | Preload the current Arabic, Hindi or Thai font and use optional font display. | Late font downloads no longer need to move already visible answers and player cards. A slow first visit can retain the readable system font. |
| HIGH | Preserve distinct comparison descriptions after match imports, including the proper metric cutoff. | Resolves the generic-description defect affecting 45 live URLs across nine languages. |
| MEDIUM | Shorten the peak-year article title to “Messi 2012 vs Ronaldo 2013: Goals and Scoring Rates”; put the 91-versus-69 calendar-year answer first. | Makes the intent clearer on the supplied export’s highest-impression page, with 976 impressions and five clicks. CTR improvement remains a hypothesis. |
| MEDIUM | Add a reproducible peak-year rate table, formula, source links, downloadable CSV and jump to the existing calculator. | Readers can inspect and reuse the calculation, then test a different exposure. This is original arithmetic using published facts, not a new historical dataset. |
| MEDIUM | Make the Dutch ceremony title a date question and include 26 October 2026 and London in its description. Apply equivalent focused copy across the other languages. | Addresses observed date-query demand while retaining the voting guide and existing URL. [UEFA’s announcement](https://www.uefa.com/ballondor/news/02a5-20bba5196317-e0e34001e13b-1000--2026-ballon-d-or-ceremony-date-and-host-city-announced/) supports the date and city. |
| MEDIUM | Add international assist totals to the introduction, a Ronaldo assist question with counting rules, and an eleventh entry in the answer directory. | Answers an observed narrow query using the published international scope and its coverage date. |
| MEDIUM | Translate live coverage and incomplete-classification notices in all supported languages. | Makes the limits of the data understandable alongside the numbers. |
| MEDIUM | Place article summaries before covers, reserve image space, use responsive images and connect newer articles to relevant records. | Faster access to the answer, stable image loading and useful onward reading. |

The strong French and Spanish Kane–Mbappé article titles remain intact. No player totals, goal classifications, publication dates, URLs or ad-enablement settings were changed to make the audit look better. The two revised articles and changed answer pages have real editorial revision dates, separate from statistical cutoffs.

## Measured document reduction

Decoded homepage HTML from the same local dataset, before this improvement batch versus the completed copy/catalog work:

| Language | Before | After | Reduction |
|---|---:|---:|---:|
| French | 564,648 bytes | 430,412 bytes | 23.8% |
| Arabic | 612,981 bytes | 460,664 bytes | 24.8% |
| Thai | 703,709 bytes | 511,077 bytes | 27.4% |
| English | 343,686 bytes | 343,398 bytes | 0.1% |

These are uncompressed HTML measurements, not download-time claims. English already avoided shipping a translated catalog. The earlier isolated catalog-only comparison reduced Arabic HTML by 26.2% and Thai by 29.2%; the final figures above include the added content, font preloads and translated coverage notices. Tiny English differences are not a material optimization.

The font retest used cold Chromium contexts, an iPhone 13 viewport, 4× CPU slowdown, 150 ms configured network latency and 1.6 Mbps download throughput. Each visit observed seven seconds after DOM readiness, with ads absent from the local document. The Arabic homepage previously recorded CLS 0.2233, Thai 0.0458 and Hindi 0.0185. After the font change, all three recorded **CLS 0 in both runs**. Observed LCP ranges were Arabic 2.332–2.624 seconds, Hindi 2.216–2.236 seconds and Thai 2.468–2.680 seconds. This establishes the tested layout-shift fix; it does not establish uniformly faster LCP, a Lighthouse score, INP or a live field pass. Font download size and prioritization remain candidates for further performance work if production traces confirm them.

## Reproducible research

The visible table and `/api/research/peak-calendar-years` CSV use Messi’s 91 goals in 69 appearances in 2012 and Ronaldo’s 69 in 59 in 2013. The primary references are [UEFA on Messi’s Barcelona career](https://www.uefa.com/news/026c-12f331da0b70-64b0980c3700-1000--messi-leaves-barca-a-salute/) and [UEFA on Ronaldo’s 2013](https://www.uefa.com/uefachampionsleague/news/0211-0e8866833d94-86d200f75b0a-1000--cristiano-ronaldo-takes-2013-by-storm/).

The formula is recorded goals ÷ recorded appearances × selected appearances. At 50 appearances it gives 65.94 and 58.47 goals, calculated before rounding. The table states that this is an arithmetic scenario, with no adjustment for opposition, team strength or minutes per appearance. Both input samples cover January–December senior club and country matches. The CSV includes inputs, full-precision outputs, formula, references, revision date and limitations. Missing or zero exposure produces an unavailable rate rather than a fabricated value.

## Statistical freshness review

The authenticated production health check returned a healthy database, revision 6 and a daily job that ran on 6 October UTC. The job reported **partial coverage**; it was neither overdue nor stalled. A successful job run does not establish complete statistical coverage.

The 27 September Inter Miami result is corroborated by the [club’s Columbus recap](https://www.intermiamicf.com/news/match-recap-inter-miami-cf-falls-against-columbus-crew-on-the-road), which also identifies its next club match as 10 October. Portugal’s team fixtures on 1 and 4 October are not evidence that Ronaldo made appearances: [RTP’s Denmark match coverage](https://www.rtp.pt/noticias/desporto/portugal-sem-ronaldo-bate-dinamarca-e-jesus-sauda-grupo-que-acredita-na-ideia-do-treinador_e1768915) and [post-Norway press-conference report](https://www.rtp.pt/noticias/selecao-nacional/abandono-de-ronaldo-nunca-foi-um-caso-e-ate-pode-ser-convocado-para-o-proximo-jogo_d1769585) describe his absence. No extra appearance or goal was imported from a team fixture alone.

**Remaining verification:** inspect the sync’s pending dates and reconcile any incomplete player appearances, minutes, assists and goal classifications against official match records. The reviewed sources do not certify every player match or every historical classification. Keep the existing scope-specific cutoffs until that reconciliation is complete.

## Remaining work by category

| Category | Completed improvement | Evidence or action still required |
|---|---|---|
| Technical SEO | Local crawl eligibility, metadata, language alternates, schema syntax and HTML reachability pass. | After deployment, crawl production and inspect representative URLs in Search Console for actual indexing and Google-selected canonicals. |
| On-page SEO | Distinct descriptions and focused copy on the priority date/peak-year pages. | Compare complete equal post-publication periods by page, query, country and device. Low CTR alone does not establish a title defect. |
| Content | Direct answers, primary references and a reproducible comparison. | Complete match-coverage reconciliation; maintain award announcements and grow useful original analyses. |
| E-E-A-T | Existing real editor/methodology information plus inspectable calculation sources. | Independent recognition and citations must be earned; code changes cannot manufacture them. |
| AEO | Answers visible before images, eleven searchable answers and explicit counting rules. | Observe actual question-query performance and search presentation after recrawling. |
| GEO | Explicit inputs, formula, limitations and a reusable download. | Record real citations or referrals; there is no guaranteed inclusion from an extra schema type. [Google’s AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) retains ordinary SEO requirements and does not require special AI markup. |
| Internal linking | Published-language-aware topic links and complete local HTML reachability. | Verify links against the larger live CMS inventory after deployment. |
| Performance | Smaller localized documents, reserved images and stable language-font loading. | Apply AdSense placement changes and measure the production experience, including interactions and field data. |
| Local SEO | Not applicable to this worldwide publication. | Do not invent locations or local services to produce a numeric score. |

## Account work and publication checks

1. **AdSense:** open Ads → the site’s Edit control → Excluded areas. Protect the header/intro, primary player comparison and its controls, and article headings/answer summaries from in-page insertions. Review both mobile and article previews, then apply the chosen account settings. Overlay formats have separate controls. The earlier live measurements of 0.351–0.377 homepage layout shift remain unresolved until the live ad experience is retested. [Google’s excluded-area instructions](https://support.google.com/adsense/answer/12626543?hl=en).
2. **Engagement measurement — NEEDS USER INPUT:** provide the chosen analytics provider and public property/tracking ID. Then verify page views, useful second-page visits and calculator interactions. Search Console does not measure time on site. No invented tracking ID was installed.
3. **Search Console — NEEDS USER INPUT:** provide Page indexing, representative URL Inspection results, Core Web Vitals and page-filtered query exports for the Dutch date guide, peak-year comparison, La Liga and French free-kick pages. The supplied performance dimensions cannot establish indexing or query-to-page attribution.
4. Deploy the tested changes through the project’s normal release process, record the publication time, and repeat the production crawl. Check the new CSV, language navigation, image loading and ads on the live site.
5. Measure real visits. The performance target is LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1 at the 75th percentile, assessed separately for mobile and desktop. Laboratory visits cannot establish that field result. [Core Web Vitals definitions](https://web.dev/articles/vitals).

The [prioritized page CSV](search-console-priorities-2026-10-06.csv) records implemented local work and remaining measurement tasks. Its homepage row now uses the canonical HTTPS export record, 22 clicks and 198 impressions; the HTTP and www rows are separate source records.

## Verification receipts

The local crawl covered **1,054 URLs** with no detected eligibility failures, missing descriptions, invalid JSON-LD, orphan URLs, or duplicate titles/descriptions/main-text hashes within a language. The live inventory has 1,073 URLs because its CMS content differs; this is not a deletion plan.

Unit validation: **200 passed, one optional PostgreSQL test skipped**. Translation tests verify runtime labels, dates and coverage notes; calculation tests verify unrounded arithmetic and unavailable exposure; metadata tests check metric-specific cutoffs. Browser checks cover rendering without JavaScript, language navigation, comparison controls, answer search, accessibility, schema/data agreement, CSV downloads and image space. The late-font regression reproduced an 18.6875-pixel movement before the fix; it now passes on desktop Chrome, mobile Chrome and mobile Safari. The final font/language/article browser run passed **33 checks**; earlier runs passed 32 broader SEO checks and 15 answer/calculation checks, with overlap between runs. Production build, lint and TypeScript checks passed.

Raw receipts, build/lint/typecheck logs, browser results and laboratory measurements are in `.artifacts/seo-improvements-2026-10-06/`. The directory retains its UTC start date; the report and new editorial revisions use 7 October in the owner’s timezone. The reusable performance collector is `scripts/measure-page-performance.mjs`; it records its throttling, ad state, timing window and layout-shift sources. [Chrome’s optional-font guidance](https://web.dev/articles/preload-optional-fonts) explains the font-loading tradeoff.
