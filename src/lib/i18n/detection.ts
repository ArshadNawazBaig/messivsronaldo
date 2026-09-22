import { isLocale, locales, type Locale } from "./config";

export const languageCookie = "rivalry-locale";
export const languageCookieMaxAge = 60 * 60 * 24 * 365;

/** Match regional browser preferences (es-MX, pt-BR, etc.) by quality weight. */
export function browserLocale(header: string | null): Locale {
  const ranges = (header ?? "").slice(0, 4096).split(",").flatMap((part, order) => {
    const match = part.trim().match(/^([a-z]{2,8}(?:-[a-z0-9]{1,8})*|\*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i);
    return match ? [{ language: match[1].toLowerCase().split("-")[0], quality: match[2] === undefined ? 1 : Number(match[2]), order }] : [];
  });
  const candidates = locales.flatMap(locale => {
    const explicit = ranges.filter(range => range.language === locale);
    const matches = explicit.length ? explicit : ranges.filter(range => range.language === "*");
    const best = matches.sort((a, b) => b.quality - a.quality || a.order - b.order)[0];
    return best && best.quality > 0 ? [{ locale, ...best }] : [];
  });
  return candidates.sort((a, b) => b.quality - a.quality || a.order - b.order)[0]?.locale ?? "en";
}

export function preferredLocale(saved: string | undefined, acceptLanguage: string | null): Locale {
  return saved && isLocale(saved) ? saved : browserLocale(acceptLanguage);
}

// Keep unprefixed English URLs directly available to crawlers and link previews.
// This only bypasses preference redirects; the page content stays identical.
export function isLanguageCrawler(userAgent: string | null): boolean {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|google-inspectiontool/i.test(userAgent ?? "");
}
