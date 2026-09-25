import { StatImageButton } from "@/components/admin-stat-export";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedData } from "@/lib/server-data";
import { players, sources } from "@/lib/data";
export async function CurrentHighlights() {
    const { t } = await getI18n();
    const { scopes, snapshotLabel } = await getPublishedData();
    const highlights = [
        { href: "/2026", title: "2026 goals", values: scopes["2026"].goals, detail: "Club & country this calendar year" },
        { href: "/clubs", title: "Current club goals", values: scopes["current-clubs"].goals, detail: "Inter Miami / Al Nassr" },
        { href: "/records", title: "Goals to reach 1,000", values: { messi: Math.max(0, 1000 - scopes.career.goals.messi), ronaldo: Math.max(0, 1000 - scopes.career.goals.ronaldo) }, detail: `Career totals through ${snapshotLabel}` },
    ];
    return <section className="current-strip" aria-label={t("2026 highlights")}>{highlights.map(item => <article className="current-tile" key={item.href}><Link href={item.href}><span className="current-title">{t(item.title)}<ArrowUpRight size={15}/></span><strong><span className="messi-text"><small>{t("Messi")}</small>{t(item.values.messi)}</span><span className="ronaldo-text"><small>{t("Ronaldo")}</small>{t(item.values.ronaldo)}</span></strong><p>{t(item.detail)}</p></Link><StatImageButton stat={{ title: item.title, context: item.detail, values: item.values, lowerIsBetter: item.href === "/records" }}/></article>)}</section>;
}
export async function ClubBreakdown({ only }: {
    only?: "messi" | "ronaldo";
}) {
    const { t, numberLocale } = await getI18n();
    const { clubs, snapshotLabel } = await getPublishedData();
    return <section aria-label={t("Club-by-club statistics")}><div className="section-title-row"><div><span className="section-kicker">{t("CLUB RECORDS")}</span><h2>{t("Club by club")}<span className="heading-dot">.</span></h2></div></div><div className="club-columns">{(["messi", "ronaldo"] as const).filter(p => !only || p === only).map(player => <div className="club-column" key={player}><h2 className={`${player}-text`}>{t(players[player].name)}</h2>{clubs.filter(c => c.player === player).toReversed().map(club => <article className="panel club-card" key={club.id}><span className="section-kicker">{t(club.period)}</span><StatImageButton player={player} stats={[...["goals", "assists", "appearances", "minutes", "hatTricks"].map(field => ({ title: field === "hatTricks" ? "Hat-tricks" : field === "minutes" ? "Minutes played" : field[0].toUpperCase() + field.slice(1), context: `${club.name} · ${club.period}`, values: { messi: null, ronaldo: null, [player]: club[field as "goals" | "assists" | "appearances" | "minutes" | "hatTricks"] }, note: "Competitive first-team matches" })), { title: "Goals per 90 minutes", context: `${club.name} · ${club.period}`, values: { messi: null, ronaldo: null, [player]: club.minutes ? club.goals * 90 / club.minutes : null }, decimals: 2, note: "Competitive first-team matches" }]} /><h3>{t(club.name)}</h3><div className="club-stat-grid"><div><strong className={`${player}-text`}>{t(club.goals)}</strong><span>{t("GOALS")}</span></div><div><strong>{t(club.assists)}</strong><span>{t("ASSISTS")}</span></div><div><strong>{t(club.appearances)}</strong><span>{t("APPEARANCES")}</span></div></div><p>{t("{0} minutes \u00B7 {1} goals per 90 \u00B7 {2} hat-tricks", { "0": t(club.minutes.toLocaleString(numberLocale)), "1": t((club.goals * 90 / club.minutes).toFixed(2)), "2": t(club.hatTricks) })}</p><a href={club.source} target="_blank" rel="noreferrer">{t("Club record & counting rules ")}<ArrowUpRight size={12}/></a></article>)}</div>)}</div><p className="freshness-note">{t("Competitive first-team matches through {0}. Manchester United combines both spells. Ronaldo\u2019s Real Madrid total uses the standard 450-goal convention; the club\u2019s own 451 count assigns a disputed goal differently.", { "0": t(snapshotLabel) })}</p></section>;
}
export const trophyRows = [
    { label: "Champions League", messi: 4, ronaldo: 5, note: "Messi: 2006, 2009, 2011, 2015. Ronaldo: 2008, 2014, 2016, 2017, 2018." },
    { label: "Domestic league titles", messi: 12, ronaldo: 8, note: "Messi: 10 La Liga + 2 Ligue 1. Ronaldo: 3 Premier League + 2 La Liga + 2 Serie A + 1 Saudi Pro League (2025/26)." },
    { label: "Domestic cups", messi: 7, ronaldo: 6, note: "Messi: 7 Copa del Rey. Ronaldo: 1 FA Cup, 2 League Cups, 2 Copa del Rey, 1 Coppa Italia." },
    { label: "Domestic super cups", messi: 9, ronaldo: 7, note: "Includes Messi's 2005 Spanish Super Cup and Ronaldo's 2002 Portuguese / 2008 English super cups without a match appearance." },
    { label: "UEFA Super Cup", messi: 3, ronaldo: 3, note: "Ronaldo's 2016 title is included although he did not feature in the squad." },
    { label: "FIFA Club World Cup", messi: 3, ronaldo: 4, note: "Titles in the tournament's earlier format." },
    { label: "MLS Supporters’ Shield", messi: 1, ronaldo: 0, note: "2024 regular-season points title. Separate from the MLS Cup championship." },
    { label: "MLS Cup", messi: 1, ronaldo: 0, note: "2025 playoff championship." },
    { label: "Leagues Cup / Arab Club Champions Cup", messi: 1, ronaldo: 1, note: "Both in 2023, in different competitions." },
    { label: "Campeones Cup", messi: 1, ronaldo: 0, note: "Inter Miami, September 2026." },
    { label: "World Cup", messi: 1, ronaldo: 0, note: "Argentina, 2022." },
    { label: "Copa América / European Championship", messi: 2, ronaldo: 1, note: "Argentina: 2021, 2024. Portugal: 2016. Different tournaments." },
    { label: "Finalissima / UEFA Nations League", messi: 1, ronaldo: 2, note: "Messi: 2022 Finalissima. Ronaldo: 2019, 2025 Nations League. Different competitions." },
    { label: "Conference championship", messi: 1, ronaldo: 0, note: "2025 MLS Eastern Conference. A stage on the way to the MLS Cup; listed separately to make the overlap clear." },
    { label: "Youth & Olympic titles", messi: 2, ronaldo: 0, note: "2005 U20 World Cup and 2008 Olympic gold. Not senior national-team titles." },
];
export const teamTrophyTotals = trophyRows.reduce((totals, row) => ({
    messi: totals.messi + row.messi,
    ronaldo: totals.ronaldo + row.ronaldo,
}), { messi: 0, ronaldo: 0 });
export async function TeamHonours() {
    const { t } = await getI18n();
    return <section className="panel"><div className="panel-heading"><div><span className="section-kicker">{t("TEAM HONOURS \u00B7 THROUGH SEPTEMBER 2026")}</span><h2>{t("The trophy cabinet")}<span className="heading-dot">.</span></h2></div></div><div className="year-table-wrap" role="region" aria-label={t("Scrollable team honours")} tabIndex={0}><table className="year-table trophy-table"><caption className="sr-only">{t("Team honours by category, including participation and counting notes.")}</caption><thead><tr><th scope="col">{t("TITLE & CONTEXT")}</th><th scope="col">{t("MESSI")}</th><th scope="col">{t("RONALDO")}</th></tr></thead><tbody>{trophyRows.map(row => <tr key={row.label}><th scope="row">{t(row.label)}<small>{t(row.note)}</small><StatImageButton stat={{ title: row.label, context: "Team honours · Through September 2026", values: { messi: row.messi, ronaldo: row.ronaldo }, date: "2026-09-21", note: row.note }}/></th><td className="messi-text">{t(row.messi)}</td><td className="ronaldo-text">{t(row.ronaldo)}</td></tr>)}</tbody><tfoot><tr><th scope="row">{t("Overall trophies")}<StatImageButton stat={{ title: "Overall trophies", context: "Club & country · Team honours", values: teamTrophyTotals, date: "2026-09-21", note: "Includes youth/Olympic titles and MLS conference championship. Individual awards excluded." }}/></th><td className="messi-text">{t(teamTrophyTotals.messi)}</td><td className="ronaldo-text">{t(teamTrophyTotals.ronaldo)}</td></tr></tfoot></table></div><div className="stats-footnote"><span>{t("Overall totals include every team honour listed, including youth/Olympic titles and the MLS conference championship. Individual awards are separate.")}</span><a href={sources.trophies.url} target="_blank" rel="noreferrer">{t("Trophy register ")}<ArrowUpRight size={14}/></a></div></section>;
}
