import { players, type PlayerId } from "./data";
import { localizedUrl, type Locale } from "./i18n/config";

export const semanticContentUpdated = "2026-09-27";
export type Breadcrumb = { path: string; name: string };
export type PageSemantics = {
  path: string;
  title: string;
  description?: string;
  kind?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";
  breadcrumbs: Breadcrumb[];
  players?: readonly PlayerId[];
  mainEntityId?: string;
};

// A player's identity stays the same across languages; their profile URL is localized.
export function playerEntity(id: PlayerId, locale: Locale, origin: string) {
  return { "@type": "Person", "@id": `${origin}/players/${id}#person`, name: players[id].name, url: localizedUrl(`/players/${id}`, locale, origin) };
}

export function pageSemantics(input: PageSemantics, locale: Locale, origin: string) {
  const url = localizedUrl(input.path, locale, origin);
  const breadcrumb = input.breadcrumbs.length > 1 ? {
    "@context": "https://schema.org", "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
    itemListElement: input.breadcrumbs.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, item: localizedUrl(item.path, locale, origin),
    })),
  } : undefined;
  return {
    page: {
      "@context": "https://schema.org", "@type": input.kind ?? "WebPage", "@id": `${url}#webpage`,
      url, name: input.title, ...(input.description && { description: input.description }), inLanguage: locale,
      isPartOf: { "@id": `${origin}/#website` }, publisher: { "@id": `${origin}/#publisher` },
      ...(breadcrumb && { breadcrumb: { "@id": breadcrumb["@id"] } }),
      ...(input.players?.length && { about: input.players.map(id => playerEntity(id, locale, origin)) }),
      ...(input.mainEntityId && { mainEntity: { "@id": input.mainEntityId.startsWith("#") ? `${url}${input.mainEntityId}` : input.mainEntityId } }),
    },
    breadcrumb,
  };
}
