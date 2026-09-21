import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { AdminError, type MatchRecord, type ProviderConnection, type RunRecord } from "./model";

export function openStore(path = process.env.ADMIN_DATABASE_PATH || resolve(".data/admin.sqlite")) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new Database(path);
  db.pragma("journal_mode = WAL"); db.pragma("busy_timeout = 5000");
  db.exec(`CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO state (id) VALUES (1);
    CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runs (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, date TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL, message TEXT NOT NULL, before_data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS locks (id INTEGER PRIMARY KEY, token TEXT NOT NULL, expires INTEGER NOT NULL);`);
  return db;
}
let singleton: Database.Database | undefined;
export const store = () => singleton ??= openStore();
export function readRecords(db = store()): MatchRecord[] { return (db.prepare("SELECT data FROM matches ORDER BY id").all() as {data: string}[]).map(row => JSON.parse(row.data)); }
export function revision(db = store()) { return (db.prepare("SELECT revision FROM state WHERE id = 1").get() as {revision: number}).revision; }
export function history(db = store()): RunRecord[] { return db.prepare("SELECT id, at, date, action, status, message FROM runs ORDER BY id DESC LIMIT 100").all() as RunRecord[]; }
export function logRun(date: string, action: string, status: string, message: string, before: MatchRecord[] = [], db = store()) {
  db.prepare("INSERT INTO runs (at,date,action,status,message,before_data) VALUES (?,?,?,?,?,?)").run(new Date().toISOString(), date, action, status, message, JSON.stringify(before));
}
export function commitRecords(expected: number, next: MatchRecord[], date: string, action: string, message: string, db = store()) {
  db.transaction(() => {
    if (revision(db) !== expected) throw new AdminError("Data changed while you were working. Refresh the dashboard and try again.", 409);
    const before = readRecords(db);
    db.prepare("DELETE FROM matches").run();
    const insert = db.prepare("INSERT INTO matches (id,data) VALUES (?,?)");
    for (const row of next) insert.run(row.id, JSON.stringify(row));
    db.prepare("UPDATE state SET revision = revision + 1 WHERE id = 1").run();
    logRun(date, action, "success", message, before, db);
  }).immediate();
}
export function undoLast(expected: number, db = store()) {
  const last = db.prepare("SELECT * FROM runs WHERE status = 'success' AND action IN ('sync','manual','remove','undo') ORDER BY id DESC LIMIT 1").get() as {before_data: string; date: string; id: number} | undefined;
  if (!last) throw new AdminError("There is no published change to undo.");
  commitRecords(expected, JSON.parse(last.before_data), last.date, "undo", `Restored data from before update #${last.id}.`, db);
}
function encryptionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new AdminError("Admin security is not configured.", 503);
  return createHash("sha256").update(secret).digest();
}
export function encryptConnection(connection: ProviderConnection) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(connection), "utf8"), cipher.final()]);
  const payload = [iv, cipher.getAuthTag(), encrypted].map(b => b.toString("base64")).join(".");
  return payload;
}
export function saveConnection(connection: ProviderConnection, db = store()) {
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('provider',?)").run(encryptConnection(connection));
}
export function getConnection(db = store()): ProviderConnection | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'provider'").get() as {value: string} | undefined;
  if (!row) return null;
  return decryptConnection(row.value);
}
export function decryptConnection(payload: string): ProviderConnection {
  const [iv, tag, encrypted] = payload.split(".").map(v => Buffer.from(v, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv); decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"));
}
export function acquireSync(db = store()) {
  const token = randomBytes(16).toString("hex");
  db.transaction(() => {
    db.prepare("DELETE FROM locks WHERE expires < ?").run(Date.now());
    if (db.prepare("SELECT id FROM locks WHERE id = 1").get()) throw new AdminError("An update is already running. Wait for it to finish.", 409);
    db.prepare("INSERT INTO locks (id,token,expires) VALUES (1,?,?)").run(token, Date.now() + 300_000);
  }).immediate();
  return () => { db.prepare("DELETE FROM locks WHERE token = ?").run(token); };
}
