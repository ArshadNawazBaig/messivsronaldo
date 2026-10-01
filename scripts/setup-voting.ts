import postgres from "postgres";
import { votingSchema } from "../src/lib/voting/schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql.begin(async tx => {
      await tx`SELECT pg_advisory_xact_lock(17071700)`;
      await tx.unsafe(votingSchema);
    });
    const counts = await sql`SELECT player,votes FROM fan_vote_counts ORDER BY player`;
    console.log("Voting schema ready; existing votes retained.", [...counts]);
  } finally { await sql.end({ timeout: 5 }); }
}
main().catch(() => { console.error("Voting setup failed. Credentials were not logged."); process.exitCode = 1; });
