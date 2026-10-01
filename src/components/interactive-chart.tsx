"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, BarChart3, ChartNoAxesCombined } from "lucide-react";
import { useI18n } from "./i18n-provider";
import Link from "./localized-link";
import { Select } from "./ui/select";
import { chartMaximum, chartPath, type ChartMetric, type ChartRecord } from "@/lib/chart-data";
import type { PlayerId } from "@/lib/data";
import styles from "./interactive-chart.module.css";

const bothPlayers: PlayerId[] = ["messi", "ronaldo"];
export function InteractiveChart({ title = "Explore the numbers", records, metrics, initialMetric, initialRecord, players = bothPlayers, source = "/methodology", sourceLabel = "Sources & counting rules" }: {
  title?: string; records: ChartRecord[]; metrics: ChartMetric[]; initialMetric?: string; initialRecord?: string; players?: PlayerId[]; source?: string; sourceLabel?: string;
}) {
  const { t, numberLocale } = useI18n();
  const id = useId();
  const [metricId, setMetricId] = useState(initialMetric ?? metrics[0]?.id);
  const [recordId, setRecordId] = useState(initialRecord ?? records.at(-1)?.id);
  const [view, setView] = useState<"line" | "bars">("line");
  const plot = useRef<HTMLDivElement>(null);
  const [{ width, height }, setPlotSize] = useState({ width: 640, height: 244 });
  const hasSeries = records.length > 1;
  useEffect(() => {
    if (!plot.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(100, Math.round(entry.contentRect.width));
      const height = Math.max(244, Math.round(entry.contentRect.height));
      setPlotSize(current => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(plot.current);
    return () => observer.disconnect();
  }, [hasSeries]);
  const metric = metrics.find(item => item.id === metricId) ?? metrics[0];
  const active = records.find(item => item.id === recordId) ?? records.at(-1);
  if (!metric || !active) return null;
  const activeIndex = records.indexOf(active);
  const values = active.values[metric.id] ?? { messi: null, ronaldo: null };
  const maximum = chartMaximum(records.flatMap(record => players.map(player => record.values[metric.id]?.[player] ?? null)));
  const format = (value: number | null) => value === null ? "—" : value.toLocaleString(numberLocale, { minimumFractionDigits: metric.decimals ?? 0, maximumFractionDigits: metric.decimals ?? 0 }) + (metric.unit ?? "");
  const x = (index: number) => 12 + (index + .5) / records.length * (width - 24);
  const baseline = height - 20;
  const y = (value: number) => baseline - value / maximum * (height - 44);
  const gap = values.messi === null || values.ronaldo === null ? null : Math.abs(values.messi - values.ronaldo);
  function selectPoint(clientX: number, element: SVGSVGElement) {
    const bounds = element.getBoundingClientRect();
    const relative = (clientX - bounds.left) / bounds.width * width;
    const index = Math.max(0, Math.min(records.length - 1, Math.floor((relative - 12) / (width - 24) * records.length)));
    setRecordId(records[index].id);
  }

  const readout = <div className={styles.readout} aria-live="polite" aria-atomic="true">
          <div className={styles.recordLabel}><strong>{t(active.label)}</strong>{active.href && <Link href={active.href} prefetch={false}>{t("View original record")}<ArrowUpRight size={14} aria-hidden="true"/></Link>}</div>
          <div className={styles.values}>{players.map(player => <div key={player} className={styles.value} data-player={player}><span>{t(player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo")}</span><strong>{format(values[player])}</strong><div className={styles.track} aria-hidden="true"><span style={{ width: `${(values[player] ?? 0) / maximum * 100}%` }}/></div></div>)}</div>
          {players.length === 2 && <p>{t("Difference")}: <strong>{metric.unit === "%" && gap !== null ? t("{0} percentage points", { 0: gap.toLocaleString(numberLocale, { maximumFractionDigits: metric.decimals ?? 0 }) }) : format(gap)}</strong>{metric.lowerIsBetter && <> · {t("Lower minutes per goal is better")}</>}</p>}
        </div>;

  return <section className={styles.panel} aria-labelledby={`${id}-title`} data-interactive-chart>
    <header className={styles.header}>
      <div><span className="section-kicker">{t("Interactive comparison")}</span><h2 id={`${id}-title`}>{t(title)}</h2><p id={`${id}-instructions`}>{t(hasSeries ? "Hover or tap a point to explore. Use arrow keys when the chart is focused." : "Choose a statistic to see the comparison and its definition.")}</p></div>
      <div className={styles.controls}>
        {metrics.length > 1 && <div className={styles.select}><label htmlFor={`${id}-metric`}>{t("Chart statistic")}</label><Select id={`${id}-metric`} label="Chart statistic" value={metric.id} options={metrics.map(item => ({ value: item.id, label: item.label }))} onValueChange={setMetricId}/></div>}
        {hasSeries && <div className={styles.switch} role="group" aria-label={t("Chart display")}>
          <button type="button" aria-pressed={view === "line"} onClick={() => setView("line")}><ChartNoAxesCombined size={16} aria-hidden="true"/>{t("Trend line")}</button>
          <button type="button" aria-pressed={view === "bars"} onClick={() => setView("bars")}><BarChart3 size={16} aria-hidden="true"/>{t("Bars")}</button>
        </div>}
      </div>
    </header>
    <div className={styles.body}>
      <div className={styles.visual}>
        <div className={styles.plotHeading}><span>{t(metric.label)}{metric.unit && ` (${metric.unit})`}</span><div className={styles.legend}>{players.map(player => <span key={player} data-player={player}><i/>{t(player === "messi" ? "Messi" : "Ronaldo")}</span>)}</div></div>
        {hasSeries && <>
          <div className={styles.plotGrid} dir="ltr">
            <div className={styles.axis} aria-hidden="true">{[4,3,2,1,0].map(tick => <span key={tick} style={{ top: `${(4 - tick) * 25}%` }}>{(maximum * tick / 4).toLocaleString(numberLocale, { maximumFractionDigits: maximum < 10 ? 2 : 1 })}</span>)}</div>
            <div className={styles.plot}>
              <div ref={plot} className={styles.canvas}>
              <svg viewBox={`0 0 ${width} ${height}`} role="img" tabIndex={0} aria-label={`${t(metric.label)} · ${t(records[0].label)}–${t(records.at(-1)!.label)}`} aria-describedby={`${id}-instructions`} onKeyDown={event => {
                const index = event.key === "Home" ? 0 : event.key === "End" ? records.length - 1 : event.key === "ArrowLeft" ? activeIndex - 1 : event.key === "ArrowRight" ? activeIndex + 1 : null;
                if (index === null) return;
                event.preventDefault();
                setRecordId(records[Math.max(0, Math.min(records.length - 1, index))].id);
              }} onPointerMove={event => { if (event.pointerType === "mouse") selectPoint(event.clientX, event.currentTarget); }} onPointerDown={event => selectPoint(event.clientX, event.currentTarget)}>
                {[0,1,2,3,4].map(tick => <line key={tick} x1="0" x2={width} y1={y(maximum * tick / 4)} y2={y(maximum * tick / 4)} stroke="var(--border-subtle)"/>)}
                <rect x={x(activeIndex) - (width - 24) / records.length / 2} y="16" width={(width - 24) / records.length} height={baseline - 16} fill="var(--accent)" opacity=".06"/>
                {players.map((player, playerIndex) => <g key={player}>
                  {view === "line" ? <path d={chartPath(records.map(record => record.values[metric.id]?.[player] ?? null), x, y)} fill="none" stroke={`var(--${player})`} strokeWidth="2.5" strokeDasharray={player === "ronaldo" ? "6 4" : undefined}/> : records.map((record, index) => {
                    const value = record.values[metric.id]?.[player];
                    const size = Math.min(22, (width - 24) / records.length / (players.length + 1));
                    return value === null || value === undefined ? null : <rect key={record.id} x={x(index) + (playerIndex - players.length / 2) * size} y={y(value)} width={Math.max(1, size - 1)} height={baseline - y(value)} rx="2" fill={`var(--${player})`} opacity={index === activeIndex ? 1 : .65}/>;
                  })}
                  {values[player] !== null && <circle cx={x(activeIndex)} cy={y(values[player])} r={view === "line" ? 5 : 0} fill={`var(--${player})`} stroke="var(--panel)" strokeWidth="2"/>}
                </g>)}
              </svg>
              </div>
              <div className={styles.xAxis} aria-hidden="true"><span>{t(records[0].label)}</span><span>{t(records[Math.floor(records.length / 2)].label)}</span><span>{t(records.at(-1)!.label)}</span></div>
            </div>
          </div>
        </>}
        {!hasSeries && readout}
      </div>
      <aside className={styles.explanation}>
        {hasSeries && readout}
        <span className="section-kicker">{t("READING THE DATA")}</span><h3>{t(metric.label)}</h3>
        {metric.explanation && <p>{t(metric.explanation)}</p>}
        {(metric.decimals ?? 0) > 0 && <p>{t("Rates and differences are calculated before rounding.")}</p>}
        {metric.coverage && <p className={styles.coverage}>{t(metric.coverage)}</p>}
        {active.note && <p>{t(active.note)}</p>}
        {players.some(player => values[player] === null) && <p>{t("A rate comparison is unavailable because at least one player has no recorded appearances or playing time in this sample.")}</p>}
        <Link href={source}>{t(sourceLabel)}<ArrowUpRight size={14} aria-hidden="true"/></Link>
      </aside>
    </div>
  </section>;
}
