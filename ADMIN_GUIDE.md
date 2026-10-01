# Admin dashboard

Open `/admin/dahsboard` and sign in with your private admin email and existing password. `/admin` and `/admin/dashboard` redirect there. The admin has its own sidebar, top bar, tool search, light/dark themes and mobile navigation, separate from the public website.

Configure `ADMIN_EMAIL` alongside `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` on every host. For local setup, run `npm run admin:setup -- --email you@example.com` and restart the app. If a password already exists, this command updates the email while retaining the password and encryption secret. New credentials are saved to the ignored `.artifacts/admin-access.txt`; store the password in a password manager and delete the plaintext file. The browser never receives the password hash or configured email before authentication. There is one administrator account, with no public registration.

To rotate the password, run `npm run admin:setup -- --reset` and restart. The setup script revokes local SQLite sessions; for a production password rotation, also revoke sessions in the production database. Keep the encryption secret stable to preserve access to saved provider credentials.

## Workspace navigation

- **Overview:** real counts of published language editions, drafts, match records and open support reports; recent statistics activity and player totals.
- **Posts & articles:** write and manage articles in all nine languages.
- **Match records:** search by opponent, competition, team or date; filter by player and date; edit, remove and paginate records.
- **Players:** inspect published career totals and open each player's match records or statistics entry form.
- **Add statistics:** publish a sourced match and its verified scoring breakdown. Related totals are recalculated together.
- **Data updates:** manual provider checks and automatic schedule status.
- **Content review:** existing editorial and coverage checks.
- **Support inbox:** reader reports, private notes and review status.
- **Activity log:** statistical publication history and undo.
- **Settings:** private sign-in email and encrypted API-Football connection.

Player biographies and the reviewed historical baseline remain versioned source content. The dashboard changes post-baseline match records; it does not independently overwrite career totals.

## Daily operation

For articles, open **Posts & articles** from the admin navigation, or go directly to `/admin/blog`. Choose a language, write in the visual editor, upload images, save drafts, preview and publish. Existing articles can be edited, unpublished or moved to recoverable Trash. See [the blog editor guide](docs/blog-editor.md) for the publishing workflow, language versions and storage details.

1. Sign in and open **Settings**. Paste your API-Football API-Sports key and click **Connect API-Football**. The server checks player profiles against their birth dates and verifies Inter Miami, Al Nassr, Argentina, and Portugal by name, country, and club/national-team status. Al Nassr uses a `Nassr` search so spaces and hyphens do not prevent discovery; the server checks the returned country locally because API-Football forbids combining `search` and `country`. Failed or ambiguous identity checks do not save the connection.
2. Production runs **once daily around 1 PM Pakistan time (08:00 UTC)** using Vercel Cron. No browser tab or button click is needed. Configure the private `CRON_SECRET` and deploy as described in [DEPLOYMENT.md](DEPLOYMENT.md). On Vercel Hobby, execution can occur between 1:00 and 1:59 PM Pakistan time. The dashboard shows the schedule and latest run status. Completed fixtures and player statistics are fetched, goal events are reconciled with the final score, and conventional assists are cross-checked against events. The job checks the previous two UTC dates for late results, retries unresolved fixtures, and catches up unchecked dates after the baseline. Each batch checks at most seven dates and stops after four minutes or a provider quota/outage error; remaining dates continue the next day. Postponed, unfinished, or disputed fixtures stay queued without blocking other valid dates.

   Use **Data updates → Update latest stats** for recent dates, or expand **Check a specific match date** and choose **Check selected date**. The date picker also handles the match-record filter and editor. It supports month/year selectors, arrow keys, Page Up/Down, Today, and Escape.
3. Successful post-baseline changes publish immediately to server-rendered comparisons, profiles, calendar records, club totals, CSVs, the public comparison API, and `/updates`. No code edit or rebuild is needed. An already-open public browser tab updates on reload or navigation.
4. Inspect **Activity log** for automatic run summaries, successes, no-change checks, and failures. The database records each daily attempt and prevents duplicate runs on the same UTC day. A failed automatic run retries outstanding work on the next day; the manual date button is still available immediately. **Undo last publication** restores the entire ledger saved immediately before the latest data change. Settings and failed checks are not treated as data publications.

Provider errors identify the failing endpoint and include the provider's explanation with the API key redacted. Invalid records identify the match/date and affected fields rather than displaying an unrelated admin-form error. Changing the selected date clears the previous result or error. Failed connection attempts are retained in the private activity log. Result pages are fetched sequentially (maximum 10); missing or inconsistent pages reject the entire operation. Quota exhaustion stops further requests in that operation without automatic retries. A rate-limit error distinguishes the daily quota from the per-minute limit.

**Live connection verified:** A locally supplied API-Football key successfully connected through the admin endpoint and is saved encrypted in this workspace's database. The live `2026-09-20` check succeeded on both local servers, returning one tracked match and one verified player record, including league metadata, player statistics and goal events. Since this date is in the baseline, it did not append a match or change public totals. The `2026-09-21` check returned no tracked matches. These checks do not establish full coverage of both players across all competitions; each required competition and season still needs verification. Other installations need their own key. Provider reference: https://www.api-football.com/documentation-v3 and https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide.

## Counting boundaries

- The historical baseline already includes matches through **2026-09-21**. Fetching that date or an earlier date is a read-only provider check; it never appends those matches to the baseline again. New ledger entries must be after the baseline and no later than today in UTC. The original snapshot is not rewritten by this dashboard.
- Repeating a sync uses stable fixture/player IDs and replaces records rather than incrementing totals. Manual corrections remain protected. Concurrent publications use a revision check; concurrent sync requests use a database lock.
- Previously imported records that disappear from a response trigger a review error. Only explicit cancellation or exclusion can remove an imported record automatically. Network errors, invalid responses, missing player coverage, disputed totals, live games, suspended games, and shootout fixtures leave published statistics unchanged. Shootout fixtures require a verified manual record.
- Club friendlies and exhibitions are excluded. Senior national-team friendlies are included. MLS playoff games count toward club/career totals but not regular-season league totals. The integration currently tracks Inter Miami/Al Nassr and Argentina/Portugal; transfers require a deliberate provider mapping and aggregation update.
- Core goals, assists, appearances and minutes are updated together. Calendar, club, international, league and relevant tournament totals are derived from the same ledger. Detailed goal types (including penalty conversion and career hat-tricks) keep their earlier, explicitly displayed cutoff because the provider adapter does not supply the full classification. Club hat-tricks can be derived from completed match goal counts.
- Fixture responses omit competition type. Tracked completed club games resolve it through `/leagues` using the returned competition ID. Missing or ambiguous metadata blocks publication instead of guessing whether a match belongs in league or cup totals.
- API-Football's assists can differ from the secondary baseline source's convention. The boundary and match-level evidence are disclosed, not represented as a single-provider audited career ledger. UEFA's completed Champions League convention is unchanged.
- A later recorded match does not prove every intermediate date is complete. The public coverage note and update log explicitly disclose this. Automatic catch-up checks previously unscanned dates after the baseline. Older provider corrections outside the two-day lookback can still be checked manually.

## Manual correction and recovery

**Match records → Add match** records one appearance after the baseline. Enter player, date, opponent, competition, category, goals, assists, minutes, evidence URL, and a source/reason note. Club entries refer to the currently tracked clubs; international entries refer to the player's national team. Edit an existing record to correct it instead of creating another record for the same player/date. The database rejects duplicates. Manual records and edits are protected from automatic overwrite. Remove an incorrect match with its inline confirmation, then use undo if needed.

The activity log retains publication history and supports undoing the last publication. The reviewed baseline remains versioned in `src/data/football.json`. The dashboard has no download or export controls; full disaster recovery uses the database and baseline backup described below.

### Download stat images and player posters

While signed in as an administrator, open a public comparison page and choose **Download image** beside a statistic. **Stat card** exports that comparison. Select **Player poster** for a poster featuring a player photo, national flag and tournament statistics in the site's colors.

Choose **Lionel Messi** or **Cristiano Ronaldo**, then choose a **Tournament / competition**. Messi uses Argentina's flag; Ronaldo uses Portugal's. The tournament list includes the Champions League, World Cup stats, La Liga and each player's continental championship, plus career, club and international scopes. World Cup stats cover tournament matches across all rounds, excluding qualifiers and shootouts. Copa América and the European Championship, and Inter Miami and Al Nassr, switch to the correct player automatically. Posters show goals, matches, assists, minutes and goals per game, using the same published data and assist conventions as the site. Every image includes its scope's data date and coverage notes.

Choose a light or dark theme and Square (1080 × 1080), Portrait (1080 × 1350) or Story (1080 × 1920), then **Download PNG**. **Open image** and supported mobile sharing remain available. Exported artwork uses English labels; the controls follow the selected site language. Generating a poster does not change any published data.

Choose **Comparison poster** for a side-by-side Messi/Ronaldo design with the Player poster's textured background, blue/coral accent stripes, national flags, bold surnames and stacked logo. It initially opens in Portrait format. Career comparisons show games, goals + assists, goals, assists, team trophies, Ballon d’Or awards, European Golden Shoes, hat-tricks and free-kick goals. Tournament comparisons use that competition's match totals and scoring rates, with goal-type rows when available. Trophy totals follow the site's full honours register, including youth/Olympic and conference honours. Match statistics, goal-type records and awards keep their separate data dates in the image. The existing Stat card and Player poster designs remain selectable.

## Hosting and recovery

Production on Vercel uses **shared Neon Postgres** through the private `DATABASE_URL` environment variable. Match records, revision checks, audit history, encrypted provider settings, sessions, login throttling and sync locks all live in that database. The application refuses to use local SQLite on Vercel when `DATABASE_URL` is missing. Local development still uses `.data/admin.sqlite` (or `ADMIN_DATABASE_PATH`) when no database URL is configured. Use HTTPS and set `NEXT_PUBLIC_SITE_URL=https://messivsronaldo17.com` before building. Keep `ADMIN_SESSION_SECRET` stable so saved provider keys remain decryptable. See [DEPLOYMENT.md](DEPLOYMENT.md) for migration and production setup.

Keep `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` in the host's private environment settings. The stable secret encrypts the API connection with AES-256-GCM; changing it makes the saved provider key unreadable. Use `npm run db:backup` with private database credentials and PostgreSQL 18 tools for a production backup, and retain the encryption secret separately. Restore only into an isolated database for verification. For local SQLite, use SQLite's backup API or stop the app and include its WAL files if not checkpointed. Retain the baseline JSON alongside backups. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup, monitoring, and recovery instructions.

Admin pages and APIs are excluded from indexing. Dashboard mutations require a valid server-side session and matching request origin. The scheduler endpoint instead requires an exact `Authorization: Bearer <CRON_SECRET>` header; missing configuration fails closed, and admin cookies do not authorize cron calls. Sessions use opaque random tokens, expire after eight hours, and are revoked at logout. Password attempts are limited to ten per fifteen-minute window, globally for this single-admin app. Provider credentials are encrypted at rest, never returned by admin state API, and sent only to the fixed HTTPS API-Sports host. Admin data and response bodies are not publicly cached.

## Checks

`npm test` verifies aggregation, scope boundaries, source cutoffs, duplicate/correction behavior, database transactions/undo, encryption, concurrency, and provider response handling. `npm run test:admin` starts an isolated production server on port 3002 with a separate synthetic database and test-only credentials, covering authentication, CSRF, authorization, logout revocation, invalid/stale updates, public publication/undo, exports, mobile layout and accessibility. Test fixtures never enter the real `.data/admin.sqlite` database.
