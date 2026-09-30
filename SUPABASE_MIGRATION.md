# Deferred Supabase migration

Status: paused on 30 September 2026. Keep production on Neon while the owner
reviews one month of charges on the upgraded plan. Reconsider this migration
only if those costs warrant a move. No transfer or cutover is scheduled.

Branch: `codex/supabase-migration`. The migration tools, Supabase table security,
and this guide are preserved here; they have not been deployed to production.
Database-load caching improvements are kept separate from this migration commit.

## Optional future move from Neon to Supabase (paused)

The following procedure is retained for a future migration. The current choice
is to keep production on Neon.

The existing destination is `rivalry-supabase`, Supabase **Free**, in US East
(N. Virginia / `iad1`) alongside the Vercel functions. Its project reference is
`mdajdslqvouwxcrrbmvt`, and its Vercel resource is `store_VKyRpMTKZFoA63Nm`.
Open it through the [Vercel integration dashboard](https://vercel.com/d/dashboard/integrations/supabase/icfg_DMcLisLGIgaILhDPLq7SjKnh/resources/store_VKyRpMTKZFoA63Nm).
Do not create a second destination. The marketplace terms are already accepted.

The preview connection uses the `SUPABASE_MIGRATION` prefix. It does not change
the app's `DATABASE_URL`; neither preview nor production has been switched to
Supabase. The nine app tables are empty except for the initial state row.
Both session and transaction pooler connections were verified. Anonymous Data API
requests to settings, sessions, articles, and media returned permission errors.

Both providers use Postgres; no Supabase browser client or public API key is
needed. The app continues using `DATABASE_URL`, with `prepare: false` and a small
connection pool. For the running app, select Supabase's **Transaction pooler**
URL (port `6543`). For migration, use the **Session pooler** URL (port `5432`),
which supports IPv4. Keep all connection strings in ignored, mode-600 env files.
The marketplace also supplies `POSTGRES_URL`; explicitly map the selected
transaction URL to `DATABASE_URL` at cutover.

1. Stop admin publications and scheduled writes while exporting and switching.
   `MAINTENANCE_MODE` alone does not stop admin APIs or the cron endpoint.
2. Restore read access to Neon if its quota is exhausted. A quota-blocked source
   cannot be exported. Do not substitute the old local SQLite database or the
   partial article backups for a complete production export.
3. Make a private `.artifacts/supabase-migration/transfer.env` with
   `SOURCE_DATABASE_URL` (Neon), `TARGET_DATABASE_URL` (Supabase session pooler),
   and the **unchanged production** `ADMIN_SESSION_SECRET`. Never commit it.
   The prepared file uses the saved local admin secret, which must pass the
   import's provider-key decryption check against the actual source backup.
   Vercel redacts sensitive admin/cron variables when pulling environment files;
   never upload the literal `[SENSITIVE]` placeholders or replace those secrets.
4. Run the transfer commands:

```sh
npx tsx --env-file=.artifacts/supabase-migration/transfer.env scripts/migrate-postgres.ts export .artifacts/supabase-migration/production.json
npx tsx --env-file=.artifacts/supabase-migration/transfer.env scripts/migrate-postgres.ts import .artifacts/supabase-migration/production.json
npx tsx --env-file=.artifacts/supabase-migration/transfer.env scripts/migrate-postgres.ts verify .artifacts/supabase-migration/production.json
```

The export is one consistent, read-only transaction and writes a mode-600 file
without overwriting existing backups. It preserves matches, revision, complete
activity history, encrypted provider settings, daily-sync progress, article
drafts/publications/deletions, and binary images. Import checks the checksum and
provider-key decryption, refuses any populated destination, and validates every
imported value before committing. Supabase's own schemas remain untouched.
Sessions, login attempts, and temporary sync locks start empty.

All application tables enable row-level security and revoke browser-role grants.
Only the existing server database owner accesses these tables; keep credentials
server-side. This prevents Supabase's Data API from exposing admin sessions,
provider settings, drafts, or private images.

5. Verify the source has not changed since export, and test a private deployment
   using the destination. Check statistics, article counts, image bytes, admin
   login, and provider-key decryption before switching the production URL.
6. Set production `DATABASE_URL` to the Supabase transaction pooler, retaining
   `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET`. Redeploy and
   check the homepage, localized pages, `/api/comparison/career`,
   `/api/data-version`, articles/images, and admin sign-in. Resume scheduled
   updates after the new deployment is verified.
7. Retain the Neon database and the private export for rollback. Reverting the
   connection string is safe only before new writes reach Supabase; otherwise
   reconcile those writes first. Do not delete Neon as part of the initial switch.

References: [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres),
[Neon migration guide](https://supabase.com/docs/guides/platform/migrating-to-supabase/neon),
[Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Validation

The migration suite also requires a separate isolated database and a local test
role that can create schemas and the synthetic Supabase API roles:

```sh
TEST_MIGRATION_DATABASE_URL=postgresql://localhost/rivalry_test_migration npx tsx --test tests/postgres-migration.test.ts
```

It checks complete data and image preservation, checksum validation, wrong-secret
rejection, transaction rollback, overwrite refusal, sequence restoration, and
denied access for Supabase's `anon` and `authenticated` roles. Never run it against
a hosted production database.
