# Career keyword articles — 28 September 2026

Three original English articles, totaling **3,730 words**, have been saved as **private drafts** in the [site's blog editor](https://messivsronaldo17.com/admin/blog). Select English and find the titles below. They are not published, indexed or included in the public sitemap yet.

| Article | Words | Search intent |
| --- | --- | --- |
| [Messi vs Ronaldo Stats: Goals, Assists and What They Tell Us](messi-vs-ronaldo-stats-guide.md) | 1,239 | `messi vs ronaldo`, `messi vs ronaldo stats`, `ronaldo vs messi`, `ronaldo vs messi stats` |
| [Messi Stats: Career Goals, Assists and His Club-by-Club Record](messi-stats-career-guide.md) | 1,240 | `messi stats` |
| [Ronaldo Stats: Career Goals, Club Records and the 1,000-Goal Chase](ronaldo-stats-career-guide.md) | 1,251 | `ronaldo stats` |

Each draft includes a direct opening answer, original explanatory prose, dated figures, native tables, useful questions and answers, nearby source links, internal links, a search description and an at-a-glance summary. No cover image was added. The writing does not claim human authorship, match attendance or interviews.

## How the topics fit the site

The four comparison query variants are covered in one article because reversing the players' names does not create a new reader need. The other two articles explain each player's club and country record. These are supporting editorial guides; the site's homepage, comparison explorer and player profiles remain the natural destinations for interactive statistics.

The articles link to existing material on assists, penalties, La Liga and goal-counting rules instead of duplicating those narrower articles. Fourteen distinct internal destinations returned HTTP 200. The live English inventory was checked before import; all 14 existing articles were preserved unchanged.

The title, summary and description use natural phrasing. The keyword mapping in [manifest.json](manifest.json) is an editorial planning record, not reader-facing keyword stuffing or a meta-keywords tag. No duplicate article was made solely for the reversed `ronaldo vs messi` wording.

[Google's guidance on helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) emphasizes useful, reliable content written for readers. These articles follow that approach with checkable figures and original analysis. Publication, indexing and search placement are separate outcomes; no ranking, traffic or originality-checker score is promised.

## Evidence and review

[Source review](source-review.md) records the factual inputs, primary sources, source discrepancies and calculations. Career figures were checked on September 28, 2026. That is newer than the site's September 21 baseline, so the articles explicitly distinguish their editorial snapshot from separately dated comparison pages. No underlying football data was changed.

The prose was written for this collection. A local check found no matching 12-word prose sequences against the previous collection's English articles. This limited check is not a web-wide plagiarism certification.

## Preparation and saved drafts

Run from the project root:

```sh
npx tsx content/keyword-guides-2026-09-28/prepare.ts
```

This converts the Markdown into the existing blog editor's rich-document format, validates it with the application schema and writes `.artifacts/keyword-guides-2026-09-28/drafts.json`. It also regenerates [editorial-report.json](editorial-report.json), containing word counts, keyword intent, headings, tables, source counts, links and content hashes. This local command does not authenticate or make remote changes.

The initial import used the existing admin API's `save` action. Every saved draft was read back and compared with the prepared document, with `published: null` verified. The import rejected conflicting slugs and checked that existing posts were unchanged. Receipts and the pre-import backup are retained in `.artifacts/keyword-guides-2026-09-28/`, outside version control and without credentials.

Arithmetic, conversion, lint and TypeScript checks passed. All three drafts were checked in the real blog editor and in desktop and 390-pixel mobile previews, with all six tables present, no page overflow and no browser errors. Table labels were shortened after visual review for phone readability. Anonymous requests to their future public URLs returned 404, confirming draft privacy. Verification results and screenshots are retained in the same artifact directory. Before eventually publishing, retain the visible source-review date or review the changing inputs and all dependent text together.
