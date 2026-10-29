# Player statistics update — 30 October 2026

Four revision-checked changes were published through the production admin match endpoint. The data revision advanced from 15 to 19. Two existing appearances were corrected and two new appearances were added; the remaining match records and provider configuration were preserved.

| Match | Verified change |
| --- | --- |
| Ronaldo vs Al-Faisaly, October 23 | Corrected the existing record from zero goals to one. Retained zero assists and 90 minutes. The headed goal from a free-kick delivery is not a direct free-kick goal. |
| Ronaldo vs NEOM, October 20 | Added one unsuccessful penalty attempt to the existing zero-goal, zero-assist, 90-minute appearance. |
| Messi vs FC Cincinnati, October 28 | Added zero goals, zero assists, 90 minutes and one appearance. |
| Ronaldo vs Al-Kholood, October 29 | Added three goals, zero assists, 90 minutes and one appearance. This also adds one hat-trick and one verified header. Remaining unverified classifications retain their coverage notes. |

Evidence: [SPL's October 23 highlights](https://www.spl.com.sa/en/videos/youtube/ronaldo-gets-goal-982-as-al-nassr-triumph-powered-by-toyota), [SPL's October 20 penalty report](https://www.spl.com.sa/en/videos/youtube/ronaldo-misses-penalty-and-felix-wins-it-for-al-nassr-powered-by-toyota), [Cincinnati's full-time report and lineup](https://www.fccincinnati.com/news/recap-inter-miami-cf-2-fc-cincinnati-2), [Inter Miami's recap](https://www.intermiamicf.com/news/match-recap-inter-miami-cf-draws-against-fc-cincinnati), [Sofascore's October 29 match report](https://www.sofascore.com/news/ronaldo-hits-985-career-goals-with-hat-trick-in-al-nassrs-5-3-win), [October 29 events](https://www.flashsoccer.com/game/al-kholood-Mqs1WbFK/al-nassr-h4I89ZuE/), [Ronaldo's match log](https://fbref.com/en/players/dea698d9/) and [October 23 goal description](https://as.com/futbol/internacional/cristiano-huele-los-1000-f202610-n/).

## Published totals

| Career statistic | Messi | Ronaldo |
| --- | ---: | ---: |
| Goals | 936 | 985 |
| Assists | 427 | 261 |
| Appearances | 1,183 | 1,343 |
| Minutes | 97,321 | 109,812 |
| Hat-tricks | 62 | 67 |

The maintained 2026 calendar-year goals are 40 and 28. Club career, current-club and league views receive the same verified club-match additions. International and historical tournament totals are unchanged by these club matches. All 13 public comparison API responses were checked against locally calculated expected scopes at revision 19.

## Current club season

The separate 2026/27 club-season snapshot had remained at its September 29 review. Its updated figures add the ten verified club appearances after that cutoff: five for each player. The September 27 Messi appearance is already in the snapshot and is not added again; the October 6 Argentina appearance is excluded from club totals.

| 2026/27 aligned club period | Messi | Ronaldo |
| --- | ---: | ---: |
| Goals | 16 | 9 |
| Assists | 7 | 0 |
| Appearances | 18 | 12 |
| Minutes | 1,466 | 963 |

These are club competitions in the existing aligned period, not the full 2026 MLS season. The original snapshot source remains identified, with the verified additions linked to the public update log. Ronaldo's October 23 correction is included even though the reference's aggregate had not incorporated that goal. The record identifiers and applied cutoff are stored with this season to make the reconciliation auditable. The other 24 season snapshots and their review dates remain unchanged.

The page, index, chart and export use the revised season figures. A translated coverage note explains the baseline and match cutoff in all nine languages. Only the current season and club-season index receive the new review date; the separate October 30 editorial revision for the 2008/09 page remains intact.

## Verification and maintenance

Prepublication checks validated all four records, rejected duplicate player/date combinations, reconciled appearances and minutes, and established the expected effects on scoring and unaffected scopes. The authenticated publication receipts and source snapshots are retained privately under `.artifacts/stats-update-2026-10-30/`.

The season update passed the production build and TypeScript checks, focused ESLint, and 13 existing club-season/localization unit tests. Twenty-seven preview browser checks passed: the season in all nine languages without JavaScript; English, French and Arabic on mobile Chromium and WebKit; career/year totals; the match-source links in the update log; and the season index. Advertising was blocked during browser verification. No extra match was published by these checks.

The current season remains a reviewed snapshot rather than an automatic feed. For another update, add only newly verified club records after its stored cutoff and reconcile any correction to an already applied record. Do not re-add the ten listed records or advance historical source dates.
