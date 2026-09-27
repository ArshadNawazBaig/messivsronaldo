import Link from "./localized-link";
import { getI18n } from "@/lib/i18n/server";
import { calendarSummaryRows, seasonSummaryRows, type SummaryRow } from "@/lib/archive-summary";
import { sources } from "@/lib/data";
import type { CalendarYear } from "@/lib/published-data";
import { seasons, type SeasonRecord } from "@/lib/seasons";
import styles from "./archive-summary.module.css";

async function SummaryTable({ title, rows }: { title: string; rows: SummaryRow[] }) {
  const { t, numberLocale } = await getI18n();
  return <table className={styles.table}>
    <caption>{title}</caption>
    <thead><tr><th scope="col">{t("Statistic")}</th><th scope="col">{t("Messi")}</th><th scope="col">{t("Ronaldo")}</th></tr></thead>
    <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{t(row.label)}</th>{(["messi", "ronaldo"] as const).map(player => <td key={player} className={`${player}-text`}>{row.values[player] === null ? "—" : row.values[player].toLocaleString(numberLocale, { minimumFractionDigits: row.decimals ?? 0, maximumFractionDigits: row.decimals ?? 0 })}</td>)}</tr>)}</tbody>
  </table>;
}

async function ArchiveNavigation({ items, current }: { items: { slug: string; label: string }[]; current: string }) {
  const { t } = await getI18n();
  const index = items.findIndex(item => item.slug === current);
  const previous = items[index - 1];
  const next = items[index + 1];
  return <nav className={styles.navigation} aria-label={t("Explore nearby periods")}>
    {previous && <Link href={`/seasons/${previous.slug}`} rel="prev">{t("Previous: {0}", { 0: previous.label })}</Link>}
    <Link href="/seasons">{t("All years & seasons")}</Link>
    {next && <Link href={`/seasons/${next.slug}`} rel="next">{t("Next: {0}", { 0: next.label })}</Link>}
  </nav>;
}

export async function CalendarSummary({ year, years, snapshotLabel, hasUpdates }: { year: CalendarYear; years: CalendarYear[]; snapshotLabel: string; hasUpdates: boolean }) {
  const { t, numberLocale } = await getI18n();
  const fmt = (value: number) => value.toLocaleString(numberLocale);
  return <section className={`${styles.summary} panel`} aria-labelledby="archive-summary-title" data-archive-summary>
    <h2 id="archive-summary-title">{t("{0}: the complete statistical summary", { 0: year.year })}</h2>
    <p>{t("In {0}, Messi recorded {1} goals and {2} assists in {3} appearances; Ronaldo recorded {4} goals and {5} assists in {6} appearances.", { 0: year.year, 1: fmt(year.career.goals.messi), 2: fmt(year.career.assists.messi), 3: fmt(year.career.appearances.messi), 4: fmt(year.career.goals.ronaldo), 5: fmt(year.career.assists.ronaldo), 6: fmt(year.career.appearances.ronaldo) })}</p>
    <div className={styles.grid}>{(["career", "club", "international", "league"] as const).map((scope, index) => <SummaryTable key={scope} title={`${year.year} · ${t(["Club + country", "Club", "Country", "League"][index])}`} rows={calendarSummaryRows(year[scope])} />)}</div>
    <p>{t("League figures are part of club totals. Add club and country to obtain the overall total; do not add league figures again.")}</p>
    <p>{t("— = no playing minutes for a rate")} · <Link href="/glossary">{t("Football statistics glossary")}</Link></p>
    <p>{t("Source")}: <Link href={year.source}>{t("{0} calendar-year source", { 0: year.year })}</Link>. {t("Data updated {0}", { 0: t(snapshotLabel) })}.{hasUpdates && <> <Link href="/updates">{t("Published match updates")}</Link>.</>}</p>
    <ArchiveNavigation items={years.map(item => ({ slug: String(item.year), label: String(item.year) }))} current={String(year.year)} />
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
