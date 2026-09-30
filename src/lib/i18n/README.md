# Website languages

English (en), Spanish (es), Portuguese (pt), Dutch (nl), French (fr), German (de),
Arabic (ar), Hindi (hi), and Thai (th) share the same published football dataset.

English URLs remain unprefixed. `src/proxy.ts` internally rewrites them to
`/en/...`; public `/en/...` URLs permanently redirect to the original URL.
Other languages use `/es/...`, `/pt/...`, etc. Explicit language URLs are
authoritative. On unprefixed public page visits, a valid `rivalry-locale` cookie
takes priority over the browser's weighted `Accept-Language` preferences. Regional
variants map to supported base languages, with English as the fallback. Only
manual menu choices are saved, for one year (Path=/, SameSite=Lax, Secure on HTTPS).
Automatic detection does not set a cookie. An explicit `/en/...` visit also saves
English before redirecting to its canonical unprefixed URL.

Language negotiation uses temporary, private, non-cacheable redirects and skips
API/admin/assets, non-GET/HEAD requests, prefetches, RSC fetches, and recognized
search/link-preview crawlers. Thus English and translated pages remain directly
crawlable. The header selector retains the page, query and comparison hash;
full navigation updates the document language and direction together.
Normal navigation uses `components/localized-link.tsx` and its router wrapper.
Admin, API, assets and metadata endpoints retain their original URLs.

Public pages live in `app/[locale]`. Server components call `getI18n()`;
interactive components call `useI18n()`. Only the active language's catalog is
sent to the browser, and English needs no catalog payload. Public translations
are rendered into HTML before hydration. No visitor text, translation request,
or football data is sent to a translation service at runtime.

The public root layout is `app/[locale]/layout.tsx`. `getI18n()` reads Next.js
root parameters, so the URL determines the language without request headers or
cookies making every page dynamic. Public pages are generated on their first
visit and cached for one hour; publishing statistics or articles invalidates
their data tags and dependent pages immediately. The query-dependent comparison
poster studio remains dynamic. Language-negotiation redirects remain private.

Admin pages use a separate dynamic root layout. Cached public HTML contains no
admin controls. A readable UI hint cookie only triggers a private session check;
the server still verifies the HttpOnly session before enabling export controls
and authorizes every export request. Sessions created before this hint was added
receive it on their next visit to `/admin`.

## Editing translations

`messages/en.json` is the message inventory. Readable English message IDs are
shared across the nine checked-in JSON catalogs. Translate full sentences with
`{0}`, `{1}`, etc. placeholders, and pass live values separately to `t()`.
Never translate IDs, routes, source URLs, metric keys or database values.
The translator also recognizes existing composed messages from the published
dataset and falls back to English for unknown messages. `date-format.ts` parses
valid UTC calendar dates and uses checked-in month names and date patterns;
public translated date labels must not use runtime `Intl.DateTimeFormat`, whose
punctuation can differ between the server and browser. Numeric formatting uses
`numberLocales`, with an explicit Latin numbering system for Arabic to keep the
site's 0–9 statistics consistent across ICU versions.

The initial catalog includes machine-assisted translations with reviewed core
football vocabulary, navigation and comparison controls. Long-form articles
and policies should receive native-speaker editorial review as wording evolves.
Update all catalogs when changing a message. `tests/i18n.test.ts` checks message
coverage, interpolation, localized links, and routing. Browser tests check all
nine languages, filters, RTL, server metadata and the language selector.

The language selector uses native language names. Arabic has RTL document
flow; football diagrams and Messi/Ronaldo column order stay consistent. Arabic, Hindi
and Thai use locally hosted Noto fonts with their license files in public/fonts.

## Search metadata

Every public page has a localized canonical URL, translated title and
description, Open Graph locale, and reciprocal hreflang links for all nine
languages plus x-default (English). The XML sitemap expands the shared public
page catalog into each language; adding a registered page includes its nine
URLs automatically. System responses and private routes are excluded.

Thai uses `/th` routes, the native language label ไทย, and `th_TH` Open Graph metadata.
Dates explicitly retain Gregorian years (for example, 21 กันยายน ค.ศ. 2026),
matching the football dataset instead of switching silently to Buddhist years.
Thai statistics use Latin digits. Blog word counts and reading-time estimates
use Thai word segmentation because whitespace is not a reliable word boundary.
Thai catalogs include machine-assisted text with reviewed core navigation and
football terminology; long-form wording should receive native-speaker review.
