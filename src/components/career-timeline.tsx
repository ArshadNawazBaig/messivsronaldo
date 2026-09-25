"use client";
import { StatImageButton } from "@/components/admin-stat-export";
import { useEffect, useId, useState } from "react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import { Select } from "./ui/select";
import { RangeSlider } from "./ui/range-slider";
import { useToolUrl } from "./use-tool-url";
import Link from "./localized-link";
import { normalizeTimeline, timelineRows, type TimelineMetric, type TimelineState } from "@/lib/engagement";
import { ToolShare } from "./tool-shared";
import styles from "./interactive-tools.module.css";

const metricLabels: Record<TimelineMetric, string> = { goals: "Goals", assists: "Assists", contributions: "Goals + assists" };
const hash = (state: TimelineState) => `#${new URLSearchParams({ from: String(state.from), to: String(state.to), metric: state.metric, cumulative: state.cumulative ? "1" : "0" })}`;
export function CareerTimeline() {
  const { calendarYears, snapshotLabel } = useFootballData();
  const { t, numberLocale } = useI18n();
  const [state, setState] = useState(() => normalizeTimeline(new URLSearchParams(), calendarYears));
  const [selected, setSelected] = useState(calendarYears.at(-1)!.year);
  const uid = useId();
  const updateUrl = useToolUrl();
  useEffect(() => {
    function restore() { const next = normalizeTimeline(new URLSearchParams(window.location.hash.slice(1)), calendarYears); setState(next); setSelected(next.to); }
    restore(); window.addEventListener("hashchange", restore); window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
  }, [calendarYears]);
  function update(next: TimelineState) {
    const safe = normalizeTimeline(new URLSearchParams(hash(next).slice(1)), calendarYears);
    setState(safe); setSelected(year => Math.max(safe.from, Math.min(year, safe.to)));
    updateUrl(hash(safe));
  }
  const rows = timelineRows(calendarYears, state);
  const active = rows.find(row => row.year === selected) ?? rows.at(-1)!;
  const selectedIndex = rows.indexOf(active);
  const totals = rows.reduce((total, row) => ({ messi: total.messi + row.annual.messi, ronaldo: total.ronaldo + row.annual.ronaldo }), { messi: 0, ronaldo: 0 });
  const maximum = Math.max(10, Math.ceil(Math.max(...rows.flatMap(row => [row.values.messi, row.values.ronaldo])) / 10) * 10);
  const x = (index: number) => rows.length === 1 ? 320 : index / (rows.length - 1) * 620 + 10;
  const y = (value: number) => 210 - value / maximum * 200;
  const fmt = (value: number) => value.toLocaleString(numberLocale);
  return <section className={styles.panel} aria-label={t("Career timeline")} data-testid="career-timeline">
    <div className={styles.controls}>
      {(["from", "to"] as const).map(key => <div className={styles.control} key={key}><label htmlFor={`${uid}-${key}`}>{t(key === "from" ? "Start year" : "End year")}</label><Select id={`${uid}-${key}`} label={key === "from" ? "Start year" : "End year"} value={String(state[key])} options={calendarYears.map(row => ({ value: String(row.year), label: String(row.year) }))} onValueChange={value => update({ ...state, [key]: Number(value) })}/></div>)}
      <div className={styles.control}><label htmlFor={`${uid}-metric`}>{t("Statistic")}</label><Select id={`${uid}-metric`} label="Statistic" value={state.metric} options={Object.entries(metricLabels).map(([value, label]) => ({ value, label }))} onValueChange={value => update({ ...state, metric: value as TimelineMetric })}/></div>
      <label className="checkbox-label"><input type="checkbox" checked={state.cumulative} onChange={event => update({ ...state, cumulative: event.target.checked })}/>{t("Cumulative within range")}</label>
    </div>
    <div className={styles.heading}><div><span className="section-kicker">{state.from}–{state.to}</span><h2>{t(metricLabels[state.metric])}</h2></div><span className={styles.muted}>{t(state.cumulative ? "Running total starts at the selected first year." : "Each point is one calendar year.")}</span></div>
    <div className={styles.summary} aria-label={t("Selected range totals")}><div><span>Messi</span><strong className={styles.messi} data-testid="timeline-messi-total">{fmt(totals.messi)}</strong></div><div><span>Ronaldo</span><strong className={styles.ronaldo} data-testid="timeline-ronaldo-total">{fmt(totals.ronaldo)}</strong></div><p className={styles.muted}>{t("Totals for the selected years")}</p></div><StatImageButton placement="toolbar" stat={{ title: metricLabels[state.metric], context: `${state.from}–${state.to} · Club & country`, values: totals, note: "Totals for the selected calendar years; latest year is incomplete." }}/>
    <figure style={{ margin: 0 }}><div className={styles.plot}><div className={styles.axis} aria-hidden="true">{[4,3,2,1,0].map(tick => <span key={tick}>{fmt(maximum * tick / 4)}</span>)}</div><svg className={styles.chart} viewBox="0 0 640 220" role="img" aria-label={t("Messi and Ronaldo across the selected years")}>
      {[0,1,2,3,4].map(tick => <line key={tick} x1="10" x2="630" y1={y(maximum * tick / 4)} y2={y(maximum * tick / 4)} stroke="var(--border)" vectorEffect="non-scaling-stroke"/>)}
      <line x1={x(selectedIndex)} x2={x(selectedIndex)} y1="10" y2="210" stroke="var(--muted)" strokeDasharray="4 5" vectorEffect="non-scaling-stroke"/>
      {(["messi", "ronaldo"] as const).map(player => <g key={player}><polyline points={rows.map((row, i) => `${x(i)},${y(row.values[player])}`).join(" ")} stroke={`var(--${player})`} strokeWidth="2.5" strokeDasharray={player === "ronaldo" ? "6 4" : undefined} fill="none" vectorEffect="non-scaling-stroke"/><circle cx={x(selectedIndex)} cy={y(active.values[player])} r="5" fill={`var(--${player})`}/></g>)}
    </svg></div><div className={styles.xAxis} aria-hidden="true"><span>{state.from}</span><span>{state.to}</span></div><figcaption className={styles.chartCaption}>{t("Messi: solid line. Ronaldo: dashed line. Move through the years below or open the data table.")}</figcaption></figure>
    <RangeSlider id={`${uid}-year`} label={t("Explore a year")} direction="ltr" min={0} max={Math.max(0, rows.length - 1)} disabled={rows.length === 1} value={selectedIndex} formatValue={index => String(rows[index].year)} onValueChange={index => setSelected(rows[index].year)}/>
    <div className={styles.selectedYear} aria-live="polite"><b>{active.year}</b><span className={styles.messi}>Messi <strong>{fmt(active.values.messi)}</strong></span><span className={styles.ronaldo}>Ronaldo <strong>{fmt(active.values.ronaldo)}</strong></span><Link className="text-link" href={`/seasons/${active.year}`}>{t("View original record")}</Link><StatImageButton stat={{ title: metricLabels[state.metric], context: `${state.cumulative ? `${state.from}–${active.year}` : active.year} · Club & country`, values: active.values, note: state.cumulative ? "Cumulative within selected range" : "Calendar year totals; latest year is incomplete." }}/></div>
    <div className={styles.actions}><ToolShare key={hash(state)} hash={hash(state)}/></div>
    <details className={styles.tableWrap}><summary>{t("Open the data table")}</summary><table className={styles.table}><caption>{t(metricLabels[state.metric])} · {t(state.cumulative ? "Cumulative within range" : "Annual totals")}</caption><thead><tr><th scope="col">{t("Year")}</th><th scope="col">Messi</th><th scope="col">Ronaldo</th></tr></thead><tbody>{rows.map(row => <tr key={row.year}><th scope="row">{row.year}<StatImageButton stat={{ title: metricLabels[state.metric], context: `${state.cumulative ? `${state.from}–${row.year}` : row.year} · Club & country`, values: row.values, note: state.cumulative ? "Cumulative within selected range" : "Calendar year totals; latest year is incomplete." }}/></th><td>{fmt(row.values.messi)}</td><td>{fmt(row.values.ronaldo)}</td></tr>)}</tbody></table></details>
    <div className={styles.note}><p>{t("Club and country records are combined. Cumulative totals restart at your chosen first year; they are not full career totals unless you select every year.")}</p><p>{t("The latest year is incomplete through {0}. Assist definitions follow the published dataset.", { "0": t(snapshotLabel) })}</p><Link className="text-link" href="/methodology">{t("Sources & counting rules")}</Link></div>
  </section>;
}
