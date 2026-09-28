import type { Locale } from "../i18n/config";

/** Thai does not separate every word with a space. */
export function articleWordCount(text: string, locale: Locale): number {
  if (locale === "th") {
    const segments = new Intl.Segmenter("th", { granularity: "word" }).segment(text);
    return Array.from(segments).filter(segment => segment.isWordLike).length;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}
