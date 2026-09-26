# Production: messivsronaldo17.com

Status: deployed and HTTPS verified on 21 September 2026. Both apex and www DNS records are verified by Vercel.

Vercel project: `arshadnawazbaigs-projects/messivsronaldo17`.
Canonical origin: `https://messivsronaldo17.com`.
Database: `rivalry-production`, Neon Free, region `iad1`. The Vercel functions use the same region.

## Environment and data

Production needs `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, `SITE_INDEXABLE=true`, `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET` for automatic updates. Keep database and admin secrets private. Google Search Console verification can optionally use `GOOGLE_SITE_VERIFICATION`.

The provider key is encrypted in the database; the app does not need the plain API-Football key in a public environment variable. Keep the existing admin secret when moving the database. Active sessions are intentionally not copied during migration; sign in again with the existing admin password.

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
