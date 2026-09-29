import Link from "./localized-link";
import { getI18n } from "@/lib/i18n/server";
import { calendarYearTitle } from "@/lib/archive-summary";
import styles from "./archive-summary.module.css";

export async function CalendarYearNavigation({ years, selected }: { years: readonly { year: number }[]; selected?: number }) {
  const { t } = await getI18n();
  return <nav className={`${styles.years} panel`} aria-label={t("Choose a calendar year")} data-calendar-years>
    <span className="section-kicker">{t("Choose a calendar year")}</span>
    <ol>{[...years].sort((a, b) => b.year - a.year).map(({ year }) => <li key={year}>
      <Link href={`/seasons/${year}`} prefetch={false} aria-current={selected === year ? "page" : undefined} aria-label={t(calendarYearTitle(year))}>{year}</Link>
    </li>)}</ol>
  </nav>;
}
