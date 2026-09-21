import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
const file = '.env.local';
let env = existsSync(file) ? readFileSync(file, 'utf8') : '';
if (/^ADMIN_PASSWORD_HASH=/m.test(env) && !process.argv.includes('--reset')) {
  console.log('Admin is already configured. Use npm run admin:setup -- --reset to rotate the password and invalidate sessions.');
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
writeFileSync('.artifacts/admin-access.txt',`The Rivalry admin\nURL: http://localhost:3001/admin\nPassword: ${password}\n\nKeep this file private. Delete it once the password is stored in your password manager.\nRestart the server after setup or reset.\n`,{mode:0o600});
if (process.argv.includes('--reset')) {
  const {default:Database} = await import('better-sqlite3');
  const dbPath = process.env.ADMIN_DATABASE_PATH || env.match(/^ADMIN_DATABASE_PATH=(.+)$/m)?.[1] || '.data/admin.sqlite';
  if (existsSync(dbPath)) { const db = new Database(dbPath); db.exec('DELETE FROM sessions'); db.close(); }
}
console.log('Admin configured. Your private password is in .artifacts/admin-access.txt. Restart the server to apply configuration.');
