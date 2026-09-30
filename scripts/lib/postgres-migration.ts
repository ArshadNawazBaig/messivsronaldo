import { createHash } from "node:crypto";
import type { Sql, TransactionSql } from "postgres";
import { z } from "zod";
import { matchSchema } from "../../src/lib/admin/model";
import { decryptConnection } from "../../src/lib/admin/store";
import { applicationTables, initializePostgresSchema } from "../../src/lib/admin/postgres-schema";

const text = z.string();
const integer = z.number().int().nonnegative();
const tablesSchema = z.object({
  state: z.array(z.object({ id: z.literal(1), revision: integer })).length(1),
  matches: z.array(z.object({ id: text, data: text })),
  runs: z.array(z.object({ id: integer, at: text, date: text, action: text, status: text, message: text, before_data: text })),
  settings: z.array(z.object({ key: text, value: text })),
  blog_posts: z.array(z.object({ id: text, locale: text, slug: text, revision: integer, data: text })),
  blog_media: z.array(z.object({ id: text, data: text, created_at: text })),
});
const backupSchema = z.object({
  format: z.literal("rivalry-postgres-v1"),
  exportedAt: z.iso.datetime(),
  sha256: text.regex(/^[a-f0-9]{64}$/),
  tables: tablesSchema,
});
type Tables = z.infer<typeof tablesSchema>;
export type PostgresBackup = z.infer<typeof backupSchema>;

function checksum(tables: Tables) {
  return createHash("sha256").update(JSON.stringify(tables)).digest("hex");
}

// Fixed columns and JS sorting keep checksums independent of DB collation.
async function readTables(tx: TransactionSql): Promise<Tables> {
  const rows = {
    state: [...await tx`SELECT id, revision FROM state`],
    matches: [...await tx`SELECT id, data FROM matches`],
    runs: [...await tx`SELECT id, at, date, action, status, message, before_data FROM runs`],
    settings: [...await tx`SELECT key, value FROM settings`],
    blog_posts: [...await tx`SELECT id, locale, slug, revision, data FROM blog_posts`],
    blog_media: (await tx`SELECT id, data, created_at FROM blog_media`).map(row => ({ id: row.id, data: (row.data as Buffer).toString("base64"), created_at: row.created_at })),
  };
  const tables = tablesSchema.parse(rows);
  for (const records of Object.values(tables)) {
    records.sort((a, b) => {
      const left = "key" in a ? a.key : a.id;
      const right = "key" in b ? b.key : b.id;
      return left < right ? -1 : left > right ? 1 : 0;
    });
  }
  return tables;
}

export function validateBackup(input: unknown): PostgresBackup {
  const backup = backupSchema.parse(input);
  if (checksum(backup.tables) !== backup.sha256) throw new Error("Backup checksum does not match; import refused.");
  for (const row of backup.tables.matches) {
    const record = matchSchema.parse(JSON.parse(row.data));
    if (record.id !== row.id) throw new Error("Backup contains a mismatched match ID.");
  }
  for (const row of backup.tables.runs) z.array(matchSchema).parse(JSON.parse(row.before_data));
  for (const row of backup.tables.blog_posts) {
    const post = JSON.parse(row.data);
    if (post.id !== row.id || post.locale !== row.locale || post.slug !== row.slug || post.revision !== row.revision) {
      throw new Error("Backup contains mismatched blog metadata.");
    }
  }
  for (const row of backup.tables.blog_media) {
    if (Buffer.from(row.data, "base64").toString("base64") !== row.data) throw new Error("Backup contains invalid image data.");
  }
  return backup;
}

export function backupSummary(backup: PostgresBackup) {
  return {
    exportedAt: backup.exportedAt,
    revision: backup.tables.state[0].revision,
    counts: Object.fromEntries(Object.entries(backup.tables).map(([table, rows]) => [table, rows.length])),
    sha256: backup.sha256,
  };
}

// Export only durable application data. Supabase's managed schemas are untouched;
// admin sessions, rate-limit entries and in-progress locks start fresh.
export async function exportPostgres(db: Sql): Promise<PostgresBackup> {
  const tables = await db.begin("isolation level repeatable read read only", readTables);
  return validateBackup({ format: "rivalry-postgres-v1", exportedAt: new Date().toISOString(), sha256: checksum(tables), tables });
}

export async function verifyPostgres(db: Sql, input: unknown) {
  const backup = validateBackup(input);
  const current = await db.begin("isolation level repeatable read read only", readTables);
  if (checksum(current) !== backup.sha256) throw new Error("Database contents differ from the backup. Do not switch production.");
  return backupSummary(backup);
}

export async function importPostgres(db: Sql, input: unknown) {
  const backup = validateBackup(input);
  const provider = backup.tables.settings.find(row => row.key === "provider");
  // A changed admin secret would make the migrated provider key unusable.
  if (provider) decryptConnection(provider.value);
  await db.begin(async tx => {
    await initializePostgresSchema(tx);
    for (const table of applicationTables) await tx`LOCK TABLE ${tx(table)} IN ACCESS EXCLUSIVE MODE`;
    const [state] = await tx`SELECT revision FROM state WHERE id=1`;
    if (state.revision !== 0) throw new Error("Destination is not empty. Import refused.");
    for (const table of applicationTables.filter(name => name !== "state")) {
      const [row] = await tx`SELECT EXISTS(SELECT 1 FROM ${tx(table)}) AS populated`;
      if (row.populated) throw new Error("Destination is not empty. Import refused.");
    }
    const { tables } = backup;
    if (tables.matches.length) await tx`INSERT INTO matches ${tx(tables.matches, "id", "data")}`;
    if (tables.runs.length) await tx`INSERT INTO runs ${tx(tables.runs, "id", "at", "date", "action", "status", "message", "before_data")}`;
    if (tables.settings.length) await tx`INSERT INTO settings ${tx(tables.settings, "key", "value")}`;
    if (tables.blog_posts.length) await tx`INSERT INTO blog_posts ${tx(tables.blog_posts, "id", "locale", "slug", "revision", "data")}`;
    // Insert images individually to keep query parameter buffers bounded.
    for (const row of tables.blog_media) {
      await tx`INSERT INTO blog_media (id, data, created_at) VALUES (${row.id}, ${Buffer.from(row.data, "base64")}, ${row.created_at})`;
    }
    await tx`UPDATE state SET revision=${tables.state[0].revision} WHERE id=1`;
    if (checksum(await readTables(tx)) !== backup.sha256) throw new Error("Import verification failed; transaction rolled back.");
    await tx`SELECT setval(pg_get_serial_sequence('runs','id'), COALESCE((SELECT MAX(id) FROM runs),1), EXISTS(SELECT 1 FROM runs))`;
  });
  return backupSummary(backup);
}
