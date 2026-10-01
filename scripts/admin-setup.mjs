import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
const file = '.env.local';
let env = existsSync(file) ? readFileSync(file, 'utf8') : '';
const emailIndex = process.argv.indexOf('--email');
const email = (emailIndex >= 0 ? process.argv[emailIndex + 1] || '' : process.env.ADMIN_EMAIL || env.match(/^ADMIN_EMAIL=(.+)$/m)?.[1] || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error('Provide an admin email: npm run admin:setup -- --email you@example.com');
  process.exit(1);
}
env = env.replace(/^ADMIN_EMAIL=.*\n?/gm, '');
env = `${env.trimEnd()}\nADMIN_EMAIL=${email}\n`;

if (/^ADMIN_PASSWORD_HASH=/m.test(env) && !process.argv.includes('--reset')) {
  writeFileSync(file, env, {mode:0o600});
  chmodSync(file,0o600);
  console.log('Admin email configured. Existing password retained. Restart the app to apply changes. Use --reset to rotate the password.');
  process.exit(0);
}
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
// Keep the encryption secret on resets so the stored provider key remains readable.
const secret = env.match(/^ADMIN_SESSION_SECRET=(.+)$/m)?.[1] || randomBytes(48).toString('hex');
env = env.replace(/^ADMIN_PASSWORD_HASH=.*\n?/gm,'').replace(/^ADMIN_SESSION_SECRET=.*\n?/gm,'');
writeFileSync(file, `${env.trimEnd()}\nADMIN_PASSWORD_HASH=${hash}\nADMIN_SESSION_SECRET=${secret}\n`, {mode:0o600});
chmodSync(file,0o600);
mkdirSync('.artifacts',{recursive:true});
writeFileSync('.artifacts/admin-access.txt',`The Rivalry admin\nURL: http://localhost:3000/admin/dahsboard\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. Delete it once the password is stored in your password manager.\nRestart the server after setup or reset.\n`,{mode:0o600});
if (process.argv.includes('--reset')) {
  const {default:Database} = await import('better-sqlite3');
  const dbPath = process.env.ADMIN_DATABASE_PATH || env.match(/^ADMIN_DATABASE_PATH=(.+)$/m)?.[1] || '.data/admin.sqlite';
  if (existsSync(dbPath)) { const db = new Database(dbPath); db.exec('DELETE FROM sessions'); db.close(); }
}
console.log('Admin configured. Your private password is in .artifacts/admin-access.txt. Restart the server to apply configuration.');
