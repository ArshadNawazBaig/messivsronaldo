import { isIP } from "node:net";

type Environment = Record<string, string | undefined>;

export function requiresPostgres(env: Environment = process.env) {
  return !!(env.VERCEL || env.RAILWAY_ENVIRONMENT_ID);
}

export function requestOrigin(request: Request, env: Environment = process.env): string | null {
  // Next's self-hosted request URL may contain its internal bind address.
  // Pin Railway's public origin to configuration, never forwarded host headers.
  try {
    if (env.RAILWAY_ENVIRONMENT_ID) {
      if (!env.NEXT_PUBLIC_SITE_URL) return null;
      const url = new URL(env.NEXT_PUBLIC_SITE_URL);
      return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
    }
    return new URL(request.url).origin;
  } catch { return null; }
}

export function clientAddress(request: Request, env: Environment = process.env): string | null {
  // Select the host's documented ingress header; never fall back to generic XFF.
  // Railway must be reached through its HTTP ingress, not a public TCP proxy.
  const address = env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim()
    : env.RAILWAY_ENVIRONMENT_ID
      ? request.headers.get("x-real-ip")?.trim()
      : "local";
  if (!requiresPostgres(env)) return "local";
  return address && isIP(address) ? address : null;
}

export function dailySyncConfigured(env: Environment = process.env) {
  return !!env.CRON_SECRET && (env.VERCEL_ENV === "production"
    || (!!env.RAILWAY_ENVIRONMENT_ID && env.DAILY_SYNC_ENABLED === "true"));
}
