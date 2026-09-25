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

- A protected `/admin` dashboard with date-based API-Football sync, verified manual match edits, audit history, undo, and persistent Postgres storage on Vercel (SQLite for local development). Setup and boundaries: [ADMIN_GUIDE.md](ADMIN_GUIDE.md).
- Next.js App Router, TypeScript, locally hosted Inter and Manrope fonts, Lucide icons, and custom responsive CSS.
- Thirteen comparison scopes: career, 2026, club, country, Champions League, La Liga, World Cup, Copa América/Euros, current clubs, all leagues, European clubs, career excluding USA/Saudi, and direct meetings.
- Goals, assists, appearances, minutes, contributions, per-appearance and per-90 rates, hat-tricks, penalties/conversion, non-penalty goals, free kicks, scoring locations and body parts.
- Source explanations for each metric, clipboard sharing, and filter restoration through URL fragments.
- A 2002–2026 calendar explorer with club/country/league filters, metric selection, per-90 rates and 25 individual year pages. The nine shared-Spain season pages remain a separate archive.
- Eight club records and a team-honours table with participation and counting notes.
- An interactive Ballon d'Or chart, accessible data table, and award history through the latest completed edition, 2025.
- Player profiles, original explanatory articles, methodology and source register, coverage matrix, privacy information, photo credits, and a local correction-report generator.
- Keyboard-accessible search, a mobile navigation drawer, persistent light/dark themes, visible focus states and reduced-motion support.
- Shared styled dropdowns for comparison scope, scoring rate, calendar year/statistic and archived seasons, with keyboard navigation, selected checkmarks and responsive menus.
- Canonical metadata, sitemap, robots controls, Open Graph image, JSON-LD, meaningful HTML content, a read-only comparison JSON endpoint, and an optional `llms.txt` content index.

Google's AI-search guidance does not prescribe a special GEO framework or promise inclusion. The site makes its main content crawlable and attributable; the `llms.txt` file is only a convenience index. See https://developers.google.com/search/docs/appearance/ai-features.

## Data boundaries

**Statistics were updated through 21 September 2026.** Career goals: Messi 930, Ronaldo 979. The 2026 calendar year is incomplete. The interface, API and AI-readable summary retain the cutoff.

`src/data/football.json` stores the reviewed numeric snapshot with calendar-year and club provenance. `src/lib/data.ts` defines formulas, source references and comparison scopes. `src/lib/seasons.ts` preserves the historical shared-Spain archive. `DATA_SOURCES.md` documents the source choices and reconciliation checks.

Detailed current numbers use the attributed secondary statistical reference, with UEFA used separately for its Champions League definition and Ballon d'Or records. The dataset is not an independently audited match ledger or a licensed live provider feed. An administrator-triggered API-Football adapter is implemented; it requires a provider key in Admin Settings before real imports can run. The original baseline remains fixed, with later verified records stored separately. Arbitrary opponent/age filtering and full-coverage xG are not available.

The correction form prepares a report to review and copy on the page. It does **not** persist reports to a backend or claim delivery. If `CONTACT_EMAIL` is configured, it also offers a prefilled email for the visitor to send themselves.

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

Browser tests use port 3001 and start a production server when one is not already running. They cover desktop and mobile, HTML statistics without JavaScript, comparison and season state, theme persistence, source dialogs, search, correction reports, route status codes, layout overflow, and automated accessibility checks in both themes. Unit tests cover aggregation boundaries, missing denominators, references and chronology.

Generated screenshots and audit artifacts belong in `.artifacts/` and are ignored. Automated accessibility checks do not replace a complete manual accessibility audit. Lab performance measurements do not establish real-user Core Web Vitals.

To check development-only React warnings, start `npm run dev` and run `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/theme-recovery.spec.ts`. These checks exercise 404 fallbacks, client navigation, saved themes and blocked browser storage.

## Deploy

On Vercel, use Neon Postgres through `DATABASE_URL`. For a separate Node.js host using SQLite, use persistent writable storage and one application instance; set `ADMIN_DATABASE_PATH` to the persistent volume. Ephemeral serverless filesystems cannot persist the SQLite database. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for credentials, backup and deployment details.

1. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, without a path. This affects built canonical URLs, sitemap URLs and structured data.
2. Set `SITE_INDEXABLE=true` only for the intended public site. Private previews should keep it `false`. The code also prevents indexing for localhost origins.
3. Run `npm run admin:setup` and configure the private admin environment variables. On Vercel, connect a Neon Postgres database and set `DATABASE_URL`; local SQLite requires a persistent disk on other hosts. Optionally configure `CONTACT_EMAIL` and `GOOGLE_SITE_VERIFICATION`. These are publisher configuration values, not football-provider credentials.
4. Build with those environment values, then start the production server. Environment changes affecting static metadata require a rebuild.
5. Check the final domain, HTTPS, canonical tags, sitemap, robots file, social image, source links and actual page content. Verify the property in Search Console and submit the sitemap.

The production website is deployed on Vercel at https://messivsronaldo17.com with Neon Postgres.

## Public policies and system pages

- `/terms`, `/privacy`, `/cookies`, `/disclaimer`, and `/accessibility` describe this edition. Policy content is in `src/lib/policies.ts`. Set the publisher's public `CONTACT_EMAIL` to show a real email contact; no contact address or legal entity is invented by the app.
- `/about`, `/contact`, `/credits`, `/methodology`, and `/updates` provide the existing project information and correction workflow. Preparing a correction report does **not** submit it.
- `/sitemap` is the visitor directory; `/sitemap.xml` uses the same catalog in `src/lib/public-pages.ts`. The catalog includes every public content route, player profile, article, calendar year and archived season. Error responses, `/maintenance`, `/admin`, API endpoints and filter variants are excluded. New `[slug]` pages registered in `content-pages.ts` are included automatically; register any new standalone route in `public-pages.ts` too.
- Unknown routes use the custom 404. Route rendering failures use `error.tsx`; root-layout failures use the independent `global-error.tsx`. Retry re-fetches the failed route through Next.js.
- `/maintenance` always serves the maintenance design with HTTP **503**, `Retry-After: 300`, and no caching. It works without the database. To temporarily pause public routes, set `MAINTENANCE_MODE=true` in the host environment and redeploy. Admin routes, admin APIs, assets and `robots.txt` remain accessible; existing admin authentication still applies. Set it back to `false` and redeploy to reopen. Keep this mode brief: prolonged 503 responses can affect search visibility. Normal URLs are not given `noindex` during an outage.

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
src/lib/data.ts          Source register, formulas and comparison scopes
src/lib/seasons.ts       Shared-era season data and aggregation
src/lib/articles.ts      Original explanatory articles
src/lib/site.ts          Origin, indexing controls and metadata helpers
tests/                   Data checks and Playwright browser checks
public/images/           Attributed player photographs
```

Photograph licenses and original authors are documented in `ASSET_LICENSES.md` and displayed at `/credits`.

### Languages

The header language menu supports English, Spanish, Portuguese, Dutch, French,
German, Arabic and Hindi. English URLs stay unchanged; other languages use
`/es`, `/pt`, `/nl`, `/fr`, `/de`, `/ar` and `/hi` prefixes. The selected page and
comparison filters are preserved when switching. Unprefixed visits automatically
use the browser's preferred supported language; a manual language choice is
remembered for one year and takes priority. Explicit language URLs remain
authoritative. Translations render on the
server, Arabic uses right-to-left layout, and the XML sitemap includes every
public page in all eight languages with reciprocal `hreflang` alternates.
See `src/lib/i18n/README.md` for catalog maintenance and translation coverage.

### Admin social images

Sign in at `/admin`, then open a comparison. **Download image** appears next to
statistics and beneath the player cards for authenticated admins. Select both
players or one player, choose a dark or light image theme, then Square (1080×1080), Portrait (1080×1350), or Story
(1080×1920). Each preview starts with the website's currently selected theme;
changing the image theme only affects that preview. The preview is the actual PNG. Download it on desktop or mobile;
supported mobile browsers also offer native file sharing. **Open image** provides
a save-image fallback. Posting to a social network remains a manual action.

Artwork uses English labels and the approved player portraits, colours and logo;
the controls are translated. Values are captured from the visible filters, with
their snapshot date and coverage notes. Scenarios remain explicitly labelled.
The authenticated, same-origin POST `/api/admin/stat-image` validates bounded
input and renders local assets with `ImageResponse`. Responses are private and
uncached; no export changes the database or exposes provider credentials. Public
visitors have no download controls. No sitemap entry is needed for this private API.
