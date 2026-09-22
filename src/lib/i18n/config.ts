export const locales = ["en", "es", "pt", "nl", "fr", "de", "ar", "hi"] as const;
export type Locale = typeof locales[number];
export const languageNames: Record<Locale, string> = { en: "English", es: "Español", pt: "Português", nl: "Nederlands", fr: "Français", de: "Deutsch", ar: "العربية", hi: "हिन्दी" };
export const intlLocales: Record<Locale, string> = { en: "en-GB", es: "es-ES", pt: "pt-PT", nl: "nl-NL", fr: "fr-FR", de: "de-DE", ar: "ar", hi: "hi-IN" };
export const ogLocales: Record<Locale, string> = { en: "en_US", es: "es_ES", pt: "pt_PT", nl: "nl_NL", fr: "fr_FR", de: "de_DE", ar: "ar_AR", hi: "hi_IN" };
export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function pathLocale(path: string): Locale { const first = path.split("/")[1]; return isLocale(first) ? first : "en"; }
export function stripLocale(path: string): string {
  const bare = path.replace(/^\/(en|es|pt|nl|fr|de|ar|hi)(?=\/|\?|#|$)/, "") || "/";
  return bare.startsWith("?") || bare.startsWith("#") ? `/${bare}` : bare;
}
export function isPublicPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !/^\/(api|admin|_next)(\/|$)/.test(path) && !/\.[a-z0-9]+(?:[?#]|$)/i.test(path) && !/^\/opengraph-image(?:[/?#]|$)/.test(path);
}
export function localizedPath(path: string, locale: Locale): string {
  if (!isPublicPath(path)) return path;
  const bare = stripLocale(path);
  if (!isPublicPath(bare)) return bare;
  return locale === "en" ? bare : `/${locale}${bare === "/" ? "" : bare}`;
}
export function languageAlternates(path: string, origin: string) {
  return Object.fromEntries([...locales.map(locale => [locale, localizedUrl(path, locale, origin)]), ["x-default", localizedUrl(path, "en", origin)]]);
}
export function localizedUrl(path: string, locale: Locale, origin: string): string {
  const localized = localizedPath(path, locale);
  return localized === "/" ? new URL(origin).origin : new URL(localized, origin).href;
}
