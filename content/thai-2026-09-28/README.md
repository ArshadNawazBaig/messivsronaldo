# Thai statistics guide — 28 September 2026

[Read the original Thai article](messi-vs-ronaldo-stats-guide.md).

The user selected a Messi–Ronaldo statistics guide for Thai readers. The article explains dated career totals, club and country scope, per-appearance and per-90 calculations, assist definitions, penalties, the 450/451 Madrid discrepancy, Champions League records and calendar-year comparisons. It contains four tables, ten section headings, eight source links and six internal destinations. Thai word segmentation estimates 1,930 words and a ten-minute reading time.

## Delivery state

A private draft was saved and read back from the **local** `.data/admin.sqlite` database, with `published: null`. The stable draft ID is `6b55a4b6-a1b9-8d50-a67b-fc0ec0d397d8`. No production deployment or production article publication was performed. The production CMS needs this Thai-language code deployed before it can accept the draft.

[drafts.json](drafts.json) contains the native CMS `save` command, including the rich document, description, category, summary and citations. After deployment it can be submitted through the existing authenticated `/api/admin/blog` endpoint. Inspect any existing Thai post with this slug first; the initial payload expects revision zero. Publishing is a separate action in the blog editor.

The eventual public path is `/th/insights/messi-vs-ronaldo-stats-guide`. It reuses the English guide's slug so the existing article-language logic can connect the versions when both are published. These are supporting guides, not keyword-variant duplicates.

## Evidence and editorial choices

The dated factual inputs were reviewed alongside the [English collection's source review](../keyword-guides-2026-09-28/source-review.md). Career figures are from the named secondary reference; UEFA and club sources support the competition records and historical context. The Thai guide was written for this audience, including an explanation of Gregorian and Buddhist years. It is not a rewrite of the linked gambling promotion.

The article visibly distinguishes its 28 September source check from the site's 21 September baseline. Tables reconcile: club plus country equals career goals, the club subtotals sum correctly, penalty subtraction matches non-penalty totals, and rates use the same sample before rounding. Review changing figures and all dependent prose together before publishing at a later date.

The writing and explanatory examples are original. No claim of human authorship, web-wide plagiarism certification, indexing or guaranteed Google ranking is made. The title and description address Thai readers naturally; the keyword map in [manifest.json](manifest.json) is an editorial record, not a meta-keywords tag.

## Rebuild and validation

From the project root:

```sh
npx tsx content/thai-2026-09-28/prepare.ts
```

This local conversion validates the draft with the app's document and publication schemas, regenerates `drafts.json`, and records counts, links and the content hash in [editorial-report.json](editorial-report.json). It does not authenticate, save or publish.

Build, lint and TypeScript checks passed. Unit tests passed (135, with one existing optional database test skipped); 21 language browser tests passed across desktop Chromium, mobile Chromium and mobile WebKit. The Thai guide and comparison page were also rendered against an isolated local preview database: all tables appeared, fonts loaded, and no page overflow or browser errors were found. Evidence and screenshots are in `.artifacts/thai-2026-09-28/`, outside version control. The preview database is separate from the local private draft and from production.
