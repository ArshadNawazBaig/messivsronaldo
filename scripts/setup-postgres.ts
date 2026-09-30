import postgres from "postgres";
import { initializePostgresSchema } from "./lib/postgres-schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const db = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 10, onnotice: () => {} });
  try {
    await db.begin(initializePostgresSchema);
    console.log("Postgres application schema is ready. Existing data was retained.");
  } finally { await db.end({ timeout: 5 }); }
}
main().catch(() => { console.error("Database setup failed. Check database access; credentials were not logged."); process.exitCode = 1; });
