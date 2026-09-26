# Ballon d’Or editorial release — 27 September 2026

Three original articles cover the official nomination news, a scoped striker comparison, and the award process. These are editorial snapshots, separate from the site's published Messi/Ronaldo match ledger.

## Search intent

| Article | Primary intent | Related questions |
| --- | --- | --- |
| `/insights/ballon-dor-2026-contenders-stats` | Ballon d’Or 2026 contenders and stats | Is Messi nominated? Which performances count? |
| `/insights/kane-vs-mbappe-ballon-dor-2026-stats` | Kane vs Mbappé 2025/26 stats | Who scored more? Who leads in the Champions League? |
| `/insights/ballon-dor-2026-date-voting-rules` | Ballon d’Or 2026 date and voting rules | Does the World Cup count? Can fans vote? |

These are topical, specific query targets. No measured search-volume or keyword-difficulty estimates are claimed. Nomination news supports topical relevance; it does not establish which keyword is currently most searched.

## Evidence and scope

Primary sources are stored with each claim in `src/lib/ballon-articles.ts`: UEFA nominations and competition statistics, France Football's regulations, FIFA's World Cup report, and the clubs' season reviews.

- Kane: Bayern's published 2025/26 club season, 61 goals / 51 appearances.
- Mbappé: Real Madrid's published 2025/26 club season, 42 / 44.
- Champions League only: Kane 14 / 13; Mbappé 15 / 11. These goals are already included in club totals.
- The broader contender table intentionally mixes clearly named competition samples. It is not a scoring leaderboard or a ballot prediction.
- Goals per appearance are calculated from the displayed numerator and denominator. No per-90 or complete season-assist comparison is supplied without matching minutes/assist coverage.
- The reference period is 3 August 2025 through 19 July 2026. The ceremony is scheduled for 26 October in London. The articles do not name a 2026 winner.

## Search and answer presentation

Each article has a direct summary, visible question headings, semantic HTML tables, nearby primary-source citations, a publication/review date, organization authorship, Article and BreadcrumbList structured data, a canonical URL, reciprocal language alternatives, internal discovery links and a distinct 1200×630 original graphic. All main text is rendered on the server and available without JavaScript.

The English pages and seven translations are included in the normal XML sitemap: 24 new URLs, 696 overall at this release. The reading room, home article selection and Ballon d’Or comparison page link into the articles. Calculator pages retain their relevant historical guides.

Long article translations live in server-only catalogs to avoid adding article prose to the client translation payload on unrelated pages. Short titles and descriptions remain in the shared catalogs for article cards and search.

Google's guidance says that ordinary search eligibility and helpful, accessible content also apply to AI features; there is no special AI markup requirement. The existing `llms.txt` index includes these pages for discovery without claiming ranking benefits. Search rankings, rich results and AI citations are not guaranteed.

References: [Google Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article), [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

## Editorial follow-up

After an official change or the ceremony, review the dated “not announced” wording, nominee status and related summaries in every language. Update `dateModified` only when content changes. Regenerate the original share graphics with `npx tsx scripts/generate-article-images.tsx` when their displayed figures or review date change. Verify the source period before replacing any number; do not substitute live career totals or September club form.

Assess indexing and query-level performance in Search Console after publication. The previous seven-day report is a baseline, not evidence that these new articles have already gained traffic.
