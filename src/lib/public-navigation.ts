import { isPublicPath, stripLocale } from "./i18n/config";

export function needsDocumentNavigation(href: string, currentHref: string, adsEnabled: boolean): boolean {
  if (!adsEnabled) return false;
  const current = new URL(currentHref);
  const next = new URL(href, current);
  return next.origin === current.origin && next.pathname !== current.pathname
    && isPublicPath(stripLocale(next.pathname));
}
