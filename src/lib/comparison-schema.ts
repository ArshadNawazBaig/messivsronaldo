import { players, sources, type ScopeId } from "./football";
import { localizedUrl, type Locale } from "./i18n/config";
import type { createTranslator } from "./i18n/translate";
import type { PublishedData } from "./published-data";
import { playerEntity } from "./page-semantics";

export function comparisonDataset(data: PublishedData, scopeId: ScopeId, path: string, locale: Locale, origin: string, t: ReturnType<typeof createTranslator>, scoring = false) {
  const scope = data.scopes[scopeId];
  const metrics = scope.metrics.filter(metric => metric.group === (scoring ? "scoring" : "overview"));
  const cutoff = scoring ? metrics.map(metric => metric.updatedThrough ?? data.baselineDate).sort().at(-1) ?? data.baselineDate : scope.updatedThrough;
  const url = localizedUrl(path, locale, origin);
  return {
    "@context": "https://schema.org", "@type": "Dataset", "@id": `${url}#comparison-dataset`,
    name: `${t("Messi vs Ronaldo")} · ${t(scope.label)}`,
    description: `${t(scope.description)} ${scoring ? t("Each scoring statistic lists its own coverage.") : `${t("Data cutoff: ")} ${cutoff}.`}`,
    url: `${url}#comparison`, inLanguage: locale, version: data.datasetVersion,
    dateModified: cutoff, creator: { "@id": `${origin}/#publisher` }, isAccessibleForFree: true,
    // Reference the site's existing reuse terms, including third-party rights.
    license: localizedUrl("/terms#using-the-content", locale, origin),
    mainEntityOfPage: { "@id": `${url}#webpage` },
    about: (["messi", "ronaldo"] as const).map(id => playerEntity(id, locale, origin)),
    measurementTechnique: localizedUrl("/methodology", locale, origin),
    citation: [...new Set(metrics.flatMap(metric => metric.source))].map(id => new URL(sources[id].url, origin).href),
    variableMeasured: metrics.flatMap(metric => (["messi", "ronaldo"] as const).map(player => ({
      "@type": "PropertyValue", name: `${players[player].name} · ${t(metric.label)}`,
      propertyID: `${localizedUrl("/glossary", locale, origin)}#${metric.id}`,
      value: Number(metric.values[player].toFixed(metric.decimals ?? 0)), ...(metric.unit ? { unitText: metric.unit } : {}),
      description: `${t(metric.explanation)} ${t(metric.coverage ?? scope.period)}`,
    }))),
  };
}
