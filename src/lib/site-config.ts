export const productionOrigin = "https://messivsronaldo17.com";
export const wwwProductionOrigin = "https://www.messivsronaldo17.com";
const productionOrigins = new Set([productionOrigin, wwwProductionOrigin]);

export function siteConfiguration(env: Record<string, string | undefined>) {
  const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL || productionOrigin).origin;
  const indexable = env.SITE_INDEXABLE === "true"
    && productionOrigins.has(siteUrl)
    && (!env.VERCEL_ENV || env.VERCEL_ENV === "production");
  return { siteUrl, indexable };
}

export function canonicalHostRedirects(env: Record<string, string | undefined>) {
  const { siteUrl } = siteConfiguration(env);
  if (!productionOrigins.has(siteUrl)) return [];
  const alternate = siteUrl === productionOrigin ? wwwProductionOrigin : productionOrigin;
  return [{
    source: "/:path*",
    has: [{ type: "host" as const, value: new URL(alternate).hostname }],
    destination: `${siteUrl}/:path*`,
    permanent: true,
  }];
}
