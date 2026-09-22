"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { locales, languageNames, localizedPath, type Locale } from "@/lib/i18n/config";
import { languageCookie, languageCookieMaxAge } from "@/lib/i18n/detection";
import { useI18n } from "./i18n-provider";

function rememberLanguage(locale: Locale) {
  document.cookie = `${languageCookie}=${locale}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [suffix, setSuffix] = useState("");
  function choose(event: React.MouseEvent<HTMLAnchorElement>, next: Locale) {
    // Remember explicit choices, including English, before following the link.
    // The cookie is a language preference only; it contains no visitor ID.
    rememberLanguage(next);
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.pathname = localizedPath(url.pathname, next);
    // Full navigation updates html lang/dir and the server-provided catalog
    // together, while preserving the current comparison, query and hash.
    window.location.assign(url.href);
  }
  return <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (next) setSuffix(window.location.search + window.location.hash); }}>
    <Popover.Trigger asChild><button className="language-trigger" type="button" aria-label={t("Choose your language")}>
      <Languages size={18} aria-hidden="true" /><span className="language-current" lang={locale}>{languageNames[locale]}</span><span className="language-code">{locale.toUpperCase()}</span><ChevronDown size={12} aria-hidden="true" />
    </button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="language-menu" align="end" sideOffset={10} collisionPadding={12} aria-label={t("Language")} dir={locale === "ar" ? "rtl" : "ltr"}>
      <p className="language-menu-title">{t("Choose your language")}</p>
      <nav aria-label={t("Language")}><ul>{locales.map(next => <li key={next}>
        <a href={`${localizedPath(pathname, next)}${suffix}`} hrefLang={next} lang={next} dir="auto" aria-current={locale === next ? "true" : undefined} onClick={event => choose(event, next)}>
          <span>{languageNames[next]}</span><span className="language-item-code" aria-hidden="true">{next.toUpperCase()}</span>{locale === next && <Check size={16} aria-hidden="true" />}
        </a>
      </li>)}</ul></nav>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
