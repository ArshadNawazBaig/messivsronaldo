import { PageContext } from "@/components/page-context";
import { RelatedReading } from "@/components/related-reading";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { CalendarExplorer } from "@/components/calendar-explorer";
import { CalendarYearNavigation } from "@/components/calendar-year-navigation";
import { ClubSeasonNavigation } from "@/components/club-season-navigation";
import { getPublishedData } from "@/lib/server-data";
import { seasons } from "@/lib/seasons";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("Messi vs Ronaldo by Year: 2002–2026 Goals & Assists", "Compare every calendar year through 2026: goals, assists, minutes, appearances and per-90 rates for club, country and league football.", "/seasons"); }
export default async function SeasonsPage() {
    const { t } = await getI18n();
    const { calendarYears } = await getPublishedData();
    return <div className="page-container inner-page">
        <PageContext path="/seasons" title={t("Messi vs Ronaldo by Year: 2002–2026 Goals & Assists")} kind="CollectionPage" players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/seasons", name: t("Years & seasons") }]} />
        <div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("2002\u20132026 \u00B7 THE COMPLETE TIMELINE")}</span><h1>{t("Messi vs Ronaldo by Year: 2002–2026 Goals & Assists")}</h1><p>{t("From the first appearances to 2026. Explore goals, assists and scoring rates across 25 calendar years.")}</p></div></div>
        <CalendarYearNavigation years={calendarYears} />
        <div className="archive-link"><Link href="/club-stats">{t("All club seasons")}</Link></div>
        <CalendarExplorer />
        <ClubSeasonNavigation />
        <section className="prose panel"><h2>{t("Explore their shared Spanish seasons")}</h2><p>{t("The calendar-year explorer above includes every year through 2026. This separate archive compares the nine full club seasons in which both played in Spain.")}</p><div className="archive-link">{seasons.map(s => <Link href={`/seasons/${s.slug}`} key={s.slug}>{t(s.label)}</Link>)}</div></section>
        <RelatedReading path="/seasons" />
    </div>;
}
