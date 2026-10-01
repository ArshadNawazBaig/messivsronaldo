import Database from "better-sqlite3";
import { resolve } from "node:path";
import { postgresStore, closeDatabase } from "../src/lib/admin/database";
import { decryptConnection } from "../src/lib/admin/store";
import { matchSchema } from "../src/lib/admin/model";
import { initializePostgresSchema } from "./lib/postgres-schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the destination database before migrating.");
  const source = new Database(process.env.ADMIN_DATABASE_PATH || resolve(".data/admin.sqlite"), { readonly: true, fileMustExist: true });
  try {
    const hasTable = (name: string) => !!source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
    const snapshot = source.transaction(() => ({
      state: source.prepare("SELECT revision FROM state WHERE id=1").get() as { revision: number },
      matches: source.prepare("SELECT id,data FROM matches ORDER BY id").all() as { id: string; data: string }[],
      runs: source.prepare("SELECT id,at,date,action,status,message,before_data FROM runs ORDER BY id").all() as Record<string, string | number>[],
      settings: source.prepare("SELECT key,value FROM settings").all() as { key: string; value: string }[],
      posts: hasTable("blog_posts") ? source.prepare("SELECT id,locale,slug,revision,data FROM blog_posts").all() as { id: string; locale: string; slug: string; revision: number; data: string }[] : [],
      support: hasTable("support_tickets") ? source.prepare("SELECT id,status,revision,created_at,data FROM support_tickets").all() as { id: string; status: string; revision: number; created_at: string; data: string }[] : [],
      media: hasTable("blog_media") ? source.prepare("SELECT id,data,created_at FROM blog_media").all() as { id: string; data: Buffer; created_at: string }[] : [],
    }))();
    for (const row of snapshot.matches) matchSchema.parse(JSON.parse(row.data));
    const provider = snapshot.settings.find(row => row.key === "provider");
    if (provider) decryptConnection(provider.value); // Verify that the configured secret can decrypt the migrated key.
    const pg = (await postgresStore())!;
    await pg.begin(initializePostgresSchema);
    await pg.begin(async tx => {
      await tx`SELECT revision FROM state WHERE id=1 FOR UPDATE`;
      const [existing] = await tx`SELECT (SELECT COUNT(*) FROM matches) + (SELECT COUNT(*) FROM runs) + (SELECT COUNT(*) FROM settings) + (SELECT COUNT(*) FROM blog_posts) + (SELECT COUNT(*) FROM blog_media) + (SELECT COUNT(*) FROM support_tickets) AS n`;
      if (Number(existing.n)) throw new Error("Destination is not empty. Migration refused; existing data was not changed.");
      if (snapshot.matches.length) await tx`INSERT INTO matches ${tx(snapshot.matches, "id", "data")}`;
      if (snapshot.runs.length) await tx`INSERT INTO runs ${tx(snapshot.runs, "id", "at", "date", "action", "status", "message", "before_data")}`;
      if (snapshot.settings.length) await tx`INSERT INTO settings ${tx(snapshot.settings, "key", "value")}`;
      if (snapshot.posts.length) await tx`INSERT INTO blog_posts ${tx(snapshot.posts, "id", "locale", "slug", "revision", "data")}`;
      if (snapshot.media.length) await tx`INSERT INTO blog_media ${tx(snapshot.media, "id", "data", "created_at")}`;
      if (snapshot.support.length) await tx`INSERT INTO support_tickets ${tx(snapshot.support, "id", "status", "revision", "created_at", "data")}`;
      await tx`UPDATE state SET revision=${snapshot.state.revision} WHERE id=1`;
      await tx`SELECT setval(pg_get_serial_sequence('runs','id'), COALESCE((SELECT MAX(id) FROM runs),1), EXISTS(SELECT 1 FROM runs))`;
      await tx`INSERT INTO settings (key,value) VALUES ('sqlite-import',${new Date().toISOString()})`;
    });
    console.log(`Migration complete: ${snapshot.matches.length} match records, ${snapshot.runs.length} activity entries, ${snapshot.posts.length} blog posts ${snapshot.media.length} images and ${snapshot.support.length} support reports, revision ${snapshot.state.revision}. Provider connection ${provider ? "preserved" : "not configured"}. Existing login sessions were not copied.`);
  } finally { source.close(); await closeDatabase(); }
}
main().catch(() => { console.error("Migration failed. Verify DATABASE_URL, the admin secret, and that the destination is empty. No credentials were logged."); process.exitCode = 1; });
