export const productionOrigin = "https://messivsronaldo17.com";

export function siteConfiguration(env: Record<string, string | undefined>) {
  const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL || productionOrigin).origin;
  const indexable = env.SITE_INDEXABLE === "true"
    && siteUrl === productionOrigin
    && (!env.VERCEL_ENV || env.VERCEL_ENV === "production");
  return { siteUrl, indexable };
}
