import "server-only";
import { cache } from "react";
import { locale as routeLocale } from "next/root-params";
import { isLocale, numberLocales, type Locale } from "./config";
import { createTranslator, type Messages } from "./translate";

const catalogs: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"), es: () => import("./messages/es.json"),
  pt: () => import("./messages/pt.json"), nl: () => import("./messages/nl.json"),
  fr: () => import("./messages/fr.json"), de: () => import("./messages/de.json"),
  ar: () => import("./messages/ar.json"), hi: () => import("./messages/hi.json"),
  th: () => import("./messages/th.json"),
};
export const getI18n = cache(async () => {
  // Root params are isolated per render and support ISR without request headers.
  const requested = await routeLocale();
  const locale = typeof requested === "string" && isLocale(requested) ? requested : "en";
  return getLocaleI18n(locale);
});
export const getLocaleI18n = cache(async (locale: Locale) => {
  const messages = locale === "en" ? {} : (await catalogs[locale]()).default;
  return { locale, messages, numberLocale: numberLocales[locale], t: createTranslator(locale, messages) };
});
