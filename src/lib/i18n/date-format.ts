import { isCalendarDate } from "../calendar";
import type { Locale } from "./config";

// Shared locale data keeps SSR and hydration identical across ICU/CLDR
// versions. Intl.DateTimeFormat may add different punctuation or digits in
// Node, Chrome and Safari, even when given the same locale and UTC timezone.
const months: Record<Locale, readonly string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  nl: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
};

/** Format only valid ISO dates or the dataset's English date labels. */
export function translatedDate(source: string, locale: Locale): string | undefined {
  let iso = source;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const match = source.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
    if (!match) return;
    const month = months.en.findIndex(name => name.toLowerCase() === match[2].toLowerCase());
    if (month < 0) return;
    iso = `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  if (!isCalendarDate(iso)) return;
  const day = Number(iso.slice(8));
  const month = months[locale][Number(iso.slice(5, 7)) - 1];
  const year = iso.slice(0, 4);
  if (locale === "es" || locale === "pt") return `${day} de ${month} de ${year}`;
  if (locale === "de") return `${day}. ${month} ${year}`;
  return `${day} ${month} ${year}`;
}
