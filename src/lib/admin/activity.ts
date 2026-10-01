import { defaultAdminPageSize } from "@/lib/admin/pagination";
import type Database from "better-sqlite3";
import { z } from "zod";
import { postgresStore } from "./database";
import { store } from "./store";
import { paginationState } from "./pagination";
import type { RunRecord } from "./model";

export const activityQuery = z.object({ page: z.coerce.number().int().min(0).max(1_000_000).default(0), pageSize: z.coerce.number().pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])).default(defaultAdminPageSize), query: z.string().trim().max(200).default("") });
export async function listActivity(input: unknown, db?: Database.Database) {
  const { page, pageSize, query } = activityQuery.parse(input);
  const pg = db ? null : await postgresStore();
  const needle = query.toLowerCase();
  if (pg) {
    // Count and rows use the same snapshot; never send stored rollback payloads.
    return pg.begin("isolation level repeatable read read only", async tx => {
      const where = needle ? tx`strpos(lower(action || ' ' || status || ' ' || message || ' ' || date), ${needle}) > 0` : tx`TRUE`;
      const [count] = await tx`SELECT COUNT(*)::integer AS total FROM runs WHERE ${where}`;
      const bounds = paginationState(Number(count.total), page, pageSize);
      const rows = await tx`SELECT id,at,date,action,status,message FROM runs WHERE ${where} ORDER BY id DESC LIMIT ${pageSize} OFFSET ${bounds.start}`;
      return { rows: [...rows] as RunRecord[], total: Number(count.total), page: bounds.page, pageSize };
    });
  }
  const sqlite = db ?? store();
  return sqlite.transaction(() => {
    const where = needle ? "WHERE instr(lower(action || ' ' || status || ' ' || message || ' ' || date), ?) > 0" : "";
    const values = needle ? [needle] : [];
    const { total } = sqlite.prepare(`SELECT COUNT(*) AS total FROM runs ${where}`).get(...values) as { total: number };
    const bounds = paginationState(total, page, pageSize);
    const rows = sqlite.prepare(`SELECT id,at,date,action,status,message FROM runs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...values, pageSize, bounds.start) as RunRecord[];
    return { rows, total, page: bounds.page, pageSize };
  })();
}
