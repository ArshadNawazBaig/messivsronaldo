# Blog publishing

Open **Admin → Blog editor** (`/admin/blog`) and sign in with the existing admin password.

1. Choose the article language, then select **New article** or an existing article.
2. Add a title, URL slug, category and excerpt. Write in the visual editor, using headings, lists, links, quotes, tables and images as needed.
3. Use **Add cover image** for the article/share image and the toolbar's **Insert image** for images in the body. Upload JPEG, PNG, WebP or AVIF files up to 3 MB. Add alt text; captions can include photo credits.
4. **Preview** shows the current draft. **Save draft** saves privately; an existing published version remains live.
5. **Publish article / Publish changes** updates the public article, reading-room cards, site search, related reading and sitemaps.
6. **Unpublish article** removes the public version and keeps the draft. **Move to Trash** removes it from the website; **Restore as draft** recovers its saved content without publishing it.

The language and URL are fixed after the first save to preserve links. For another language, create an article in that language using the same slug. Alternate-language links appear only for published versions; the editor does not translate the article automatically. New English articles appear at `/insights/slug`; other languages use `/es/insights/slug`, `/ar/insights/slug`, etc.

The original articles remain available until an administrator changes them. Editing an original article creates a database override for that language. Imported drafts preserve sections, tables, references and existing calculator presets. Deleting one keeps a tombstone so it cannot reappear from the original code.

## Storage and access

Production uses the existing PostgreSQL `DATABASE_URL`. Local development uses the existing SQLite admin database. The `blog_posts` and `blog_media` tables are created automatically by the existing database initialization; no new storage service or credentials are required. The SQLite-to-Postgres migration includes articles and image bytes.

Each post stores a draft, separate published snapshot and revision. Atomic revision checks reject competing saves instead of overwriting an editor's work. Saving or publishing updates the post in one database operation. Trash keeps a recoverable draft. Images are decoded, resized to at most 1800 × 1800 pixels, stripped of metadata, encoded as WebP, and stored in the database so deployments do not erase them. Media is publicly served only while referenced by a published article; draft and unused images require an admin session. Retained unused images are not automatically deleted.

The editor uses Tiptap and stores validated JSON, not arbitrary HTML. Public pages render a restricted set of React elements. Admin reads and writes require the existing session; writes also enforce the existing same-origin check. Article requests have a 750 KB limit. Admin responses are private and excluded from indexing. No image optimization proxy or external URL fetch is used for uploads.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- `npm run test:admin -- tests/admin-e2e/blog.spec.ts` covers desktop, mobile Chromium and mobile Safari using isolated synthetic content.
- The admin test script builds for its local HTTP origin first, so Safari can use the test session cookie. Build again with the production site URL before deploying a prebuilt artifact.
- `TEST_DATABASE_URL=postgres://…/rivalry_test_… npm test` also checks PostgreSQL persistence, images and concurrent writes. Never point tests at the production database.
