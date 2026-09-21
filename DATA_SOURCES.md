# Data register — 21 September 2026

Dataset `2026.09.21.1`, stored in `src/data/football.json`. This release replaces the previous end-of-2024 snapshot. It is a dated, reviewed dataset, not an automatic live feed.

| Scope | Messi | Ronaldo | Evidence |
| --- | --- | --- | --- |
| Career goals / assists / appearances | 930 / 424 / 1,176 | 979 / 261 / 1,337 | [Statistical reference](https://www.messivsronaldo.app/) |
| Career minutes | 96,747 | 109,295 | Same reference, detailed statistics |
| Club goals | 805 | 833 | Same reference; all eight club records sum to these totals |
| Senior international goals | 125 | 146 | Same reference; club + country reconciles to career |
| 2026 goals / assists / appearances | 34 / 17 / 39 | 22 / 1 / 36 | [2026 calendar record](https://www.messivsronaldo.app/calendar-year-stats/2026/) |
| 2025 goals / assists / appearances | 46 / 28 / 54 | 41 / 4 / 46 | [2025 calendar record](https://www.messivsronaldo.app/calendar-year-stats/2025/) |
| Current-club goals / assists / appearances | 101 / 56 / 116 | 132 / 23 / 155 | [Inter Miami](https://www.messivsronaldo.app/all-time-stats/messi-inter-miami-stats/), [Al Nassr](https://www.messivsronaldo.app/all-time-stats/ronaldo-al-nassr-stats/) |
| World Cup finals goals / assists / appearances | 21 / 12 / 34 | 11 / 2 / 27 | Statistical reference, World Cup scope through 2026 |
| Champions League goals / assists / appearances | 129 / 40 / 163 | 140 / 42 / 183 | [UEFA](https://www.uefa.com/uefachampionsleague/news/0297-1d3e8b524832-5bf371ab86ce-1000--most-assists-in-the-champions-league-cristiano-ronaldo-lea/) |
| La Liga goals / appearances | 474 / 520 | 311 / 292 | [Barcelona](https://www.fcbarcelona.com/en/football/first-team/news/2070529/leo-messi-fc-barcelonas-historic-record-breaker), [TFF publication](https://www.tff.org/Resources/Tamsaha/188/files/assets/common/downloads/publication.pdf) |
| Direct meetings, goals / assists | 22 / 12 | 21 / 1 | [36-match head-to-head scope](https://www.messivsronaldo.app/all-time-stats/games-vs-each-other/) |
| Ballon d'Or wins | 8 | 5 | [UEFA winners through 2025](https://www.uefa.com/ballondor/news/0287-195e642735da-0594342b9554-1000--history-of-the-ballon-d-or-all-the-winners/) |

## Evidence quality and conventions

The detailed 2026 dataset uses published numerical facts from a secondary statistical reference, with explicit attribution. These figures are not described as an independently audited match-event database or a licensed Opta feed. The reference's prose, design and code are not used in this project. There is no competitor scraper in the application or its runtime.

The September 21 source revision includes Messi's September 20 San Diego goal. [AS reported the match](https://as.com/us/futbol/messi-se-luce-con-golazo-en-el-duelo-entre-inter-miami-y-san-diego-fc-f202609-n/), and [AS reported Ronaldo's 979th goal on September 9](https://as.com/futbol/internacional/cristiano-lanzado-hacia-los-1000-goles-f202609-n/). News corroboration does not independently verify every assist, minute or goal-type classification.

Each calendar year and club row stores its own direct source URL. The source register in `src/lib/data.ts` supports every published comparison metric. The raw reviewed numerical snapshot retains the reference's Champions League assist count (41 Ronaldo); the UI explicitly uses UEFA's 42 in that competition. It does not change the career provider's 261 assists or pretend the definitions match.

- Senior competitive club games and recognized A internationals count; club friendlies, exhibitions, youth/reserve matches and shootouts do not.
- National-team friendlies count. The 36 direct meetings include two such internationals, but exclude the Riyadh exhibition.
- League statistics exclude MLS playoffs; club totals include them.
- Ronaldo's Real Madrid total uses 450. The club's 451 credits a disputed deflection differently.
- World Cup covers the final tournament through 2026, excluding qualifiers.
- Copa América and Euros are explicitly different tournaments.
- Calendar years use January–December. 2026 is incomplete. Their 2009/10–2017/18 shared Spanish club seasons are a separate historical archive.
- Minutes-based rates use the numerator and playing minutes of the same scope. Undefined rates display a dash, never a fabricated zero.
- Body-part categories sum to total goals. Goal-location categories exclude penalties and direct free kicks as labelled, making that partition reconcile too.

## Honours

[Trophy register](https://www.messivsronaldo.app/honours-and-achievements/) reviewed September 21, 2026. The interface separates domestic league titles, the Supporters' Shield, MLS Cup, conference championship, senior national-team trophies, youth/Olympic awards and participation exceptions. These different achievements are not presented as interchangeable measures. The 2026 Ballon d'Or has not yet been awarded at this cutoff; the award chart ends with the latest completed edition, 2025.

## Validation and maintenance

Unit tests check career = club + country; every year's same-scope aggregation; all 25 years against career goals, assists, appearances and minutes; club-by-club totals; scoring partitions; conversion formulas; source references; and UEFA's distinct assist definition.

After future matches, update `src/data/football.json` from reviewed evidence, update its `asOf`, `reviewedAt` and `version`, reconcile the year and club rows, and update the source register and any editorial milestone text. Run `npm test`, lint, production build and browser tests before publishing. Changing only the date would misrepresent freshness.

A supported provider integration with suitable coverage and publication rights is still needed for automatic ongoing updates. No such integration or commercial data permission is implied by this source register.

## Revisions

- `2026.09.21.1`: career goals updated 850 → 930 Messi and 916 → 979 Ronaldo; added assists, appearances, minutes, per-90 rates, goal types, penalties, 25 calendar years, eight clubs, international tournaments, direct meetings and team honours.
- `historical-2024.1`: earlier archival release, retained only as history. The 2024 baseline plus the 2025 and 2026 additions reconciles with the new totals.
