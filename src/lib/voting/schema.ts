// Compatible with SQLite and PostgreSQL. Starting totals are editorial offsets,
// not invented visitor records; only actual submissions increment these counts.
export const votingSchema = `
CREATE TABLE IF NOT EXISTS fan_votes (
  browser_hash TEXT PRIMARY KEY,
  player TEXT NOT NULL CHECK(player IN ('messi','ronaldo')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fan_vote_counts (
  player TEXT PRIMARY KEY CHECK(player IN ('messi','ronaldo')),
  votes INTEGER NOT NULL DEFAULT 0 CHECK(votes >= 0)
);
INSERT INTO fan_vote_counts (player,votes) VALUES ('messi',0),('ronaldo',0) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS fan_vote_limits (
  key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL
);
`;
