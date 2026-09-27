import { scopes } from "./data";
import type { createTranslator } from "./i18n/translate";
import { localizedUrl, type Locale } from "./i18n/config";

// Definitions come from the same metric catalog as the comparison tables.
// Keep numerical totals out of this reference page so it cannot become stale.
const destinations: Record<string, string> = {
  goals: "/goals", assists: "/assists", appearances: "/compare", minutes: "/compare",
  contributions: "/assists", "goals-per-game": "/scoring-calculator", "goals-per-90": "/scoring-calculator",
  "contributions-per-90": "/assists", "minutes-per-goal": "/scoring-calculator",
  hatTricks: "/hat-tricks", penalties: "/penalties", penaltyAttempts: "/penalties",
  freeKicks: "/free-kicks", outsideBox: "/free-kicks", insideBox: "/goals",
  leftFoot: "/goals", rightFoot: "/goals", headers: "/goals", otherBody: "/goals",
  "non-penalty-goals": "/penalties", "penalty-conversion": "/penalties",
};
export const glossaryTerms = scopes.career.metrics.map(metric => ({
  id: metric.id, label: metric.label, definition: metric.explanation, group: metric.group,
  href: destinations[metric.id] ?? "/compare",
}));

export function glossarySchema(locale: Locale, origin: string, t: ReturnType<typeof createTranslator>) {
  const url = localizedUrl("/glossary", locale, origin);
  const id = `${url}#terms`;
  return {
    "@context": "https://schema.org", "@type": "DefinedTermSet", "@id": id,
    name: t("Football statistics glossary"), url, inLanguage: locale,
    mainEntityOfPage: { "@id": `${url}#webpage` }, publisher: { "@id": `${origin}/#publisher` },
    hasDefinedTerm: glossaryTerms.map(term => ({
      "@type": "DefinedTerm", "@id": `${url}#${term.id}`, url: `${url}#${term.id}`,
      name: t(term.label), description: t(term.definition), inDefinedTermSet: { "@id": id },
    })),
  };
}
