import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { sessionValid, recordLoginAttempt, saveSession, deleteSession } from "./database";
import { AdminError } from "./model";
import { cookieName, adminHintCookie } from "./session-cookie";
import { normalizeAdminEmail, validAdminEmail, verifyAdminCredentials } from "./credentials";
export { cookieName } from "./session-cookie";
export function adminEmail() { return normalizeAdminEmail(process.env.ADMIN_EMAIL ?? ""); }
export function configured() { return validAdminEmail(adminEmail()) && !!process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32; }
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export async function isAdmin() {
  if (!configured()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || token.length !== 64) return false;
  return sessionValid(digest(token));
}
export async function requireAdmin() { if (!await isAdmin()) throw new AdminError("Sign in to continue.", 401); }
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new AdminError("Request origin was rejected.", 403);
}
export async function login(email: string, password: string) {
  if (!configured()) throw new AdminError("Run npm run admin:setup on the server first.", 503);
  const now = Date.now();
  await recordLoginAttempt(now);
  if (!verifyAdminCredentials(email, password, adminEmail(), process.env.ADMIN_PASSWORD_HASH!)) throw new AdminError("Incorrect email or password.", 401);
  const token = randomBytes(32).toString("hex"); const expires = now + 8 * 60 * 60 * 1000;
  await saveSession(digest(token), expires);
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: "strict", secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false, path: "/", maxAge: 8 * 60 * 60 });
  (await cookies()).set(adminHintCookie, "1", { sameSite: "strict", secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false, path: "/", maxAge: 8 * 60 * 60 });
}
export async function logout() {
  const jar = await cookies(); const token = jar.get(cookieName)?.value;
  if (token) await deleteSession(digest(token));
  jar.delete(cookieName);
  jar.delete(adminHintCookie);
}
