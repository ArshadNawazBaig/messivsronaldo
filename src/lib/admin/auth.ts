import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { store } from "./store";
import { AdminError } from "./model";
export const cookieName = "rivalry-admin";
export function configured() { return !!process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32; }
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export async function isAdmin() {
  if (!configured()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || token.length !== 64) return false;
  const session = store().prepare("SELECT expires FROM sessions WHERE token = ?").get(digest(token)) as {expires: number} | undefined;
  return !!session && session.expires > Date.now();
}
export async function requireAdmin() { if (!await isAdmin()) throw new AdminError("Sign in to continue.", 401); }
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new AdminError("Request origin was rejected.", 403);
}
export async function login(password: string) {
  if (!configured()) throw new AdminError("Run npm run admin:setup on the server first.", 503);
  const db = store(); const now = Date.now();
  db.transaction(() => {
    db.prepare("DELETE FROM login_attempts WHERE at < ?").run(now - 900_000);
    const count = (db.prepare("SELECT COUNT(*) AS n FROM login_attempts").get() as {n: number}).n;
    if (count >= 10) throw new AdminError("Too many sign-in attempts. Try again in 15 minutes.", 429);
    db.prepare("INSERT INTO login_attempts (at) VALUES (?)").run(now);
  }).immediate();
  const [salt, expected] = process.env.ADMIN_PASSWORD_HASH!.split(":");
  const actual = scryptSync(password, salt, 64); const expectedBuffer = Buffer.from(expected || "", "hex");
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) throw new AdminError("Incorrect admin password.", 401);
  db.prepare("DELETE FROM login_attempts").run(); db.prepare("DELETE FROM sessions WHERE expires <= ?").run(now);
  const token = randomBytes(32).toString("hex"); const expires = now + 8 * 60 * 60 * 1000;
  db.prepare("INSERT INTO sessions (token,expires) VALUES (?,?)").run(digest(token), expires);
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: "strict", secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false, path: "/", maxAge: 8 * 60 * 60 });
}
export async function logout() {
  const jar = await cookies(); const token = jar.get(cookieName)?.value;
  if (token) store().prepare("DELETE FROM sessions WHERE token = ?").run(digest(token));
  jar.delete(cookieName);
}
