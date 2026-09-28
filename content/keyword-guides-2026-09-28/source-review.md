# Source review — 28 September 2026

The three articles use facts checked during this review and original explanatory writing. They do not reproduce source prose or claim firsthand reporting. Historical records use primary club or UEFA sources where available; current career and club breakdowns are explicitly attributed to the secondary statistical reference. This is an editorial snapshot, not an official live feed.

## Current career inputs

The [career reference](https://www.messivsronaldo.app/) displayed the following values during the review:

| Input | Messi | Ronaldo |
| --- | --- | --- |
| Goals | 931 | 979 |
| Assists | 424 | 261 |
| Appearances | 1,177 | 1,338 |
| Minutes | 96,837 | 109,362 |
| In-match penalty goals | 114 | 184 |

Career assists and minutes retain the reference's conventions. The articles do not present those assist figures as a universal cross-provider definition.

These values differ from the repository's `src/data/football.json` baseline dated 21 September 2026: Messi has one additional goal and appearance, and Ronaldo one additional appearance. Every article discloses the September 28 review and explains that other site pages can carry an earlier cutoff. The baseline and published match ledger were not changed as part of this writing task.

## Club and international cross-checks

| Source | Goals | Appearances |
| --- | --- | --- |
| [Messi, Barcelona](https://www.messivsronaldo.app/all-time-stats/messi-barcelona-stats/) | 672 | 778 |
| [Messi, PSG](https://www.messivsronaldo.app/all-time-stats/messi-psg-stats/) | 32 | 75 |
| [Messi, Inter Miami](https://www.messivsronaldo.app/all-time-stats/messi-inter-miami-stats/) | 102 | 117 |
| [Ronaldo, Sporting](https://www.messivsronaldo.app/all-time-stats/ronaldo-sporting-cp-stats/) | 5 | 31 |
| [Ronaldo, Manchester United](https://www.messivsronaldo.app/all-time-stats/ronaldo-manchester-united-stats/) | 145 | 346 |
| [Ronaldo, Real Madrid](https://www.messivsronaldo.app/all-time-stats/ronaldo-real-madrid-stats/) | 450 | 438 |
| [Ronaldo, Juventus](https://www.messivsronaldo.app/all-time-stats/ronaldo-juventus-stats/) | 101 | 134 |
| [Ronaldo, Al Nassr](https://www.messivsronaldo.app/all-time-stats/ronaldo-al-nassr-stats/) | 132 | 155 |
| [Messi, Argentina](https://www.messivsronaldo.app/international-stats/) | 125 | 207 |
| [Ronaldo, Portugal](https://www.messivsronaldo.app/international-stats/) | 146 | 234 |

PSG's 34 assists were also checked on the linked PSG page. The United figures combine both spells. Inter Miami and Al Nassr totals cover the reference's competitive club scope, not league matches alone. Al Nassr includes the Arab Club Champions Cup. Senior international totals include recognized A-international friendlies; club friendlies, youth games and shootout kicks are excluded from the career convention used here.

## Primary historical and methodological sources

- [FC Barcelona's historical record](https://www.fcbarcelona.com/en/football/first-team/news/2070529/leo-messi-fc-barcelonas-historic-record-breaker): Messi's 672 Barcelona goals and 778 appearances; 474 La Liga goals and 520 appearances; 73 club goals in 2011/12.
- [Barcelona's specific account of 2012](https://www.fcbarcelona.com/en/football/first-team/news/1670444/-91-/featured): 91 calendar-year goals, comprising 79 for Barcelona and 12 for Argentina. The broader club record page contains an inconsistent 84-goal club subtotal in its 2012 paragraph; the dedicated account and the club's [contemporary year-end report](https://www.fcbarcelona.com/en/news/1146881/) support 79. That inconsistent subtotal was not copied.
- [UEFA's Messi record](https://www.uefa.com/uefachampionsleague/news/02a7-212c29181390-c681db1beaba-1000--lionel-messi-in-the-champions-league-records-stats-who-he-/): 129 goals in 163 main-competition appearances.
- [UEFA's Ronaldo record](https://www.uefa.com/uefachampionsleague/news/02a7-2136b8f054ea-76a61b3f9d24-1000--cristiano-ronaldo-in-the-champions-league-records-stats-wh/): 140 goals in 183 main-competition appearances; 67 knockout goals; 17 goals in 2013/14; qualifying excluded from the 140.
- [UEFA's assist register](https://www.uefa.com/uefachampionsleague/news/0297-1d3e8b524832-5bf371ab86ce-1000--most-assists-in-the-champions-league-cristiano-ronaldo-lea/): Messi's 40 Champions League assists.
- [Real Madrid's Ronaldo profile](https://www.realmadrid.com/en-US/the-club/history/football-legends/cristiano-ronaldo-dos-santos-aveiro): the club's alternative attribution, 451 goals in 438 appearances and 312 La Liga goals. The article makes the difference from the 450/311 convention explicit and does not mix conventions in arithmetic.
- [UEFA's Ballon d'Or winners](https://www.uefa.com/ballondor/news/0287-195e642735da-0594342b9554-1000--history-of-the-ballon-d-or-all-the-winners/): eight Messi wins and five Cristiano Ronaldo wins through the 2025 edition. No claim is made about a 2026 award outcome.
- [Opta event definitions](https://www.statsperform.com/opta-event-definitions/): conventional goal assists and fantasy assists are distinct categories. The articles use original hypothetical examples to explain what an assist total omits.

## Derived analysis

Rates were recalculated from the displayed goals, appearances and minutes and rounded to three decimal places. Club and country rows were reconciled to the career totals. Non-penalty goals subtract in-match penalty goals only: 817 for Messi and 795 for Ronaldo. The Ronaldo milestone gap is 1,000 − 979 = 21; no date of reaching it is predicted. Messi's Barcelona share is 672 ÷ 931 × 100, approximately 72.2%.

Future updates should review all dependent tables, body figures, summaries and descriptions together. Do not change only the review date. The match data driving the site's comparison tools must follow its existing sourced update workflow independently.
