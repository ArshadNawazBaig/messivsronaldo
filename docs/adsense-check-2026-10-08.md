# Live AdSense check — 8 October 2026

The owner reported ads appearing only on the overview page. The investigation was interrupted to prioritize the missing Messi match; that update is now published and verified in [stats-update-2026-10-08.md](stats-update-2026-10-08.md).

A bounded desktop Chromium check visited the overview, followed its Goals link, then opened Assists directly. The current production navigation already performs a full document navigation for Goals and initializes Google's SDK for the destination. Both inner pages create Auto ads placements and send requests with their own canonical page URLs. No browser page errors were recorded.

| Visit | Auto ads wrappers | Ad requests for that page | Completed slots marked unfilled |
|---|---:|---:|---:|
| Overview | 6 | 5 during its capture window | 5; two additional slots had no status yet |
| Goals via overview link | 5 | 6 | 6 |
| Assists opened directly | 5 | 6 | 6 |

The captured ad responses returned HTTP 200. Google marked the completed slots `data-ad-status="unfilled"`; the existing CSS then collapsed their empty space. This indicates no advertisement returned for those slots in this test session. It is not evidence that the site failed to load the SDK or request ads. Slot counts include formats outside the counted in-page wrappers, so the two counts need not match. A late overview request was recorded during the next capture window and is not counted as a Goals request.

This does not establish why Google returned no inventory, whether another visitor receives ads, or the account's serving/review status. Google's [unfilled-ad documentation](https://support.google.com/adsense/answer/10762946?hl=en) explains the status. No artificial ad refresh, new slot IDs, altered consent choices, or account-setting changes were made.

Requested the owner's current Policy centre/Sites warning or serving-limit message to continue diagnosing the account-dependent part. The earlier question about whether reloading an affected page restores ads remains unanswered. No authenticated AdSense connection is available in this workspace.

Raw browser results and the bounded reproduction script: `.artifacts/adsense-2026-10-08/live-diagnosis.json` and `diagnose.cjs`. No ad was clicked.
