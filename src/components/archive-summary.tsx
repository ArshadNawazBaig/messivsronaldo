import Link from "./localized-link";
import { getI18n } from "@/lib/i18n/server";
import { calendarSummaryRows, seasonSummaryRows, type SummaryRow } from "@/lib/archive-summary";
import { sources } from "@/lib/data";
import type { CalendarYear } from "@/lib/published-data";
import { seasons, type SeasonRecord } from "@/lib/seasons";
import styles from "./archive-summary.module.css";

export async function SummaryTable({ title, rows, variant }: { title: string; rows: SummaryRow[]; variant?: "panel" }) {
  const { t, numberLocale } = await getI18n();
  const isPanel = variant === "panel";
  return <table className={`${styles.table}${isPanel ? ` ${styles.seasonTable}` : ""}`} dir="ltr">
    <caption className={isPanel ? "sr-only" : undefined} dir="auto">{title}</caption>
    <colgroup><col className={styles.playerColumn}/><col className={styles.labelColumn}/><col className={styles.playerColumn}/></colgroup>
    <thead><tr>
      <th scope="col">{isPanel ? <span className={styles.playerHeading} dir="auto"><span>{t("Lionel")}</span><strong>{t("Messi")}</strong></span> : t("Messi")}</th>
      <th scope="col"><span className={isPanel ? styles.columnLabel : "sr-only"}>{t("Statistic")}</span></th>
      <th scope="col">{isPanel ? <span className={styles.playerHeading} dir="auto"><span>{t("Cristiano")}</span><strong>{t("Ronaldo")}</strong></span> : t("Ronaldo")}</th>
    </tr></thead>
    <tbody>{rows.map((row, index) => {
      const { messi, ronaldo } = row.values;
      const comparable = messi !== null && ronaldo !== null;
      const leader = !comparable || messi === ronaldo ? null : (row.lowerIsBetter ? messi < ronaldo : messi > ronaldo) ? "messi" : "ronaldo";
      const total = comparable ? messi + ronaldo : 0;
      const share = comparable && total > 0 ? messi / total * 100 : null;
      const format = (value: number | null) => value === null ? "—" : value.toLocaleString(numberLocale, { minimumFractionDigits: row.decimals ?? 0, maximumFractionDigits: row.decimals ?? 0 });
      return <tr key={row.label} data-rate-start={isPanel && row.decimals !== undefined && rows[index - 1]?.decimals === undefined}>
        <td className={styles.value} data-player="messi" data-leading={leader === "messi"}>{format(messi)}</td>
        <th scope="row" className={styles.metric} dir="auto">
          <span>{t(row.label)}</span>
          <span className={styles.balance} aria-hidden="true">{share !== null && <><span className={styles.messiShare} style={{ width: `${share}%` }}/><span className={styles.ronaldoShare} style={{ width: `${100 - share}%` }}/></>}</span>
        </th>
        <td className={styles.value} data-player="ronaldo" data-leading={leader === "ronaldo"}>{format(ronaldo)}</td>
      </tr>;
    })}</tbody>
  </table>;
}

async function ArchiveNavigation({ items, current, panel = false }: { items: { slug: string; label: string }[]; current: string; panel?: boolean }) {
  const { t } = await getI18n();
  const index = items.findIndex(item => item.slug === current);
  const previous = items[index - 1];
  const next = items[index + 1];
  return <nav className={`${styles.navigation}${panel ? ` ${styles.seasonNavigation}` : ""}`} aria-label={t("Explore nearby periods")}>
    {previous && <Link href={`/seasons/${previous.slug}`} rel="prev">{t("Previous: {0}", { 0: previous.label })}</Link>}
    <Link href="/seasons">{t("All years & seasons")}</Link>
    {next && <Link href={`/seasons/${next.slug}`} rel="next">{t("Next: {0}", { 0: next.label })}</Link>}
  </nav>;
}

export async function CalendarSummary({ year, years, snapshotLabel, hasUpdates, inProgress }: { year: CalendarYear; years: CalendarYear[]; snapshotLabel: string; hasUpdates: boolean; inProgress: boolean }) {
  const { t, numberLocale } = await getI18n();
  const fmt = (value: number) => value.toLocaleString(numberLocale);
  return <section className={styles.clubSummary} aria-labelledby="archive-summary-title" data-archive-summary data-calendar-summary>
    <header className={styles.seasonHeading}>
      <div>
        <span className={styles.seasonPeriod}>{year.year}</span>
        <h2 id="archive-summary-title">{t("Calendar-year statistics")}</h2>
      </div>
      <div className={styles.seasonMeta}>
        {inProgress && <span className={styles.seasonStatus}>{t("In progress")}</span>}
        <span className={styles.leaderKey}><span aria-hidden="true"><i/><i/></span>{t("Leads this stat")}</span>
      </div>
    </header>
    <p className={styles.calendarIntro}>{t("In {0}, Messi recorded {1} goals and {2} assists in {3} appearances; Ronaldo recorded {4} goals and {5} assists in {6} appearances.", { 0: year.year, 1: fmt(year.career.goals.messi), 2: fmt(year.career.assists.messi), 3: fmt(year.career.appearances.messi), 4: fmt(year.career.goals.ronaldo), 5: fmt(year.career.assists.ronaldo), 6: fmt(year.career.appearances.ronaldo) })}</p>
    <div className={styles.calendarGrid}>{(["career", "club", "international", "league"] as const).map((scope, index) => {
      const label = t(["Club + country", "Club", "Country", "League"][index]);
      return <section key={scope} className={styles.scopePanel} aria-labelledby={`calendar-summary-${scope}`}>
        <h3 id={`calendar-summary-${scope}`}>{label}</h3>
        <SummaryTable title={`${year.year} · ${label}`} rows={calendarSummaryRows(year[scope])} variant="panel" />
      </section>;
    })}</div>
    <div className={styles.seasonNotes}>
      <div className={styles.sourceLine}>
        <span>{t("Source")}: <Link href={year.source}>{t("{0} calendar-year source", { 0: year.year })}</Link></span>
        <span>{t("Data updated {0}", { 0: t(snapshotLabel) })}.</span>
      </div>
      {hasUpdates && <p><Link href="/updates">{t("Published match updates")}</Link></p>}
      <details>
        <summary>{t("Source & definition")}</summary>
        <p>{t("League figures are part of club totals. Add club and country to obtain the overall total; do not add league figures again.")}</p>
        <p>{t("— = no playing minutes for a rate")} · <Link href="/glossary">{t("Football statistics glossary")}</Link></p>
      </details>
    </div>
    <dl className={`${styles.questions} ${styles.calendarQuestions}`} data-year-answers>
      {(["goals", "assists"] as const).map(metric => {
        const values = year.career[metric];
        const leader = values.messi > values.ronaldo ? "Messi" : "Ronaldo";
        const answer = values.messi === values.ronaldo
          ? t(metric === "goals" ? "Both players scored {0} goals in {1}." : "Both players provided {0} assists in {1}.", { 0: fmt(values.messi), 1: year.year })
          : t(metric === "goals" ? "{0} scored more goals in {1}: {2} compared with {3}." : "{0} provided more assists in {1}: {2} compared with {3}.", { 0: t(leader), 1: year.year, 2: fmt(Math.max(values.messi, values.ronaldo)), 3: fmt(Math.min(values.messi, values.ronaldo)) });
        return <div key={metric}>
          <dt>{t(metric === "goals" ? "Who scored more goals in {0}?" : "Who provided more assists in {0}?", { 0: year.year })}</dt>
          <dd>{answer} {t("Club + country")}. <a href={`#scope=career&metric=${metric}&per90=0`}>{t(metric === "goals" ? "Compare goals" : "Compare assists")}</a></dd>
        </div>;
      })}
    </dl>
    <ArchiveNavigation items={years.map(item => ({ slug: String(item.year), label: String(item.year) }))} current={String(year.year)} panel />
  </section>;
}

export async function SeasonSummary({ season }: { season: SeasonRecord }) {
  const { t } = await getI18n();
  return <section className={`${styles.summary} panel`} aria-labelledby="archive-summary-title" data-archive-summary>
    <h2 id="archive-summary-title">{t("{0}: both competitions at a glance", { 0: season.label })}</h2>
    <div className={styles.grid}>
      <SummaryTable title={`${season.label} · ${t("La Liga")}`} rows={seasonSummaryRows(season.league)} />
      <SummaryTable title={`${season.label} · ${t("Champions League")}`} rows={seasonSummaryRows(season.ucl)} />
    </div>
    <p>{t("League and Champions League figures are kept separate.")} {t("Domestic cups, national-team games and other competitions are excluded. Champions League figures exclude qualifying rounds.")}</p>
    <p>{t("Source: the Turkish Football Federation’s July 2020 TamSaha comparison table.")} <a href={sources.liga.url}>{t("Read the publication")}</a></p>
    <ArchiveNavigation items={seasons.map(item => ({ slug: item.slug, label: item.label }))} current={season.slug} />
  </section>;
}
