# Messi statistics update — 11 October 2026

Published API-Football fixture `1490513` through the production admin date-sync endpoint. Record `api:1490513:messi` advanced the data revision from 8 to 9.

## Match and evidence

Inter Miami beat D.C. United 4–0 on 10 October 2026. The configured provider verified Messi's two goals, zero assists and 90 minutes against the completed fixture's goal events. [D.C. United's official match report](https://www.dcunited.com/news/post-match-facts-mcfvdc-x3263) corroborates the result, scorers, assists and lineup; Messi started and was not substituted.

The provider import records zero penalty goals. Goal location, body part, direct free kicks and penalty attempts remain unclassified where the provider did not establish them.

## Published changes

| Messi scope | Goals before → after |
| --- | --- |
| Career | 932 → **934** |
| Club career | 806 → **808** |
| All leagues | 567 → **569** |
| Inter Miami | 102 → **104** |
| Published 2026 calendar totals | 36 → **38** |

Each affected scope gains one appearance and 90 minutes; assists are unchanged. Calendar totals and the Inter Miami club record incorporate the match. Ronaldo's figures, international scopes and the four earlier records are unchanged. The separate dated club-season snapshot is not advanced by match-ledger updates.

## Verification

Schema and aggregation checks passed before publication, covering affected scopes, calendar totals, club records, unchanged scopes and duplicate-ID handling. The production endpoint applied its authentication, origin, lock, revision, validation, audit and cache-invalidation checks. The temporary maintenance session was revoked after publication.

All 13 live comparison API responses matched the expected data at revision 9. Eight browser checks passed: homepage, goals, clubs, 2026, French goals, Arabic goals, the 2026 calendar table and the update ledger's match/source link. No browser page errors occurred; advertising was stubbed for these statistical checks.

Inspection, preparation, publication and live verification receipts are retained under `.artifacts/messi-2026-10-11/`. The match appears in the public [update ledger](https://messivsronaldo17.com/updates). No application deployment was required. Existing historical coverage limitations remain documented in the public data.
