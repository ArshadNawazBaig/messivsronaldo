# Production: messivsronaldo17.com

Status: deployed and HTTPS verified on 21 September 2026. Both apex and www DNS records are verified by Vercel.

Vercel project: `arshadnawazbaigs-projects/messivsronaldo17`.
Canonical origin: `https://messivsronaldo17.com`.
Database: `rivalry-production`, Neon Launch (verified 30 September 2026), region `iad1`. The Vercel functions use the same region.

Recovery verified on 30 September 2026 after the Neon plan upgrade: `/`,
`/goals`, `/api/comparison/career`, `/api/data-version`, and `/admin` returned
HTTP 200. The owner chose to keep Neon; the Supabase migration is paused.
Production database settings were not changed.

Supabase migration work is saved on `codex/supabase-migration`. Revisit it after
reviewing one month of charges on the upgraded Neon plan. The unused Supabase
Free destination remains connected to preview only; no data was transferred.

## Environment and data

Production needs `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, `SITE_INDEXABLE=true`, `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET` for automatic updates. `HEALTHCHECK_SECRET` authorizes the operational monitor. Keep database and admin secrets private. Google Search Console verification can optionally use `GOOGLE_SITE_VERIFICATION`.

The provider key is encrypted in the database; the app does not need the plain API-Football key in a public environment variable. Keep the existing admin secret when moving the database. Active sessions are intentionally not copied during migration; sign in again with the existing admin password.

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

## Schema setup

The request handler only opens its Postgres connection pool; it no longer creates
tables or runs schema checks on each cold start. Existing production tables are
already initialized. For a new database, supply its private `DATABASE_URL` and run
`npm run db:setup` before deploying. The command is idempotent and retains data.
The SQLite migration command also initializes its destination explicitly.
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
