import Link from "./localized-link";
import { clubSeasons } from "@/lib/club-seasons";
import { getI18n } from "@/lib/i18n/server";
import styles from "./archive-summary.module.css";

// These are different club seasons. Never substitute the same-season Ronaldo
// column above or calendar-year totals for this specific comparison.
export async function EarlySeasonComparison() {
  const { t, numberLocale } = await getI18n();
  const messiSeason = clubSeasons.find(season => season.slug === "2008-2009")!;
  const ronaldoSeason = clubSeasons.find(season => season.slug === "2007-2008")!;
  const messi = { goals: messiSeason.stats.goals.messi, appearances: messiSeason.stats.appearances.messi };
  const ronaldo = { goals: ronaldoSeason.stats.goals.ronaldo, appearances: ronaldoSeason.stats.appearances.ronaldo };
  const fmt = (value: number, decimals = 0) => value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <section id="ronaldo-2008-messi-2009" className={styles.summary} aria-labelledby="early-season-title" data-early-season-comparison>
    <h2 id="early-season-title">{t("Ronaldo 2008 vs Messi 2009: comparing different seasons")}</h2>
    <p>{t("For this club-season comparison, Ronaldo scored {0} goals in {1} appearances for Manchester United in 2007/08; Messi scored {2} in {3} for Barcelona in 2008/09. National-team matches are excluded.", { 0: fmt(ronaldo.goals), 1: fmt(ronaldo.appearances), 2: fmt(messi.goals), 3: fmt(messi.appearances) })}</p>
    <table className={styles.table} dir="ltr">
      <caption dir="auto">{t("All club competitions")} · 2007/08 / 2008/09</caption>
      <thead><tr>
        <th scope="col">{t("Messi")}<br/>2008/09</th>
        <th scope="col">{t("Statistic")}</th>
        <th scope="col">{t("Ronaldo")}<br/>2007/08</th>
      </tr></thead>
      <tbody>{[
        { label: "Goals", messi: messi.goals, ronaldo: ronaldo.goals, decimals: 0 },
        { label: "Appearances", messi: messi.appearances, ronaldo: ronaldo.appearances, decimals: 0 },
        { label: "Goals per appearance", messi: messi.goals / messi.appearances, ronaldo: ronaldo.goals / ronaldo.appearances, decimals: 2 },
      ].map(row => <tr key={row.label}>
        <td className={styles.value}>{fmt(row.messi, row.decimals)}</td>
        <th scope="row" className={styles.metric} dir="auto">{t(row.label)}</th>
        <td className={styles.value}>{fmt(row.ronaldo, row.decimals)}</td>
      </tr>)}</tbody>
    </table>
    <p>{t("Goals per appearance means goals divided by appearances. This compares scoring output across two different seasons; it does not by itself decide who played better.")}</p>
    <p>{t("If you mean January–December instead, use the calendar-year records. The main table on this page compares both players in the same 2008/09 club season.")}</p>
    <div className="archive-link">
      <Link href="/club-stats/2007-2008">{t("2007/08 club season")}</Link>
      <Link href="/seasons/2008">{t("2008 calendar year")}</Link>
      <Link href="/seasons/2009">{t("2009 calendar year")}</Link>
    </div>
    <p>{t("Sources")}: <a href="https://www.manutd.com/en/club/history/history-by-decade/2000-2009">Manchester United</a> · <a href="https://www.fcbarcelona.com/en/news/1125678/messi-scores-40-goals-for-the-fifth-consecutive-season">FC Barcelona</a> · <a href={ronaldoSeason.source}>2007/08</a> · <a href={messiSeason.source}>2008/09</a></p>
  </section>;
}
