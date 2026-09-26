import postgres, { type Sql } from "postgres";
import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import * as local from "./store";
import { AdminError, type MatchRecord, type RunRecord, type ProviderConnection } from "./model";

let sql: Sql | undefined;
let initialized: Promise<void> | undefined;
export async function postgresStore() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL) throw new AdminError("The production database is not configured.", 503);
    return null;
  }
  sql ??= postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false, onnotice: () => {} });
  const db = sql;
  initialized ??= db.begin(async tx => {
    // Serialize first-time initialization across serverless instances.
    await tx`SELECT pg_advisory_xact_lock(17071700)`;
    await tx`CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0)`;
    await tx`INSERT INTO state (id) VALUES (1) ON CONFLICT DO NOTHING`;
    await tx`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, data TEXT NOT NULL)`;
    await tx`CREATE TABLE IF NOT EXISTS runs (id SERIAL PRIMARY KEY, at TEXT NOT NULL, date TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL, message TEXT NOT NULL, before_data TEXT NOT NULL)`;
    await tx`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
    await tx`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires BIGINT NOT NULL)`;
    await tx`CREATE TABLE IF NOT EXISTS login_attempts (id SERIAL PRIMARY KEY, at BIGINT NOT NULL)`;
    await tx`CREATE TABLE IF NOT EXISTS locks (id INTEGER PRIMARY KEY, token TEXT NOT NULL, expires BIGINT NOT NULL)`;
  }).then(() => {}).catch(error => { initialized = undefined; throw error; });
  await initialized;
  return db;
}

async function remote(db?: Database.Database) { return db ? null : postgresStore(); }
export async function readSnapshot(db?: Database.Database): Promise<{ revision: number; records: MatchRecord[] }> {
  const pg = await remote(db);
  if (!pg) {
    const sqlite = db ?? local.store();
    return sqlite.transaction(() => ({ revision: local.revision(sqlite), records: local.readRecords(sqlite) }))();
  }
  // One statement keeps the revision and records in the same MVCC snapshot.
  const [row] = await pg`SELECT revision, (SELECT COALESCE(json_agg(data::json ORDER BY id), '[]'::json) FROM matches) AS records FROM state WHERE id=1`;
  return { revision: row.revision, records: row.records };
}
export async function readRecords(db?: Database.Database) { return (await readSnapshot(db)).records; }
export async function revision() { return (await readSnapshot()).revision; }
export async function history(): Promise<RunRecord[]> {
  const pg = await remote();
  return pg ? await pg`SELECT id,at,date,action,status,message FROM runs ORDER BY id DESC LIMIT 100` as unknown as RunRecord[] : local.history();
}
export async function fullHistory() {
  const pg = await remote();
  return pg ? [...await pg`SELECT id,at,date,action,status,message,before_data FROM runs ORDER BY id`] : local.store().prepare("SELECT id,at,date,action,status,message,before_data FROM runs ORDER BY id").all();
}
export async function logRun(date: string, action: string, status: string, message: string, before: MatchRecord[] = []) {
  const pg = await remote();
  if (!pg) return local.logRun(date, action, status, message, before);
  await pg`INSERT INTO runs (at,date,action,status,message,before_data) VALUES (${new Date().toISOString()},${date},${action},${status},${message},${JSON.stringify(before)})`;
}
export async function commitRecords(expected: number, next: MatchRecord[], date: string, action: string, message: string, db?: Database.Database) {
  const pg = await remote(db);
  if (!pg) return local.commitRecords(expected, next, date, action, message, db);
  await pg.begin(async tx => {
    const [state] = await tx`SELECT revision FROM state WHERE id=1 FOR UPDATE`;
    if (state.revision !== expected) throw new AdminError("Data changed while you were working. Refresh the dashboard and try again.", 409);
    const before = (await tx`SELECT data FROM matches ORDER BY id`).map(row => JSON.parse(row.data));
    await tx`DELETE FROM matches`;
    if (next.length) await tx`INSERT INTO matches ${tx(next.map(record => ({ id: record.id, data: JSON.stringify(record) })), "id", "data")}`;
    await tx`UPDATE state SET revision=revision+1 WHERE id=1`;
    await tx`INSERT INTO runs (at,date,action,status,message,before_data) VALUES (${new Date().toISOString()},${date},${action},'success',${message},${JSON.stringify(before)})`;
  });
}
export async function undoLast(expected: number) {
  const pg = await remote();
  if (!pg) return local.undoLast(expected);
  // commitRecords checks the caller's revision under a write lock before publishing.
  const [last] = await pg`SELECT id,date,before_data FROM runs WHERE status='success' AND action IN ('sync','manual','remove','undo') ORDER BY id DESC LIMIT 1`;
  if (!last) throw new AdminError("There is no published change to undo.");
  await commitRecords(expected, JSON.parse(last.before_data), last.date, "undo", `Restored data from before update #${last.id}.`);
}
export async function saveConnection(connection: ProviderConnection) {
  const pg = await remote();
  if (!pg) return local.saveConnection(connection);
  const payload = local.encryptConnection(connection);
  await pg`INSERT INTO settings (key,value) VALUES ('provider',${payload}) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`;
}
export async function getConnection() {
  const pg = await remote();
  if (!pg) return local.getConnection();
  const [row] = await pg`SELECT value FROM settings WHERE key='provider'`;
  return row ? local.decryptConnection(row.value) : null;
}
export async function readSetting(key: string) {
  const pg = await remote();
  const row = pg ? (await pg`SELECT value FROM settings WHERE key=${key}`)[0]
    : local.store().prepare("SELECT value FROM settings WHERE key=?").get(key) as { value: string } | undefined;
  return row?.value as string | undefined;
}
export async function writeSetting(key: string, value: string) {
  const pg = await remote();
  if (!pg) { local.store().prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, value); return; }
  await pg`INSERT INTO settings (key,value) VALUES (${key},${value}) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`;
}
export async function acquireSync() {
  const pg = await remote();
  if (!pg) return local.acquireSync();
  const token = randomBytes(16).toString("hex");
  const now = Date.now();
  const rows = await pg`INSERT INTO locks (id,token,expires) VALUES (1,${token},${now + 300_000}) ON CONFLICT (id) DO UPDATE SET token=EXCLUDED.token,expires=EXCLUDED.expires WHERE locks.expires < ${now} RETURNING id`;
  if (!rows.length) throw new AdminError("An update is already running. Wait for it to finish.", 409);
  return async () => { await pg`DELETE FROM locks WHERE token=${token}`; };
}
export async function sessionValid(token: string) {
  const pg = await remote();
  const session = pg ? (await pg`SELECT expires FROM sessions WHERE token=${token}`)[0] : local.store().prepare("SELECT expires FROM sessions WHERE token=?").get(token) as { expires: number } | undefined;
  return !!session && Number(session.expires) > Date.now();
}
export async function recordLoginAttempt(now: number) {
  const pg = await remote();
  if (!pg) {
    const db = local.store();
    return db.transaction(() => {
      db.prepare("DELETE FROM login_attempts WHERE at < ?").run(now - 900_000);
      const count = (db.prepare("SELECT COUNT(*) AS n FROM login_attempts").get() as { n: number }).n;
      if (count >= 10) throw new AdminError("Too many sign-in attempts. Try again in 15 minutes.", 429);
      db.prepare("INSERT INTO login_attempts (at) VALUES (?)").run(now);
    }).immediate();
  }
  await pg.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(17071701)`;
    await tx`DELETE FROM login_attempts WHERE at < ${now - 900_000}`;
    const [row] = await tx`SELECT COUNT(*)::integer AS n FROM login_attempts`;
    if (row.n >= 10) throw new AdminError("Too many sign-in attempts. Try again in 15 minutes.", 429);
    await tx`INSERT INTO login_attempts (at) VALUES (${now})`;
  });
}
export async function saveSession(token: string, expires: number) {
  const pg = await remote();
  if (!pg) {
    const db = local.store();
    db.prepare("DELETE FROM login_attempts").run();
    db.prepare("DELETE FROM sessions WHERE expires <= ?").run(Date.now());
    db.prepare("INSERT INTO sessions (token,expires) VALUES (?,?)").run(token, expires);
    return;
  }
  await pg.begin(async tx => {
    await tx`DELETE FROM login_attempts`;
    await tx`DELETE FROM sessions WHERE expires <= ${Date.now()}`;
    await tx`INSERT INTO sessions (token,expires) VALUES (${token},${expires})`;
  });
}
export async function deleteSession(token: string) {
  const pg = await remote();
  if (!pg) { local.store().prepare("DELETE FROM sessions WHERE token=?").run(token); return; }
  await pg`DELETE FROM sessions WHERE token=${token}`;
}
export async function closeDatabase() { if (sql) await sql.end(); sql = undefined; initialized = undefined; }
