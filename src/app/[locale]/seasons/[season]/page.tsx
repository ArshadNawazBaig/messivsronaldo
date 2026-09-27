import { PageContext } from "@/components/page-context";
import { RelatedReading } from "@/components/related-reading";
import { getI18n } from "@/lib/i18n/server";
import { notFound } from "next/navigation";
import { SeasonExplorer } from "@/components/season-explorer";
import { CalendarExplorer } from "@/components/calendar-explorer";
import { calendarYears } from "@/lib/data";
import { getPublishedData } from "@/lib/server-data";
import { seasons } from "@/lib/seasons";
import { pageMetadata } from "@/lib/site";
export function generateStaticParams() { return [...seasons.map(s => ({ season: s.slug })), ...calendarYears.map(y => ({ season: String(y.year) }))]; }
export async function generateMetadata({ params }: {
    params: Promise<{
        season: string;
    }>;
}) {
    const { calendarYears } = await getPublishedData();
    const { season } = await params;
    const year = calendarYears.find(y => String(y.year) === season);
    if (year)
        return pageMetadata(`Messi vs Ronaldo ${year.year}: Goals, Assists & Stats`, `${year.year} club and country: Messi ${year.career.goals.messi} goals, Ronaldo ${year.career.goals.ronaldo}. Compare assists, minutes and per-90 rates.`, `/seasons/${season}`);
    const item = seasons.find(s => s.slug === season);
    return item ? pageMetadata(`Messi vs Ronaldo ${item.label}: Goals & Scoring Rates`, `In La Liga ${item.label}, Messi scored ${item.league.messi.goals} goals and Ronaldo scored ${item.league.ronaldo.goals}. Compare league and Champions League figures with sources.`, `/seasons/${season}`) : {};
}
export default async function SeasonPage({ params }: {
    params: Promise<{
        season: string;
    }>;
}) {
    const { t } = await getI18n();
    const { calendarYears, snapshotLabel } = await getPublishedData();
    const { season } = await params;
    const year = calendarYears.find(y => String(y.year) === season);
    if (year)
        return <div className="page-container inner-page"><PageContext path={`/seasons/${season}`} title={t(`Messi vs Ronaldo ${year.year}: Goals, Assists & Stats`)} players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/seasons", name: t("Years & seasons") }, { path: `/seasons/${season}`, name: t(String(year.year)) }]} /><div className="page-intro inner-intro"><div><span className="eyebrow">{t("CALENDAR YEAR IN FOCUS")}</span><h1>{t("Messi vs Ronaldo, {0}.", { "0": t(year.year) })}</h1><p>{t(year.year === 2026 ? `Year to date through ${snapshotLabel}.` : "A full January-to-December comparison.")}{t(" Club, country and league records with their sources.")}</p></div></div><CalendarExplorer selected={season}/><RelatedReading path={`/seasons/${season}`} /></div>;
    const item = seasons.find(s => s.slug === season);
    if (!item)
        notFound();
    return <div className="page-container inner-page"><PageContext path={`/seasons/${season}`} title={t(`Messi vs Ronaldo ${item.label}: Goals & Scoring Rates`)} players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/seasons", name: t("Years & seasons") }, { path: `/seasons/${season}`, name: item.label }]} /><div className="page-intro inner-intro"><div><span className="eyebrow">{t("SEASON IN FOCUS")}</span><h1>{t("Messi vs Ronaldo, {0}.", { "0": t(item.label) })}</h1><p>{t("A closer look at their league and Champions League campaigns, with the competition boundaries kept clear.")}</p></div></div><SeasonExplorer selected={season}/><RelatedReading path={`/seasons/${season}`} /></div>;
}
