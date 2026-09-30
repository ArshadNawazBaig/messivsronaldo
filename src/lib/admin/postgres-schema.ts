import type { TransactionSql } from "postgres";

export const applicationTables = ["state", "matches", "runs", "settings", "sessions", "login_attempts", "locks", "blog_posts", "blog_media"] as const;

// The server owns these tables. Supabase's browser/Data API roles must not gain
// access to admin sessions, provider credentials, drafts, or unpublished media.
export async function initializePostgresSchema(tx: TransactionSql) {
  await tx`SELECT pg_advisory_xact_lock(17071700)`;
  await tx`CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0)`;
  await tx`INSERT INTO state (id) VALUES (1) ON CONFLICT DO NOTHING`;
  await tx`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, data TEXT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS runs (id SERIAL PRIMARY KEY, at TEXT NOT NULL, date TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL, message TEXT NOT NULL, before_data TEXT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires BIGINT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS login_attempts (id SERIAL PRIMARY KEY, at BIGINT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS locks (id INTEGER PRIMARY KEY, token TEXT NOT NULL, expires BIGINT NOT NULL)`;
  await tx`CREATE TABLE IF NOT EXISTS blog_posts (id TEXT PRIMARY KEY, locale TEXT NOT NULL, slug TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL, UNIQUE(locale,slug))`;
  await tx`CREATE TABLE IF NOT EXISTS blog_media (id TEXT PRIMARY KEY, data BYTEA NOT NULL, created_at TEXT NOT NULL)`;

  const apiRoles = await tx`SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')`;
  for (const table of applicationTables) {
    await tx`ALTER TABLE ${tx(table)} ENABLE ROW LEVEL SECURITY`;
    await tx`REVOKE ALL ON TABLE ${tx(table)} FROM PUBLIC`;
    for (const role of apiRoles) await tx`REVOKE ALL ON TABLE ${tx(table)} FROM ${tx(role.rolname)}`;
  }
  for (const sequence of ["runs_id_seq", "login_attempts_id_seq"]) {
    await tx`REVOKE ALL ON SEQUENCE ${tx(sequence)} FROM PUBLIC`;
    for (const role of apiRoles) await tx`REVOKE ALL ON SEQUENCE ${tx(sequence)} FROM ${tx(role.rolname)}`;
  }
}
