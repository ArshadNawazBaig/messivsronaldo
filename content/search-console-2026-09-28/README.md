# Search Console article collection — 28 September 2026

13 complete articles, covering 11 topics in seven languages. The free-kick topic has English, French and German versions sharing the same slug. They can become reciprocal language alternatives when published.

The batch contains **8,274 words of article body**, excluding titles, metadata and source URLs. Each article has a direct answer, original explanatory prose, comparison tables, nearby citations, internal links, a search description, an at-a-glance summary and an original 1200 × 630 branded cover with descriptive alt text. It uses the existing blog editor's native document format.

## Read the articles

| Article | Language | Words | Impressions in matched supplied queries |
| --- | --- | --- | --- |
| [How many career goals does Messi have?](pt-messi-career-goals.md) | Portuguese | 660 | 107 |
| [La Liga goals, scoring rates and 311 versus 312](en-messi-ronaldo-la-liga-records.md) | English | 623 | 52 |
| [Messi or Ronaldo: who has more free-kick goals?](fr-messi-ronaldo-free-kick-records.md) | French | 653 | 23 |
| [Direct free-kick goals and the Champions League comparison](de-messi-ronaldo-free-kick-records.md) | German | 585 | 26 |
| [Messi vs Ronaldo in 2026: career and calendar-year goals](ar-messi-ronaldo-2026-goals-comparison.md) | Arabic | 606 | 13 |
| [Who has more trophies, and what counts?](nl-messi-ronaldo-team-trophies.md) | Dutch | 648 | 12 |
| [Messi vs Ronaldo in 2017](en-messi-ronaldo-2017-stats.md) | English | 584 | 18 |
| [Penalties: goals, attempts and conversion](en-messi-ronaldo-penalty-records.md) | English | 658 | 7 |
| [Hat-tricks by club and country](pt-messi-ronaldo-hat-tricks.md) | Portuguese | 639 | 4 |
| [Career appearances and playing time](fr-messi-ronaldo-career-appearances.md) | French | 695 | 3 |
| [Messi's goals in 2009: why 41 and 38 both appear](es-messi-goals-2009.md) | Spanish | 646 | 4 |
| [Ballon d’Or, European Golden Shoes and UEFA awards](en-messi-ronaldo-individual-awards.md) | English | 639 | 16 |
| [Career free kicks and the European competition difference](en-messi-ronaldo-free-kick-records.md) | English | 638 | 14 |

## Query evidence and editorial decisions

The supplied export contains 162 queries, 387 impressions and three clicks. No reporting date range, average position, country breakdown or worldwide keyword volumes were supplied. Impression counts are site-specific observations, not measures of global search demand.

The selected articles match 106 of those queries, accounting for 299 impressions and all three clicks. The largest single query is `messi golos` (62 impressions). Its Portuguese career-goal cluster totals 107. La Liga variants contribute 52; German free kicks 26; French free kicks 23. The French appearance question contributed the export's three clicks and has its own article despite its small impression total.

Related spellings and phrases are grouped into articles rather than made into separate pages. The writing uses natural language; it does not repeat every spelling variant or include keyword lists in the reader-facing text. English-only writing would miss the intent expressed in much of this export, so the drafts follow the query languages.

Nine existing seeded articles per language were checked before preparation. The new slugs do not overwrite those articles. Existing guides to assist definitions, career-goal counting and the 2012/2013 peak years are linked where useful rather than rewritten as competing articles. Brand/navigation searches and unrelated highlight searches were not forced into new article topics.

Exact query mappings, word counts, source counts and internal URLs are in [editorial-report.json](editorial-report.json). The supplied query rows are preserved in [queries.json](queries.json). Metadata and cover text are in [manifest.json](manifest.json).

## Evidence and dates

Career, free-kick, penalty, appearance, trophy and 2026 totals explicitly use the site's **21 September 2026 statistical snapshot**. Source pages were consulted during preparation and some live figures had subsequently changed. In particular, the live reference showed an additional Ronaldo appearance; the appearance article intentionally preserves the stated September 21 snapshot rather than mixing dates or silently changing the site's data.

Historical articles use the specified calendar year or completed La Liga career. The awards article identifies completed Ballon d’Or editions through 2025 and does not invent a 2026 winner. Real Madrid's 312-goal league attribution is disclosed alongside the 311 convention used for the calculations. Trophy counting includes transparent youth, Olympic, conference and participation notes. Conversion rates use matching numerators and denominators; partial free-kick attempts are not presented as an exhaustive career rate.

Primary club and UEFA sources support historical and award claims where available. Detailed career breakdowns are attributed to the site's named secondary statistical reference. Original analysis explains the calculations and limitations rather than reproducing source prose. No interviews, personal match attendance or human authorship claims are fabricated.

## Delivery and maintenance

All 13 articles are now **published**, following the request to publish the entire new batch. Each includes its uploaded cover and remains editable in [Admin → Blog editor](https://messivsronaldo17.com/admin/blog), with one language selected per post. See [all 13 public article links](published-articles.md).

The 45 distinct internal article links returned HTTP 200. Drafts pass the application's document/publication validation, and the preparation scripts pass lint and TypeScript checks. The import verified each saved document against its prepared content and did not overwrite existing articles.

After publication, all 13 article URLs and covers returned HTTP 200 without an admin session. Each article appeared in its language's reading room and in the XML sitemap, with the expected canonical URL, Article structured data and no `noindex` directive. The article text and tables rendered with JavaScript disabled. The three free-kick versions expose reciprocal language alternatives; the Arabic page also passed the mobile RTL/overflow check.

Local preparation:

```sh
npx tsx content/search-console-2026-09-28/prepare.ts
node content/search-console-2026-09-28/covers.mjs
```

The preparation script needs the read-only pre-import inventory in `.artifacts/search-console-2026-09-28/existing-posts.json`. It validates the drafts with the application schema and rejects conflicting slugs. The scripts above make local artifacts only; they do not authenticate or write to production. Import receipts and production checks are kept separately under that artifact directory, without credentials.

Before refreshing a statistical article, update its body, summary, description and cover together. Preserve the original cutoff if the underlying numbers have not been reviewed. A new publishing date alone is not evidence of new match data.
