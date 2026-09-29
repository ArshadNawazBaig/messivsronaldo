import { notFound } from "next/navigation";
import { SummaryTable } from "@/components/archive-summary";
import { ClubSeasonNavigation } from "@/components/club-season-navigation";
import Link from "@/components/localized-link";
import { PageContext } from "@/components/page-context";
import { PlayerMatchup } from "@/components/player-matchup";
import { clubSeasons, clubSeasonsReviewed, clubSeasonTitle, clubSeasonDescription, clubSeasonRows } from "@/lib/club-seasons";
import { getI18n } from "@/lib/i18n/server";
import { translatedDate } from "@/lib/i18n/date-format";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/archive-summary.module.css";

type Props = { params: Promise<{ season: string }> };
export function generateStaticParams() { return clubSeasons.map(({ slug }) => ({ season: slug })); }

export async function generateMetadata({ params }: Props) {
  const { season: slug } = await params;
  const season = clubSeasons.find(item => item.slug === slug);
  if (!season) return {};
  const { t, locale } = await getI18n();
  const cutoff = t("In progress; source reviewed {0}.", { 0: translatedDate(clubSeasonsReviewed, locale)! });
  return pageMetadata(clubSeasonTitle(season), `${t(clubSeasonDescription(season))}${season.inProgress ? ` ${cutoff}` : ""}`, `/club-stats/${slug}`);
}

export default async function ClubSeasonPage({ params }: Props) {
  const { season: slug } = await params;
  const season = clubSeasons.find(item => item.slug === slug);
  if (!season) notFound();
  const { t, locale, numberLocale } = await getI18n();
  const title = t(clubSeasonTitle(season));
  const reviewed = translatedDate(clubSeasonsReviewed, locale)!;
  const description = `${t(clubSeasonDescription(season))}${season.inProgress ? ` ${t("In progress; source reviewed {0}.", { 0: reviewed })}` : ""}`;
  const index = clubSeasons.indexOf(season);
  const previous = clubSeasons[index - 1];
  const next = clubSeasons[index + 1];
  const startYear = Number(slug.slice(0, 4));
  const historicalSlug = `${startYear}-${String(startYear + 1).slice(2)}`;
  const fmt = (value: number) => value.toLocaleString(numberLocale);
  return <div className="page-container inner-page">
    <PageContext path={`/club-stats/${slug}`} title={title} description={description} players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/club-stats", name: t("Club seasons") }, { path: `/club-stats/${slug}`, name: season.label }]} />
    <div className="page-intro inner-intro"><div>
      <span className="eyebrow">{t("CLUB SEASON IN FOCUS")}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {season.alignedPeriod && <p>{t("Messi’s club figures cover the same period as Ronaldo’s season. This is not a complete MLS calendar season.")}</p>}
    </div></div>
    <PlayerMatchup values={season.stats.goals} label={t("Goals")} accessibleLabel={t("goals")} context={`${season.label} · ${t("All club competitions")}`} details={{
      messi: t("{0} appearances · {1} minutes", { 0: fmt(season.stats.appearances.messi), 1: fmt(season.stats.minutes.messi) }),
      ronaldo: t("{0} appearances · {1} minutes", { 0: fmt(season.stats.appearances.ronaldo), 1: fmt(season.stats.minutes.ronaldo) }),
    }} exportData={{ title: "Club season goals", context: `${season.label} · All club competitions`, note: `Source reviewed ${clubSeasonsReviewed}${season.inProgress ? " · Incomplete season" : ""}${season.alignedPeriod ? " · Messi in the same period as Ronaldo's season" : ""}` }} />
    <section className={`${styles.summary} panel`} aria-labelledby="club-season-summary" data-club-season-summary>
      <h2 id="club-season-summary">{t("{0}: the complete statistical summary", { 0: season.label })}</h2>
      <SummaryTable title={`${season.label} · ${t("All club competitions")}`} rows={clubSeasonRows(season)} />
      <p>{t("Club competitions only. National-team matches and club friendlies are excluded.")}</p>
      <p>{t("These figures describe one club season, not the sum of two calendar years. Assists follow the linked source’s definitions. A dash means the rate has no valid denominator.")}</p>
      <p>{t("Source")}: <a href={season.source}>{t("{0} club-season source", { 0: season.label })}</a>. {t("Source reviewed {0}.", { 0: reviewed })} {season.inProgress && t("This season is incomplete. Figures are a reviewed snapshot and do not update automatically.")}</p>
      <nav className={styles.navigation} aria-label={t("Explore nearby periods")}>
        {previous && <Link href={`/club-stats/${previous.slug}`} rel="prev">{t("Previous: {0}", { 0: previous.label })}</Link>}
        <Link href="/club-stats">{t("All club seasons")}</Link>
        {next && <Link href={`/club-stats/${next.slug}`} rel="next">{t("Next: {0}", { 0: next.label })}</Link>}
      </nav>
    </section>
    <ClubSeasonNavigation selected={slug} />
    <section className="prose panel"><h2>{t("Calendar years & competition breakdowns")}</h2>
      <p>{t("Calendar years run from January to December. Explore either year separately for club and country totals.")}</p>
      <div className="archive-link">
        <Link href={`/seasons/${startYear}`}>{startYear}</Link>
        {startYear < 2026 && <Link href={`/seasons/${startYear + 1}`}>{startYear + 1}</Link>}
        {startYear >= 2009 && startYear <= 2017 && <Link href={`/seasons/${historicalSlug}`}>{t("La Liga & Champions League")}</Link>}
        <Link href="/methodology">{t("Sources & methodology")}</Link>
      </div>
    </section>
  </div>;
}
