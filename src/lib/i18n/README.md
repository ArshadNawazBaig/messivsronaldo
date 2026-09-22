# Website languages

English (en), Spanish (es), Portuguese (pt), Dutch (nl), French (fr), German (de),
Arabic (ar), and Hindi (hi) share the same published football dataset.

English URLs remain unprefixed. `src/proxy.ts` internally rewrites them to
`/en/...`; public `/en/...` URLs permanently redirect to the original URL.
Other languages use `/es/...`, `/pt/...`, etc. The request URL is authoritative:
there is no automatic browser-language redirect or language cookie. The header
selector retains the current page, query and comparison hash. Language changes
use a full navigation to update the document language and direction together.
Normal navigation uses `components/localized-link.tsx` and its router wrapper.
Admin, API, assets and metadata endpoints retain their original URLs.

Public pages live in `app/[locale]`. Server components call `getI18n()`;
interactive components call `useI18n()`. Only the active language's catalog is
sent to the browser, and English needs no catalog payload. Public translations
are rendered into HTML before hydration. No visitor text, translation request,
or football data is sent to a translation service at runtime.

## Editing translations

`messages/en.json` is the message inventory. Readable English message IDs are
shared across the eight checked-in JSON catalogs. Translate full sentences with
`{0}`, `{1}`, etc. placeholders, and pass live values separately to `t()`.
Never translate IDs, routes, source URLs, metric keys or database values.
The translator also recognizes existing composed messages from the published
dataset, formats dates in UTC, and falls back to English for unknown messages.

The initial catalog includes machine-assisted translations with reviewed core
football vocabulary, navigation and comparison controls. Long-form articles
and policies should receive native-speaker editorial review as wording evolves.
Update all catalogs when changing a message. `tests/i18n.test.ts` checks message
coverage, interpolation, localized links, and routing. Browser tests check all
eight languages, filters, RTL, server metadata and the language selector.

The language selector uses native language names. Arabic has RTL document
flow; football diagrams and Messi/Ronaldo column order stay consistent. Arabic
and Hindi use locally hosted Noto fonts with their license files in public/fonts.

## Search metadata

Every public page has a localized canonical URL, translated title and
description, Open Graph locale, and reciprocal hreflang links for all eight
languages plus x-default (English). The XML sitemap expands the shared public
page catalog into each language; adding a registered page includes its eight
URLs automatically. System responses and private routes are excluded.
