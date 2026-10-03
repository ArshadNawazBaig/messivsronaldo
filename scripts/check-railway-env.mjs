const required = ["DATABASE_URL", "NEXT_PUBLIC_SITE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"];
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length) throw new Error(`Missing Railway variables: ${missing.join(", ")}`);
if (process.env.VERCEL || process.env.VERCEL_ENV) throw new Error("Remove Vercel platform variables from Railway.");
if (process.env.ADMIN_SESSION_SECRET.length < 32) throw new Error("ADMIN_SESSION_SECRET is too short.");
function protocol(key) {
  try { return new URL(process.env[key]).protocol; }
  catch { throw new Error(`${key} must be a valid URL.`); }
}
if (!/^postgres(ql)?:$/.test(protocol("DATABASE_URL"))) throw new Error("DATABASE_URL must use Postgres.");
if (protocol("NEXT_PUBLIC_SITE_URL") !== "https:") throw new Error("Railway requires an HTTPS site origin.");
if (process.env.PORT && (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535)) {
  throw new Error("PORT must be between 1 and 65535.");
}
console.log("Railway environment checks passed.");
