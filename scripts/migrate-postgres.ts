import { readFile, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { backupSummary, exportPostgres, importPostgres, verifyPostgres } from "./lib/postgres-migration";

async function main() {
  const [action, path] = process.argv.slice(2);
  if (!["export", "import", "verify"].includes(action) || !path) {
    throw new Error("Usage: npm run db:transfer -- export|import|verify .artifacts/migration/backup.json");
  }
  const variable = action === "export" ? "SOURCE_DATABASE_URL" : "TARGET_DATABASE_URL";
  const url = process.env[variable];
  if (!url) throw new Error(`Set ${variable} privately before running ${action}.`);
  const db = postgres(url, { max: 1, connect_timeout: 10, idle_timeout: 10, prepare: false, onnotice: () => {} });
  try {
    if (action === "export") {
      const backup = await exportPostgres(db);
      // Exclusive creation prevents overwriting an earlier recovery point.
      await writeFile(path, JSON.stringify(backup), { mode: 0o600, flag: "wx" });
      console.log(JSON.stringify({ action, ...backupSummary(backup) }, null, 2));
    } else {
      const backup: unknown = JSON.parse(await readFile(path, "utf8"));
      const result = action === "import" ? await importPostgres(db, backup) : await verifyPostgres(db, backup);
      console.log(JSON.stringify({ action, ...result }, null, 2));
    }
  } finally { await db.end({ timeout: 5 }); }
}

main().catch((error: unknown) => {
  // Never print driver errors, connection strings, failed rows, or credentials.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
  const message = error instanceof Error && error.constructor === Error ? error.message : "Check database access, backup integrity, the admin secret, and an empty destination.";
  console.error(`Database transfer failed${code && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
