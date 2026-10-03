# Railway migration

Production migration: 3 October 2026. The canonical website is
https://www.messivsronaldo17.com on Railway Hobby, using GoDaddy DNS without
Cloudflare. Its authoritative CNAME, Railway ownership verification, trusted
HTTPS certificate, and direct Railway requests have been verified. GitHub CLI
is connected as `erushbaig` and Railway as `erushbaig@gmail.com`.

Railway project: `luminous-optimism` (`baf7eb9a-c51c-4b44-a442-f8447acb807e`),
environment `production`. Web service: `messivsronaldo`
(`891a9749-7286-4557-a224-6807a077383e`). Generated service URL:
https://messivsronaldo-production.up.railway.app.
Daily job: `daily-sync` (`87bda577-9333-4de3-a8be-bc4919c4d21c`).
Both services use `ArshadNawazBaig/messivsronaldo`. The migration was prepared on
`codex/railway-migration`; production should track `main` after its fast-forward
to the migration commits. Do not deploy the older pre-migration code onto Railway.
The initial preview was non-indexable. The cutover build targets
`https://www.messivsronaldo17.com` and enables indexing for that canonical origin.
The old Vercel cron was removed in the transition deployment. Railway's daily
job is being enabled and verified as the final scheduler handover.
Keep the existing Neon database; no production data migration
or schema change is required.

Local validation on 3 October 2026 passed: production build with Railway
environment variables, lint, TypeScript, 189 unit tests, the separate PostgreSQL
integration test, and seven smoke-check groups through a synthetic HTTPS reverse
proxy. Those checks covered browser sign-in, secure cookies, support, voting,
origin rejection, locale redirects, hosting disclosures, generated images and
readiness failure/recovery. Logs are under `.artifacts/railway-migration/`.
The Railway Linux build and all seven hosted smoke-check groups also passed
against isolated Postgres. Spoofed `X-Real-IP`, `X-Forwarded-For`, and
`X-Vercel-Forwarded-For` could not change the actual-client rate-limit keys in
either voting or support. Hosted receipts are in the same artifact directory.
A private Neon backup was taken before connecting production data. The saved
encryption secret decrypts the existing provider settings, and the saved health
token authenticates successfully against current production.
The preview is now connected to Neon. Twelve read-only checks passed with actual
production data, including authenticated database health, editor/publisher
settings, public routes, generated media, and browser rendering. Health remained
successful after deleting the temporary test database. The cron image built
successfully and its manual execution exited with
`Daily sync is disabled for this deployment.`

## Web service

Use Railpack, Node 22, and a single replica in the US East region
nearest the existing Neon `iad1` database. Settings are stored on the Railway
service via the dashboard/API. Railway rejects legacy Config as Code for new
services, so do not add `railway.json` or `railway.toml`.

| Web setting | Value |
| --- | --- |
| Builder | Railpack |
| Build command | `npm run build` |
| Start command | `npm run start:railway` |
| Health check | `/api/ready`, timeout 120 seconds |
| Restart policy | On failure, maximum 5 retries |
| Replicas | 1 |
| Public domain target port / `PORT` | 3000 |

The start command binds to `0.0.0.0`
and Railway's `PORT`. `/api/ready` checks initialized database access and returns
only an HTTP status plus `ok`; detailed monitoring remains at authenticated
`/api/health`.

Use the saved production values for `DATABASE_URL`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and
`HEALTHCHECK_SECRET`. Preserve the session secret exactly: stored football API
credentials are encrypted with it. Do not print or commit any private values.
Railway's web and cron services share a newly generated `CRON_SECRET`.
The existing Vercel secret is retained for rollback; its scheduler is disabled.
Copy the current public publisher/editor/AdSense/Search Console configuration
from the production deployment as well. Do not copy `VERCEL`, `VERCEL_ENV`,
`ADMIN_DATABASE_PATH`, or other Vercel-generated variables.

The application uses `NEXT_PUBLIC_SITE_URL` for Railway origin validation and
public redirects, because self-hosted Next.js request URLs can contain an
internal bind address. The preview must use its own configured HTTPS origin.

For the initial preview use its Railway HTTPS URL in `NEXT_PUBLIC_SITE_URL`,
`SITE_INDEXABLE=false`, `DAILY_SYNC_ENABLED=false`, and `MAINTENANCE_MODE=false`.
Use isolated Postgres and synthetic credentials for write tests. Only connect
the production database after these checks, then use read-only verification
until cutover. Do not run database setup/migration scripts against the existing
Neon production database as part of deployment.

On Railway, a missing database URL fails closed instead of creating temporary
SQLite storage. Support and voting use Railway's documented `X-Real-IP` header.
Verify on the actual ingress that client-supplied headers cannot spoof this value
before switching production. Keep the web process behind Railway HTTP ingress;
do not expose its port through a public TCP proxy. Any additional reverse proxy
requires its own verified client-IP trust configuration.

Keep one application replica initially: Next.js cache invalidation is local to
the running application. Shared cache storage/invalidation is required before
running multiple replicas or regions. Avoid administrative publication during
DNS propagation because the old Vercel cache and new Railway cache are separate.

## Daily sync service

Use a second service from the same repository with Dockerfile path
`Dockerfile.cron`, start command `node run-daily-sync.mjs`, cron schedule
`0 8 * * *` UTC, and restart policy `NEVER`. It exits
after calling the web service's existing authenticated daily-sync endpoint.
Calling the web service also invalidates its Next.js caches. The cron image has
no application dependencies and needs only these variables:

- `SYNC_SITE_URL=https://messivsronaldo-production.up.railway.app`: use the
  generated Railway HTTPS origin so the job always reaches the Railway web
  process, including while custom-domain DNS caches still point to Vercel.
- `CRON_SECRET`: the same private token as the web service.
- `DAILY_SYNC_ENABLED=false` until the handover is complete; then `true`.

Set `DAILY_SYNC_ENABLED=true` on the web service only after configuring and
verifying this scheduler. Disable the old Vercel schedule during handover.
The database lock and date deduplication prevent double processing, but running
two schedulers is not the intended permanent configuration. The updated GitHub
production-health workflow calls `www` directly so its Authorization header is
not lost across a cross-origin redirect. It must be present on the default
branch for its hourly schedule to run.

## DNS and account prerequisites

The user explicitly requested GoDaddy DNS without Cloudflare. Keep the existing
nameservers (`ns39.domaincontrol.com` and `ns40.domaincontrol.com`). Use `www`
as the canonical website, connected directly to Railway by CNAME; forward the
apex to `https://www.messivsronaldo17.com` using GoDaddy's HTTPS forwarding.
No CNAME flattening or additional DNS provider is required for this setup.

The unused, unverified apex custom-domain entry was removed from Railway and
replaced with `www.messivsronaldo17.com` (ID
`d2899a00-a004-4a82-9b24-550ffc52a806`). Only one Railway custom domain is needed.
After the cutover build passes, configure these records in GoDaddy:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `gsqacoq9.up.railway.app` |
| TXT | `_railway-verify.www` | Retrieve the current public verification value from Railway's domain settings |

Wait for Railway's verification and HTTPS certificate before enabling root-domain
forwarding. Then select permanent 301 forwarding, without masking, to
`https://www.messivsronaldo17.com`. Check deep article paths, language paths, and
query strings on the apex as well as the homepage. Do not assume the forwarding
service preserves them until tested. Keep the old deployment available until
these checks pass. Preserve all unrelated DNS records.

Paid Hobby activation was verified on 3 October 2026: `isTrialing: false`,
`isUsageSubscriber: true`, `state: ACTIVE`, and an active subscription. The plan
label alone is insufficient to verify billing; these customer fields confirm it.
The `www` cutover build passed ten hosted checks, including canonical tags,
indexable robots/sitemap, language redirects preserving the query string,
authenticated Neon health, and cross-origin rejection. The GoDaddy `www` CNAME
and verification TXT are correct, and Railway reports ownership verified and a
valid certificate. Direct custom-domain checks passed for the homepage,
French goals page, robots, sitemap and database readiness.

The apex currently remains on Vercel and redirects permanently to `www`,
preserving paths and query strings. Transition deployment
`dpl_B8kApghJLdm27yJ26MuN89ftFQpz` also serves cached `www` requests without
redirecting them back to the apex, preventing a propagation-time redirect loop.
Vercel reports no cron jobs. GoDaddy root forwarding has been requested from
the owner; do not remove the Vercel domain/deployment until that forwarding and
its HTTPS, deep paths and query strings have been verified.

Original apex A records were `216.198.79.1` and `64.29.17.1`; original `www`
CNAME was `671dc91e9e34a9c2.vercel-dns-017.com`. These remain the rollback values.

## Checks and domain handover

1. Verify the Railway deployment on its generated domain: readiness, homepage,
   localized routes, articles/images, social posters, admin login, contact and
   voting. Test writes only with an isolated database. Verify same-origin POSTs
   and secure cookies behind Railway HTTPS.
2. Verify that attempts to spoof `X-Real-IP` and `X-Forwarded-For` cannot change
   the address used for rate limiting. Remove any temporary diagnostics.
3. Take a fresh private Neon backup and retain the current Vercel deployment and
   exact DNS records for rollback.
4. Add `www` to Railway. Set
   `NEXT_PUBLIC_SITE_URL=https://www.messivsronaldo17.com`, `SITE_INDEXABLE=true`,
   and rebuild with the existing publisher settings. Keep the cron's
   `SYNC_SITE_URL` on the generated Railway origin. Configure GoDaddy as described above.
5. After HTTPS/domain verification, switch traffic and check canonicals,
   robots/sitemap, `ads.txt`, database readiness, admin authentication and media.
   Enable Railway daily sync and disable the Vercel schedule. Confirm the admin
   activity log and authenticated operational monitor.
6. Watch actual RAM/CPU, transfer, errors and Neon costs. Retain Vercel for
   rollback until production is stable; only then retire its active deployment.

Rollback: remove GoDaddy root forwarding if enabled and restore the saved DNS
records. Disable the Railway scheduler. Restore Vercel's `/api/admin/daily-sync`
cron (`0 8 * * *`) in `vercel.json`, set Vercel's production
`NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, and rebuild/revalidate Vercel
so its redirects, metadata and caches use the restored origin and current Neon
data. The database and encryption secret remain the same throughout.

## References

- [Railway Next.js guide](https://docs.railway.com/guides/nextjs)
- [Railway deployment settings](https://docs.railway.com/integrations/api/manage-services)
- [Domain and apex DNS requirements](https://docs.railway.com/networking/domains/working-with-domains)
- [GoDaddy HTTPS domain forwarding](https://www.godaddy.com/help/forward-my-godaddy-domain-12123)
- [Ingress headers and networking](https://docs.railway.com/networking/public-networking/specs-and-limits)
- [Cron scheduling](https://docs.railway.com/cron-jobs)
