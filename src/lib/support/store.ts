import { defaultAdminPageSize } from "@/lib/admin/pagination";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { postgresStore } from "../admin/database";
import { store } from "../admin/store";
import { AdminError } from "../admin/model";
import { paginationState } from "../admin/pagination";
import { supportCommand, supportRetentionMs, supportSubmission, type SupportTicket } from "./model";

export async function submitSupport(input: unknown, clientKey: string, db?: Database.Database, now = Date.now()) {
  const { website, ...submission } = supportSubmission.parse(input);
  if (website) throw new AdminError("The report could not be submitted. Please try again.", 422);
  const timestamp = new Date(now).toISOString();
  const ticket: SupportTicket = { ...submission, id: randomUUID(), status: "new", notes: "", revision: 0, createdAt: timestamp, updatedAt: timestamp };
  const limits = [{ key: `client:${clientKey}`, max: 5, duration: 3_600_000 }, { key: "global", max: 100, duration: 86_400_000 }];
  const cutoff = new Date(now - supportRetentionMs).toISOString();
  const pg = db ? null : await postgresStore();
  if (pg) await pg.begin(async tx => {
    // A database lock enforces the limit across concurrent serverless instances.
    await tx`SELECT pg_advisory_xact_lock(17071702)`;
    await tx`DELETE FROM support_limits WHERE expires <= ${now}`;
    await tx`DELETE FROM support_tickets WHERE created_at <= ${cutoff}`;
    for (const limit of limits) {
      const [row] = await tx`SELECT count FROM support_limits WHERE key=${limit.key}`;
      if (row && row.count >= limit.max) throw new AdminError("Too many reports. Please try again later.", 429);
      await tx`INSERT INTO support_limits (key,count,expires) VALUES (${limit.key},1,${now + limit.duration}) ON CONFLICT (key) DO UPDATE SET count=support_limits.count+1`;
    }
    await tx`INSERT INTO support_tickets (id,status,revision,created_at,data) VALUES (${ticket.id},${ticket.status},0,${timestamp},${JSON.stringify(ticket)})`;
  });
  else {
    const sqlite = db ?? store();
    sqlite.transaction(() => {
      sqlite.prepare("DELETE FROM support_limits WHERE expires <= ?").run(now);
      sqlite.prepare("DELETE FROM support_tickets WHERE created_at <= ?").run(cutoff);
      for (const limit of limits) {
        const row = sqlite.prepare("SELECT count FROM support_limits WHERE key=?").get(limit.key) as { count: number } | undefined;
        if (row && row.count >= limit.max) throw new AdminError("Too many reports. Please try again later.", 429);
        sqlite.prepare("INSERT INTO support_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=support_limits.count+1").run(limit.key, now + limit.duration);
      }
      sqlite.prepare("INSERT INTO support_tickets (id,status,revision,created_at,data) VALUES (?,?,0,?,?)").run(ticket.id, ticket.status, timestamp, JSON.stringify(ticket));
    }).immediate();
  }
  return ticket.id;
}

export async function listSupport(status: string = "all", offset = 0, db?: Database.Database, now = Date.now(), pageSize = defaultAdminPageSize) {
  if (![10, 20, 50].includes(pageSize) || !Number.isSafeInteger(offset) || offset < 0) throw new AdminError("Invalid pagination.", 422);
  const pg = db ? null : await postgresStore();
  const cutoff = new Date(now - supportRetentionMs).toISOString();
  function result(rows: { data: string }[], total: number, start: number) {
    return { tickets: rows.map(row => JSON.parse(row.data) as SupportTicket), total, offset: start, pageSize, hasMore: start + rows.length < total };
  }
  if (pg) {
    await pg`DELETE FROM support_tickets WHERE created_at <= ${cutoff}`;
    await pg`DELETE FROM support_limits WHERE expires <= ${now}`;
    return pg.begin("isolation level repeatable read read only", async tx => {
      const where = status === "all" ? tx`TRUE` : tx`status=${status}`;
      const [count] = await tx`SELECT COUNT(*)::integer AS total FROM support_tickets WHERE ${where}`;
      const total = Number(count.total);
      const { start } = paginationState(total, Math.floor(offset / pageSize), pageSize);
      const rows = await tx`SELECT data FROM support_tickets WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT ${pageSize} OFFSET ${start}`;
      return result([...rows] as { data: string }[], total, start);
    });
  }
  const sqlite = db ?? store();
  return sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM support_tickets WHERE created_at <= ?").run(cutoff);
    sqlite.prepare("DELETE FROM support_limits WHERE expires <= ?").run(now);
    const where = status === "all" ? "" : "WHERE status=?";
    const values = status === "all" ? [] : [status];
    const { total } = sqlite.prepare(`SELECT COUNT(*) AS total FROM support_tickets ${where}`).get(...values) as { total: number };
    const { start } = paginationState(total, Math.floor(offset / pageSize), pageSize);
    const rows = sqlite.prepare(`SELECT data FROM support_tickets ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(...values, pageSize, start) as { data: string }[];
    return result(rows, total, start);
  })();
}

export async function changeSupport(input: unknown, db?: Database.Database, now = Date.now()) {
  const command = supportCommand.parse(input);
  const pg = db ? null : await postgresStore();
  const cutoff = new Date(now - supportRetentionMs).toISOString();
  const row = pg ? (await pg`SELECT data FROM support_tickets WHERE id=${command.id} AND created_at > ${cutoff}`)[0]
    : (db ?? store()).prepare("SELECT data FROM support_tickets WHERE id=? AND created_at > ?").get(command.id, cutoff) as { data: string } | undefined;
  if (!row) throw new AdminError("This report is no longer available.", 404);
  const previous: SupportTicket = JSON.parse(row.data);
  if (previous.revision !== command.revision) throw new AdminError("This report changed. Refresh before saving.", 409);
  const next = command.action === "update" ? { ...previous, status: command.status, notes: command.notes, revision: previous.revision + 1, updatedAt: new Date(now).toISOString() } : null;
  const changed = pg ? next
    ? (await pg`UPDATE support_tickets SET status=${next.status},revision=${next.revision},data=${JSON.stringify(next)} WHERE id=${command.id} AND revision=${command.revision} RETURNING id`).length
    : (await pg`DELETE FROM support_tickets WHERE id=${command.id} AND revision=${command.revision} RETURNING id`).length
    : next
      ? (db ?? store()).prepare("UPDATE support_tickets SET status=?,revision=?,data=? WHERE id=? AND revision=?").run(next.status, next.revision, JSON.stringify(next), command.id, command.revision).changes
      : (db ?? store()).prepare("DELETE FROM support_tickets WHERE id=? AND revision=?").run(command.id, command.revision).changes;
  if (!changed) throw new AdminError("This report changed. Refresh before saving.", 409);
  return next;
}
