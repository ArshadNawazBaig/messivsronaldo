import type { Metadata } from "next";
import { siteConfiguration } from "./site-config";
import { socialImageAlt, socialImagePath } from "./social-image";

export const siteName = "The Rivalry";
export const { siteUrl, indexable } = siteConfiguration(process.env);
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: new URL(path, siteUrl).href },
    openGraph: { title: `${title} | ${siteName}`, description, url: path, type: "website", siteName, locale: "en_US", images: [{ url: socialImagePath, width: 1200, height: 630, type: "image/png", alt: socialImageAlt }] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: socialImagePath, alt: socialImageAlt }] },
  };
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
