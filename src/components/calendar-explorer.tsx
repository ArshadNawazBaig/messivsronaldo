"use client";
import { useFootballData } from "@/components/data-provider";

import Link from "next/link";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, CalendarDays, Download } from "lucide-react";
import { type PlayerId } from "@/lib/data";

type YearScope = "career" | "club" | "international" | "league";
type YearMetric = "goals" | "assists" | "contributions" | "appearances" | "minutes";
const scopeNames: Record<YearScope, string> = { career: "Club + country", club: "Club", international: "Country", league: "League" };
const metricNames: Record<YearMetric, string> = { goals: "Goals", assists: "Assists", contributions: "Goals + assists", appearances: "Appearances", minutes: "Minutes played" };
const isScope = (s: string | null): s is YearScope => s !== null && Object.hasOwn(scopeNames, s);
const isMetric = (s: string | null): s is YearMetric => s !== null && Object.hasOwn(metricNames, s);
export function CalendarExplorer({ selected = "all" }: { selected?: string }) {
  const { calendarYears, snapshotDate, snapshotLabel } = useFootballData();
  const currentYear = Number(snapshotDate.slice(0,4));
  const router = useRouter();
  const [scope, setScope] = useState<YearScope>("career");
  const [metric, setMetric] = useState<YearMetric>("goals");
  const [rate, setRate] = useState(false);
  useEffect(() => {
    function restore() { const p = new URLSearchParams(window.location.hash.slice(1)); const s = p.get("scope"); const m = p.get("metric"); setScope(isScope(s) ? s : "career"); setMetric(isMetric(m) ? m : "goals"); setRate(p.get("per90") === "1" && m !== "minutes" && m !== "appearances"); }
    restore(); window.addEventListener("hashchange", restore); window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
  }, []);
  function hash(s = scope, m = metric, r = rate) { return `#scope=${s}&metric=${m}&per90=${r ? 1 : 0}`; }
  function update(s: YearScope, m: YearMetric, r: boolean) { const safe = r && m !== "minutes" && m !== "appearances"; setScope(s); setMetric(m); setRate(safe); window.history.pushState(null, "", hash(s, m, safe)); }
  const rows = [...calendarYears].reverse().filter(y => selected === "all" || String(y.year) === selected);
  function value(row: typeof calendarYears[number], player: PlayerId) { const s = row[scope]; const raw = metric === "contributions" ? s.goals[player] + s.assists[player] : s[metric][player]; return rate ? (s.minutes[player] ? raw * 90 / s.minutes[player] : null) : raw; }
  const latest = rows[0];
  const fmt = (v: number | null) => v === null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: rate ? 2 : 0, maximumFractionDigits: rate ? 2 : 0 });
  function download() {
    const rowsCsv = [["Year", "Scope", "Metric", "Messi", "Ronaldo", "As of", "Source"], ...rows.map(row => [row.year, scopeNames[scope], `${metricNames[metric]}${rate ? " per 90" : ""}`, value(row, "messi") ?? "unavailable", value(row, "ronaldo") ?? "unavailable", snapshotDate, row.source])];
    const blob = new Blob([rowsCsv.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `the-rivalry-calendar-${selected}-${snapshotDate}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section aria-label="Calendar year explorer"><div className="year-controls panel"><div className="scope-tabs" role="group" aria-label="Calendar scope">{Object.entries(scopeNames).map(([key, label]) => <button key={key} aria-pressed={scope === key} className={scope === key ? "selected" : ""} onClick={() => update(key as YearScope, metric, rate)}>{label}</button>)}</div><div className="select-field"><label htmlFor="calendar-year">Year</label><Select id="calendar-year" label="Calendar year" menuLabel="Choose a calendar year" value={selected} icon={CalendarDays} onValueChange={value => router.push(`${value === "all" ? "/seasons" : `/seasons/${value}`}${hash()}`)} options={[{ value: "all", label: `All years · 2002–${calendarYears.at(-1)!.year}` }, ...[...calendarYears].reverse().map(y => ({ value: String(y.year), label: String(y.year), badge: y.year === currentYear ? "In progress" : undefined }))]} /></div><div className="select-field"><label htmlFor="calendar-statistic">Statistic</label><Select id="calendar-statistic" label="Calendar statistic" menuLabel="Choose a statistic" value={metric} icon={BarChart3} onValueChange={value => update(scope, value as YearMetric, rate)} options={Object.entries(metricNames).map(([value, label]) => ({ value, label }))} /></div><label className="checkbox-label"><input type="checkbox" checked={rate} disabled={metric === "minutes" || metric === "appearances"} onChange={event => update(scope, metric, event.target.checked)} />Per 90 minutes</label></div>
    <div className="era-summary">{(["messi", "ronaldo"] as const).map(p => <div className="panel" key={p}><span className="section-kicker">{p.toUpperCase()} · {latest.year} · {scopeNames[scope].toUpperCase()}</span><strong className={`${p}-text`}>{fmt(value(latest, p))}</strong><p>{metricNames[metric]}{rate ? " per 90 minutes" : ""} · {latest[scope].appearances[p]} appearances · {latest[scope].minutes[p].toLocaleString("en-US")} minutes</p></div>)}</div>
    <div className="panel"><div className="panel-heading"><div><span className="section-kicker">JANUARY TO DECEMBER · {snapshotLabel.toUpperCase()}</span><h2>{selected === "all" ? "Every year. A new chapter." : `${selected}, in focus.`}</h2></div><button className="icon-button" onClick={download} aria-label="Download calendar CSV"><Download size={18} /></button></div><div className="year-table-wrap"><table className="year-table"><caption className="sr-only">Calendar-year {metricNames[metric].toLowerCase()}{rate ? " per 90 minutes" : ""}, {scopeNames[scope].toLowerCase()}. {currentYear} is incomplete.</caption><thead><tr><th scope="col">YEAR</th><th scope="col">MESSI</th><th scope="col">RONALDO</th><th scope="col">DIFFERENCE</th><th scope="col">EVIDENCE</th></tr></thead><tbody>{rows.map(row => { const m = value(row, "messi"); const r = value(row, "ronaldo"); return <tr key={row.year} className={row.year === currentYear ? "current-year" : ""}><th scope="row"><Link href={`/seasons/${row.year}${hash()}`}>{row.year}</Link>{row.year === currentYear && <small>Year to date</small>}</th><td className="messi-text">{fmt(m)}</td><td className="ronaldo-text">{fmt(r)}</td><td>{m === null || r === null ? "—" : m === r ? "Level" : `${m > r ? "Messi" : "Ronaldo"} +${fmt(Math.abs(m - r))}`}</td><td><a href={row.source} target="_blank" rel="noreferrer" aria-label={`Source for ${row.year}`}><ArrowUpRight size={16} /></a></td></tr>; })}</tbody></table></div><div className="year-legend"><span><i className="legend-dot messi-dot" />Lionel Messi</span><span><i className="legend-dot ronaldo-dot" />Cristiano Ronaldo</span><span>— = no playing minutes for a rate</span></div></div>
    <div className="prose panel"><h2>Same dates. Clear boundaries.</h2><p>Calendar years run from January to December, so the two players are compared over the same dates even when their club seasons follow different schedules. The {currentYear} figures include published records through {snapshotLabel}; compare them with completed years with that in mind.</p><p>Club + country includes senior competitive club games and recognized senior internationals. The league filter excludes cups and MLS playoffs. Per-90 rates use the minutes in the selected year and scope. A zero appearance count means no senior appearance in that year; an undefined rate is shown as a dash.</p></div></section>;
}
