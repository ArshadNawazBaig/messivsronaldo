import "server-only";
import { cache } from "react";
import { getI18n } from "./server";
import { createTranslator, type Messages } from "./translate";
import type { Locale } from "./config";

// Long-form translations stay on the server, outside the shared client catalog.
const catalogs: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./article-messages/en.json"), es: () => import("./article-messages/es.json"),
  pt: () => import("./article-messages/pt.json"), nl: () => import("./article-messages/nl.json"),
  fr: () => import("./article-messages/fr.json"), de: () => import("./article-messages/de.json"),
  ar: () => import("./article-messages/ar.json"), hi: () => import("./article-messages/hi.json"),
};
export const getArticleI18n = cache(async () => {
  const context = await getI18n();
  if (context.locale === "en") return context;
  const messages = { ...context.messages, ...(await catalogs[context.locale]()).default };
  return { ...context, t: createTranslator(context.locale, messages) };
});
