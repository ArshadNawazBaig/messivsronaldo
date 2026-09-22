import type { Metadata } from "next";
import { siteConfiguration } from "./site-config";
import { socialImageAlt, socialImagePath } from "./social-image";
import { getI18n } from "./i18n/server";
import { languageAlternates, localizedPath, ogLocales, locales } from "./i18n/config";

export const siteName = "The Rivalry";
export const { siteUrl, indexable } = siteConfiguration(process.env);
export async function pageMetadata(title: string, description: string, path: string): Promise<Metadata> {
  const { locale, t } = await getI18n();
  title = t(title); description = t(description);
  path = localizedPath(path, locale);
  return {
    title, description, alternates: { canonical: new URL(path, siteUrl).href, languages: languageAlternates(path, siteUrl) },
    openGraph: { title: `${title} | ${siteName}`, description, url: path, type: "website", siteName, locale: ogLocales[locale], alternateLocale: locales.filter(item => item !== locale).map(item => ogLocales[item]), images: [{ url: socialImagePath, width: 1200, height: 630, type: "image/png", alt: t(socialImageAlt) }] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: socialImagePath, alt: t(socialImageAlt) }] },
  };
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
