"use client";
import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { localizedPath } from "@/lib/i18n/config";
import { needsDocumentNavigation } from "@/lib/public-navigation";
import { useI18n } from "./i18n-provider";

const AdNavigationContext = createContext(false);

export function PublicNavigationProvider({ adsEnabled, children }: { adsEnabled: boolean; children: ReactNode }) {
  return <AdNavigationContext.Provider value={adsEnabled}>{children}</AdNavigationContext.Provider>;
}

export default function Link({ href, prefetch = false, onClick, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  const adsEnabled = useContext(AdNavigationContext);
  const localized = typeof href === "string" ? localizedPath(href, locale) : { ...href, pathname: href.pathname ? localizedPath(href.pathname, locale) : href.pathname };
  // Public pages carry the statistics dataset. Do not download every visible
  // navigation/footer destination before the visitor chooses one.
  return <NextLink {...props} href={localized} prefetch={prefetch} onClick={event => {
    onClick?.(event);
    const anchor = event.currentTarget;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
    // Auto ads scans a document once. Client navigation removes its placements
    // without initializing ads for the new page. Use a document navigation only
    // when changing public pages; filters and same-page anchors stay interactive.
    if (needsDocumentNavigation(anchor.href, window.location.href, adsEnabled)) {
      event.preventDefault();
      if (props.replace) window.location.replace(anchor.href);
      else window.location.assign(anchor.href);
    }
  }} />;
}
export function useRouter() {
  const router = useNextRouter();
  const { locale } = useI18n();
  const adsEnabled = useContext(AdNavigationContext);
  function navigate(method: "push" | "replace", href: string, options?: Parameters<typeof router.push>[1]) {
    const localized = localizedPath(href, locale);
    if (needsDocumentNavigation(localized, window.location.href, adsEnabled)) {
      if (method === "replace") window.location.replace(localized);
      else window.location.assign(localized);
      return;
    }
    router[method](localized, options);
  }
  return { ...router, push: (href: string, options?: Parameters<typeof router.push>[1]) => navigate("push", href, options), replace: (href: string, options?: Parameters<typeof router.replace>[1]) => navigate("replace", href, options) };
}
