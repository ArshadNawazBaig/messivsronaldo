import assert from "node:assert/strict";
import test from "node:test";
import { openStore } from "../src/lib/admin/store";
import { changeSupport, listSupport, submitSupport } from "../src/lib/support/store";
import { supportRetentionMs, supportSubmission } from "../src/lib/support/model";
import { supportClientKey } from "../src/lib/support/http";

const report = { category: "correction", details: "Please review this synthetic test issue.", email: "reader@example.com", source: "https://example.com/evidence" };
test("reports persist privately, support status/notes, reject stale writes and can be deleted", async () => {
  const db = openStore(":memory:");
  try {
    const id = await submitSupport(report, "reader", db);
    let inbox = await listSupport("all", 0, db);
    assert.equal(inbox.tickets[0].id, id);
    assert.equal(inbox.tickets[0].email, report.email);
    assert.equal(inbox.tickets[0].status, "new");
    assert.equal("website" in inbox.tickets[0], false);
    const writes = await Promise.allSettled(["reviewing", "resolved"].map(status => changeSupport({ action: "update", id, revision: 0, status, notes: "Private review notes" }, db)));
    assert.equal(writes.filter(result => result.status === "fulfilled").length, 1);
    inbox = await listSupport("all", 0, db);
    const updated = inbox.tickets[0];
    assert.equal(updated.revision, 1);
    assert.equal(updated.notes, "Private review notes");
    assert.equal((await listSupport("new", 0, db)).tickets.length, 0);
    await assert.rejects(changeSupport({ action: "delete", id, revision: 0 }, db), /changed/);
    await changeSupport({ action: "delete", id, revision: 1 }, db);
    assert.deepEqual((await listSupport("all", 0, db)).tickets, []);
  } finally { db.close(); }
});
test("limits survive requests, reject racing submissions atomically and expire", async () => {
  const db = openStore(":memory:"); const now = Date.now();
  try {
    const submissions = await Promise.allSettled(Array.from({ length: 8 }, () => submitSupport(report, "same-reader", db, now)));
    assert.equal(submissions.filter(result => result.status === "fulfilled").length, 5);
    assert.equal((await listSupport("all", 0, db, now)).tickets.length, 5);
    await submitSupport(report, "same-reader", db, now + 3_600_001);
    await assert.rejects(submitSupport({ ...report, website: "spam" }, "bot", db, now), /could not/);
    assert.equal((await listSupport("all", 0, db, now + supportRetentionMs + 3_600_002)).tickets.length, 0);
    assert.equal((db.prepare("SELECT count(*) AS n FROM support_limits").get() as { n: number }).n, 0);
  } finally { db.close(); }
});
test("pagination and the global daily limit bound inbox size and submission volume", async () => {
  const db = openStore(":memory:"); const now = Date.now();
  try {
    for (let i = 0; i < 100; i++) await submitSupport(report, `reader-${i}`, db, now + i);
    await assert.rejects(submitSupport(report, "another-reader", db, now + 101), /Too many/);
    assert.equal((await listSupport("all", 0, db, now + 102)).tickets.length, 10);
    const first = await listSupport("all", 0, db, now + 102, 50);
    const second = await listSupport("all", 50, db, now + 102, 50);
    assert.equal(first.hasMore, true); assert.equal(second.hasMore, false);
    assert.equal(new Set([...first.tickets, ...second.tickets].map(ticket => ticket.id)).size, 100);
    assert.equal(first.total, 100);
    const sized = await listSupport("all", 90, db, now + 102, 10);
    assert.equal(sized.tickets.length, 10); assert.equal(sized.hasMore, false);
    assert.equal(sized.offset, 90);
    for (const ticket of sized.tickets) await changeSupport({ action: "delete", id: ticket.id, revision: ticket.revision }, db, now + 102);
    const recovered = await listSupport("all", 90, db, now + 102, 10);
    assert.equal(recovered.offset, 80); assert.equal(recovered.total, 90);
    assert.equal(recovered.tickets.length, 10);
    await assert.rejects(listSupport("all", 0, db, now + 102, 1000), /Invalid pagination/);
  } finally { db.close(); }
});
test("server validation rejects executable URLs, oversized messages and invalid categories", () => {
  for (const invalid of [{ source: "javascript:alert(1)" }, { email: "bad\r\nBcc: victim@example.com" }, { details: "x".repeat(4001) }, { category: "other" }, { details: " " }]) assert.equal(supportSubmission.safeParse({ ...report, ...invalid }).success, false);
});
test("rate keys do not store raw IPs or trust user-controlled forwarded headers", () => {
  const previous = { VERCEL: process.env.VERCEL, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET };
  try {
    process.env.VERCEL = "1"; process.env.ADMIN_SESSION_SECRET = "synthetic-support-test-secret-of-32-characters";
    const key = supportClientKey(new Request("https://example.com", { headers: { "x-vercel-forwarded-for": "203.0.113.1", "x-forwarded-for": "spoofed" } }));
    assert.match(key, /^[a-f0-9]{64}$/);
    assert.throws(() => supportClientKey(new Request("https://example.com", { headers: { "x-forwarded-for": "203.0.113.1" } })), /unavailable/);
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
