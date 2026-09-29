import Link from "./localized-link";
import { getI18n } from "@/lib/i18n/server";
import { clubSeasons, clubSeasonTitle } from "@/lib/club-seasons";
import styles from "./archive-summary.module.css";

export async function ClubSeasonNavigation({ selected }: { selected?: string }) {
  const { t } = await getI18n();
  return <nav className={`${styles.years} panel`} aria-label={t("Choose a club season")} data-club-seasons>
    <span className="section-kicker">{t("Choose a club season")}</span>
    <ol>{[...clubSeasons].reverse().map(season => <li key={season.slug}>
      <Link href={`/club-stats/${season.slug}`} prefetch={false} aria-current={selected === season.slug ? "page" : undefined} aria-label={t(clubSeasonTitle(season))}>{season.label}{season.inProgress && <span className="sr-only"> · {t("In progress")}</span>}</Link>
    </li>)}</ol>
  </nav>;
}
