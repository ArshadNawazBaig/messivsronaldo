"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { intlLocales, type Locale } from "@/lib/i18n/config";
import { createTranslator, type Messages } from "@/lib/i18n/translate";

const Context = createContext({ locale: "en" as Locale, numberLocale: "en-US", t: createTranslator("en", {}) });
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const value = useMemo(() => ({ locale, numberLocale: locale === "en" ? "en-US" : intlLocales[locale], t: createTranslator(locale, messages) }), [locale, messages]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() { return useContext(Context); }
