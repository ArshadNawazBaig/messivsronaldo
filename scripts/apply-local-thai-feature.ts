// Local CMS content is stored separately from the Git-managed article seeds.
// Usage: npx tsx scripts/apply-local-thai-feature.ts .data/admin.sqlite
import Database from "better-sqlite3";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readPosts, writePost } from "../src/lib/blog/store";
import { seedDraft } from "../src/lib/blog/model";
import { articleWordCount } from "../src/lib/blog/word-count";
import type { Article } from "../src/lib/article-types";

async function main() {
  const databasePath = process.argv[2];
  if (!databasePath || databasePath.includes("://")) throw new Error("Pass an existing local SQLite database path.");
  const feature = JSON.parse(readFileSync(resolve("src/lib/article-features/th/messi-vs-ronaldo-stats-guide.json"), "utf8")) as Pick<Article, "slug" | "title" | "description" | "summary" | "sections" | "citations">;
  if (articleWordCount(feature.sections.map(section => section.text).join(" "), "th") < 2000) throw new Error("Thai feature is below the required length.");
  const db = new Database(resolve(databasePath), { fileMustExist: true });
  try {
    const prior = (await readPosts(db, "th")).find(post => post.slug === feature.slug);
    if (!prior?.published || prior.deleted || prior.draftChanged) throw new Error("Expected an existing published Thai article without unsaved editorial changes.");
    const article: Article = { ...prior.published, ...feature, sourceIds: [], tables: undefined, body: undefined };
    const draft = seedDraft(article);
    if (JSON.stringify(prior.draft) === JSON.stringify(draft)) { console.log("Thai feature already applied."); return; }
    const backup = resolve(".artifacts/article-revisions", `th-${feature.slug}-revision-${prior.revision}.json`);
    mkdirSync(resolve(".artifacts/article-revisions"), { recursive: true });
    writeFileSync(backup, `${JSON.stringify(prior, null, 2)}\n`, { flag: "wx" });
    const post = await writePost({ action: "publish", id: prior.id, revision: prior.revision, locale: "th", slug: prior.slug, draft }, db);
    console.log(`Updated local Thai article to revision ${post.revision}. Previous revision: ${backup}`);
  } finally { db.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
