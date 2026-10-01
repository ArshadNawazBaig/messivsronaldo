// The same additive schema is used by local SQLite and explicit Postgres setup.
export const supportSchema = `
CREATE TABLE IF NOT EXISTS support_tickets (id TEXT PRIMARY KEY, status TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS support_tickets_created ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS support_tickets_status ON support_tickets(status, created_at);
CREATE TABLE IF NOT EXISTS support_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS support_limits_expires ON support_limits(expires);`;
