# The Rivalry

A Next.js website for comparing Lionel Messi and Cristiano Ronaldo, with an original responsive interface and a reviewed September 2026 dataset. Production domain: https://messivsronaldo17.com. Vercel deployment and database instructions: [DEPLOYMENT.md](DEPLOYMENT.md).

## Run locally

Requires Node.js 22 (also selected for Vercel).

```sh
npm ci
npm run dev -- --port 3001
```

Open http://localhost:3001. For a production preview:

```sh
npm run build
npm run start -- --port 3001
```

This workspace's ignored `.env.local` sets the preview origin to `http://localhost:3001` and disables public indexing. Set your own origin when using another port or deploying.

## What is implemented

- A protected `/admin` dashboard with date-based API-Football sync, verified manual match edits, audit history, undo, exports, and persistent Postgres storage on Vercel (SQLite for local development). Setup and boundaries: [ADMIN_GUIDE.md](ADMIN_GUIDE.md).
- Next.js App Router, TypeScript, locally hosted Inter and Manrope fonts, Lucide icons, and custom responsive CSS.
- Thirteen comparison scopes: career, 2026, club, country, Champions League, La Liga, World Cup, Copa América/Euros, current clubs, all leagues, European clubs, career excluding USA/Saudi, and direct meetings.
- Goals, assists, appearances, minutes, contributions, per-appearance and per-90 rates, hat-tricks, penalties/conversion, non-penalty goals, free kicks, scoring locations and body parts.
- Source explanations for each metric, CSV export with attribution and coverage, clipboard sharing, and filter restoration through URL fragments.
- A 2002–2026 calendar explorer with club/country/league filters, metric selection, per-90 rates, CSV export and 25 individual year pages. The nine shared-Spain season pages remain a separate archive.
- Eight club records and a team-honours table with participation and counting notes.
- An interactive Ballon d'Or chart, accessible data table, and award history through the latest completed edition, 2025.
- Player profiles, original explanatory articles, methodology and source register, coverage matrix, privacy information, photo credits, and a local correction-report generator.
- Keyboard-accessible search, a mobile navigation drawer, persistent light/dark themes, visible focus states and reduced-motion support.
- Shared styled dropdowns for comparison scope, scoring rate, calendar year/statistic and archived seasons, with keyboard navigation, selected checkmarks and responsive menus.
- Canonical metadata, sitemap, robots controls, Open Graph image, JSON-LD, meaningful HTML content, a read-only comparison JSON endpoint, and an optional `llms.txt` content index.

Google's AI-search guidance does not prescribe a special GEO framework or promise inclusion. The site makes its main content crawlable and attributable; the `llms.txt` file is only a convenience index. See https://developers.google.com/search/docs/appearance/ai-features.

## Data boundaries

**Statistics were updated through 21 September 2026.** Career goals: Messi 930, Ronaldo 979. The 2026 calendar year is incomplete. The interface, API, exports and AI-readable summary retain the cutoff.

`src/data/football.json` stores the reviewed numeric snapshot with calendar-year and club provenance. `src/lib/data.ts` defines formulas, source references and comparison scopes. `src/lib/seasons.ts` preserves the historical shared-Spain archive. `DATA_SOURCES.md` documents the source choices and reconciliation checks.

Detailed current numbers use the attributed secondary statistical reference, with UEFA used separately for its Champions League definition and Ballon d'Or records. The dataset is not an independently audited match ledger or a licensed live provider feed. An administrator-triggered API-Football adapter is implemented; it requires a provider key in Admin Settings before real imports can run. The original baseline remains fixed, with later verified records stored separately. Arbitrary opponent/age filtering and full-coverage xG are not available.

The correction form creates a local download. It does **not** persist reports to a backend or claim delivery. If `CONTACT_EMAIL` is configured, it also offers a prefilled email for the visitor to send themselves.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
npm run test:admin
```

Browser tests use port 3001 and start a production server when one is not already running. They cover desktop and mobile, HTML statistics without JavaScript, comparison and season state, theme persistence, source dialogs, search, exports, correction reports, route status codes, layout overflow, and automated accessibility checks in both themes. Unit tests cover aggregation boundaries, missing denominators, references, exports and chronology.

Generated screenshots and audit artifacts belong in `.artifacts/` and are ignored. Automated accessibility checks do not replace a complete manual accessibility audit. Lab performance measurements do not establish real-user Core Web Vitals.

## Deploy

Deploy on a Node.js host with persistent writable storage and one application instance. The admin database uses SQLite; default ephemeral/serverless filesystems are unsupported. Set `ADMIN_DATABASE_PATH` to the persistent volume. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for credentials, backup and deployment details.

1. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, without a path. This affects built canonical URLs, sitemap URLs and structured data.
2. Set `SITE_INDEXABLE=true` only for the intended public site. Private previews should keep it `false`. The code also prevents indexing for localhost origins.
3. Run `npm run admin:setup` and configure the private admin environment variables. On Vercel, connect a Neon Postgres database and set `DATABASE_URL`; local SQLite requires a persistent disk on other hosts. Optionally configure `CONTACT_EMAIL` and `GOOGLE_SITE_VERIFICATION`. These are publisher configuration values, not football-provider credentials.
4. Build with those environment values, then start the production server. Environment changes affecting static metadata require a rebuild.
5. Check the final domain, HTTPS, canonical tags, sitemap, robots file, social image, source links and actual page content. Verify the property in Search Console and submit the sitemap.

No public deployment or domain purchase has been performed. A domain and hosting account remain owner inputs.

## Keeping the data current

Use `/admin` to connect API-Football, select a UTC date, and click **Fetch & update stats**. Post-baseline matches update the public site without a rebuild. Repeated imports are idempotent; protected manual corrections, source evidence, historical cutoffs and audit history are retained. Historical dates already covered by the baseline are checked without appending them again. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for the complete workflow and provider limitations.

No live provider key was supplied during implementation, so real provider access remains to be configured and verified. No scheduled background job is enabled. The public `/updates` page lists the actual matches added; unlisted dates are not claimed as verified. Detailed goal-type figures retain their original cutoff when the adapter cannot update them.

## Monetization and operations

This edition contains no ads, affiliate tracking, analytics, public user accounts or payments. A single protected administrator account manages statistics. Its essential comparisons remain free. The researched 90-day growth strategy and revenue scenarios are in `WEBSITE_BUILD_PROMPT.md` and `WEBSITE_RESEARCH.md`.

API-Football credentials and appropriate provider access are required for real statistics imports. Production hosting, a domain, current-data licensing, editorial upkeep and any added email/analytics services must be costed for the chosen providers. No $1,000 earnings or Google/AI ranking promise is made.

Before adding advertising or analytics, configure the services and appropriate privacy/consent controls, update the privacy page, reserve ad dimensions, and recheck performance. Keep the first comparison visible before monetization units.

## Project structure

```text
src/app/                 Routes, metadata, robots, sitemap, social image
src/components/          Comparison, season explorer, charts, navigation, editorial UI
src/data/football.json   Reviewed 2026 snapshot, 25 years and eight club records
src/lib/admin/           Authentication, provider adapter, SQLite store and updates
src/lib/published-data.ts Public aggregation of baseline and published matches
src/lib/data.ts          Source register, formulas, comparison scopes and CSV
src/lib/seasons.ts       Shared-era season data and aggregation
src/lib/articles.ts      Original explanatory articles
src/lib/site.ts          Origin, indexing controls and metadata helpers
tests/                   Data checks and Playwright browser checks
public/images/           Attributed player photographs
```

Photograph licenses and original authors are documented in `ASSET_LICENSES.md` and displayed at `/credits`.
