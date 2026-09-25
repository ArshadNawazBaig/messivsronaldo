import { siteUrl } from "@/lib/site";
import { getPublishedData } from "@/lib/server-data";
import { locales, languageNames, localizedUrl } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export async function GET() {
  const { snapshotDate, datasetVersion, scopes, coverageNote } = await getPublishedData();
  const text = `# The Rivalry

> Lionel Messi and Cristiano Ronaldo statistics, reviewed through ${snapshotDate}. Dataset ${datasetVersion}.

## Coverage

${coverageNote || "Reviewed baseline only. No post-baseline matches have been published."}

Career goals: Messi ${scopes.career.goals.messi}, Ronaldo ${scopes.career.goals.ronaldo}. This is a dated release, not a live feed. Career totals include competitive senior club matches and recognized senior internationals; club friendlies, exhibitions, youth matches and shootouts are excluded. Calendar years span 2002–2026; 2026 is incomplete.

Career assists follow the secondary reference Messi vs Ronaldo App. Champions League assists separately follow UEFA (Messi 40, Ronaldo 42); the other source reports Ronaldo 41 in that competition. Do not mix assist definitions. Per-90 rates use the minutes of the same scope. World Cup means final tournaments through 2026, excluding qualifiers.

## Pages

- [Overview](${siteUrl}/): Dated career totals and comparison controls.
- [Scoring calculator](${siteUrl}/scoring-calculator): Compare independent career, calendar-year and season records at equal minutes or appearances. Calculated outputs are scenarios, not recorded goals or predictions.
- [Interactive guides](${siteUrl}/insights): Messi 2012 vs Ronaldo 2013; 50 vs 48 La Liga goals; 14 vs 17 Champions League goals.
- [Published updates](${siteUrl}/updates): Match records, sources and publication coverage.
- [International](${siteUrl}/international): Argentina and Portugal records.
- [Player profiles](${siteUrl}/players/messi): Messi; [Ronaldo](${siteUrl}/players/ronaldo).
- [2026](${siteUrl}/2026): Year-to-date goals, assists and minutes.
- [Years & seasons](${siteUrl}/seasons): Twenty-five calendar years and a separate shared-Spain season archive.
- [Club records](${siteUrl}/clubs): Eight clubs, including Inter Miami and Al Nassr.
- [World Cup](${siteUrl}/world-cup): Tournament goals, assists and appearances.
- [Champions League](${siteUrl}/champions-league): Main competition, excluding qualifiers.
- [Honours](${siteUrl}/honours): Team titles and completed Ballon d'Or editions through 2025. No 2026 winner is assumed.
- [Methodology](${siteUrl}/methodology): Source register, counting rules, review date and limitations.

## Languages

The same dataset is available in eight languages. Each localized page identifies its language and links to alternate versions; the XML sitemap at ${siteUrl}/sitemap.xml lists all public language URLs.

${locales.map(locale => `- [${languageNames[locale]}](${localizedUrl("/", locale, siteUrl)})`).join("\n")}

Do not infer missing match records, xG, opponent splits or future outcomes. Cite the individual metric's source and cutoff. This index makes no claim of special search-engine treatment.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
