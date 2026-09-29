# Public posters and historical comparison research

Reviewed 29 September 2026. The public poster studio is implemented at `/comparison-posters`. Match histories, opponent records and age comparisons below are the next implementation plan; complete historical pages have not been shipped.

## Public poster studio

- Available without an account from comparison tables, Tools, site navigation, site search and the localized sitemap.
- Reuses the approved player portraits, blue/red colors, backgrounds, typography and logo placement.
- Supports the 13 published competition scopes, three PNG sizes, two themes, comparison bars, and selection/reordering of four to nine statistics.
- Shared URLs preserve the competition, size, theme, style and metric order. They reopen the latest published data; shared PNGs are dated snapshots. The public download button and attachment option are removed. Native image sharing includes the website's comparison-page link in the URL and caption.
- Social metadata uses the chosen poster and selection URL. Production robots rules allow crawlers to fetch the public poster image. Canonical URLs point to the dedicated page, keeping arbitrary filter combinations out of the sitemap.
- Public requests can only select published data. Custom numbers, text and asset URLs are rejected. Existing admin exports remain protected.
- Rendering is deduplicated and cached with memory and concurrency limits per process. A deployment with many server instances may need a shared cache or host-level traffic limits if usage grows.
- The interface is translated into all nine site languages. Poster artwork text remains English, as disclosed in the editor.

After launch, measure the page's search impressions, landing-page visits, image shares, copied links and returning visits from shared links. Existing analytics do not yet record dedicated poster conversion events. Traffic gains are a hypothesis to measure, not a promised outcome.

## Competitor findings

Messi vs Ronaldo App has separate player match-history destinations. Its opponent comparison lets visitors switch between goals, assists and contributions, limit club/country scope, set a minimum appearance count and rank by rate. Its age comparison distinguishes statistics earned during an age year from cumulative statistics by age. These are useful search intentions to investigate, rather than evidence of search volume. Sources: [match histories](https://www.messivsronaldo.app/match-histories/), [opponent records](https://www.messivsronaldo.app/all-time-stats/favourite-opponents/), [age comparison](https://www.messivsronaldo.app/all-time-stats/stats-by-age/).

Our opportunity is to connect a filtered, sourced match list to a clear comparison and a shareable poster, with an explicit coverage statement on every result. We should not publish hundreds of empty opponent or age pages just to add URLs.

## What our repository can support now

| Existing source | Available | Missing for a complete historical product |
| --- | --- | --- |
| `src/lib/data.ts` and the reviewed baseline | Career, calendar-year, club and competition aggregates | Individual appearances behind those aggregates |
| `src/lib/admin/model.ts` / `MatchRecord` | Player, date, team/opponent names, competition, goals, assists, minutes, evidence; optional scoring breakdown | Stable opponent identity, result/score, home/away, round/stage; complete pre-baseline history |
| `src/lib/admin/provider.ts` | Validated completed fixtures and player appearances for tracked current clubs/nations | Historical club memberships, a season-by-season coverage audit and backfill workflow |
| `/updates` | Published additions after the reviewed baseline | A complete match log; unlisted dates are not evidence of no appearance |

`checkDate(..., append=true)` explicitly prevents inserting pre-baseline matches into the updates store. `buildPublishedData` adds update records to the baseline totals. A historical import into that same aggregation path would double-count the career statistics. Keep the archive separate until a deliberate, reconciled migration replaces aggregate baselines.

Annual totals cannot be split accurately at birthdays. Opponent totals cannot be reconstructed from season totals. Neither feature should estimate missing match records or treat missing coverage as zero.

## Historical data acquisition

API-Football is already integrated. Its `players/teams` endpoint can identify team/season memberships. Its documentation describes competition/season coverage flags and fixture/player detail endpoints; it does not establish that every appearance in both careers is available to our account. Check each season and the actual returned match details. References: [player/team endpoint release](https://www.api-football.com/news/post/api-football-new-release-available), [coverage guidance](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage), [fixture import workflow](https://www.api-football.com/news/post/how-to-get-all-fixtures-data-from-one-league).

The review did not query account credentials, consume provider quota or import matches. Full historical coverage, subscription access and historical assist completeness remain unverified.

Suggested acquisition sequence:

1. Enumerate verified player/team memberships and available league/cup seasons. Include senior internationals and past clubs, not just the four currently tracked teams.
2. Produce a coverage manifest per player, competition and season: available fixtures, verified appearances, goals/assists/minutes coverage, missing intervals, source, assist definition and review date. Competition-wide coverage flags are only a starting point.
3. Pilot one completed season for both players. Validate appearance counts and scoring totals against the existing archive before expanding the import. Preserve provider fixture IDs and source evidence for every appearance.
4. Store historical matches independently. Deduplicate by provider fixture plus player, retain manual corrections, and merge recent updates into archive queries without applying them to career totals twice.
5. Show discrepancies for review. Different assist definitions must remain explicit; do not force reconciliation by changing a number without evidence.

## Implementation order

| Order | Feature and proposed routes | First release | Release condition |
| --- | --- | --- | --- |
| 1 | Match explorer: `/match-history`, `/match-history/messi`, `/match-history/ronaldo` | Player/date/competition/opponent filters; sourced rows; appearances, goals, assists and minutes; URL state; clear coverage | A reviewed historical store and a coverage manifest. An incomplete release must visibly name its limited coverage. |
| 2 | Opponent records: `/opponents`, then selected `/opponents/[slug]` pages | Same-opponent comparison, club/country filters, totals vs rates, minimum appearances, matching fixtures and poster export | Normalized opponent IDs, verified denominators and useful records for each published opponent page |
| 3 | Same-age comparisons: `/stats-by-age`, then useful `/stats-by-age/[age]` pages | “During age N” and “Before Nth birthday” views, common age range, goals/assists/minutes, fixture drill-down and poster export | Reliable birthdays, complete match dates and verified coverage across both compared periods |

For age calculations, use UTC date boundaries: “during age N” includes the Nth birthday and excludes the next birthday. “Before Nth birthday” excludes that birthday. An age the younger player has not reached is unavailable, not zero. A partially completed age year must be labelled and compared through the same elapsed interval if presented as an equal-age comparison.

## Acceptance criteria for the historical release

- Aggregate results reconcile to the selected verified appearances; no overlap with the baseline changes career totals.
- Unknown assists/minutes remain unavailable, and zero denominators never produce a rate of zero.
- Opponent aliases map to stable identities; similarly named clubs and national teams remain distinct.
- A player who did not appear does not count as an appearance. Extra time and shootouts follow the published counting rules.
- Each result identifies its scope, date coverage and sources. Searchable pages have substantive data and one canonical URL; arbitrary sort/filter permutations are not separately indexed.
- Match-level sources and the relevant poster selection are reachable from every comparison.

Recommended next build: the separate historical store and a one-season import audit. Once that foundation reconciles, the match explorer supports the opponent and age features without three disconnected datasets.
