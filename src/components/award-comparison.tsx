import Link from "@/components/localized-link";
import { ArrowUpRight, Star } from "lucide-react";
import { awardComparisons, awardRows, awardTotals, honoursNavigation, type AwardSlug } from "@/lib/awards";
import { getI18n } from "@/lib/i18n/server";
import { PlayerMatchup } from "./player-matchup";
import { AwardChart } from "./award-chart";
import styles from "./award-comparison.module.css";

export async function HonoursNavigation({ current }: { current: string }) {
  const { t } = await getI18n();
  return <nav className={styles.navigation} aria-label={t("Trophies & awards")}>
    {honoursNavigation.map(item => <Link key={item.href} href={item.href} aria-current={item.href === `/${current}` ? "page" : undefined}>{t(item.label)}</Link>)}
  </nav>;
}

export async function AwardComparison({ slug }: { slug: AwardSlug }) {
  const { t, numberLocale } = await getI18n();
  const award = awardComparisons[slug];
  return <section className={styles.comparison} aria-label={t(award.label)}>
    <PlayerMatchup values={awardTotals(slug)} label={t(award.cardLabel)} accessibleLabel={t(award.cardLabel)} context={t(award.context)} />
    <div className={styles.coverage}><span className="section-kicker">{t("Comparison scope")}</span><p>{t(award.note)}</p></div>
    <section className="panel">
      <div className="panel-heading"><div><span className="section-kicker">{t(award.context)}</span><h2>{t(award.wins ? "Winning editions" : "Covered match awards")}</h2></div></div>
      <div className="year-table-wrap" role="region" aria-label={t(award.label)} tabIndex={0}>
        <table className={`year-table ${styles.table}`}>
          <caption className="sr-only">{t(award.description)}</caption>
          <thead><tr><th scope="col">{t(award.wins ? "Award edition" : "Statistic")}</th><th scope="col">{t("Messi")}</th><th scope="col">{t("Ronaldo")}</th></tr></thead>
          <tbody>{awardRows(slug).map(row => <tr key={row.label}>
            <th scope="row">{t(row.label)}</th>
            {(["messi", "ronaldo"] as const).map(player => {
              const value = row.values[player];
              const other = row.values[player === "messi" ? "ronaldo" : "messi"];
              return <td key={player} className={`${player}-text`}><span className={styles.value}>
                {row.percent ? new Intl.NumberFormat(numberLocale, { style: "percent" }).format(value / 100) : t(value)}
                {value >= other && <span className="leader-mark" role="img" aria-label={t(value === other ? "Both starred = tied" : "Leads this stat")}><Star size={14} fill="currentColor" aria-hidden="true" /></span>}
              </span></td>;
            })}
          </tr>)}</tbody>
          {award.wins && <tfoot><tr><th scope="row">{t("Total awards")}</th><td className="messi-text">{t(awardTotals(slug).messi)}</td><td className="ronaldo-text">{t(awardTotals(slug).ronaldo)}</td></tr></tfoot>}
        </table>
      </div>
      <div className={`stats-footnote ${styles.sources}`}><span>{t("Sources & counting rules")}</span><div>{award.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div></div>
    </section>
    {slug === "ballon-dor" && <AwardChart full />}
  </section>;
}
