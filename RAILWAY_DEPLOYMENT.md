# Railway migration

Migration branch: `codex/railway-migration`. The canonical domain is still on
Vercel; DNS cutover has not happened. GitHub CLI is connected as `erushbaig` and
Railway as `erushbaig@gmail.com`.

Railway project: `luminous-optimism` (`baf7eb9a-c51c-4b44-a442-f8447acb807e`),
environment `production`. Web service: `messivsronaldo`
(`891a9749-7286-4557-a224-6807a077383e`). Preview:
https://messivsronaldo-production.up.railway.app.
Daily job: `daily-sync` (`87bda577-9333-4de3-a8be-bc4919c4d21c`).
The preview remains non-indexable and the Railway daily job remains disabled
until DNS handover. Keep the existing Neon database; no production data migration
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

Use the existing production values for `DATABASE_URL`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`, and
`HEALTHCHECK_SECRET`. Preserve the session secret exactly: stored football API
credentials are encrypted with it. Do not print or commit any private values.
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

- `SYNC_SITE_URL`: the canonical HTTPS origin after cutover.
- `CRON_SECRET`: the same private token as the web service.
- `DAILY_SYNC_ENABLED=false` until the handover is complete; then `true`.

Set `DAILY_SYNC_ENABLED=true` on the web service only after configuring and
verifying this scheduler. Disable the old Vercel schedule during handover.
The database lock and date deduplication prevent double processing, but running
two schedulers is not the intended permanent configuration. The existing GitHub
production-health workflow continues to monitor the same canonical domain.

## DNS and account prerequisites

GoDaddy currently hosts DNS (`ns39.domaincontrol.com` and
`ns40.domaincontrol.com`). Its apex DNS cannot flatten Railway's CNAME. Move DNS
hosting to a provider with flattening, such as Cloudflare's free DNS service,
while keeping the domain registration at GoDaddy. Preserve the complete DNS zone,
including mail and verification records; public DNS queries cannot enumerate it.
Use DNS-only routing initially so the verified Railway ingress remains the sole
HTTP proxy. An additional HTTP proxy needs its own client-IP trust verification.

The trial account accepted the apex custom domain but rejected `www` with a
custom-domain limit. Upgrade the Railway plan before adding the second domain.
Do not change live DNS until the final canonical-URL build and both domains are
ready. The current preview uses its Railway URL and `SITE_INDEXABLE=false`.

The apex record target returned by Railway is `2y3kx6ai.up.railway.app`; retrieve
the current `_railway-verify` TXT value from the domain settings. Both records are
required. Add `www` separately after the account upgrade, using its returned
records. Original apex A records were `216.198.79.1` and `64.29.17.1`; original
`www` CNAME was `671dc91e9e34a9c2.vercel-dns-017.com`.

## Checks and domain handover

1. Verify the Railway deployment on its generated domain: readiness, homepage,
   localized routes, articles/images, social posters, admin login, contact and
   voting. Test writes only with an isolated database. Verify same-origin POSTs
   and secure cookies behind Railway HTTPS.
2. Verify that attempts to spoof `X-Real-IP` and `X-Forwarded-For` cannot change
   the address used for rate limiting. Remove any temporary diagnostics.
3. Take a fresh private Neon backup and retain the current Vercel deployment and
   exact DNS records for rollback.
4. Add apex and `www` domains to Railway. Set
   `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, `SITE_INDEXABLE=true`, and
   rebuild with the existing publisher settings. Configure only the records
   Railway provides; apex hosting requires ALIAS or CNAME flattening support.
   Preserve mail and verification records.
5. After HTTPS/domain verification, switch traffic and check canonicals,
   robots/sitemap, `ads.txt`, database readiness, admin authentication and media.
   Enable Railway daily sync and disable the Vercel schedule. Confirm the admin
   activity log and authenticated operational monitor.
6. Watch actual RAM/CPU, transfer, errors and Neon costs. Retain Vercel for
   rollback until production is stable; only then retire its active deployment.

Rollback: restore the saved DNS records, disable the Railway scheduler, restore
the Vercel scheduler, and redeploy/revalidate Vercel so it reloads current Neon
data. The database and encryption secret remain the same throughout.

## References

- [Railway Next.js guide](https://docs.railway.com/guides/nextjs)
- [Railway deployment settings](https://docs.railway.com/integrations/api/manage-services)
- [Domain and apex DNS requirements](https://docs.railway.com/networking/domains/working-with-domains)
- [Ingress headers and networking](https://docs.railway.com/networking/public-networking/specs-and-limits)
- [Cron scheduling](https://docs.railway.com/cron-jobs)
