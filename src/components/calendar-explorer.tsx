"use client";
import { useI18n } from "@/components/i18n-provider";
import { useFootballData } from "@/components/data-provider";
import Link from "@/components/localized-link";
import { PlayerMatchup } from "@/components/player-matchup";
import { Select } from "@/components/ui/select";
import { useRouter } from "@/components/localized-link";
import { useEffect, useState } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import { type PlayerId, type Stats } from "@/lib/data";
type YearScope = "career" | "club" | "international" | "league";
type YearMetric = "goals" | "assists" | "contributions" | "appearances" | "minutes";
const scopeNames: Record<YearScope, string> = { career: "Club + country", club: "Club", international: "Country", league: "League" };
const metricNames: Record<YearMetric, string> = { goals: "Goals", assists: "Assists", contributions: "Goals + assists", appearances: "Appearances", minutes: "Minutes played" };
const isScope = (s: string | null): s is YearScope => s !== null && Object.hasOwn(scopeNames, s);
const isMetric = (s: string | null): s is YearMetric => s !== null && Object.hasOwn(metricNames, s);
export function CalendarExplorer({ selected = "all" }: {
    selected?: string;
}) {
    const { t, numberLocale } = useI18n();
    const { calendarYears, snapshotDate, snapshotLabel } = useFootballData();
    const currentYear = Number(snapshotDate.slice(0, 4));
    const router = useRouter();
    const [scope, setScope] = useState<YearScope>("career");
    const [metric, setMetric] = useState<YearMetric>("goals");
    const [rate, setRate] = useState(false);
    useEffect(() => {
        function restore() { const p = new URLSearchParams(window.location.hash.slice(1)); const s = p.get("scope"); const m = p.get("metric"); setScope(isScope(s) ? s : "career"); setMetric(isMetric(m) ? m : "goals"); setRate(p.get("per90") === "1" && m !== "minutes" && m !== "appearances"); }
        restore();
        window.addEventListener("hashchange", restore);
        window.addEventListener("popstate", restore);
        return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
    }, []);
    function hash(s = scope, m = metric, r = rate) { return `#scope=${s}&metric=${m}&per90=${r ? 1 : 0}`; }
    function update(s: YearScope, m: YearMetric, r: boolean) { const safe = r && m !== "minutes" && m !== "appearances"; setScope(s); setMetric(m); setRate(safe); window.history.pushState(null, "", hash(s, m, safe)); }
    const rows = [...calendarYears].reverse().filter(y => selected === "all" || String(y.year) === selected);
    function value(stats: Stats, player: PlayerId) { const raw = metric === "contributions" ? stats.goals[player] + stats.assists[player] : stats[metric][player]; return rate ? (stats.minutes[player] ? raw * 90 / stats.minutes[player] : null) : raw; }
    // Sum raw counts first so all-years rates are weighted by playing time.
    const totals: Stats = { goals: { messi: 0, ronaldo: 0 }, assists: { messi: 0, ronaldo: 0 }, appearances: { messi: 0, ronaldo: 0 }, minutes: { messi: 0, ronaldo: 0 } };
    for (const row of rows) {
        for (const field of ["goals", "assists", "appearances", "minutes"] as const) {
            for (const player of ["messi", "ronaldo"] as const)
                totals[field][player] += row[scope][field][player];
        }
    }
    const yearRange = `${calendarYears[0].year}–${calendarYears.at(-1)!.year}`;
    const period = selected === "all" ? t("All years · {0}", { "0": yearRange }) : selected;
    const fmt = (v: number | null) => v === null ? "—" : v.toLocaleString(numberLocale, { minimumFractionDigits: rate ? 2 : 0, maximumFractionDigits: rate ? 2 : 0 });
    return <section aria-label={t("Calendar year explorer")}><div className="year-controls panel"><div className="scope-tabs" role="group" aria-label={t("Calendar scope")}>{Object.entries(scopeNames).map(([key, label]) => <button key={key} aria-pressed={scope === key} className={scope === key ? "selected" : ""} onClick={() => update(key as YearScope, metric, rate)}>{t(label)}</button>)}</div><div className="select-field"><label htmlFor="calendar-year">{t("Year")}</label><Select id="calendar-year" label={t("Calendar year")} menuLabel={t("Choose a calendar year")} value={selected} icon={CalendarDays} onValueChange={value => router.push(`${value === "all" ? "/seasons" : `/seasons/${value}`}${hash()}`)} options={[{ value: "all", label: `All years · ${yearRange}` }, ...[...calendarYears].reverse().map(y => ({ value: String(y.year), label: String(y.year), badge: y.year === currentYear ? "In progress" : undefined }))]}/></div><div className="select-field"><label htmlFor="calendar-statistic">{t("Statistic")}</label><Select id="calendar-statistic" label={t("Calendar statistic")} menuLabel={t("Choose a statistic")} value={metric} icon={BarChart3} onValueChange={value => update(scope, value as YearMetric, rate)} options={Object.entries(metricNames).map(([value, label]) => ({ value, label }))}/></div><label className="checkbox-label"><input type="checkbox" checked={rate} disabled={metric === "minutes" || metric === "appearances"} onChange={event => update(scope, metric, event.target.checked)}/>{t("Per 90 minutes")}</label></div>
    <div className="calendar-matchup"><PlayerMatchup values={{ messi: value(totals, "messi"), ronaldo: value(totals, "ronaldo") }} label={`${t(metricNames[metric])}${rate ? ` / ${t("90 MIN")}` : ""}`} accessibleLabel={t(`${metricNames[metric].toLowerCase()}${rate ? " per 90 minutes" : ""}`)} context={`${period} · ${t(scopeNames[scope])}`} details={{
            messi: t("{0} appearances · {1} minutes", { "0": totals.appearances.messi.toLocaleString(numberLocale), "1": totals.minutes.messi.toLocaleString(numberLocale) }),
            ronaldo: t("{0} appearances · {1} minutes", { "0": totals.appearances.ronaldo.toLocaleString(numberLocale), "1": totals.minutes.ronaldo.toLocaleString(numberLocale) }),
        }} decimals={rate ? 2 : 0}/></div>
    <div className="panel"><div className="panel-heading"><div><span className="section-kicker">{t("JANUARY TO DECEMBER \u00B7 {0}", { "0": t(snapshotLabel.toUpperCase()) })}</span><h2>{t(selected === "all" ? "Every year. A new chapter." : `${selected}, in focus.`)}</h2></div></div><div className="year-table-wrap"><table className="year-table calendar-table"><caption className="sr-only">{t("Calendar-year {0}{1}, {2}. {3} is incomplete.", { "0": t(metricNames[metric].toLowerCase()), "1": t(rate ? " per 90 minutes" : ""), "2": t(scopeNames[scope].toLowerCase()), "3": t(currentYear) })}</caption><thead><tr><th scope="col">{t("YEAR")}</th><th scope="col">{t("MESSI")}</th><th scope="col">{t("RONALDO")}</th><th scope="col">{t("DIFFERENCE")}</th></tr></thead><tbody>{rows.map(row => { const m = value(row[scope], "messi"); const r = value(row[scope], "ronaldo"); return <tr key={row.year} className={row.year === currentYear ? "current-year" : ""}><th scope="row"><Link href={`/seasons/${row.year}${hash()}`}>{t(row.year)}</Link>{row.year === currentYear && <small>{t("Year to date")}</small>}</th><td className="messi-text">{t(fmt(m))}</td><td className="ronaldo-text">{t(fmt(r))}</td><td>{t(m === null || r === null ? "—" : m === r ? "Level" : `${m > r ? "Messi" : "Ronaldo"} +${fmt(Math.abs(m - r))}`)}</td></tr>; })}</tbody></table></div><div className="year-legend"><span><i className="legend-dot messi-dot"/>{t("Lionel Messi")}</span><span><i className="legend-dot ronaldo-dot"/>{t("Cristiano Ronaldo")}</span><span>{t("\u2014 = no playing minutes for a rate")}</span></div></div>
    <div className="prose panel"><h2>{t("Same dates. Clear boundaries.")}</h2><p>{t("Calendar years run from January to December, so the two players are compared over the same dates even when their club seasons follow different schedules. The {0} figures include published records through {1}; compare them with completed years with that in mind.", { "0": t(currentYear), "1": t(snapshotLabel) })}</p><p>{t("Club + country includes senior competitive club games and recognized senior internationals. The league filter excludes cups and MLS playoffs. All-years totals combine the selected scope across every displayed year. Per-90 rates use the combined statistic multiplied by 90 and divided by the combined minutes. A zero appearance count means no senior appearance in that year; an undefined rate is shown as a dash.")}</p></div></section>;
}
