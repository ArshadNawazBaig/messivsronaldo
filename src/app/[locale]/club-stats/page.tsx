import { ClubSeasonNavigation } from "@/components/club-season-navigation";
import Link from "@/components/localized-link";
import { PageContext } from "@/components/page-context";
import { clubSeasons, clubSeasonsReviewed } from "@/lib/club-seasons";
import { getI18n } from "@/lib/i18n/server";
import { translatedDate } from "@/lib/i18n/date-format";
import { pageMetadata } from "@/lib/site";

const title = "Messi vs Ronaldo: Club Season Goals & Stats";
const description = "Compare Messi and Ronaldo by club season, from 2002/2003 to 2026/2027: goals, assists, appearances, minutes and scoring rates.";
export async function generateMetadata() { return pageMetadata(title, description, "/club-stats"); }

export default async function ClubSeasonsPage() {
  const { t, locale } = await getI18n();
  return <div className="page-container inner-page">
    <PageContext path="/club-stats" title={t(title)} description={t(description)} kind="CollectionPage" players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/club-stats", name: t("Club seasons") }]} />
    <div className="page-intro inner-intro"><div><span className="eyebrow">{t("CLUB SEASON IN FOCUS")}</span><h1>{t(title)}</h1><p>{t(description)}</p></div></div>
    <ClubSeasonNavigation />
    <section className="panel"><div className="panel-heading"><h2>{t("Club season goals")}</h2></div>
      <div className="year-table-wrap"><table className="year-table calendar-table" data-club-season-index>
        <caption className="sr-only">{t("Club season goals")}</caption>
        <thead><tr><th scope="col">{t("Season")}</th><th scope="col">{t("Messi")}</th><th scope="col">{t("Ronaldo")}</th></tr></thead>
        <tbody>{[...clubSeasons].reverse().map(season => <tr key={season.slug}>
          <th scope="row"><Link href={`/club-stats/${season.slug}`} prefetch={false}>{season.label}</Link>{season.inProgress && <small>{t("In progress")}</small>}</th>
          <td className="messi-text">{season.stats.goals.messi}</td><td className="ronaldo-text">{season.stats.goals.ronaldo}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="prose panel"><h2>{t("Same dates. Clear boundaries.")}</h2>
      <p>{t("Club competitions only. National-team matches and club friendlies are excluded.")}</p>
      <p>{t("From 2023/2024, Messi’s figures use the same period as Ronaldo’s club season, rather than a full MLS calendar season.")}</p>
      <p>{t("Source reviewed {0}.", { 0: translatedDate(clubSeasonsReviewed, locale)! })} 2026/2027: {t("This season is incomplete. Figures are a reviewed snapshot and do not update automatically.")}</p>
      <Link href="/seasons">{t("All years & seasons")}</Link>
    </section>
  </div>;
}
