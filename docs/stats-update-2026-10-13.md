# Ronaldo statistics update — 13 October 2026

Published API-Football fixture `1629931` through the production admin date-sync endpoint at 06:08 UTC (11:08 AM Pakistan time). Record `api:1629931:ronaldo` advanced the data revision from 9 to 10.

## Match and evidence

Al Nassr beat Neftchi 3–1 on 12 October 2026 in the AFC Champions League Elite. The configured provider verified Ronaldo's one goal, zero assists and 90 minutes against the completed fixture's goal events. [The AFC match report](https://www.the-afc.com/en/club/afc_champions_league_elite.html/news/md2-al-nassr-club-ksa-3-1-pfc-neftchi-uzb) corroborates the result; [AP's match report](https://apnews.com/article/5e3e5f9bc03a7f47975c61907cd812ec) confirms Ronaldo scored before halftime.

The record is classified as a club cup appearance. The provider import records zero penalty goals; other scoring classifications remain unknown where the provider did not establish them.

## Cause of the delay

The production admin API confirmed automatic updates are enabled for 08:00 UTC (1 PM Pakistan time). Today's run was not yet due. The last automatic run began on 12 October at 08:02 UTC and checked through 11 October, before this match took place. No failed import of this fixture appeared in the inspected history.

An on-demand sync published the match immediately. The daily schedule and provider subscription remain unchanged. Older dates blocked by the provider subscription are still pending; this update does not establish complete historical coverage.

## Published changes

| Ronaldo scope | Goals before → after |
| --- | --- |
| Career | 980 → **981** |
| Club career | 834 → **835** |
| Al Nassr | 133 → **134** |
| Published 2026 calendar totals | 23 → **24** |

Each affected scope gains one appearance and 90 minutes; assists are unchanged. The calendar tables and Al Nassr club record incorporate the match. League totals, international scopes, Messi's figures and the five earlier records remain unchanged. The separate dated club-season snapshot is not advanced by match-ledger updates.

## Verification

Schema and aggregation checks passed before publication, covering affected and unchanged scopes, calendar totals, club records and duplicate-ID handling. The production endpoint applied its authentication, origin, lock, revision, validation, audit and cache-invalidation checks. The temporary maintenance session was revoked after publication.

All 13 live comparison API responses matched the expected data at revision 10. Eight browser checks passed: homepage, goals, clubs, 2026, French goals, Arabic goals, the 2026 calendar table and the update ledger's match/source link. No browser page errors occurred; advertising was stubbed for these statistical checks.

Inspection, preparation, publication and verification receipts are retained under `.artifacts/ronaldo-2026-10-13/`. The match appears in the public [update ledger](https://messivsronaldo17.com/updates). No application deployment was required.
