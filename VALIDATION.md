# Validation — admin dashboard and September 2026 data

Validated on 21 September 2026 against the optimized Next.js production server at http://localhost:3001.

- Production build and TypeScript: passed. Public data pages are server-rendered on demand so admin publications appear without rebuilding.
- ESLint: passed.
- Data, calendar and admin unit tests: 41 passed after the live API and calendar changes below.
- Browser cases: 27 passed across desktop and mobile Chromium in the final production run; the desktop instance of the mobile-only drawer case is intentionally skipped.
- Production HTML contains the statistics without JavaScript. Career totals are 930 / 979; API coverage ends `2026-09-21`.
- Browser coverage includes hydration, the 2026 scope, per-90 calculations, goal-type tabs, source dialogs, restored share state, year/club filters, zero-minute rate handling, CSV downloads, search, theme persistence, correction reports and invalid-route handling.
- Automated axe WCAG A/AA checks passed on the homepage in both themes, on desktop and mobile. Additional desktop and mobile checks cover years, clubs, honours and World Cup pages, including keyboard access to the horizontally scrolling honours table.
- Desktop/mobile screenshots were inspected. Home, year explorer and club pages do not overflow the viewport. Wide data tables scroll within their own containers.

## Data reconciliation

All 25 calendar years reconcile to career goals, assists, appearances and minutes. Each year's club + country totals reconcile. Eight club records reconcile to the club totals. Body-part and scoring-type partitions add up, and penalty conversion uses attempts. UEFA's distinct Champions League assist definition is tested separately.

The 2026 calendar figures are explicitly partial-year totals. The award timeline ends in 2025, the most recent completed Ballon d'Or edition at the snapshot date.

## Evidence and limits

These are checks on the reviewed source snapshot and application behavior, not independent verification of every historical match event. Sources, provider differences and remaining coverage gaps are documented in `DATA_SOURCES.md` and `/methodology`.

The API-Football connection and the completed Inter Miami match on `2026-09-20` were verified with a locally supplied key. This was a baseline check, not a new publication; it does not establish coverage across every competition or a live post-baseline import. Post-baseline matches can be published through the protected dashboard without a rebuild once covered. No public domain or deployment was configured. The local preview keeps indexing disabled; production requires the final origin and `SITE_INDEXABLE=true` at build time. Advertising and revenue collection are not connected.

The prior release's Lighthouse report is retained only as an ignored historical artifact; its scores are not claimed for this expanded build. Automated accessibility tests do not establish complete accessibility conformance or search rankings.

Screenshots for this release are in `.artifacts/2026-*.png`.

## Dropdown redesign

All five dropdowns use the shared styled select component. The production build and lint pass. Browser checks cover keyboard/typeahead selection, Escape and outside-click dismissal, restored focus and background interaction, selected options, long year lists, viewport positioning, and open-menu accessibility in both themes. Desktop and mobile screenshots are stored in `.artifacts/dropdown-final-*.png`.


## Admin dashboard

Twelve dedicated desktop/mobile browser cases pass against an isolated database on port 3002. They cover protected pages/APIs, origin validation, incorrect passwords, HTTP-only SameSite sessions, logout revocation, dashboard navigation, date validation, stale revisions, missing-provider errors, manual-entry controls, downloads, publication removal/undo, current server HTML/API/calendar values, preserved goal-type coverage, and the shared calendar. Full axe checks pass on all admin tabs, in both themes, on the manual editor and on the open calendars. The normal public-site suite's prior validation remains 27 passing cases with one intentional skip.

Unit cases cover core-stat aggregation, preserved cutoffs/exports, new calendar years, duplicate/baseline exclusions, same-day import replacement, explicit cancellations, missing prior records, protected corrections, atomic SQLite transactions, revision conflicts, undo, encrypted provider credentials, sync locks, identity discovery, final-score/event reconciliation, missing/ambiguous player data, friendlies, live/suspended/shootout fixtures, and manual publishing/validation. The production `.data/admin.sqlite` contains no synthetic matches; tests use memory or `.artifacts/admin-integration.sqlite`.

Admin screenshots were inspected at desktop and phone widths in both themes (`.artifacts/admin-*.png`). Setup, persistent-storage requirements and provider coverage limits are in `ADMIN_GUIDE.md`. A verified connection is not evidence of complete match-stat coverage.

## Al Nassr connection fix

The connection lookup searches `Nassr`, then checks the returned name, country and national-team flag locally. The live provider rejected the previous combined `search`/`country` parameters; regression tests now enforce that request constraint. Tests also cover accepted aliases, foreign namesakes, youth teams, missing country metadata, and ambiguous candidates.

The HTTP client follows complete, consistent result pages (maximum 10), reports endpoint-specific provider errors with credentials redacted, and stops on exhausted quotas. Failed connection attempts appear in the private activity log. Live fixture responses also exposed the absence of `league.type`; tracked club fixtures now resolve it through `/leagues` before classification. Tests reject missing competition metadata rather than misclassifying league matches as cup matches.

The production admin connection returned HTTP 200 and persisted the verified identities across a server restart: Messi player 154, club 9568, Argentina 26; Ronaldo player 874, club 2939, Portugal 27. The `2026-09-21` admin date check returned HTTP 200 with zero tracked fixtures and zero player records. Published data remained at revision 0 with no match additions. These checks do not establish full current-season player-stat coverage.

The admin theme accessibility check waits for finite color transitions to finish before measuring contrast; an initial mobile failure measured an intermediate button color. No production UI styling was changed for that test adjustment.

## September 20 fetch and shared calendar

The exact date from the reported error, `2026-09-20`, succeeded through the admin endpoints on ports 3000 and 3001. A final live browser check on the rebuilt port-3001 preview selected that day in the custom picker, clicked **Fetch & update stats**, and received one tracked fixture and one verified player record. League metadata, player statistics and complete goal events reconciled. Since this date is inside the baseline, the published ledger stayed at revision 0 with no added match. Minimal public fields from this response are retained in `tests/fixtures/api-football-2026-09-20.json` as an offline regression fixture; it contains no credentials.

Provider schema errors now identify the date, fixture and fields instead of showing a generic form/evidence-URL error. Selecting another sync date clears the previous message.

All three native date inputs were replaced by `DatePicker`: daily sync, record filtering and manual match dates. The shared control uses UTC date arithmetic, custom month/year selectors, selected/today states, future/minimum date limits, an optional clear action, arrow/Home/End/Page Up/Down keyboard navigation, Escape/outside-click dismissal and restored trigger focus. Empty allowed ranges disable selection and manual publication. The popup stays within the viewport, bringing the field into view when neither side has room for the whole calendar.

All 41 unit tests, 12 admin browser cases, ESLint and the production build pass. Four calendar cases were rerun after final spacing/position changes and passed. Open calendars were visually inspected on desktop and mobile; screenshots are in `.artifacts/date-picker-*.png`. `.artifacts/admin-fetch-sep20-success.png` records the successful live browser check. No native `input[type=date]` remains in the source or rendered admin page.

## Vercel production deployment — 21 September 2026

- Live origin: https://messivsronaldo17.com. Deployment `dpl_2Gkcio6nSw6yqS9cVvFsWMzzJ4yW` is ready; both apex and www DNS configurations are verified by Vercel and HTTPS certificates were issued.
- Neon Free database `rivalry-production` in `iad1`; migrated 0 post-baseline records, 12 activity entries and revision 0. Existing encrypted provider settings were preserved. Local SQLite backup saved privately before migration.
- 43 unit/database tests passed, including an isolated real Postgres test for restart persistence, atomic/stale/concurrent publications, rollback, undo, sync locks, encryption, rate limiting and session revocation.
- 12 admin browser tests passed. 27 public browser tests passed across the full run and targeted rerun; one desktop-only inapplicable mobile test skipped. The dropdown test now waits for Radix's deferred typeahead focus before pressing Enter.
- Production build, TypeScript and lint passed.
- Live checks passed on eight key pages: status 200, correct canonical domain/path, index/follow, descriptions, one H1, valid JSON-LD and no browser runtime errors. Robots, sitemap, llms.txt, social image and comparison API verified. www redirects to apex while retaining path and query.
- Live admin verification: unauthorized access rejected; existing admin password works; saved provider connection present; revision unchanged; secure HTTP-only session cookie; logout revokes access. No synthetic matches were written to production.
- Lighthouse 13.5.0, mobile lab run on live homepage: Performance 91, Accessibility 100, Best Practices 100, SEO 100. FCP 1.3s, LCP 2.9s, TBT 210ms, CLS 0. These are a single lab run, not field Core Web Vitals or a ranking guarantee. Remaining lab opportunities include unused framework JavaScript and image sizing.
- Reports and screenshots are in ignored `.artifacts/lighthouse-production.json`, `.artifacts/production-validation.json`, and `.artifacts/production-home-*.png`. During DNS cache propagation, verification used the production domain with its verified Vercel address; HTTPS certificate validation remained enabled.
- Owner's Google Search Console verification and sitemap submission remain external account steps; see DEPLOYMENT.md. No search ranking or AI citation is claimed.
