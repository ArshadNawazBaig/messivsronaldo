Act as a senior full-stack engineer, sports-data architect, UI/UX designer, technical SEO strategist, and digital publisher with 15 years of experience building successful content and analytics websites. Apply that level of judgment throughout this project. This is a role instruction; do not invent public author credentials, clients, testimonials, or experience claims.

Build an original, production-ready Lionel Messi vs Cristiano Ronaldo comparison website inspired by the purpose of https://www.messivsronaldo.app/. It must offer a more attractive interface, deeper explanations, flexible comparisons, and demonstrably traceable data. Use a distinctive identity, layout, writing, and assets. The reference is a competitor to study, not a source of content or code to copy.

The business objectives are to grow Google visibility for relevant Messi and Ronaldo searches and work toward at least US$1,000 in monthly owner earnings. Treat this as a target for monthly operating profit before personal taxes, after recurring operating expenses. Report gross revenue separately. Do not guarantee rankings, indexing, advertising approval, revenue, or a completion date for achieving the business target.

Research informing this brief was checked on September 21, 2026. Recheck changing provider terms, prices, coverage, software documentation, and Google guidance when implementation begins. Read the accompanying WEBSITE_RESEARCH.md for evidence and limitations.

**1. Product strategy and scope**

Serve casual fans who want a quick answer, enthusiasts who want precise comparisons, and writers who need attributable evidence. Start with English and a responsive web experience. Organize navigation around Overview, Compare, Goals & Assists, Competitions, Seasons, Matches, Honours, and Methodology.

The reference already covers many advanced categories. Our differentiation should be a smoother comparison workflow, visible evidence for individual numbers, honest coverage labels, reusable comparison links, and clearer explanations of why totals differ. Treat these as proposed advantages to validate with users, not proven market gaps.

Before implementation, provide a concise feature matrix, information architecture, proposed design direction, data coverage audit, and cost model. Then implement in useful stages. Prioritize a complete, accurate core over an extensive catalogue of empty pages.

Launch scope: overview, comparison explorer, goals, assists, penalties, international and Champions League views, season/calendar-year views, trophies, player profiles, available match records, methodology, corrections, and essential publisher pages. Publish a route only when its content and coverage support the claim in its title. Keep advanced or incomplete routes out of search until they are useful.

**2. Data correctness is a release requirement**

Never invent statistics, citations, records, match events, historical coverage, or update times. Never describe a number as live unless it is actually backed by a functioning live feed. A visually complete mockup does not establish statistical correctness.

Evaluate data sources before committing to one. API-Football is a candidate for supported competitions and seasons; its coverage varies and its terms say the subscription does not itself supply publication rights. Stats Perform/Opta is another candidate for licensed historical and event data; obtain actual coverage and pricing for this use case. Neither has been verified to supply every required field across both complete careers. Check display, storage, derived statistics, image, export, and redistribution permissions for the intended commercial product. [API-Football coverage](https://www.api-football.com/coverage), [terms](https://www.api-football.com/terms), and [Opta products and historical data](https://www.statsperform.com/faqs/stats-perform-faqs-opta-brand-data-products/) inform this evaluation.

Build a source matrix by player, team, competition, season, and metric, showing availability, definitions, provenance, permitted use, and known gaps. Verify competition facts against relevant organizers' records where available. Prefer authoritative rulings for scorer attribution and match status; use a consistently defined provider for analytical metrics. Multiple sources repeating one feed do not constitute independent verification. Do not scrape the competitor as the production database.

Use these explicit counting rules:

- Default career scope: senior first-team competitive club matches plus recognized senior national-team A internationals, including recognized international friendlies. Offer a separate competitive-internationals filter. Exclude club friendlies, exhibitions, youth/reserve matches, and penalty-shootout goals from default career goals.
- Keep qualification rounds, tournament finals, and main competition stages identifiable. Show the Champions League qualifying toggle and its default in the interface.
- Separate calendar years from competition seasons, including competitions that use different season calendars. Display the actual date interval used in cross-league comparisons.
- Publish one named, versioned assist definition for default comparisons. Store provider-native assists, secondary assists, and fantasy-style assists separately. Do not silently add secondary or fantasy assists to conventional assists. If historical events cannot support normalization, label the limitation rather than claim equivalence. [Opta's definitions](https://www.statsperform.com/opta-event-definitions/) illustrate these distinctions.
- Define whether trophies count squad membership, appearances, or another documented eligibility rule. Separate team honours, individual awards, and youth/Olympic honours. Explain unusual competitions and eligibility decisions.
- Keep xG, xA, ratings, shot coordinates, and other advanced metrics tied to their provider/model and coverage. Do not blend models or imply complete-career coverage where only selected seasons exist.
- Store missing values as null. Show “Unavailable” or “Partial coverage”; never substitute zero. Every rate must use a numerator and denominator from the same covered matches.

Each published statistic needs a definition, scope, source reference, coverage period, last successful verification time, dataset version, and status such as verified, provisional, disputed, or incomplete. Use a clearly accessible “How this is counted” panel. Do not calculate numerical confidence scores without a defensible method.

Persist match-level records where available and calculate totals from them. Keep historical aggregate baselines separately if match-level detail is unavailable. Record their exact interval and provenance, prevent overlap with later match imports, and disable filters the baseline cannot support. Partial match history must never masquerade as a complete career ledger. Only publish an all-time total after verifying complete coverage for that metric and scope.

Create scheduled ingestion, idempotent imports, duplicate detection, retries, quota handling, reconciliation, and human review for material conflicts. Keep raw inputs where permitted and retain a correction audit trail. Target an update within 60 minutes of the provider making a completed match available, followed by a later reconciliation; make this an operational target conditional on the feed. Show the last successful sync and stale state during outages.

If credentials or verified historical data are unavailable, continue building with clearly labelled development fixtures. Keep demonstration data out of public statistics, indexable pages, metadata, and social cards. Describe the exact missing inputs without presenting the site as ready for a factual launch.

**3. Comparison features and useful detail**

Build an explorer with totals, per-appearance, and per-90 views; player, club/country, competition, season, calendar year, date range, age, home/away/neutral venue, opponent, stage, and minimum-minutes filters. Enable only combinations the data supports. Support reset, readable filter chips, and shareable URLs that restore the same comparison.

Core metrics: appearances, starts, minutes, goals, assists, goal contributions, non-penalty goals, penalties scored and attempted, penalty conversion, direct free kicks, hat-tricks, minutes per goal, and goals/assists per 90. Add body-part and location breakdowns where evidence exists.

Offer equal-age comparisons, cumulative career progression, rolling form over the last 5/10/20 appearances, club versus national-team splits, and head-to-head matches. Explain whether an age comparison is cumulative through an exact birthday or limited to an age interval. Head-to-head appearances require both players to have appeared in that fixture; do not confuse them with all meetings between their teams.

Advanced later features: xG/xA, shots, conversion rates, key passes, chances created, dribbles, and shot maps, conditional on licensed coverage. An optional “same coverage” mode must show the dates, competitions, and sample sizes used. Do not imply that per-90 adjustment removes differences in league strength or role.

Provide sortable match tables with competition, date, opponent, score, minutes, goals, assists, sources, and match detail. Make each aggregate traceable to its included matches or explicitly identified historical baseline. Provide searchable definitions and a correction-report form with an administration queue.

Add branded share cards with scope, timestamp, source attribution, and a link to the comparison. Offer CSV downloads only when source permissions allow. Later enhancements can include saved comparisons, opt-in milestone notifications, and reviewed Spanish/Portuguese translations after demand is established. Keep the core statistics freely accessible.

Use neutral writing. A metric can have a numerical leader, but the site should not pretend that a chosen set of weights objectively proves the greatest player. Do not add a universal GOAT score by default.

**4. Visual design and interaction**

Create the feeling of a premium football statistics publication: confident typography, spacious composition, sharp tables, and restrained motion. Use an original visual system with a deep navy background, light neutral surfaces in light mode, cool blue for Messi, and warm coral for Ronaldo. Use color as a supporting cue alongside player names and symbols. Avoid giving either player visual prominence unrelated to the selected metric.

The homepage should contain a concise comparison headline, balanced player panels, the most important verified totals, a visible scope/date label, and an obvious “Explore comparison” action. Follow with a career trend chart, recent verified match updates, topic links, and a short methodology explanation. Reserve meaningful space for the numbers; decorative photography must not push the comparison out of view on mobile.

Desktop: balanced player columns, central metric labels, compact comparison bars, tabular numerals, and a persistent filter summary. Mobile: concise metric rows that show both players together, an accessible filter drawer, and details on demand. Dense tables may scroll within their own labelled region; the whole page must not overflow horizontally.

Use licensed photographs or original graphic treatments. Track asset rights and attribution. Offer dark/light themes, a comfortable reading density, visible keyboard focus, adequate contrast, screen-reader labels, reduced-motion support, and touch-friendly controls. Aim for WCAG 2.2 AA and verify it through automated and manual checks.

Prefer line charts for progression and paired bars for direct comparisons. Use consistent axes and show sample sizes. Supply readable HTML tables and text explanations for every important chart. Include designed loading, empty, partial-data, stale-data, and error states. Every visible control must work.

**5. Engineering and maintainability**

Use a maintained TypeScript stack with Next.js App Router, PostgreSQL, a typed data-access layer, and a compact component/design system, unless an existing repository provides a better foundation. Pin compatible supported versions after reviewing current documentation. Keep architecture proportional to a two-player publication; avoid unnecessary distributed services.

Render primary statistics, page explanations, and internal links in server-generated HTML. Use cached rendering and targeted revalidation after verified changes. Keep interactive charts and filters in small client components. Generate metadata and social images from the same verified snapshot as the visible page. [Next.js metadata documentation](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) and [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/specialty/javascript/javascript-seo-basics) are implementation references.

Model players, teams, competitions, seasons, matches, appearances, events, metric definitions, source records, coverage, historical baselines, honours, sync runs, editorial pages, corrections, and snapshots. Keep provider-specific adapters separate from aggregation and presentation so a provider can be replaced.

Document formulas, including goals per 90 = goals × 90 / covered minutes, goal contributions = goals + assists under the selected definition, and penalty conversion = valid scored attempts / valid attempts × 100. Handle zero denominators, retaken penalties, corrected scorer attribution, extra time, abandoned matches, and duplicate events explicitly. Document the chosen minutes convention.

Implement protected administration for imports, discrepancy review, corrections, and editorial publication. Protect secrets, validate input, enforce authorization on the server, rate-limit public forms, and keep backups and recoverable migrations. Provide .env.example, setup instructions, meaningful error logs, scheduled-job monitoring, and deployment/rollback instructions.

**6. Search strategy and page architecture**

Build for search intent and useful answers. Treat “messi vs ronaldo,” “messi ronaldo stats,” and “ronaldo vs messi” as broad target phrases. Start with focused comparison queries too. These are candidate targets, not measured search volumes or promises of easy rankings.

Use this initial mapping, adjusting routes to avoid two pages competing for the same intent:

| Search intent | Proposed canonical page | Required value |
| --- | --- | --- |
| Messi vs Ronaldo stats | / | Clear overview and verified career scope |
| Messi vs Ronaldo goals | /goals/ | Totals, trends, inclusions and breakdowns |
| Messi vs Ronaldo assists | /assists/ | Named definitions and source differences |
| Messi vs Ronaldo without penalties | /non-penalty-goals/ | Transparent exclusions and rate comparisons |
| Messi vs Ronaldo Champions League stats | /champions-league/ | Stage and qualifying scope |
| Messi vs Ronaldo international stats | /international/ | Competitive and friendly filters |
| Messi vs Ronaldo World Cup stats | /world-cup/ | Tournament finals versus qualifiers |
| Messi vs Ronaldo trophies | /trophies/ | Explicit eligibility rules and award records |
| Messi vs Ronaldo by age | /by-age/ | Equal-age intervals and sample sizes |
| Messi vs Ronaldo by year | /years/[year]/ | Actual calendar-year records and commentary |
| Messi vs Ronaldo by season | /seasons/[season]/ | Explicit season mapping and coverage |
| Messi or Ronaldo penalties/free kicks | /penalties/ and /free-kicks/ | Definitions, attempts, and verified events |

Create player profiles and club pages only where there is distinct useful content. Use a brandable identity and descriptive page titles; keyword repetition in the domain or copy is not a substitute for quality.

For each indexable page, provide a clear title, one main heading, concise answer, relevant data table, original explanation, definitions, visible sources and substantive update date, related links, canonical URL, and social metadata. Maintain a sitemap containing only eligible canonical pages. Set accurate status codes and redirects. Verify ownership in Search Console and inspect representative URLs after launch. Google's [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) explains discovery and indexing practices without guaranteeing inclusion or rankings.

Prevent filter combinations from creating an unlimited crawl space. Maintain an explicit allowlist of useful indexable landing pages. Use URL fragments for arbitrary client-side explorer state where appropriate. If share routes or query URLs require noindex, let crawlers access the directive; do not block them in robots.txt while relying on that directive. Canonicalize genuinely equivalent pages and document the policy. [Google's faceted navigation guidance](https://developers.google.com/crawling/docs/faceted-navigation) informs this design.

Add truthful structured data appropriate to each page, such as BreadcrumbList and Article for editorial content. Use other types only where their meaning fits visible content. Do not promise a sports-statistics rich result, FAQ enhancement, or ranking improvement from schema. Validate against the [current structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

Publish original explanations such as “Why assist totals differ,” “How penalties affect scoring comparisons,” and “What equal-age comparisons show.” Every analytical claim needs data and scope. Include truthful author information, methodology, corrections, About, Contact, Privacy, and applicable disclosure pages. Do not fabricate an expert biography to match the role instruction.

Create a dated 90-day editorial and distribution plan: maintain verified match updates, publish one or two substantial analyses per week when evidence supports them, and prepare share graphics and pitches for relevant football publishers. Earn attention through useful work. Avoid bought ranking links, keyword stuffing, copied articles, automated low-value page creation, and unrelated sponsored content. Follow [Google's spam policies](https://developers.google.com/search/docs/essentials/spam-policies). Do not send pitches or post externally without separate authorization.

**7. Performance and verification**

Target mobile and desktop 75th-percentile field performance of LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1, following [Web Vitals guidance](https://web.dev/articles/vitals). Optimize images and fonts, reserve dimensions for ads and charts, lazy-load lower-page assets, and minimize third-party scripts. Lab tests help diagnose issues; they do not prove real-user field performance before sufficient traffic exists.

Add meaningful tests for aggregation, duplicate ingestion, source corrections, counting boundaries, consistent rate denominators, baseline overlap, missing values, and filter restoration. Validate a documented sample of matches and published totals against the approved sources. Test mobile navigation, keyboard use, accessible tables, comparison sharing, and the correction workflow. Verify server-rendered HTML, canonical tags, sitemap exclusions, robots behavior, and metadata consistency.

Prevent public release of unverified career totals, exposed secrets, broken primary interactions, or unlabeled demonstration data. For unavailable advanced metrics, ship an honest explanation or omit the feature.

**8. Monetization and the US$1,000 target**

Provide a financial model with editable traffic, page RPM, conversion rates, commissions, recurring revenue, and costs. Page RPM is earnings per 1,000 page views, not per 1,000 users or ad impressions. Google's [Page RPM definition](https://support.google.com/adsense/answer/112030?hl=en) supplies the formula.

Use the following only as arithmetic scenarios, not predicted football advertising rates:

| Assumed page RPM | Monthly page views for $1,000 gross ad revenue |
| --- | ---: |
| $3 | 333,334 |
| $5 | 200,000 |
| $10 | 100,000 |
| $15 | 66,667 |

Model operating profit = advertising + affiliate commissions + sponsorship + subscriptions − operating costs. With an illustrative $200 monthly operating cost and no other income, a $1,000 profit target requires $1,200 gross, or 240,000 page views at an assumed $5 page RPM. This is not a provider quote or an earnings forecast. Include data licensing, historical acquisition, hosting, database, editorial upkeep, email, monitoring, payment fees, and acquisition costs. Report initial development/data setup costs separately and show their effect on payback.

Plan tasteful display advertising after the site is eligible and accepted. Reserve ad slots below the key comparison and between meaningful sections; protect usability and performance. Follow [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en), and do not represent approval as automatic. Keep account identifiers and consent configuration external to source code.

Explore relevant licensed-merchandise affiliates, clearly labelled newsletter or page sponsorships, and later optional ad-free membership or convenience features. Confirm actual programs, regional availability, and terms before projecting commissions. Keep basic facts and source explanations free. Disclose commercial relationships and qualify paid links. Implement consent and privacy controls appropriate to the chosen services and audience.

Track organic impressions and clicks, landing-page engagement, return visits, comparison sharing, email opt-ins, affiliate conversions, actual page RPM, revenue per channel, and operating profit. Use measured revenue data to update the model instead of turning assumptions into promises.

**9. Launch, growth, and deliverables**

Work in stages: data and rights feasibility; an end-to-end verified comparison with the design system; core content and explorer; deployment checks; then growth and validated advanced features. Demonstrate each stage with working behavior and evidence.

Deliver the working code, database schema and migrations, adapters and import pipeline, source/coverage register, administration workflow, original interface, essential editorial pages, tests and results, deployment runbook, SEO checks, 90-day content plan, and editable revenue model. Include a precise list of external inputs still needed, such as a domain, data contract, production credentials, publisher account, and verified historical archive.

For days 1–30 after launch, focus on data reliability, crawl/indexing diagnostics, and usability feedback. For days 31–60, expand useful coverage and distribute original research. For days 61–90, use actual Search Console and revenue data to improve relevant pages and test appropriate monetization. These are work periods, not promised ranking or income milestones. Provide monthly maintenance responsibilities beyond day 90.

When credentials and deployment authorization are available, deploy and verify the public site, scheduler, HTTPS, canonical host, monitoring, backups, and production search settings. Otherwise provide a tested preview and precise deployment instructions without claiming deployment is complete. Record actual publication and verification times.

The result should give visitors a fast, attractive, credible way to understand Messi and Ronaldo, and give the owner a measurable route toward a sustainable business. Be explicit about what has been built, what is verified, what remains incomplete, and which growth assumptions still require real-world evidence.
