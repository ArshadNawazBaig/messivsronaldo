"use client";

import Link from "next/link";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Info } from "lucide-react";
import { seasons, seasonTotals, type CompetitionId } from "@/lib/seasons";
import { sources } from "@/lib/data";

export function SeasonExplorer({ selected = "all" }: { selected?: string }) {
  const router = useRouter();
  const [competition, setCompetition] = useState<CompetitionId>("league");
  const [rate, setRate] = useState(false);
  useEffect(() => {
    function restore() { const p = new URLSearchParams(window.location.hash.slice(1)); setCompetition(p.get("competition") === "ucl" ? "ucl" : "league"); setRate(p.get("rate") === "1"); }
    restore(); window.addEventListener("hashchange", restore); window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
  }, []);
  function update(nextCompetition: CompetitionId, nextRate: boolean) {
    setCompetition(nextCompetition); setRate(nextRate);
    window.history.pushState(null, "", `#competition=${nextCompetition}&rate=${nextRate ? "1" : "0"}`);
  }
  const rows = selected === "all" ? seasons : seasons.filter(s => s.slug === selected);
  const total = seasonTotals(rows, competition);
  const name = competition === "league" ? "La Liga" : "Champions League";
  const max = Math.max(...rows.flatMap(row => (["messi", "ronaldo"] as const).map(p => rate ? row[competition][p].goals / row[competition][p].appearances : row[competition][p].goals)));
  return <section className="season-explorer"><div className="season-controls panel"><div className="scope-tabs" role="group" aria-label="Season competition"><button aria-pressed={competition === "league"} className={competition === "league" ? "selected" : ""} onClick={() => update("league", rate)}>La Liga</button><button aria-pressed={competition === "ucl"} className={competition === "ucl" ? "selected" : ""} onClick={() => update("ucl", rate)}>Champions League</button></div><div className="season-select"><Select id="season-picker" label="Season" menuLabel="Shared Spanish seasons" value={selected} icon={CalendarDays} onValueChange={value => router.push(`${value === "all" ? "/seasons" : `/seasons/${value}`}#competition=${competition}&rate=${rate ? "1" : "0"}`)} options={[{ value: "all", label: "All years & seasons" }, ...seasons.map(s => ({ value: s.slug, label: s.label }))]} /></div><label className="checkbox-label"><input type="checkbox" checked={rate} onChange={event => update(competition, event.target.checked)} />Per appearance</label></div><div className="era-summary"><div className="panel"><span className="section-kicker">MESSI · {name.toUpperCase()}</span><strong className="messi-text">{rate ? (total.messi.goals / total.messi.appearances).toFixed(2) : total.messi.goals}</strong><p>{rate ? "Goals per appearance" : "Goals"} · {total.messi.appearances} appearances</p></div><div className="panel"><span className="section-kicker">RONALDO · {name.toUpperCase()}</span><strong className="ronaldo-text">{rate ? (total.ronaldo.goals / total.ronaldo.appearances).toFixed(2) : total.ronaldo.goals}</strong><p>{rate ? "Goals per appearance" : "Goals"} · {total.ronaldo.appearances} appearances</p></div></div><div className="panel season-chart"><div className="panel-heading"><div><span className="section-kicker">THE SAME SEASONS. THE SAME COMPETITION.</span><h2>{selected === "all" ? "Nine seasons, side by side." : `${rows[0].label}, side by side.`}</h2></div><div className="chart-legend"><span><i className="legend-dot messi-dot" />Messi</span><span><i className="legend-dot ronaldo-dot" />Ronaldo</span></div></div><div className="season-bar-chart">{rows.map(row => <div className="season-bar-row" key={row.slug}><Link href={`/seasons/${row.slug}#competition=${competition}&rate=${rate ? "1" : "0"}`}>{row.label}</Link><div>{(["messi", "ronaldo"] as const).map(player => {
    const value = rate ? row[competition][player].goals / row[competition][player].appearances : row[competition][player].goals;
    return <div className="season-bar" key={player}><span className={player} style={{ width: `${value / max * 86}%` }} /><strong className={`${player}-text`}>{rate ? value.toFixed(2) : value}<span className="sr-only">{player} {rate ? "goals per appearance" : "goals"}</span></strong></div>;
  })}</div></div>)}</div><div className="stats-footnote"><span><Info size={14} />League and Champions League figures are kept separate.</span><a href={sources.liga.url} target="_blank" rel="noreferrer">TFF source table <ArrowUpRight size={13} /></a></div></div><div className="prose panel"><h2>Read the shared era carefully</h2><p>{selected === "all" ? "From 2009/10 to 2017/18, both players competed in Spain: Messi with Barcelona, Ronaldo with Real Madrid." : `This page compares their ${rows[0].label} season in the selected competition.`} In this {name} selection, Messi scored {total.messi.goals} goals in {total.messi.appearances} appearances and Ronaldo scored {total.ronaldo.goals} in {total.ronaldo.appearances}.</p><p>The per-appearance totals divide the combined goals by the combined appearances. They are not an average of rounded season rates. Domestic cups, national-team games and other competitions are excluded. Champions League figures exclude qualifying rounds.</p><p>Source: the Turkish Football Federation’s July 2020 TamSaha comparison table. <a href={sources.liga.url} target="_blank" rel="noreferrer">Read the publication <ArrowUpRight size={13} /></a></p></div></section>;
}
