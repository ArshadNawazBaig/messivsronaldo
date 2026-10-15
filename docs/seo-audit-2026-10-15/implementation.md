# SEO implementation — 15 October 2026

The first implementation batch is prepared and tested locally. Production code, CMS publications, statistics and AdSense settings have not been changed. The existing production CMS was read to prepare revisions against the actual published articles.

## Changes prepared

| Finding | Implementation | Release dependency |
|---|---|---|
| A1 — mobile ad displacement | Stable `#page-introduction`, `#article-summary`, `#peak-year-study` and `#article-opening-table` selectors; existing `#comparison` retained. | Deploy code, then configure excluded areas in AdSense. Selectors alone do not stop ads. |
| A2 — penalty coverage | Conversion retains and displays the actual scored/attempted inputs, unsuccessful attempts, rate, cutoff and partial-coverage label. Current goals remain separate. Dataset descriptions expose the same inputs. | Code deployment; publish the separate English article draft. |
| A3 — peak calendar years | The study table and CSV now render for the selected CMS-managed article, once, before the long body. Rates use two decimals. The scope note links to the club season and same-year comparisons. | Code deployment; publish the English title/description/summary revision. |
| A4 — international answer | Existing statistics table and assist answers precede the timeline. Provider explanation, exact international reference, update-log and World Cup links added. International metadata retained. | Code deployment. |
| A5 — internal discovery | Ordinary homepage anchors to international records, penalties and the peak-year article. The assists page adds an international link while retaining its existing counting rules. | Code deployment. |

All new shared text is included in the nine existing language catalogs. CMS editorial changes are limited to the two English articles. Existing article analysis, sources, image and original publication date are preserved.

The current published match records were copied into a separate local preview database. They produce 115 latest Messi penalty goals, while the conversion sample uses 114/149 (76.51%); Ronaldo uses 184/220 (83.64%). The sample retains its partial-coverage note through 27 September. The explanatory article retains its historical 21 September example. No missing attempts were inferred or imported from another website.

## Review and publication

The exact draft commands are in [cms-drafts.json](./cms-drafts.json). They contain complete rich-text documents and expected CMS revisions:

- `messi-2012-vs-ronaldo-2013-goals`: revision **1**; proposed title **Messi 2012 vs Ronaldo 2013: Goals and Scoring Rates**.
- `messi-ronaldo-penalty-records`: revision **3**; proposed title **Messi vs Ronaldo Penalty Records: Conversion Explained**.

Both records had `draftChanged: false` when read. The JSON commands use `action: save`, which prepares drafts without publishing them. They have not been submitted to production. Their revision checks must remain intact: if an editor changes either record, fetch it again and reconcile the changes.

The preparer can reproduce the payload from a fresh authenticated CMS export containing these records:

```sh
npx tsx scripts/prepare-seo-articles.ts current-posts.json draft-commands.json
```

It validates rich-text structure, rejects pending editorial drafts, preserves existing body content, and does not connect to the CMS. Publishing must use the CMS/API publication flow so caches are invalidated and revision dates are recorded correctly. Deploy the template changes before publishing these drafts. The penalty opening table moves ahead of its cover; its subsequent heading anchors retain their original document positions.

After an authorized release, fetch the public HTML for the homepage, `/international`, `/penalties`, and both articles. Verify the new titles and summaries, one study table and CSV link, the historical penalty table before its cover, matching Dataset inputs, correct canonicals and the ordinary internal links. Preserve the international data cutoff separately from the editorial revision date. Populate publication time, release identifier and verification time in [change-log.csv](./change-log.csv) only after those events occur.

## AdSense change still required

After deploying the selectors, open **AdSense → Ads → edit messivsronaldo17.com → Excluded areas**. In the preview, exclude insertion areas around the introduction and inside the primary comparison. Check both homepage and comparison layouts. Repeat for article summaries and opening evidence tables, then apply to the site. Google says changes can take up to an hour; exclusions cover in-page Auto ads, while overlays have separate controls. Exclusions depend on stable CSS selectors. [Official AdSense instructions](https://support.google.com/adsense/answer/12626543?hl=en).

Use these elements to locate the intended areas in the preview; inspect the selector AdSense actually saves:

| Layout | Elements to protect |
|---|---|
| Homepage and comparison pages | `#page-introduction`, `#comparison` including its toolbar, player cards and table |
| Peak-year article | `#page-introduction`, `#article-summary`, `#peak-year-study` |
| Penalty article | `#page-introduction`, `#article-summary`, `#article-opening-table` |

This code does not disable monetization, hide filled ads or claim that a selector is an ad-blocking directive. AdSense account access was unavailable in this session. The measured ad-related layout shift remains unresolved until the account configuration is applied and checked on production.

Repeat the original mobile experiment after the account change, sequentially under the same conditions:

```sh
node scripts/measure-page-performance.mjs --origin https://messivsronaldo17.com --paths /,/international --runs 2 --ads allow --output .artifacts/seo-after-ads-allowed.json
node scripts/measure-page-performance.mjs --origin https://messivsronaldo17.com --paths /,/international --runs 2 --ads block --output .artifacts/seo-after-ads-blocked.json
```

Compare session-window CLS and placement screenshots with the audit baseline. These remain laboratory observations, not field Core Web Vitals. The local preview does not establish that real ad placements have improved.

## Verification

- Production build, TypeScript and lint checks passed.
- Unit suite: **202 passed, 1 skipped** (203 total); includes matched-input coverage and draft-preservation checks.
- Browser checks: **18 passed** across desktop Chromium, mobile Chromium and mobile Safari, including existing font/image-layout regressions.
- The isolated preview contains the actual two CMS records with the proposed drafts, their existing cover, and the six published match records at dataset revision 10.
- Additional preview checks confirmed matching H1/Article metadata, a single opening table, working body-anchor targets, no page overflow on the checked mobile routes and no browser runtime errors. Arabic penalty presentation was checked as well.
- Targeted automated accessibility scans found no violations in the three new/opening evidence tables. All ten checked internal destinations returned HTTP 200 in the preview.
- Public production records were read only; no publication or statistics write was performed.

Ignored evidence, logs, screenshots and the isolated database are under `.artifacts/seo-implementation-2026-10-15/`. The source audit and baseline remain in [the audit report](../seo-audit-2026-10-15.md).

## Following work

A6 needs page-filtered Search Console queries and comparable date/page/query exports. Keep the supplied 23-day observed period as the baseline; do not claim a measured CTR gain from this implementation. Review release health promptly, then assess performance after comparable periods and sufficient impressions, accounting for other changes and football demand. The penalty-attempt ledger still needs event-level reconciliation before advancing any unverified conversion inputs. Investigation-only items A7–A10 remain in the audit backlog.
