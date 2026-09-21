import type { Metadata } from "next";

export const siteName = "The Rivalry";
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const siteUrl = new URL(configuredUrl).origin;
export const indexable = process.env.SITE_INDEXABLE === "true" && !/localhost|127\.0\.0\.1/.test(siteUrl);
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: path },
    openGraph: { title: `${title} | ${siteName}`, description, url: path, type: "website", siteName, locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
