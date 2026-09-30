import { spawn } from 'node:child_process';
import { closeSync, mkdirSync, openSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// A custom-format dump includes schema, data, images, encrypted settings and
// sequence values. Keep it private, and retain ADMIN_SESSION_SECRET separately.
export async function backupPostgres(file, snapshot) {
  const connection = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connection) throw new Error('DATABASE_URL is required.');
  const url = new URL(connection);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('A Postgres URL is required.');
  const output = resolve(file);
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  closeSync(openSync(output, 'wx', 0o600)); // Never overwrite an existing backup.
  const args = ['--format=custom', '--schema=public', '--no-owner', '--no-acl', '--file', output];
  if (snapshot) args.push('--snapshot', snapshot);
  try {
    await new Promise((resolveRun, reject) => {
      const child = spawn(process.env.PG_BIN ? join(process.env.PG_BIN, 'pg_dump') : 'pg_dump', args, {
        stdio: 'ignore', // Driver diagnostics can expose connection details.
        env: { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
          PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
          PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
          PGSSLMODE: url.searchParams.get('sslmode') || 'require',
          PGCONNECT_TIMEOUT: '15', },
      });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolveRun() : reject(new Error('pg_dump failed.')));
    });
    return output;
  } catch {
    unlinkSync(output);
    throw new Error('Backup failed. Check database access and use pg_dump matching the server major version or newer.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = process.argv[2] || `.artifacts/backups/rivalry-${new Date().toISOString().replaceAll(':', '-')}.dump`;
  backupPostgres(file).then(output => console.log(`Private Postgres backup saved: ${output}`)).catch(error => {
    console.error(error instanceof Error && error.message.startsWith('Backup failed.') ? error.message : 'Backup could not start. Check the URL and use a new output filename.');
    process.exitCode = 1;
  });
}
