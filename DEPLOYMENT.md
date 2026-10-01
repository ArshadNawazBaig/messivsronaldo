# Production: messivsronaldo17.com

Status: deployed and HTTPS verified on 21 September 2026. Both apex and www DNS records are verified by Vercel.

Vercel project: `arshadnawazbaigs-projects/messivsronaldo17`.
Canonical origin: `https://messivsronaldo17.com`.
Database: `rivalry-production`, Neon Launch (verified 30 September 2026), region `iad1`. The Vercel functions use the same region.

## AdSense preparation — 1 October 2026

Production deployment `dpl_BcQsRAcC4sD6rSEVGLC7MB3HRC4i` adds individual
interpretations for 25 club seasons, comparable-period changes, equal-time
calculations, and calendar/competition scope explanations. New content is
translated into all nine supported languages. Missing-minute samples never
acquire invented rates, and incomplete periods or changed season definitions
do not receive misleading previous-period comparisons.

The owner supplied his public editorial name, football/coaching background and
Facebook profile. `EDITOR_NAME`, `EDITOR_BIO` and `EDITOR_PROFILE_URL` are now
configured in production. About displays the biography and Person schema;
articles identify the editor while retaining their publication author. The
editorial statement explains sources, interpretation, corrections and AI assistance.

The privacy notice describes planned AdSense cookie use and visitor choices.
The owner subsequently supplied `ca-pub-1970746421579261` on 1 October 2026.
Production now has `ADSENSE_PUBLISHER_ID=pub-1970746421579261`, which generates
the verification meta tag and `ads.txt`. Advertising scripts remain inactive.
Follow the application/activation checklist in `README.md`; consent and actual ad placements
must be configured and checked before ad delivery. Search Console account
verification, indexing and organic traffic have not been verified in this release.

AdSense verification deployment `dpl_DQdiCHas4k3k47Pp7Uy3pGkrUNMG` is live.
The production build and four publisher tests passed. Anonymous crawler requests
verified the exact account meta tag once in the server-rendered `<head>` on 12
public pages spanning all nine languages, and `/ads.txt` returned HTTP 200 with
`google.com, pub-1970746421579261, DIRECT, f08c47fec0942fa0`. Google account-side
verification and review have not been submitted by this deployment.

Validation: lint, TypeScript, production build and 179 unit tests passed; one
isolated PostgreSQL test was skipped without its test database. Eleven browser
tests passed, including all club seasons without JavaScript, all calendar years,
nine-language rendering, mobile Safari, accessibility checks, and the support
submission/review/deletion workflow in a synthetic local database. Four live
mobile pages passed checks for editor identity, overflow, JavaScript errors and
unexpected advertising requests. Production support data was not modified.
The subsequent read-only production crawl checked 111 pages: every response
was HTTP 200, with matching canonical metadata and no public `noindex` flags.
It confirmed the new analysis, article editor schema, translated editor profiles
and planned-advertising notice. The root canonical's optional trailing slash was
normalized during verification; no production URL change was required.

The unusual duplicated path in the FIFA Ronaldo farewell citation was verified
as a real indexed FIFA page; it was retained. No external citation was replaced
merely because its URL looked unusual. This is independent application
preparation, not an approval issued by Google.

Recovery verified on 30 September 2026 after the Neon plan upgrade: `/`,
`/goals`, `/api/comparison/career`, `/api/data-version`, and `/admin` returned
HTTP 200. The owner chose to keep Neon; the Supabase migration is paused.
Production database settings were not changed.

Supabase migration work is saved on `codex/supabase-migration`. Revisit it after
reviewing one month of charges on the upgraded Neon plan. The unused Supabase
Free destination remains connected to preview only; no data was transferred.

## Comparison table layout — 1 October 2026

Table layout release `dpl_3tHWR2VrWV97Z3mvxh9tFE9AzXU6` was deployed on
1 October 2026. Calendar and club-season index columns now use fixed, equal
widths with centered headings and values. Honours keep a wider description
column and equal player columns; award stars no longer offset the numbers.
Period-change tables use consistent column widths and scroll within their
container on small screens. Scroll containers contain hidden captions and keep
Arabic calendar tables from widening the page. Safari menu links also remain
mounted through taps when a blur event has no next focus target.

Validation: lint, TypeScript and the production build passed, along with six
chart tests, eight honours/navigation tests, and 36 viewport/language checks
across Chromium and WebKit. The focused checks covered all nine languages,
320px and 1440px widths, stable columns after filter changes, related table
layouts, numeric alignment beside award stars, and accessibility in both themes.
Navigation tests were updated for current translated titles, touch/keyboard
focus behavior, and sitemaps containing additional published articles.
Twelve post-deployment browser checks passed, including Arabic layouts,
AdSense verification metadata, and Safari menu navigation.

Follow-up release `dpl_9joetCPpjDdksujk76QrM8h7FFBa` restores spacing on the
club-by-club page. Each player column now uses a grid with 24px gaps between
cards and below the player heading. Profile pages retain their existing grid
columns and spacing. Sixteen local and sixteen production Chromium/WebKit checks
passed across desktop and 320px layouts for English/Arabic club pages and both
player profiles. The production build passed and the release is deployed.

## Fan voting

Deployment `dpl_2o8EzQscyhKeM6a8xRx5R9Q5rVFK` adds `/vote` in all nine
languages, navigation, tools, search and sitemaps. The displayed totals begin
at Messi 4,021 and Ronaldo 3,810, explicitly labelled as publisher-set starting
values. Actual visitor votes are stored and displayed separately.

An additive production migration created `fan_votes`, `fan_vote_counts` and
`fan_vote_limits`; both visitor counters were zero before deployment. Existing
application records were retained. A unique hashed browser identifier and
transactional count updates prevent duplicate submissions, including races and
retries. The HTTP-only cookie is scoped to the voting API, with a renewable
400-day maximum lifetime. Clearing site data or using another browser can allow
another vote. A keyed network hash limits new votes to 60 per hour. Both storage
policies document the new feature. The page shell remains cacheable; per-browser
voting responses use `private, no-store`.

Validation: lint, TypeScript, local and Vercel production builds passed. All 182
unit/integration cases passed, including SQLite and isolated PostgreSQL voting
checks. Ten browser cases passed across Chromium and mobile WebKit, covering
duplicate votes, concurrent tabs, independent browsers, reloads, lost responses,
blocked cookies, service errors, nine languages, mobile layout and accessibility
in both themes. Production write tests were not used.
Eleven live browser/language checks confirmed the starting totals, zero visitor
votes, cookie attributes, private API responses, rejected invalid submissions,
translated metadata, sitemaps and storage disclosures. No synthetic vote was
added to the public poll.

## AdSense loader — 2 October 2026

Deployment `dpl_G4DpPeQDHCvZMc6M492VNfLorX9H` is live on the canonical domain.

The owner supplied the Google loader for `ca-pub-1970746421579261` and confirmed
that a European regulations consent message is not yet set up. Production uses
`ADSENSE_SCRIPT_ENABLED=true` and `ADSENSE_ADS_ENABLED=false`. The public document
head renders the supplied async script once, with anonymous cross-origin mode,
after setting `adsbygoogle.pauseAdRequests=1`. Load handlers prevent React from
hoisting the external script ahead of that initializer. Public client navigation
does not reload it, and the separate admin document excludes it. The existing
verification meta tag and `ads.txt` remain unchanged.

The loader can make technical requests to Google while ad requests are paused.
Privacy/cookie notices describe that behavior in all nine languages. Publishing
and testing the consent message, confirming Google approval, and reviewing ad
placement remain account-side activation tasks. The ad-request flag is not a
consent mechanism and must not be treated as one. See the activation checklist
in `README.md` and Google's [pause examples](https://support.google.com/adsense/answer/9042142?hl=en)
and [consent-message setup](https://support.google.com/adsense/answer/10960768?hl=en).

Validation: lint, TypeScript, the production build and 18 targeted unit tests
passed; the translation/publisher tests also passed with the loader enabled and
ad requests paused. Eleven Chromium/WebKit checks covered all nine languages,
the exact server-rendered head markup, pause-before-load ordering, client
navigation, admin exclusion, verification metadata, `ads.txt` and updated
disclosures. Browser checks stub Google's script to avoid ad impressions.
The same eleven checks passed on production after deployment, confirming the
configured publisher ID and paused requests. Account approval and a published
Google consent message have not been verified; real consent flows and ad
delivery were not exercised by the stubbed loader checks.

## PageSpeed improvements — 2 October 2026

Deployment `dpl_ES57Cm8ssP8Tc1nWvzz7ozP71bUQ` is live on the canonical domain.

Comparison portraits now request widths matching their actual CSS crop and use
quality 75, eager loading and `fetchPriority="high"`. Additional image widths
avoid large gaps between responsive variants on high-density displays. The
original licensed assets and export image quality are unchanged.

Admin workspace/calendar styles are imported only by the admin layout. Export
launch buttons have a small independent stylesheet; dialog styles load with the
export UI. Turbopack graph chunking with a 5 KB request cost separates unrelated
route styles. Thai font rules apply to Thai pages, so the English footer's
language link no longer initiates a Thai-font download.

Closed navigation menus and the search dialog mount their contents when opened;
navigation artwork loads on demand. Comparison content, editorial text and the
site-map link remain server-rendered. The mobile options panel uses its fixed
inset container's height to avoid clipping in Safari landscape.

The AdSense implementation above has been updated: the pause initializer remains
in the server-rendered head, while Next.js `lazyOnload` loads the Google SDK after
page load during browser idle time. The verification meta tag and `ads.txt` remain
server-readable, ad requests stay paused, public navigation deduplicates the SDK,
and the separate admin document excludes it. This follows the framework's
[Script loading strategy](https://nextjs.org/docs/app/api-reference/components/script#lazyonload).

CSS inlining and extra chart hydration boundaries were measured in an isolated
build and omitted because they did not improve this page's mobile audit. The
remaining legacy-JavaScript finding comes from Next.js's built-in compatibility
bundle; no framework internals or browser support were removed to suppress it.

Validation: production build, lint and TypeScript passed; 183 unit tests passed
with one existing PostgreSQL-only test skipped. All 42 selected browser tests
passed in desktop Chrome, mobile Chrome and mobile Safari, covering comparison
options, menu keyboard access, search, charts, themes and accessible data pages.
Eleven loader/font checks covered all nine languages plus Safari, including
pause-before-execution, load/idle timing, deduplication, admin exclusion and
verification. The admin export launch/dialog styles were checked with a mocked
local session; no real export or production write was issued. All eleven
loader/font checks also passed against the deployed canonical site.

With identical mobile emulation, portrait resource bytes dropped from 196,604
to 33,314 (83%), uncompressed CSS from 247,292 to 160,095 (35%), and initial DOM
elements from 1,869 to 957 (49%). Compressed CSS transfer fell 13%; the CSS byte
and transfer percentages are different measurements. The 26,924-byte Thai font
is no longer fetched on English pages. These resource figures are more stable
than individual Lighthouse scores. Both before/after measurements retain the
page content and responsive image density; no audit-user-agent special case is
used.

Measurement and browser artifacts are in `.artifacts/pagespeed-fix/`. Google's
unauthenticated PageSpeed API returned HTTP 429 (shared daily quota exceeded), so
local Lighthouse reports are labelled separately from Google-hosted PageSpeed
results. The hosted UI report also remained in its loading state for four
minutes; it is not evidence of a completed Google-hosted test.

Fresh Lighthouse 13.5.0 runs against the canonical live site measured mobile
performance 58 before and 83 after, FCP 2.6s → 1.3s, LCP 5.6s → 3.2s, TBT 540ms →
420ms, and CLS 0. Desktop measured 100 performance, 0.4s FCP, 0.7s LCP and 10ms TBT.
Accessibility, best practices and SEO measured 100 on both devices. Reports are
`live-before-mobile.json`, `live-after-mobile.json/html` and
`live-after-desktop.json/html` in the artifact directory. These are individual
lab runs; background host activity, network and Google SDK responses can vary.
The user's earlier 86-point screenshot is a different test, not this baseline.
A 90+ mobile score has not been established. The remaining JavaScript warnings
include Google's SDK and framework runtime; preserving those integrations leaves
some unused/compatibility code in the audit. No arbitrary timer or crawler-specific
behavior was added to hide work outside the measurement window.

## Environment and data

Production needs `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, `SITE_INDEXABLE=true`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET` for automatic updates. `HEALTHCHECK_SECRET` authorizes the operational monitor. Keep database and admin secrets private. Google Search Console verification can optionally use `GOOGLE_SITE_VERIFICATION`.

The provider key is encrypted in the database; the app does not need the plain API-Football key in a public environment variable. Keep the existing admin secret when moving the database. Active sessions are intentionally not copied during migration; sign in again with the configured admin email and existing password. The email is private and must not use a `NEXT_PUBLIC_` prefix. When deploying the separate admin workspace, add `ADMIN_EMAIL` to Vercel before deployment; existing password and session-secret values remain unchanged.

## Database-load improvements

The original cache improvements were deployed in commit `e766421` on 30 September
2026. Public statistics and blog reads are cached across requests for up to one hour.
Statistics, article content per language, navigation metadata, and image visibility
now have separate invalidation tags. A changed statistics revision expires the
statistics cache; article publication, unpublication, and deletion expire the
relevant language, navigation, and visibility caches. Draft saves and syncs that
publish no changes leave public caches intact. Partial batches still invalidate
statistics if they committed changes before failing.
The version endpoint reads the shared snapshot without recalculating statistics
or querying Postgres on every visitor poll. Caches are isolated by database.
Admin state, sessions, and writes remain uncached. A cache miss still needs a
working database.

Navigation and language links use a small article index. Article pages fetch
published content for the requested locale; private drafts are excluded by SQL.
Unpublished and deleted overrides are retained so built-in articles stay hidden.
Image access checks return a boolean instead of downloading all blog records.
Immutable image bytes are cached on the server for a day in 512 KiB chunks, with publication/admin
access checked on every request. HTTP responses remain `private, no-store` so
unpublishing is enforced on the next request, including for previously cached
images. Publication changes expire visibility without downloading the image bytes
again. Admin session checks are never cached. Admin article lists read only the
selected language; saving reads the affected article and checks image sizes
instead of downloading all articles and image contents.

Read-only measurements on 30 September 2026 found 471,191 bytes of stored blog
records across 17 rows. The new navigation query serialized to 3,582 bytes,
approximately 99.2% smaller before protocol overhead. This is one query's payload
reduction, not a forecast of total Neon charges. Compare daily transfer against
request volume after deployment to measure the actual savings.

Validation: 149 tests passed across the unit and isolated PostgreSQL suites; lint,
TypeScript, the production build, and four targeted browser tests passed.
`npm run test:cache` recorded zero statements for 18 repeated page, version,
article, and image requests after cache warmup. It verified draft/no-op cache
retention, selective statistics/language refreshes, and anonymous image access
revocation while retaining admin previews. This integration check requires a
production build, a fresh local `rivalry_test_*` PostgreSQL database in
`TEST_DATABASE_URL`, and `TEST_POSTGRES_LOG` pointing to its `log_statement=all`
log. Never use production for write tests.

## Vercel CPU, transfer and function storage

The initial page/poster optimizations were committed in `5755371`. Follow-up
production requests to `/`, `/goals` and `/es/goals` returned Vercel `HIT` on
30 September 2026. The additional CPU changes below are prepared locally and
still require deployment:

- Public pages and their shared statistics/article reads use a one-day fallback
  lifetime instead of regenerating hourly. Publishing invalidates
  the existing data tags and their rendered pages. Locale comes from the URL;
  admin session checks run separately so visitor cookies do not disable caching.
  The query-dependent comparison-poster studio remains dynamic.
- The comparison API, sitemap, and `llms.txt` use one-hour ISR; `/api/data-version`
  uses 30-second ISR in addition to its short CDN lifetime. These responses track
  publication tags, including article removal from both crawler feeds. Metadata
  routes can expose a browser revalidation header while their ISR lifetime is
  defined by the prerender manifest. Build-time feed generation now needs the
  initialized deployment database to be reachable.
- Shared social previews render at `/opengraph-image/dark` and `/opengraph-image/light`
  and reuse completed PNG responses with one-hour ISR. Old query-string URLs
  redirect to these paths. Publishing statistics invalidates the previews.
- Each server instance retains one calculated statistics snapshot by revision.
  Every request still reads the tagged source snapshot before reusing calculations,
  preserving cross-instance publication invalidation. This memory cache is bounded
  and does not replace the shared data cache.
- The routing middleware skips already-protected admin routes and Vercel telemetry,
  as well as exempt assets. Public route maintenance and language handling remain
  active. Poster option changes wait 600 ms before starting image generation,
  avoiding intermediate renders that would continue even after fetch cancellation.
- Public navigation links do not automatically prefetch every visible destination
  and its statistics payload. Pages load when selected, using the shared cache.
- Visible tabs check the published version every five minutes, with throttled
  checks on returning to the tab. The version response has a 30-second browser
  and CDN lifetime. An already-open page can take a polling interval plus that
  short cache lifetime to show new statistics; hidden tabs resume checking when visible.
- Public PNG URLs include the dataset and artwork versions. Completed PNGs use
  ISR and a one-day browser/CDN lifetime. Old uncached versions redirect to the
  current version. Bump `publicPosterRenderVersion` after changing poster artwork.
  Temporary rendering failures throw instead of returning an error response that
  ISR could persist; overloaded requests can retry without a cached failure.
  Private admin exports and unpublished blog media retain authorization checks.
- Vercel function traces exclude Sharp's optional WASM fallback while retaining
  its native renderer. Verify PNG generation on the deployed Linux runtime.

The earlier read-only deployment audit found 86 retained deployments (84 production,
two previews), with 30-day retention configured for every status. No deployments
were deleted. The API rejected a retention update, so those settings are unchanged.
Review **Project → Settings → Security → Deployment Retention** in Vercel;
shorter preview/canceled/errored retention can reduce future accumulation. Keep
the active production deployment, useful rollback deployments, and the Supabase
migration preview. Most existing deployments are production, so shortening only
preview retention will have little effect on the current total.

After deployment, check repeated anonymous `/goals` and `/es/goals` requests for
cache hits, correct language and no admin controls. Publish a controlled real
update through the normal admin workflow and confirm the new statistics appear;
never run synthetic write tests against production. Compare Active CPU and Fast
Origin Transfer against request volume over the following days. Function Storage
is retained bundle usage billed as GB-month, so the rolling usage chart does not
immediately reset after a smaller deployment or cleanup. See Vercel's
[storage documentation](https://vercel.com/docs/deployment-storage) and
[retention documentation](https://vercel.com/docs/deployment-retention).

The follow-up CPU investigation used the owner's hot-route list: localized
overview, general comparison pages, club seasons, calendar seasons, articles,
player profiles, and the comparison-poster studio. Vercel's project and metrics
APIs returned `403 Not authorized`, so route CPU totals and CPU per invocation
could not be retrieved. Do not treat a local calculation benchmark or cache hits
as a measured reduction in billed CPU. Use the same routes and comparable traffic
windows after deployment, as described in Vercel's
[Active CPU guide](https://vercel.com/kb/guide/optimize-active-cpu-on-fluid-compute).
Accumulated usage is not erased by deploying optimizations. Out-of-band database
edits must also invalidate public tags or wait for the daily fallback; the normal
admin and scheduled publication workflows already invalidate those tags.

Local validation: production build, lint, TypeScript and 151 unit tests passed
(one PostgreSQL integration test skipped without its isolated test database).
The previous browser pass covered all sitemap URLs, desktop and mobile Safari languages,
404 recovery, authenticated exports, blog publication/access revocation, cache
invalidation after statistics edits, anonymous request counts, poster reuse and
recovery after intentionally overloading the renderer. No production write tests
or deployment cleanup were performed. Follow-up checks cover the reported hot
page types with one-day cache headers, crawler/social-preview cache reuse,
statistics and article invalidation, and batching poster option changes.

## Schema setup

The request handler only opens its Postgres connection pool; it no longer creates
tables or runs schema checks on each cold start. Supply the target environment's
private `DATABASE_URL` and run `npm run db:setup` before the first deployment and
before any release that adds tables or indexes, including releases to an existing
database. The command is idempotent and retains existing records and settings.

The support inbox requires `support_tickets`, `support_limits`, and their indexes.
The dashboard also queries `support_tickets` for its summary; deploying that code
without applying the schema causes an authenticated dashboard request to fail
with Postgres error `42P01` (missing relation). Run `npm run db:setup` against the
same database configured in Vercel Production to apply these additive changes.
Do not use `db:migrate` for this upgrade: that command imports a local SQLite
archive into an empty destination.

Future schema changes should be reviewed and applied as explicit migrations.

## Monitoring and cost tracking

The owner selected **US$10 per month** for Neon spending alerts. This is a
notification threshold, not a spending cap. Applying it and verifying Neon's
hosted recovery window still require access to the Neon account; the current
Vercel integration does not expose those controls. Neither is claimed configured.
In Neon Usage/Billing, record month-to-date cost and daily network transfer,
compute, and storage, alongside Vercel request counts, during the one-month
evaluation before deciding whether to use the Supabase migration branch.

The `Production health` GitHub Actions workflow checks the homepage and the
authenticated `/api/health` endpoint hourly, with three attempts. The health
endpoint bypasses caches to check the database and detects failed, missing, and
stalled daily syncs after the Hobby cron window plus grace (10:00 UTC). Partial
coverage is reported but is not treated as an outage. The monitor uses a separate
random `HEALTHCHECK_SECRET`, configured in Vercel Production and GitHub Actions;
it grants no admin or cron access. Missing/invalid authorization returns 401.

Failed checks appear in GitHub Actions. Enable **Settings → Notifications → Actions
→ Send notifications for failed workflows only** and email delivery in the
owner's GitHub account; delivery preferences have not been verified. See
[GitHub workflow notifications](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).
Schedules
can be delayed, and GitHub disables scheduled workflows in public repositories
after 60 days without repository activity ([schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)). This is an hourly operational check,
not a guaranteed immediate alert for every isolated 500 response.
Server failures also emit structured `rivalry_server_error` logs with error codes
and digests while omitting SQL, messages, cookies, credentials, and drafts.
Vercel's paid built-in anomaly alerts were not enabled on this Hobby project.

## Postgres backup and recovery

`npm run db:backup` creates a private, custom-format dump under the ignored
`.artifacts/backups/` directory. It uses `DATABASE_URL_UNPOOLED` when available,
otherwise `DATABASE_URL`, and requires `pg_dump` matching the server major version
or newer (production is PostgreSQL 18). Set `PG_BIN` if the binaries are outside
PATH. An optional output filename is accepted after `--`; existing files are
never overwritten. Backups include article images and encrypted provider
settings. Retain `ADMIN_SESSION_SECRET` separately to decrypt those settings.

To test recovery, use a **new isolated database**, remove its empty default
`public` schema without CASCADE, then run `pg_restore --no-owner --no-acl
--exit-on-error --dbname=<isolated-database> <backup.dump>`. Do not restore over
production. Compare all table row counts and content hashes against the same
source snapshot, including image bytes; check sequence values before reopening
write traffic. Keep an encrypted off-device copy in the owner's backup storage.
The local dump is a recovery checkpoint, not an automated off-site backup policy.

Restore verified on 30 September 2026: a 297,598-byte snapshot was restored into
an isolated local PostgreSQL 18 database. All nine tables matched the source
snapshot by row count and content digest, including 17 article records and 13
images; both sequence values also matched. Production was only read. The private
backup is `.artifacts/backups/rivalry-2026-09-30-restore-tested.dump`; its verification
report is `.artifacts/neon-reliability/backup-verification.json`.

## Existing SQLite migration

The local SQLite database remains the local development default. On Vercel, missing `DATABASE_URL` is an error, not a fallback to temporary local storage. Production is connected to Neon; preview deployments require their own isolated database and admin secrets before the admin or public data routes will work. Never point automated write tests at production.

One-time migration to an **empty** Postgres database:

```sh
npx vercel env pull .artifacts/vercel-production.env --environment production
npx tsx --env-file=.env.local --env-file=.artifacts/vercel-production.env scripts/migrate-database.ts
```

The migration keeps matches, revisions, audit history and encrypted settings, checks that the existing admin secret can decrypt the connection, and refuses to overwrite a nonempty destination. `.artifacts/pre-vercel-admin.sqlite` is the private pre-migration backup. `.env*`, `.data`, `.artifacts` and test outputs are excluded from deployment uploads.

To deploy current local source:

```sh
npm run lint
npm test
npm run build
npx vercel deploy --prod --yes
```

Do not upload local admin passwords or database backups. Vercel builds using its production environment values, not the local preview URL. Public indexing is enabled only with the production origin, `SITE_INDEXABLE=true`, and a production deployment. Preview environments stay noindex. The `www` host permanently redirects to the apex domain and preserves the path/query.

## Automatic daily statistics

`vercel.json` schedules `GET /api/admin/daily-sync` with `0 8 * * *` (08:00 UTC / 1 PM Pakistan time). Cron jobs activate on production deployments, not preview or local servers. Hobby plans may invoke the job at any time during the scheduled hour.

Before deploying, add a private random `CRON_SECRET` to the project's **Production** environment variables (at least 32 random bytes, e.g. `openssl rand -hex 32`). Do not use a `NEXT_PUBLIC_` prefix. Vercel automatically sends it as a bearer token; the endpoint refuses requests if the secret is missing or incorrect. The existing encrypted API-Football connection and stable `ADMIN_SESSION_SECRET` must also be available in production. See [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and [schedule limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

After deploying, verify the schedule under **Project → Settings → Cron Jobs**, and check **Admin → Daily updates / Activity log** after execution. The dashboard reports when deployment configuration or the provider connection is missing. The endpoint uses the same shared database lock and revision checks as manual syncs, stores progress after each date, and invalidates public pages after the batch. Daily attempts are deduplicated in the database, including failed attempts. A four-minute budget leaves time to save progress before the function and lock expire at five minutes. Each batch is limited to seven dates; unresolved dates and any catch-up backlog continue the next day. Public goal-type details and honours remain at their reviewed cutoff because the existing provider adapter only supplies core match statistics.

## Domain DNS

Vercel returned these project-specific records on 21 September 2026. In GoDaddy DNS, replace the parking A records for `@` (`13.248.243.5`, `76.223.105.230`) with:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | 671dc91e9e34a9c2.vercel-dns-017.com |

Keep email and unrelated DNS records. Both domains are attached to the Vercel project. Recheck the exact recommendations in Vercel if configuring the domain later.

```sh
npx vercel domains verify messivsronaldo17.com
npx vercel domains verify www.messivsronaldo17.com
```

Vercel provisions HTTPS after DNS is valid. Check both hosts, redirect behavior, `/robots.txt`, `/sitemap.xml`, page canonicals, the social image, and the protected admin sign-in.

## Google Search and AI search

1. Open https://search.google.com/search-console and add the **Domain** property `messivsronaldo17.com`.
2. Add Google's exact verification TXT record at `@` in GoDaddy. This is an additional record; keep the Vercel A records.
3. Verify ownership and submit `https://messivsronaldo17.com/sitemap.xml` under Sitemaps.
4. Use URL Inspection on the homepage and priority pages (`/goals`, `/assists`, `/honours`, `/international`, `/2026`). Run the live test, then request indexing where appropriate.
5. Monitor indexing, Core Web Vitals, impressions, clicks and queries such as “Messi vs Ronaldo”. Search Console verification and sitemap submission require the owner's Google account; deploying the site does not perform those steps automatically.
6. Keep match updates sourced and publish useful original analysis when new matches or milestones occur. The current snapshot is dated and must not be presented as a live feed. Earn relevant editorial links; avoid bought links, doorway pages or repetitive keyword pages.

Implemented: server-rendered statistics, descriptive titles and summaries, canonical URLs, robots controls, sitemap, social previews, Website/Organization/Person/Article/Breadcrumb/Dataset structured data, internal navigation, a source register and visible comparison answers. `llms.txt` is a convenience index for systems that use it, not a Google ranking factor. Structured data reflects visible content and does not guarantee rich results.

Google's current guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide. Traditional SEO fundamentals also support AI search. Indexing, first-page positions, AI citations and advertising income are not guaranteed. Sustained accuracy, useful content, performance and reputation matter beyond deployment.

## Validation

The Postgres integration suite requires an explicitly isolated database whose name starts with `rivalry_test_`:

```sh
TEST_DATABASE_URL=postgresql://localhost/rivalry_test_example npm test
```

It checks restart persistence, rollback, stale writes, concurrent publications, undo, sync locking, encrypted credentials, login throttling and session revocation. Ordinary unit tests and browser tests use local/synthetic databases; see `VALIDATION.md` and `ADMIN_GUIDE.md`.
