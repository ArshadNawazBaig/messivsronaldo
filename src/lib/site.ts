import type { Metadata } from "next";
import { siteConfiguration } from "./site-config";

export const siteName = "The Rivalry";
export const { siteUrl, indexable } = siteConfiguration(process.env);
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: new URL(path, siteUrl).href },
    openGraph: { title: `${title} | ${siteName}`, description, url: path, type: "website", siteName, locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
