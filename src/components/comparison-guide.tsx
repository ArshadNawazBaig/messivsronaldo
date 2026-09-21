import Link from "next/link";
import { getPublishedData } from "@/lib/server-data";
import { sources } from "@/lib/data";
import { jsonLd, siteUrl } from "@/lib/site";

export async function ComparisonGuide() {
  const { scopes, snapshotLabel, snapshotDate, baselineDate, datasetVersion } = await getPublishedData();
  const goals = scopes.career.goals;
  const assists = scopes.career.metrics.find(metric => metric.id === "assists")!.values;
  return <section className="comparison-guide prose panel" aria-labelledby="comparison-guide-title">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "Dataset",
      "@id": `${siteUrl}/#career-dataset`, name: "Messi vs Ronaldo career statistics",
      description: `Career goals, assists, appearances and scoring rates for Lionel Messi and Cristiano Ronaldo. Published figures through ${snapshotLabel}; reviewed baseline ${baselineDate}.`,
      url: `${siteUrl}/#comparison`, version: datasetVersion, dateModified: snapshotDate,
      creator: { "@id": `${siteUrl}/#publisher` },
      about: [ { "@type": "Person", name: "Lionel Messi", url: `${siteUrl}/players/messi` }, { "@type": "Person", name: "Cristiano Ronaldo", url: `${siteUrl}/players/ronaldo` } ],
      variableMeasured: ["Goals", "Assists", "Appearances", "Minutes played"],
      citation: scopes.career.source.map(id => sources[id].url),
      isAccessibleForFree: true,
    }) }} />
    <span className="section-kicker">THE COMPARISON, IN CONTEXT</span>
    <h2 id="comparison-guide-title">Messi vs Ronaldo: goals, assists and trophies</h2>
    <p>Compare Lionel Messi and Cristiano Ronaldo across their careers, clubs and national teams. The published figures below run through <time dateTime={snapshotDate}>{snapshotLabel}</time>. Each competition has its own boundary and supporting sources.</p>
    <h3>Who has scored more career goals?</h3>
    <p>Messi has {goals.messi.toLocaleString("en-US")} career goals and Ronaldo has {goals.ronaldo.toLocaleString("en-US")}. These totals include senior competitive club matches and recognized senior internationals. Club friendlies, youth matches and penalty shootouts are excluded. <Link href="/goals">Explore the full goals comparison</Link>.</p>
    <h3>How do their assists compare?</h3>
    <p>The career comparison records {assists.messi} assists for Messi and {assists.ronaldo} for Ronaldo. Assist definitions differ between providers, so compare totals using the same source and scope. <Link href="/assists">See assists, goal contributions and counting rules</Link>.</p>
    <h3>How are team trophies and individual awards counted?</h3>
    <p>Team trophies are listed by competition, with youth, Olympic and conference titles identified. Ballon d’Or awards are shown separately. <Link href="/honours">Compare the complete trophy cabinet</Link>.</p>
    <h3>Does a higher total settle who is better?</h3>
    <p>A total answers one question. Playing time, competition, role and the length of each career add context. Use total goals alongside appearances and per-90 rates, or explore <Link href="/head-to-head">matches in which both players appeared</Link>. Our <Link href="/methodology">methodology</Link> explains the limits and sources.</p>
  </section>;
}
