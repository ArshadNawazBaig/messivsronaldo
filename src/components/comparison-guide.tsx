import { localizedPath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { getPublishedData } from "@/lib/server-data";
import { sources } from "@/lib/data";
import { jsonLd, siteUrl } from "@/lib/site";
export async function ComparisonGuide() {
    const { t, numberLocale, locale } = await getI18n();
    const { scopes, snapshotLabel, snapshotDate, baselineDate, datasetVersion } = await getPublishedData();
    const goals = scopes.career.goals;
    const assists = scopes.career.metrics.find(metric => metric.id === "assists")!.values;
    return <section className="comparison-guide prose panel" aria-labelledby="comparison-guide-title">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
                "@context": "https://schema.org", "@type": "Dataset",
                "@id": `${siteUrl}/#career-dataset`, name: "Messi vs Ronaldo career statistics",
                description: `Career goals, assists, appearances and scoring rates for Lionel Messi and Cristiano Ronaldo. Published figures through ${snapshotLabel}; reviewed baseline ${baselineDate}.`,
                url: `${siteUrl}${localizedPath("/", locale)}#comparison`, inLanguage: locale, version: datasetVersion, dateModified: snapshotDate,
                creator: { "@id": `${siteUrl}/#publisher` },
                about: [{ "@type": "Person", name: "Lionel Messi", url: `${siteUrl}/players/messi` }, { "@type": "Person", name: "Cristiano Ronaldo", url: `${siteUrl}/players/ronaldo` }],
                variableMeasured: ["Goals", "Assists", "Appearances", "Minutes played"],
                citation: scopes.career.source.map(id => sources[id].url),
                isAccessibleForFree: true,
            }) }}/>
    <span className="section-kicker">{t("THE COMPARISON, IN CONTEXT")}</span>
    <h2 id="comparison-guide-title">{t("Messi vs Ronaldo: goals, assists and trophies")}</h2>
    <p>{t("Compare Lionel Messi and Cristiano Ronaldo across their careers, clubs and national teams. The published figures below run through ")}<time dateTime={snapshotDate}>{t(snapshotLabel)}</time>{t(". Each competition has its own boundary and supporting sources.")}</p>
    <h3>{t("Who has scored more career goals?")}</h3>
    <p>{t("Messi has {0} career goals and Ronaldo has {1}. These totals include senior competitive club matches and recognized senior internationals. Club friendlies, youth matches and penalty shootouts are excluded. ", { "0": t(goals.messi.toLocaleString(numberLocale)), "1": t(goals.ronaldo.toLocaleString(numberLocale)) })}<Link href="/goals">{t("Explore the full goals comparison")}</Link>.</p>
    <h3>{t("How do their assists compare?")}</h3>
    <p>{t("The career comparison records {0} assists for Messi and {1} for Ronaldo. Assist definitions differ between providers, so compare totals using the same source and scope. ", { "0": t(assists.messi), "1": t(assists.ronaldo) })}<Link href="/assists">{t("See assists, goal contributions and counting rules")}</Link>.</p>
    <h3>{t("How are team trophies and individual awards counted?")}</h3>
    <p>{t("Team trophies are listed by competition, with youth, Olympic and conference titles identified. Ballon d\u2019Or awards are shown separately. ")}<Link href="/honours">{t("Compare the complete trophy cabinet")}</Link>.</p>
    <h3>{t("Does a higher total settle who is better?")}</h3>
    <p>{t("A total answers one question. Playing time, competition, role and the length of each career add context. Use total goals alongside appearances and per-90 rates, or explore ")}<Link href="/head-to-head">{t("matches in which both players appeared")}</Link>{t(". Our ")}<Link href="/methodology">{t("methodology")}</Link>{t(" explains the limits and sources.")}</p>
  </section>;
}
