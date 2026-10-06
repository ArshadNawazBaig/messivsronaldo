import Link from "./localized-link";
import { getI18n } from "@/lib/i18n/server";
import { getPublishedData } from "@/lib/server-data";
import { peakYearStudy, peakYearStudyDownload } from "@/lib/peak-year-study";
import styles from "@/app/[locale]/insights/[slug]/article.module.css";

export async function PeakYearStudy() {
  const [{ t, numberLocale }, data] = await Promise.all([getI18n(), getPublishedData()]);
  const rows = peakYearStudy(data);
  if (rows.length !== 2) return null;
  const number = (value: number | null, digits = 0) => value === null ? "—" : value.toLocaleString(numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return <section className={styles.tableSection} aria-labelledby="peak-year-calculation" data-peak-year-study>
    <h2 id="peak-year-calculation">{t("The same 50 appearances: a worked comparison")}</h2>
    <p>{t("This scenario scales each recorded scoring rate to 50 appearances. It does not adjust for opponents, team strength or minutes per appearance.")}</p>
    <div className={`${styles.tableWrap} ${styles.studyTable}`} role="region" aria-labelledby="peak-year-calculation" tabIndex={0}>
      <table><caption className="sr-only">{t("Peak calendar years")}</caption>
        <thead><tr><th scope="col">{t("Statistic")}</th>{rows.map(row => <th key={row.player} scope="col">{row.name} · {row.year}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">{t("Goals")}</th>{rows.map(row => <td key={row.player}>{number(row.goals)}</td>)}</tr>
          <tr><th scope="row">{t("Appearances")}</th>{rows.map(row => <td key={row.player}>{number(row.appearances)}</td>)}</tr>
          <tr><th scope="row">{t("Goals per appearance")}</th>{rows.map(row => <td key={row.player}>{number(row.perAppearance, 3)}</td>)}</tr>
          <tr><th scope="row">{t("Goals over 50 appearances (scenario)")}</th>{rows.map(row => <td key={row.player}>{number(row.over50, 2)}</td>)}</tr>
        </tbody>
      </table>
    </div>
    <p className={styles.tableNote}>{t("Formula: recorded goals ÷ recorded appearances × selected appearances.")} {t("Rates and differences are calculated before rounding.")}</p>
    <p className={styles.inlineSources}>{rows.map(row => <a href={row.source} key={row.player} target="_blank" rel="noreferrer">UEFA · {row.name} · {row.year}</a>)}</p>
    <p><a href={peakYearStudyDownload} download>{t("Download the calculation (CSV)")}</a></p>
    <p><Link href="#scoring-calculator">{t("Try a different number of appearances")}</Link></p>
  </section>;
}
