import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { applicationTables, initializePostgresSchema } from "../src/lib/admin/postgres-schema";
import { encryptConnection } from "../src/lib/admin/store";
import { exportPostgres, importPostgres, validateBackup, verifyPostgres, type PostgresBackup } from "../scripts/lib/postgres-migration";

test("Postgres migration preserves durable data, refuses overwrites, and keeps API roles out", { skip: !process.env.TEST_MIGRATION_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_MIGRATION_DATABASE_URL!);
  assert.match(url.pathname, /^\/rivalry_test_/);
  const admin = postgres(url.href, { max: 1, onnotice: () => {} });
  const suffix = Date.now();
  const sourceSchema = `migration_source_${suffix}`;
  const targetSchema = `migration_target_${suffix}`;
  const source = postgres(url.href, { max: 1, connection: { search_path: sourceSchema }, onnotice: () => {} });
  const target = postgres(url.href, { max: 1, connection: { search_path: targetSchema }, onnotice: () => {} });
  const oldSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "migration-test-secret-at-least-32-characters";
  try {
    await admin`CREATE SCHEMA ${admin(sourceSchema)}`;
    await admin`CREATE SCHEMA ${admin(targetSchema)}`;
    for (const role of ["anon", "authenticated"]) {
      if (!(await admin`SELECT 1 FROM pg_roles WHERE rolname=${role}`).length) await admin`CREATE ROLE ${admin(role)} NOLOGIN`;
      await admin`GRANT USAGE ON SCHEMA ${admin(targetSchema)} TO ${admin(role)}`;
      // Reproduce Supabase's legacy Data API grants on newly created tables.
      await admin`ALTER DEFAULT PRIVILEGES IN SCHEMA ${admin(targetSchema)} GRANT ALL ON TABLES TO ${admin(role)}`;
      await admin`ALTER DEFAULT PRIVILEGES IN SCHEMA ${admin(targetSchema)} GRANT ALL ON SEQUENCES TO ${admin(role)}`;
    }
    await source.begin(initializePostgresSchema);
    const match = { id: "manual:messi:test", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Test opponent", competition: "Test league", category: "league", goals: 1, assists: 0, minutes: 90, appearances: 1, headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic migration test", locked: true };
    const post = { id: "post-test", locale: "en", slug: "migration-test", revision: 3, published: null, draft: { title: "Private draft" } };
    const image = Buffer.from([0, 1, 10, 127, 128, 254, 255]);
    const connection = { key: "synthetic-provider-key", messi: { player: 1, club: 2, country: 3 }, ronaldo: { player: 4, club: 5, country: 6 } };
    await source`INSERT INTO matches VALUES (${match.id},${JSON.stringify(match)})`;
    await source`UPDATE state SET revision=7 WHERE id=1`;
    await source`INSERT INTO runs (id,at,date,action,status,message,before_data) VALUES (12,'2026-09-22T00:00:00Z','2026-09-22','manual','success','Test','[]')`;
    await source`INSERT INTO settings VALUES ('provider',${encryptConnection(connection)}),('daily-sync','{"scannedThrough":"2026-09-22"}')`;
    await source`INSERT INTO blog_posts VALUES (${post.id},${post.locale},${post.slug},${post.revision},${JSON.stringify(post)})`;
    await source`INSERT INTO blog_media VALUES ('test.webp',${image},'2026-09-22T00:00:00Z')`;
    await source`INSERT INTO sessions VALUES ('old-session',9999999999999)`;
    await source`INSERT INTO locks VALUES (1,'in-progress-lock',9999999999999)`;

    const backup = await exportPostgres(source);
    const corrupt = structuredClone(backup);
    corrupt.tables.state[0].revision++;
    assert.throws(() => validateBackup(corrupt), /checksum/);
    process.env.ADMIN_SESSION_SECRET = "different-test-secret-at-least-32-characters";
    await assert.rejects(importPostgres(target, backup));
    process.env.ADMIN_SESSION_SECRET = "migration-test-secret-at-least-32-characters";

    // A later insert failure rolls back earlier rows and schema creation.
    const duplicate: PostgresBackup = structuredClone(backup);
    duplicate.tables.blog_posts.push(duplicate.tables.blog_posts[0]);
    duplicate.sha256 = createHash("sha256").update(JSON.stringify(duplicate.tables)).digest("hex");
    await assert.rejects(importPostgres(target, duplicate), /duplicate key/);
    assert.equal((await target`SELECT to_regclass('matches') AS table_name`)[0].table_name, null);

    await importPostgres(target, backup);
    assert.equal((await verifyPostgres(target, backup)).revision, 7);
    assert.deepEqual((await exportPostgres(target)).tables, backup.tables);
    assert.deepEqual((await target`SELECT data FROM blog_media`)[0].data, image);
    assert.equal((await target`SELECT COUNT(*)::int AS n FROM sessions`)[0].n, 0);
    assert.equal((await target`SELECT COUNT(*)::int AS n FROM locks`)[0].n, 0);
    await assert.rejects(importPostgres(target, backup), /not empty/);
    assert.equal((await verifyPostgres(target, backup)).sha256, backup.sha256);

    for (const table of applicationTables) {
      const [row] = await target`SELECT relrowsecurity FROM pg_class WHERE oid=${`${targetSchema}.${table}`}::regclass`;
      assert.equal(row.relrowsecurity, true, table);
      for (const role of ["anon", "authenticated"]) {
        const [grants] = await target`SELECT has_table_privilege(${role},${`${targetSchema}.${table}`},'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS allowed`;
        assert.equal(grants.allowed, false, `${role}: ${table}`);
      }
    }
    await assert.rejects(target.begin(async tx => {
      await tx`SET LOCAL ROLE anon`;
      await tx`SELECT * FROM settings`;
    }), /permission denied/);
    const [next] = await target`INSERT INTO runs (at,date,action,status,message,before_data) VALUES ('2026-09-23','2026-09-23','manual','success','Next','[]') RETURNING id`;
    assert.equal(next.id, 13);
    await assert.rejects(verifyPostgres(target, backup), /differ/);
  } finally {
    if (oldSecret === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = oldSecret;
    await source.end();
    await target.end();
    await admin`DROP SCHEMA IF EXISTS ${admin(sourceSchema)} CASCADE`;
    await admin`DROP SCHEMA IF EXISTS ${admin(targetSchema)} CASCADE`;
    await admin.end();
  }
});
