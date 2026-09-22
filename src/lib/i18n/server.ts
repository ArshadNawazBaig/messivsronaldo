import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { isLocale, numberLocales, type Locale } from "./config";
import { createTranslator, type Messages } from "./translate";

const catalogs: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"), es: () => import("./messages/es.json"),
  pt: () => import("./messages/pt.json"), nl: () => import("./messages/nl.json"),
  fr: () => import("./messages/fr.json"), de: () => import("./messages/de.json"),
  ar: () => import("./messages/ar.json"), hi: () => import("./messages/hi.json"),
};
export const getI18n = cache(async () => {
  const requested = (await headers()).get("x-rivalry-locale") ?? "en";
  const locale = isLocale(requested) ? requested : "en";
  const messages = locale === "en" ? {} : (await catalogs[locale]()).default;
  return { locale, messages, numberLocale: numberLocales[locale], t: createTranslator(locale, messages) };
});
