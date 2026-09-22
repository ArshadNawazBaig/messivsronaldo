"use client";
import { useI18n } from "@/components/i18n-provider";
import Link from "@/components/localized-link";
import { PlayerMatchup } from "@/components/player-matchup";
import { Select } from "@/components/ui/select";
import { useRouter } from "@/components/localized-link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Info } from "lucide-react";
import { seasons, seasonTotals, type CompetitionId } from "@/lib/seasons";
import { sources } from "@/lib/data";
export function SeasonExplorer({ selected = "all" }: {
    selected?: string;
}) {
    const { t } = useI18n();
    const router = useRouter();
    const [competition, setCompetition] = useState<CompetitionId>("league");
    const [rate, setRate] = useState(false);
    useEffect(() => {
        function restore() { const p = new URLSearchParams(window.location.hash.slice(1)); setCompetition(p.get("competition") === "ucl" ? "ucl" : "league"); setRate(p.get("rate") === "1"); }
        restore();
        window.addEventListener("hashchange", restore);
        window.addEventListener("popstate", restore);
        return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
    }, []);
    function update(nextCompetition: CompetitionId, nextRate: boolean) {
        setCompetition(nextCompetition);
        setRate(nextRate);
        window.history.pushState(null, "", `#competition=${nextCompetition}&rate=${nextRate ? "1" : "0"}`);
    }
    const rows = selected === "all" ? seasons : seasons.filter(s => s.slug === selected);
    const total = seasonTotals(rows, competition);
    const name = competition === "league" ? "La Liga" : "Champions League";
    const max = Math.max(...rows.flatMap(row => (["messi", "ronaldo"] as const).map(p => rate ? row[competition][p].goals / row[competition][p].appearances : row[competition][p].goals)));
    return <section className="season-explorer"><div className="season-controls panel"><div className="scope-tabs" role="group" aria-label={t("Season competition")}><button aria-pressed={competition === "league"} className={competition === "league" ? "selected" : ""} onClick={() => update("league", rate)}>{t("La Liga")}</button><button aria-pressed={competition === "ucl"} className={competition === "ucl" ? "selected" : ""} onClick={() => update("ucl", rate)}>{t("Champions League")}</button></div><div className="season-select"><Select id="season-picker" label={t("Season")} menuLabel={t("Shared Spanish seasons")} value={selected} icon={CalendarDays} onValueChange={value => router.push(`${value === "all" ? "/seasons" : `/seasons/${value}`}#competition=${competition}&rate=${rate ? "1" : "0"}`)} options={[{ value: "all", label: "All years & seasons" }, ...seasons.map(s => ({ value: s.slug, label: s.label }))]}/></div><label className="checkbox-label"><input type="checkbox" checked={rate} onChange={event => update(competition, event.target.checked)}/>{t("Per appearance")}</label></div><div className="calendar-matchup"><PlayerMatchup values={{
            messi: rate ? (total.messi.appearances ? total.messi.goals / total.messi.appearances : null) : total.messi.goals,
            ronaldo: rate ? (total.ronaldo.appearances ? total.ronaldo.goals / total.ronaldo.appearances : null) : total.ronaldo.goals,
        }} label={t(rate ? "GOALS / APPEARANCE" : "TOTAL GOALS")} accessibleLabel={t(rate ? "goals per appearance" : "goals")} context={t(`${selected === "all" ? "2009/10–2017/18" : rows[0].label} · ${t(name)}`)} details={{ messi: t("{0} appearances", { "0": total.messi.appearances }), ronaldo: t("{0} appearances", { "0": total.ronaldo.appearances }) }} decimals={rate ? 2 : 0}/></div><div className="panel season-chart"><div className="panel-heading"><div><span className="section-kicker">{t("THE SAME SEASONS. THE SAME COMPETITION.")}</span><h2>{t(selected === "all" ? "Nine seasons, side by side." : `${rows[0].label}, side by side.`)}</h2></div><div className="chart-legend"><span><i className="legend-dot messi-dot"/>{t("Messi")}</span><span><i className="legend-dot ronaldo-dot"/>{t("Ronaldo")}</span></div></div><div className="season-bar-chart">{rows.map(row => <div className="season-bar-row" key={row.slug}><Link href={`/seasons/${row.slug}#competition=${competition}&rate=${rate ? "1" : "0"}`}>{t(row.label)}</Link><div>{(["messi", "ronaldo"] as const).map(player => {
                const value = rate ? row[competition][player].goals / row[competition][player].appearances : row[competition][player].goals;
                return <div className="season-bar" key={player}><span className={player} style={{ width: `${value / max * 86}%` }}/><strong className={`${player}-text`}>{t(rate ? value.toFixed(2) : value)}<span className="sr-only">{t(player)} {t(rate ? "goals per appearance" : "goals")}</span></strong></div>;
            })}</div></div>)}</div><div className="stats-footnote"><span><Info size={14}/>{t("League and Champions League figures are kept separate.")}</span><a href={sources.liga.url} target="_blank" rel="noreferrer">{t("TFF source table ")}<ArrowUpRight size={13}/></a></div></div><div className="prose panel"><h2>{t("Read the shared era carefully")}</h2><p>{t(selected === "all" ? "From 2009/10 to 2017/18, both players competed in Spain: Messi with Barcelona, Ronaldo with Real Madrid." : `This page compares their ${rows[0].label} season in the selected competition.`)}{t(" In this {0} selection, Messi scored {1} goals in {2} appearances and Ronaldo scored {3} in {4}.", { "0": t(name), "1": t(total.messi.goals), "2": t(total.messi.appearances), "3": t(total.ronaldo.goals), "4": t(total.ronaldo.appearances) })}</p><p>{t("The per-appearance totals divide the combined goals by the combined appearances. They are not an average of rounded season rates. Domestic cups, national-team games and other competitions are excluded. Champions League figures exclude qualifying rounds.")}</p><p>{t("Source: the Turkish Football Federation\u2019s July 2020 TamSaha comparison table. ")}<a href={sources.liga.url} target="_blank" rel="noreferrer">{t("Read the publication ")}<ArrowUpRight size={13}/></a></p></div></section>;
}
