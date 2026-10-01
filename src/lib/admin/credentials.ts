import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

export function normalizeAdminEmail(value: string) { return value.trim().toLowerCase(); }
export function validAdminEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function verifyAdminCredentials(email: string, password: string, expectedEmail: string, passwordHash: string) {
  const [salt, expected, extra] = passwordHash.split(":");
  if (!salt || salt.length > 128 || extra || !/^[a-f0-9]{128}$/i.test(expected || "")) return false;
  // Check both fields without revealing which credential was incorrect.
  const actual = scryptSync(password, salt, 64);
  const passwordMatches = timingSafeEqual(actual, Buffer.from(expected, "hex"));
  const digest = (value: string) => createHash("sha256").update(normalizeAdminEmail(value)).digest();
  const emailMatches = timingSafeEqual(digest(email), digest(expectedEmail));
  return passwordMatches && emailMatches && validAdminEmail(normalizeAdminEmail(expectedEmail));
}
