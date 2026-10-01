import { CalendarSummary, SeasonSummary } from "@/components/archive-summary";
import { PageContext } from "@/components/page-context";
import { RelatedReading } from "@/components/related-reading";
import { getI18n } from "@/lib/i18n/server";
import { notFound } from "next/navigation";
import { SeasonExplorer } from "@/components/season-explorer";
import { CalendarExplorer } from "@/components/calendar-explorer";
import { CalendarYearNavigation } from "@/components/calendar-year-navigation";
import { calendarYearDescription, calendarYearTitle } from "@/lib/archive-summary";
import { calendarYears } from "@/lib/data";
import { getPublishedData } from "@/lib/server-data";
import { seasons } from "@/lib/seasons";
import { pageMetadata } from "@/lib/site";
import Link from "@/components/localized-link";
export function generateStaticParams() { return [...seasons.map(s => ({ season: s.slug })), ...calendarYears.map(y => ({ season: String(y.year) }))]; }
export async function generateMetadata({ params }: {
    params: Promise<{
        season: string;
    }>;
}) {
    const { t } = await getI18n();
    const { calendarYears, snapshotDate, snapshotLabel } = await getPublishedData();
    const { season } = await params;
    const year = calendarYears.find(y => String(y.year) === season);
    if (year) {
        const { comparison, coverage } = calendarYearDescription(year, snapshotDate, snapshotLabel);
        return pageMetadata(calendarYearTitle(year.year), `${t(comparison)} ${t(coverage)}`, `/seasons/${season}`);
    }
    const item = seasons.find(s => s.slug === season);
    return item ? pageMetadata(`Messi vs Ronaldo ${item.label}: Goals & Scoring Rates`, `In La Liga ${item.label}, Messi scored ${item.league.messi.goals} goals and Ronaldo scored ${item.league.ronaldo.goals}. Compare league and Champions League figures with sources.`, `/seasons/${season}`) : {};
}
export default async function SeasonPage({ params }: {
    params: Promise<{
        season: string;
    }>;
}) {
    const { t } = await getI18n();
    const { calendarYears, snapshotLabel, snapshotDate, coverageNote } = await getPublishedData();
    const { season } = await params;
    const year = calendarYears.find(y => String(y.year) === season);
    if (year) {
        const { comparison, coverage } = calendarYearDescription(year, snapshotDate, snapshotLabel);
        const title = t(calendarYearTitle(year.year));
        return <div className="page-container inner-page">
            <PageContext path={`/seasons/${season}`} title={title} description={`${t(comparison)} ${t(coverage)}`} players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/seasons", name: t("Years & seasons") }, { path: `/seasons/${season}`, name: String(year.year) }]} />
            <div className="page-intro inner-intro"><div>
                <span className="eyebrow">{t("CALENDAR YEAR IN FOCUS")}</span>
                <h1>{title}</h1>
                <p>{t(comparison)} {t(year.year === Number(snapshotDate.slice(0, 4)) ? `Year to date through ${snapshotLabel}.` : "A full January-to-December comparison.")}</p>
            </div></div>
            <CalendarExplorer selected={season}/>
            <CalendarSummary year={year} years={calendarYears} hasUpdates={Boolean(coverageNote)} inProgress={year.year === Number(snapshotDate.slice(0, 4))} />
            <CalendarYearNavigation years={calendarYears} selected={year.year} />
            <RelatedReading path={`/seasons/${season}`} />
        </div>;
    }
    const item = seasons.find(s => s.slug === season);
    if (!item)
        notFound();
    const fullSeason = `${season.slice(0, 4)}-${Number(season.slice(0, 4)) + 1}`;
    return <div className="page-container inner-page"><PageContext path={`/seasons/${season}`} title={t(`Messi vs Ronaldo ${item.label}: Goals & Scoring Rates`)} players={["messi", "ronaldo"]} breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/seasons", name: t("Years & seasons") }, { path: `/seasons/${season}`, name: item.label }]} /><div className="page-intro inner-intro"><div><span className="eyebrow">{t("SEASON IN FOCUS")}</span><h1>{t("Messi vs Ronaldo, {0}.", { "0": t(item.label) })}</h1><p>{t("A closer look at their league and Champions League campaigns, with the competition boundaries kept clear.")}</p><div className="archive-link"><Link href={`/club-stats/${fullSeason}`}>{t("All club competitions")}</Link></div></div></div><SeasonExplorer selected={season}/><SeasonSummary season={item} /><RelatedReading path={`/seasons/${season}`} /></div>;
}
