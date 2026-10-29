# Search improvements — 30 October 2026

The authenticated Search Console review identified a specific intent gap: visitors searching for Ronaldo in 2008 versus Messi in 2009 were being shown the same-season 2008/09 comparison. The page now offers an explicit comparison of Ronaldo's 2007/08 Manchester United season and Messi's 2008/09 Barcelona season, alongside its existing same-season records.

## Website change

- `/club-stats/2008-2009` adds an opening jump link and a server-rendered section with goals, appearances and calculated goals per appearance. The figures come from the existing reviewed club-season dataset: Messi 38 goals in 51 appearances; Ronaldo 42 in 49. The original same-season Ronaldo total remains 26.
- The section states both periods, excludes national-team matches, distinguishes calendar years from club seasons, and links to the relevant archives and Manchester United/Barcelona evidence. It makes no claim that scoring output alone establishes the better player.
- All nine languages have translated explanations and link labels. Existing number formatting and localized navigation remain in use.
- Only this club-season page and its translations receive the October 30 editorial sitemap date. Statistical source review dates and other club-season dates retain their existing meanings.

## CMS publication

The normal authenticated CMS endpoint published these two reviewed revisions. Revision checks confirmed that neither article had changed or contained pending editorial work. Original publication dates and cover images were preserved.

- Dutch `/nl/insights/ballon-dor-2026-date-voting-rules`: retrospective title, summary and excerpt; removed obsolete upcoming wording; added the confirmed date/location and Harry Kane's men's award result, with UEFA citations and a link to the existing localized Kane–Mbappé article. The voting explanation and existing sources remain.
- French `/fr/insights/messi-ronaldo-free-kick-records`: clearer title, “Coups francs de Messi et Ronaldo : nombre de buts et records.” The article's analysis, sources and explicitly dated historical figures remain intact.

Primary evidence: [Manchester United history](https://www.manutd.com/en/club/history/history-by-decade/2000-2009), [Barcelona's season totals](https://www.fcbarcelona.com/en/news/1125678/messi-scores-40-goals-for-the-fifth-consecutive-season), [UEFA's 2026 result](https://www.uefa.com/uefachampionsleague/news/02aa-21ec47378e70-b29defb43769-1000--harry-kane-wins-2026-mens-ballon-d-or/), [UEFA's ceremony location/date](https://support.tickets-ballondor.uefa.com/hc/en-us/articles/29825565046556-When-and-where-will-the-70th-Ballon-d-Or-ceremony-take-place).

## Validation

- Production build, including TypeScript, passed against an isolated local database.
- Existing unit suite: 204 passed, one skipped, no failures.
- Changed TypeScript/TSX files passed ESLint; the diff passed whitespace checks.
- Eighteen browser checks passed: the comparison in nine languages without JavaScript, English/French/Arabic on mobile Chromium and mobile WebKit, plus the revised Dutch article in the isolated preview. Checks cover different-season versus same-season counts, rates, translated headings, localized archive links and horizontal overflow.
- Both published CMS records were reread through the API. Live article HTML was checked separately after publication.

Search Console metrics, account snapshots and browser artifacts are retained privately under `.artifacts/gsc-2026-10-30/`. They are a baseline, not evidence of ranking gains from this release. The reviewed reporting period predates these changes. URL Inspection confirmed that `/fr/seasons` and the German ceremony article are currently indexed despite older exclusion-report entries. The Core Web Vitals report has insufficient field data for both device types.

Measure subsequent clicks and impressions for the affected query/page pairs after Google recrawls them, separating the October 26–27 event spike from repeatable traffic. Average position varies by query, device and country; no specific position or first-page result is guaranteed.
