# Messi match correction — 8 October 2026

Published the missing **6 October Argentina–Benin match** to the production match ledger. Argentina won 3–0; Messi recorded **one goal, two assists and 90 minutes**. Production revision advanced from **6 to 7**. The existing admin publication route validated the record and expired the statistics caches; no code deployment was needed.

## Evidence

- [AFA's match report](https://www.afa.com.ar/es/posts/la-seleccion-argentina-despidio-a-lionel-messi-con-una-goleada-ante-benin) corroborates the fixture, result and Messi goal.
- [MessiStats match record](https://www.messistats.com/en/detail/1521/00) supplies 90 minutes, one goal, two assists and the left-foot penalty classification. It is the record's public source.
- [Sofascore's match analysis](https://www.sofascore.com/news/argentina-3-0-benin-messi-signs-off-with-goal-and-two-assists) independently describes the two assisted goals and the left-foot penalty. Sources differ on whether the penalty minute is written as 70 or 71; the application record does not store a goal minute.

The match is a senior international friendly and counts in the application's existing international scope. It is not a club appearance or a World Cup match.

## Why it was missing

The production activity log shows that the **7 October 08:03 UTC** sync rejected 6 October with `Penalty goals disagree with match events. Review before publishing.` The record was never committed, so this was not just a stale browser cache.

On 8 October, the provider's free plan allowed date queries only from 7–9 October. Both the scheduled run and a read-only verification returned an access restriction for 6 October. The job ran, but could not recover the disputed match through its usual date lookup. The provider's inconsistent penalty fields have not been independently retrieved in this investigation, so no particular field is claimed to be the erroneous one.

Used a sourced manual record protected from automated overwrite. The normal validation, duplicate checks, revision guard, publication history and cache invalidation remain intact. No provider consistency check was relaxed, and no subscription or schedule settings were changed. Older pending dates remain unresolved; adding this match does not certify complete historical coverage.

## Published changes

| Scope | Goals before → after | Assists before → after |
|---|---|---|
| Career | 931 → **932** | 424 → **426** |
| International | 125 → **126** | 65 → **67** |
| 2026 | 35 → **36** | 17 → **19** |

The corresponding scopes gain one appearance and 90 minutes. Verified penalty-goal and left-foot totals also gain one. The new record leaves the penalty-attempt count unclassified because a complete attempt count was not independently verified; the existing partial-coverage calculation keeps that limitation explicit. Club, league, current-club, World Cup and Copa América statistics remain unchanged. Ronaldo's totals and both earlier match records are unchanged.

Record ID: `manual:argentina-benin-2026-10-06:messi`. Public ledger: [updates](https://messivsronaldo17.com/updates).

## Verification

Before publication, the prepared record passed the application schema and aggregation assertions covering all changed scopes, the 2026 calendar tables, unaffected club scopes, unchanged Ronaldo figures, and duplicate-ID handling. The live publication confirmed exactly one new record and revision 7.

Seven live comparison API responses matched the expected recalculated data, including unchanged scopes. Browser verification checked overview goals, career assists, international goals, 2026 goals, French goals, Arabic assists, the 2026 calendar goals/assists table and the public source link in the update log. No browser page errors were observed. Advertising was stubbed for these statistical checks.

The pre-publication ledger, prepared record, expected differences, publication receipt and live checks are retained under `.artifacts/messi-2026-10-08/`. The brief maintenance session used for the existing admin API was revoked after publication. No credentials or session tokens are included in these report files.
