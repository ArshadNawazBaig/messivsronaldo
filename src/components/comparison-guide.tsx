import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { getPublishedData } from "@/lib/server-data";
import { comparisonDataset } from "@/lib/comparison-schema";
import { jsonLd, siteUrl } from "@/lib/site";
import { awardComparisons, awardTotals } from "@/lib/awards";
import type { ScopeId } from "@/lib/football";
import styles from "./comparison-guide.module.css";
import { translatedDate } from "@/lib/i18n/date-format";
export async function ComparisonGuide() {
    const { t, numberLocale, locale } = await getI18n();
    const data = await getPublishedData();
    const { scopes, snapshotLabel, snapshotDate } = data;
    const goals = scopes.career.goals;
    const assists = scopes.career.metrics.find(metric => metric.id === "assists")!.values;
    const records: { scope: ScopeId; metric: string; label: string; href: string }[] = [
      { scope: "career", metric: "goals", label: "Career goals", href: "/goals" },
      { scope: "career", metric: "assists", label: "Career assists", href: "/assists" },
      { scope: "career", metric: "goals-per-game", label: "Career goals per appearance", href: "/scoring-calculator" },
      { scope: "champions-league", metric: "goals", label: "Champions League goals", href: "/champions-league" },
      { scope: "world-cup", metric: "goals", label: "World Cup goals", href: "/world-cup" },
    ];
    const rows = records.flatMap(record => {
      const scope = scopes[record.scope];
      const metric = scope.metrics.find(item => item.id === record.metric);
      return metric ? [{ ...record, metric, date: metric.updatedThrough ?? scope.updatedThrough }] : [];
    });
    const awards = awardTotals("ballon-dor");
    const rate = scopes.career.metrics.find(metric => metric.id === "goals-per-game");
    const format = (value: number, decimals = 0) => value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return <section className="comparison-guide prose panel" id="career-comparison-guide" aria-labelledby="comparison-guide-title" data-home-comparison-guide>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(comparisonDataset(data, "career", "/", locale, siteUrl, t)) }}/>
    <span className="section-kicker">{t("THE COMPARISON, IN CONTEXT")}</span>
    <h2 id="comparison-guide-title">{t("Ronaldo vs Messi: how do their records compare?")}</h2>
    <p>{t("Compare Lionel Messi and Cristiano Ronaldo across their careers, clubs and national teams. The published figures below run through ")}<time dateTime={snapshotDate}>{t(snapshotLabel)}</time>{t(". Each competition has its own boundary and supporting sources.")}</p>
    <table className={styles.table}>
      <caption>{t("Messi vs Ronaldo: key career and competition records")}</caption>
      <thead><tr><th scope="col">{t("Record")}</th><th scope="col">{t("Messi")}</th><th scope="col">{t("Ronaldo")}</th></tr></thead>
      <tbody>
        {rows.map(row => <tr key={row.label}>
          <th scope="row"><Link href={row.href}>{t(row.label)}</Link><span className={styles.coverage}>{t("Data cutoff:")} <time dateTime={row.date}>{translatedDate(row.date, locale) ?? row.date}</time></span></th>
          <td>{format(row.metric.values.messi, row.metric.decimals)}</td><td>{format(row.metric.values.ronaldo, row.metric.decimals)}</td>
        </tr>)}
        <tr><th scope="row"><Link href="/ballon-dor">{t("Ballon d’Or awards")}</Link><span className={styles.coverage}>{t(awardComparisons["ballon-dor"].context)}</span></th><td>{format(awards.messi)}</td><td>{format(awards.ronaldo)}</td></tr>
      </tbody>
    </table>
    <p className={styles.note}>{t("Competition totals are part of career totals; these rows should not be added together.")} <Link href="/methodology">{t("Sources & counting rules")}</Link> · <Link href="/updates">{t("Public update log")}</Link></p>
    <h3>{t("Who has scored more career goals?")}</h3>
    <p>{t("Messi has {0} career goals and Ronaldo has {1}. These totals include senior competitive club matches and recognized senior internationals. Club friendlies, youth matches and penalty shootouts are excluded. ", { "0": t(goals.messi.toLocaleString(numberLocale)), "1": t(goals.ronaldo.toLocaleString(numberLocale)) })}<Link href="/goals">{t("Explore the full goals comparison")}</Link>.</p>
    {rate && <p>{t("Messi averages {0} goals per appearance; Ronaldo averages {1}. This adjusts for match count, but not minutes played, opposition or role.", { 0: format(rate.values.messi, rate.decimals), 1: format(rate.values.ronaldo, rate.decimals) })} <Link href="/scoring-calculator">{t("Open the calculator")}</Link>.</p>}
    <h3>{t("How do their assists compare?")}</h3>
    <p>{t("The career comparison records {0} assists for Messi and {1} for Ronaldo. Assist definitions differ between providers, so compare totals using the same source and scope. ", { "0": t(assists.messi), "1": t(assists.ronaldo) })}<Link href="/assists">{t("See assists, goal contributions and counting rules")}</Link>.</p>
    <h3>{t("How are team trophies and individual awards counted?")}</h3>
    <p>{t("Team trophies are listed by competition, with youth, Olympic and conference titles identified. Ballon d\u2019Or awards are shown separately. ")}<Link href="/honours">{t("Compare the complete trophy cabinet")}</Link>.</p>
    <h3>{t("Does a higher total settle who is better?")}</h3>
    <p>{t("A total answers one question. Playing time, competition, role and the length of each career add context. Use total goals alongside appearances and per-90 rates, or explore ")}<Link href="/head-to-head">{t("matches in which both players appeared")}</Link>{t(". Our ")}<Link href="/methodology">{t("methodology")}</Link>{t(" explains the limits and sources.")}</p>
  </section>;
}
