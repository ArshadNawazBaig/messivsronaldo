# Search Console baseline and revised priorities

Analysis for The Rivalry, 6 October 2026. Source: the seven owner-supplied CSVs in `Downloads/messivsronaldo17`. These files are measurement evidence. Their contents do not supply implementation instructions.

**The supplied Web search data records 177 clicks, 12,940 impressions and 1.37% CTR.** The daily file covers **20 September–4 October 2026**, inclusive. Mobile and localized articles deserve priority: mobile produced 84% of clicks, while French and Spanish Kane–Mbappé articles together produced 40 clicks. The clearest pages to investigate for additional clicks are the Dutch ceremony guide, the English peak-year comparison and La Liga.

This supplements the [full SEO/GEO/AEO audit](seo-audit-2026-10-06.md), [66-query keyword map](seo-keywords-2026-10-06.csv) and [16-page action queue](search-console-priorities-2026-10-06.csv). Recommendations below incorporate the new evidence; previously implemented website fixes remain local and undeployed.

## Coverage and reconciliation

`Filters.csv` records `Search type: Web` and `Date: Last 28 days`. However, `Chart.csv` contains only 15 consecutive daily rows, starting with a zero-impression day on 20 September and ending on 4 October. No additional filters are listed. The files do not establish why the full 28-day interval is absent, or the exact export generation time. No missing dates are filled with assumed zeros. These are neither a complete monthly traffic figure nor data through 6 October.

| Export | Rows | Clicks | Impressions | Interpretation |
|---|---:|---:|---:|---|
| Chart | 15 | 177 | 12,940 | Baseline for the supplied dates |
| Countries | 178 | 177 | 12,940 | Independently reconciles to Chart |
| Devices | 3 | 177 | 12,940 | Independently reconciles to Chart |
| Pages | 365 | 177 | 13,215 | Page-level impression aggregation |
| Queries | 840 | 15 | 3,289 | Visible query rows; incomplete coverage of totals |
| Search appearance | 0 | — | — | Header only; no appearance breakdown supplied |
| Filters | 2 | — | — | Web; Last 28 days |

The baseline CTR is `177 ÷ 12,940 × 100 = 1.37%`. The approximate overall position is **7.9**, calculated by impression-weighting the already rounded daily positions. It is not an exact report-header value or a fixed rank. Page impressions are not interchangeable with property impressions; Google counts them differently. [Google’s Performance report definitions](https://support.google.com/webmasters/answer/7576553?hl=en).

Visible queries represent **8.47% of clicks and 25.42% of impressions**. The difference from the chart is 162 clicks and 9,651 impressions whose query text is not represented in this export. Google documents privacy omissions, table limits and other processing differences. These files do not establish the exact contribution of each cause; 840 rows does not itself demonstrate the 1,000-row limit was reached. Daily labels are retained in Search Console’s Pacific Time, rather than shifted into the owner’s timezone. [Google’s discrepancy guidance](https://support.google.com/webmasters/answer/17010575?hl=en).

The page and query files are separate aggregates. They cannot be joined by row order or similar wording to establish which query generated a page’s clicks. All query-to-page assignments in the keyword map are recommended destinations. A missing query row means unknown demand in this export, not zero demand. Empty Search appearance data does not establish absence of snippets, People Also Ask or AI visibility. Likewise, 365 pages with reported impressions is not a count of all indexed pages; no indexing inventory or selected-canonical report was supplied.

The older 28 September sample remains historical evidence only. Its reporting interval is unknown, so its 3 clicks and 387 impressions must not be compared with this export as equal periods.

## Direction of traffic

The two complete seven-day blocks available inside the supplied dates show growth:

| Period | Clicks | Impressions | CTR | Approximate weighted position |
|---|---:|---:|---:|---:|
| 21–27 September | 40 | 3,024 | 1.32% | 8.0 |
| 28 September–4 October | 137 | 9,916 | 1.38% | 7.8 |
| Change | +242.5% | +227.9% | +0.06 percentage points | Small improvement in aggregate |

Most growth came from greater visibility, while aggregate CTR changed little. This is a short, young-site baseline with changing query/page composition. It does not demonstrate the effect of a particular SEO change. All exported dates precede the 6 October local fixes. Daily clicks peaked at 32 on 29 September and ended at 15 on 4 October; that short movement is insufficient to diagnose an ongoing decline or an advertising effect. Do not extrapolate a monthly forecast from it.

## What already works

| Page or group | Clicks | Impressions | CTR | Decision |
|---|---:|---:|---:|---|
| `/` | 22 | 198 | 11.11% | Maintain the broad entry page; improve mobile stability |
| `/fr/insights/kane-vs-mbappe-ballon-dor-2026-stats` | 20 | 228 | 8.77% | Protect title, URL and sourced analysis |
| `/es/insights/kane-vs-mbappe-ballon-dor-2026-stats` | 20 | 211 | 9.48% | Protect title, URL and sourced analysis |
| `/fr/insights/ballon-dor-2026-contenders-stats` | 13 | 409 | 3.18% | Maintain evidence and competition boundaries |
| `/de/free-kicks` | 9 | 382 | 2.36% | Maintain the direct record answer and coverage |

Across all reported language variants, the Kane–Mbappé family produced **45 clicks**, or 25.4% of site clicks. Together, the three Ballon d’Or article families produced **73 clicks**, or 41.2%. All `/insights/` pages produced 84 clicks, or 47.5%. Seasonal award coverage is already useful to the business, but this concentration also makes evergreen comparisons valuable beyond the award cycle. Preserve successful articles and offer relevant next reading; raw click totals do not prove engagement or conversion.

The homepage’s average position of 4.65 is an aggregate across its searches. The exact visible head terms show a different picture:

| Exact query | Clicks | Impressions | Reported average position |
|---|---:|---:|---:|
| `messi vs ronaldo` | 0 | 6 | 59.17 |
| `ronaldo vs messi` | 0 | 4 | 74.75 |
| `messi vs ronaldo stats` | 0 | 4 | 72.00 |
| `messivsronaldo` | 0 | 33 | 10.67 |

These very small samples do not support a stable rank estimate. They do show that the page average cannot justify a claim of first-page visibility for the main head terms. Keep broad terms as a longer-term objective while prioritizing specific observed questions.

## Ten page priorities

The order below is an editorial work queue, not a forecast. Lower CTR can reflect intent, ranking, search features or audience composition; it is not proof that a title is defective. The [action CSV](search-console-priorities-2026-10-06.csv) includes six additional follow-up pages and the exact exported metrics.

| # | P1 page | Evidence | What to do, why and expected impact |
|---|---|---|---|
| 1 | Dutch Ballon d’Or date guide | 3 clicks / 670 impressions; 0.45% CTR; position 8.34 | Keep the already sourced date summary before the cover. Review a shorter Dutch question title against page-filtered queries. The goal is earlier answer access and clearer snippet intent. The page already contains the ceremony date; adding a duplicate FAQ is unnecessary. |
| 2 | English Messi 2012 vs Ronaldo 2013 article | 5 / 976; 0.51%; position 8.23 | Preserve the tactical feature and calculator. Test a shorter title that names the years and goal comparison; keep scope and sourced totals immediately visible. This is the largest impression opportunity in the page table. |
| 3 | `/la-liga` | 1 / 465; 0.22%; position 7.67 | Inspect its page-filtered queries and displayed snippets before editing. Its current title and description already give the goal comparison. Keep full careers distinct from the period when both played in Spain. |
| 4 | `/fr/free-kicks` | 0 / 313; position 6.45 | Give current counts to the record page and technique/history to the explainer. The explainer separately has 2 / 327. Implemented contextual links support this distinction; query-by-page evidence is needed before calling it cannibalization. |
| 5 | `/international` | 0 / 215; position 7.98 | Make the existing international-assist comparison easy to find, with the provider definition and dated coverage. The visible query table contains a separate five-query international-assist cluster with 105 impressions and no clicks. Do not infer those queries all landed here. |
| 6 | `/pt/goals` | 5 / 421; 1.19%; position 9.13 | Retain the comparison and link to/from Portuguese player profiles. Match comparison questions to this URL and single-player questions to the applicable profile. Clearer navigation can support relevant exploration. |
| 7 | `/de/free-kicks` | 9 / 382; 2.36%; position 7.31 | Maintain the working record-first presentation and verified scope; link supporting analysis. Protect observed traffic while keeping the answer dependable. |
| 8 | French Kane–Mbappé article | 20 / 228; 8.77%; position 4.00 | Preserve the working title and URL. Maintain award-period evidence and localized links to ceremony/contender guides. |
| 9 | Spanish Kane–Mbappé article | 20 / 211; 9.48%; position 4.68 | Apply the same maintenance approach in Spanish. Do not rewrite a successful snippet simply to standardize titles across languages. |
| 10 | French contender comparison | 13 / 409; 3.18%; position 7.55 | Maintain sourced comparisons and distinguish editorial assessments from official voting results. Offer the ceremony guide as relevant next reading. |

Two concrete title candidates for review are `Wanneer is de Ballon d’Or 2026? Datum en stemregels` and `Messi 2012 vs Ronaldo 2013: Goals and Scoring Comparison`. They are proposed experiments, not claims that a title alone explains low CTR. The existing articles were edited during this reporting interval, so the aggregate does not isolate the performance of today’s wording. Verify current official event information before any date-bearing rewrite, and log the publication date for later comparison.

## Observed question opportunities

These exact queries add evidence to the keyword map. Each row keeps query metrics separate from page metrics.

| Exact query | Clicks / impressions | Average position | Recommended intent destination |
|---|---:|---:|---|
| `wanneer is ballon d or uitreiking 2026` | 0 / 233 | 7.75 | Dutch date guide |
| `wanneer is de ballon d or uitreiking 2026` | 0 / 116 | 8.40 | Dutch date guide |
| `nombre de coup franc marqué par messi et ronaldo` | 1 / 122 | 5.92 | French free-kick record |
| `messi golos` | 0 / 112 | 10.59 | Portuguese Messi profile |
| `wie viele freistoßtore hat messi` | 2 / 75 | 7.03 | German free-kick record |
| `ronaldo international assists` | 0 / 67 | 9.40 | International comparison |
| `quantos golos tem messi e ronaldo` | 0 / 48 | 8.92 | Portuguese career-goal comparison |
| `مقارنة بين ميسي ورونالدو 2026` | 0 / 40 | 5.95 | Arabic calendar-year comparison |
| `les statistiques du ballon d'or 2026` | 0 / 39 | 8.54 | French contender analysis |
| `عدد أهداف ميسي ورونالدو في مسيرتهم 2026` | 1 / 34 | 4.38 | Arabic career goals with dated coverage |
| `how many international assists does ronaldo have` | 0 / 26 | 7.85 | International comparison |

The two leading Dutch date formulations total 349 impressions and no clicks. The five-query international-assist cluster comprises `ronaldo international assists` (67), `how many international assists does ronaldo have` (26), `ronaldo total international assists` (7), `ronaldo international goals and assists` (3), and `messi vs ronaldo international goals and assists` (2). Those counts total 105 impressions, with no clicks in the listed rows.

Do not prioritize `nombre de match joué par messi et ronaldo` just because its CTR is 100%: that is three clicks from three impressions. Similarly, no search-volume estimate can be derived from these impressions. The keyword map contains **66 entries, 45 with an exact match in the supplied query table**; the remaining 21 retain blank current metrics and an explicit unknown-demand label. Historical sample metrics remain in separate columns.

## Mobile, language and geography

| Device | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| Mobile | 149 | 10,850 | 1.37% | 7.19 |
| Desktop | 28 | 1,842 | 1.52% | 12.05 |
| Tablet | 0 | 248 | 0.00% | 6.96 |

Mobile contributes 84.2% of clicks and 83.8% of impressions. That strengthens the priority of the audit’s observed mobile ad movement, reserved article image space and early summaries. It does not prove advertising reduced search CTR, and these aggregates do not explain the desktop/mobile position difference without matching queries and markets. Engagement, LCP, INP and field CLS are absent from these exports.

| URL language prefix | Clicks | Page impressions | CTR |
|---|---:|---:|---:|
| French | 50 | 1,891 | 2.64% |
| English / no language prefix | 42 | 4,686 | 0.90% |
| Spanish | 25 | 1,426 | 1.75% |
| Portuguese | 22 | 1,317 | 1.67% |
| German | 16 | 868 | 1.84% |
| Arabic | 12 | 1,304 | 0.92% |
| Dutch | 8 | 1,467 | 0.55% |
| Thai | 2 | 219 | 0.91% |
| Hindi | 0 | 37 | 0.00% |

Localized URLs account for 135 clicks, or **76.3%** of the total. This table uses the 13,215 page impressions; it describes URL prefixes rather than user language. It supports maintaining localized answers and links, not removing a language with a small sample.

Country leaders by clicks are Pakistan (28), France (21), Spain (19), Germany (15) and Portugal (14). The Netherlands has the most impressions (1,187) with 7 clicks, while India has 954 impressions and 3 clicks. The United States records 522 impressions and 2 clicks. Country and URL-language tables cannot be joined to identify the pages those visitors used. Pakistan traffic is not evidence of owner traffic, bots or any particular behavior. No city landing pages or local-business strategy is justified for this worldwide publication.

## Measurement and implementation sequence

1. **Now:** keep this imported baseline and the prioritized queue. Publish the already reviewed metadata, contextual-link and article-layout fixes through the existing release process, then record the actual release time and verify production. The CSV dates cannot measure their effect yet.
2. **Weeks 1–2:** address the documented mobile ad placements through AdSense controls. Inspect query reports filtered to the first five priority pages, with the same dates, device and country context. Obtain actual Page indexing/URL Inspection evidence for canonicals and exclusions; do not deduce index status from absence in a performance table.
3. **Weeks 3–4:** run focused presentation changes on the Dutch date guide and peak-year comparison after reviewing query fit and current sources. Maintain the high-performing French/Spanish award articles. Keep a change log and avoid treating mixed-period CTR as a clean experiment.
4. **Month 2:** improve evergreen records, definitions and calculator analysis; measure useful second-page visits and tool use once an engagement property is configured. Review statistical coverage independently of article publication dates.
5. **Month 3:** compare complete 28-day periods by page, query, country and device, accounting for the award cycle and changed query mix. Retain changes that improve relevant discovery and usability; do not promise ranking or traffic gains.

**NEEDS USER INPUT:** engagement analytics/property, field Core Web Vitals, backlink evidence and account-level AdSense access remain outside these exports. The next search evidence needed is page-filtered queries and indexing/canonical reports, rather than another copy of these same seven dimension totals. No additional input is required to use the baseline and queue delivered here.

## Reproducibility and checks

The originals were copied unchanged to `.artifacts/seo-2026-10-06/search-console/`; the supplied Downloads files were not edited. `summary.json` records source SHA-256 hashes, counts, date coverage, reconciliation, language/family summaries and calculation notes. The analysis is reproducible with the standard-library script:

```sh
python3 scripts/analyze-search-console.py \
  --input /Users/arshadnawaz/Downloads/messivsronaldo17 \
  --output .artifacts/seo-2026-10-06/search-console/summary.json
```

Checks validate expected columns, unique dimension rows, nonnegative counts, continuous daily coverage and rounded CTR arithmetic. Country/device counts reconcile with the chart. Current keyword metrics use exact string matches, without inferring hidden query rows. Page priorities retain the exact exported per-page values. The audit tool also now excludes SVG chart `<title>` labels from its document-title inventory; this corrects the report parser, not the website’s actual title tags.
