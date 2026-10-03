# Railway migration

Production migration: 3 October 2026. The canonical website is
https://messivsronaldo17.com on Railway Hobby. The domain stays registered at
GoDaddy; Vercel DNS provides the apex ALIAS needed to reach Railway directly.
Cloudflare and Namecheap are not used. Nameserver handover, apex ownership
verification and trusted HTTPS passed. Railway is configured to build with the
apex canonical origin and redirect `www` while preserving paths and queries. GitHub CLI is
connected as `erushbaig` and Railway as `erushbaig@gmail.com`.

Railway project: `luminous-optimism` (`baf7eb9a-c51c-4b44-a442-f8447acb807e`),
environment `production`. Web service: `messivsronaldo`
(`891a9749-7286-4557-a224-6807a077383e`). Generated service URL:
https://messivsronaldo-production.up.railway.app.
Daily job: `daily-sync` (`87bda577-9333-4de3-a8be-bc4919c4d21c`).
Both services deploy `ArshadNawazBaig/messivsronaldo`, branch `main`. The migration
branch was fast-forwarded onto `main`; both Railway sources were then switched
to that branch and deployed successfully.
The initial preview was non-indexable. The first cutover used `www`; the owner
then requested the apex without `www`. The apex build uses
`NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com` and `SITE_INDEXABLE=true`.
The old Vercel cron was removed in the transition deployment. Railway's daily
job is enabled, scheduled at 08:00 UTC (1 PM Pakistan), and its manual execution
completed with `Daily sync finished: partial.` Existing API-Football subscription
restrictions leave ten historical dates pending; this is not a deployment error.
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

Initial enabled deployments: web `edd52ffa-5a6e-4f35-a0da-99f650b9eeb3`, cron
`e892e2d4-0d72-4cc1-9df7-28130f24e3dd`. Eight final checks against the actual
Railway custom-domain ingress passed with trusted TLS, including metadata,
localized content, sitemap, publisher verification, readiness, authenticated
Neon health, and query-preserving locale redirects. The default-branch
[production-health workflow](https://github.com/ArshadNawazBaig/messivsronaldo/actions/runs/37134036492)
also passed. Its report was healthy with today's daily-sync state marked
`partial`; deployment validation does not claim all provider dates are available.

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
- `DAILY_SYNC_ENABLED=true` on both current production services. Use `false`
  while preparing a separate preview or disabling the Railway scheduler.

Set `DAILY_SYNC_ENABLED=true` on the web service only after configuring and
verifying this scheduler. Disable the old Vercel schedule during handover.
The database lock and date deduplication prevent double processing, but running
two schedulers is not the intended permanent configuration. The updated GitHub
production-health workflow calls the canonical apex directly so its Authorization
header is not lost across a cross-origin redirect. It must be present on the default
branch for its hourly schedule to run.

## DNS and account prerequisites

The owner requested the apex without `www`, Cloudflare or Namecheap. Use the
existing Vercel account for DNS, with GoDaddy remaining the registrar:

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

The apex ALIAS resolves the Railway hostname dynamically; do not hard-code a
Railway edge IP in an A record. Website requests then reach Railway directly,
without passing through Vercel hosting. The owner confirmed that only this
website uses the domain. Public DNS had no MX, AAAA or DNSSEC DS records.
The existing Google verification TXT, DMARC TXT and Domain Connect CNAME were
copied to Vercel. Fourteen checks passed against both prepared nameservers.
The owner then changed nameservers at GoDaddy. The `.com` registry now delegates
to Vercel, and public DNS resolvers return the Railway edge address
and the correct apex verification TXT. Railway reports apex ownership verified
and a valid certificate; trusted TLS was also checked directly against its ingress.

GoDaddy's built-in domain forwarding was tested and rejected: its HTTPS homepage
redirect returned 301, but `/goals`, `/fr/goals`, and `/robots.txt` returned 404;
the homepage query string was also dropped. These results were reproduced on
both forwarding IPs. Do not enable it for this site, since existing search and
shared article links use apex paths. The owner removed that forwarding. The
initial workaround retained a Vercel apex redirect to Railway `www`; the current
apex DNS migration replaces that workaround.

Both custom domains now belong to the Railway web service:

- `messivsronaldo17.com`: `107daafa-b192-4426-8ef9-c50e0ce17c37`.
- `www.messivsronaldo17.com`: `d2899a00-a004-4a82-9b24-550ffc52a806`.

Configure these records in **Vercel DNS**. The two ownership TXT records have
different values; retrieve each current value from its Railway domain settings.

| Type | Name | Value |
| --- | --- | --- |
| ALIAS | `@` | `tcpmv7ks.up.railway.app` |
| CNAME | `www` | `gsqacoq9.up.railway.app` |
| TXT | `_railway-verify` | Railway apex ownership token |
| TXT | `_railway-verify.www` | Retrieve the current public verification value from Railway's domain settings |
| TXT | `@` | Existing Google Search Console verification |
| TXT | `_dmarc` | Existing GoDaddy DMARC policy |
| CNAME | `_domainconnect` | `_domainconnect.gd.domaincontrol.com` |

Wait for apex ownership verification and trusted HTTPS before enabling the
Railway build's `www`-to-apex redirect. Check deep article paths, language paths,
query strings, robots, sitemap and authenticated health. The generated Railway
origin remains the cron target so DNS propagation cannot send daily sync to the
rollback host.

Paid Hobby activation was verified on 3 October 2026: `isTrialing: false`,
`isUsageSubscriber: true`, `state: ACTIVE`, and an active subscription. The plan
label alone is insufficient to verify billing; these customer fields confirm it.
The `www` cutover build passed ten hosted checks, including canonical tags,
indexable robots/sitemap, language redirects preserving the query string,
authenticated Neon health, and cross-origin rejection. The `www` CNAME
and verification TXT were copied to Vercel DNS, and Railway reports ownership verified and a
valid certificate. Direct custom-domain checks passed for the homepage,
French goals page, robots, sitemap and database readiness.

The Vercel fallback was rebuilt with the apex origin and promoted as
`dpl_3qRp32Cd2aNURM1L6SeHxfUM79eR`. Cached apex requests are served normally;
cached `www` requests redirect to the apex with the path/query preserved.
Readiness, homepage metadata and these redirects passed checks before the
nameserver handover. This avoids an opposite-direction redirect loop while DNS
caches expire. Vercel reports no cron jobs. Keep its DNS zone; the application
deployment is only a propagation fallback and rollback option.

Original apex A records were `216.198.79.1` and `64.29.17.1`; original `www`
CNAME was `671dc91e9e34a9c2.vercel-dns-017.com`. These remain the rollback values.
Original GoDaddy nameservers were `ns39.domaincontrol.com` and
`ns40.domaincontrol.com`. Public DNS snapshots and prepared Vercel records are
saved under `.artifacts/railway-migration/`.

## Checks and domain handover

1. Verify the Railway deployment on its generated domain: readiness, homepage,
   localized routes, articles/images, social posters, admin login, contact and
   voting. Test writes only with an isolated database. Verify same-origin POSTs
   and secure cookies behind Railway HTTPS.
2. Verify that attempts to spoof `X-Real-IP` and `X-Forwarded-For` cannot change
   the address used for rate limiting. Remove any temporary diagnostics.
3. Take a fresh private Neon backup and retain the current Vercel deployment and
   exact DNS records for rollback.
4. Add both apex and `www` to Railway. Set
   `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, `SITE_INDEXABLE=true`,
   and rebuild with the existing publisher settings. Keep the cron's
   `SYNC_SITE_URL` on the generated Railway origin. Prepare and verify all Vercel
   DNS records, then set its nameservers at GoDaddy as described above.
5. After HTTPS/domain verification, switch traffic and check canonicals,
   robots/sitemap, `ads.txt`, database readiness, admin authentication and media.
   Enable Railway daily sync and disable the Vercel schedule. Confirm the admin
   activity log and authenticated operational monitor.
6. Watch actual RAM/CPU, transfer, errors and Neon costs. Keep the Vercel DNS zone
   active. Retain the Vercel application until DNS propagation is complete and
   Railway is stable; DNS and application hosting are separate responsibilities.

Rollback: point the Vercel DNS apex to the saved Vercel target
`671dc91e9e34a9c2.vercel-dns-017.com` using ALIAS and point `www` to the same
target using CNAME. Alternatively restore the saved GoDaddy nameservers and
their original records. Disable the Railway scheduler. Restore Vercel's `/api/admin/daily-sync`
cron (`0 8 * * *`) in `vercel.json`, set Vercel's production
`NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com`, and rebuild/revalidate Vercel
so its redirects, metadata and caches use the restored origin and current Neon
data. The database and encryption secret remain the same throughout.

## References

- [Railway Next.js guide](https://docs.railway.com/guides/nextjs)
- [Railway deployment settings](https://docs.railway.com/integrations/api/manage-services)
- [Domain and apex DNS requirements](https://docs.railway.com/networking/domains/working-with-domains)
- [GoDaddy HTTPS domain forwarding](https://www.godaddy.com/help/forward-my-godaddy-domain-12123)
- [Vercel ALIAS records](https://vercel.com/docs/domains/working-with-dns)
- [Vercel nameservers](https://vercel.com/docs/domains/working-with-nameservers)
- [Ingress headers and networking](https://docs.railway.com/networking/public-networking/specs-and-limits)
- [Cron scheduling](https://docs.railway.com/cron-jobs)
