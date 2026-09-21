"use client";
import { useFootballData } from "@/components/data-provider";

import { PlayerMatchup } from "@/components/player-matchup";
import { Select } from "@/components/ui/select";
import { ComparisonOptions } from "@/components/comparison-options";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Download, Globe2, Info, Link2, ShieldCheck, Star } from "lucide-react";
import { comparisonCsv, getGoalValues, isScope, players, scopeIds, sources, type GoalMode, type MetricGroup, type Metric, type PlayerId, type ScopeId } from "@/lib/data";

export function Comparison({ initialScope = "career", compact = false, initialGroup = "overview" }: { initialScope?: ScopeId; compact?: boolean; initialGroup?: MetricGroup | "all" }) {
  const { scopes, snapshotDate, coverageNote } = useFootballData();
  const [scopeId, setScopeId] = useState<ScopeId>(initialScope);
  const [mode, setMode] = useState<GoalMode>("total");
  const [group, setGroup] = useState<MetricGroup | "all">(initialGroup);
  const [copied, setCopied] = useState(false);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const scope = scopes[scopeId];
  const goals = getGoalValues(scope, mode);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const requestedScope = params.get("scope");
      const selected = isScope(requestedScope) ? requestedScope : initialScope;
      setScopeId(selected);
      setMode(params.get("mode") === "per-90" ? "per-90" : params.get("mode") === "per-game" ? "per-game" : "total");
      setGroup(params.get("view") === "overview" ? "overview" : params.get("view") === "scoring" ? "scoring" : params.get("view") === "all" ? "all" : initialGroup);
      setOnlyDifferences(params.get("different") === "1");
    };
    restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); if (shareTimer.current) clearTimeout(shareTimer.current); };
  }, [initialScope, initialGroup]);

  function update(nextScope: ScopeId, nextMode = mode, differences = onlyDifferences, nextGroup = group) {
    const safeMode = nextMode;
    setScopeId(nextScope); setMode(safeMode); setOnlyDifferences(differences); setGroup(nextGroup);
    const params = new URLSearchParams({ scope: nextScope, mode: safeMode, view: nextGroup });
    if (differences) params.set("different", "1");
    window.history.pushState(null, "", `#${params.toString()}`);
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (shareTimer.current) clearTimeout(shareTimer.current);
      shareTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch { window.prompt("Copy this comparison link:", window.location.href); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob(["\ufeff", comparisonCsv(scope)], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `the-rivalry-${scopeId}-${snapshotDate}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className={`comparison ${compact ? "comparison-compact" : ""}`} id="comparison" aria-label="Interactive player comparison">
    <div className="comparison-toolbar"><div className="scope-tabs" role="group" aria-label="Competition scope">{(["career", "2026", "club", "international", "champions-league"] as ScopeId[]).map(id => <button key={id} className={scopeId === id ? "selected" : ""} aria-pressed={scopeId === id} onClick={() => update(id)}>{scopes[id].shortLabel}</button>)}</div><div className="extra-scope"><Select label="More comparisons" menuLabel="Compare by competition" value={scopeId} onValueChange={value => update(value as ScopeId)} icon={Globe2} options={(["career", ...scopeIds.filter(id => id !== "career")] as ScopeId[]).map(id => ({ value: id, label: scopes[id].shortLabel }))} /></div><ComparisonOptions mode={mode} onlyDifferences={onlyDifferences} onChange={(nextMode, differences) => update(scopeId, nextMode, differences)} /></div>
    {coverageNote && <p className="data-update-note">{coverageNote} <Link href="/updates">View update log ↗</Link></p>}<div className="snapshot-line"><span><span className="snapshot-dot" /> {scope.period}</span><Link href="/methodology">Sources & definitions <Info size={12} /></Link></div>
    <PlayerMatchup
      values={goals}
      decimals={mode !== "total" ? 2 : 0}
      label={mode === "per-90" ? "GOALS / 90 MIN" : mode === "per-game" ? "GOALS / APPEARANCE" : "TOTAL GOALS"}
      accessibleLabel={mode === "per-90" ? "goals per 90 minutes" : mode === "per-game" ? "goals per appearance" : "goals"}
      context={scope.shortLabel}
    />
    <div className="numbers-panel panel"><div className="panel-heading"><div><span className="section-kicker">STATISTICAL COMPARISON</span><h2>{scope.shortLabel} statistics</h2></div><div className="panel-actions"><button className="icon-button" onClick={download} aria-label="Download comparison CSV" title="Download CSV"><Download size={17} /></button><button className="small-button" onClick={share}>{copied ? <Check size={14} /> : <Link2 size={14} />}<span aria-live="polite">{copied ? "Link copied" : "Share comparison"}</span></button></div></div>
      <div className="metric-tabs" role="group" aria-label="Statistic category">{([["overview", "Overview"], ["scoring", "Goal types & set pieces"], ["all", "All statistics"]] as const).map(([id, label]) => <button key={id} className={group === id ? "selected" : ""} aria-pressed={group === id} onClick={() => update(scopeId, mode, onlyDifferences, id)}>{label}</button>)}</div><div className="comparison-legend"><span><Star size={13} fill="currentColor" aria-hidden="true" />Leads this stat</span><span>Both starred = tied</span><span>Lower minutes per goal is better</span></div><div className="stats-table-wrap"><table className="stats-table"><caption className="sr-only">{scope.label}: Messi versus Ronaldo. {scope.period}. Counting rules and sources are available on the methodology page.</caption><thead><tr><th className="messi-text" scope="col"><span className="legend-dot messi-dot" />LIONEL MESSI</th><th scope="col">{scope.shortLabel.toUpperCase()}</th><th className="ronaldo-text" scope="col">CRISTIANO RONALDO<span className="legend-dot ronaldo-dot" /></th></tr></thead><tbody>{scope.metrics.filter(m => (group === "all" || m.group === group) && (!onlyDifferences || m.values.messi !== m.values.ronaldo)).map(m => {
        const max = Math.max(m.values.messi, m.values.ronaldo, 1);
        return <tr key={m.id}><td><div className="metric-number messi-text">{m.values.messi.toLocaleString("en-US", { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 })}{m.unit}<StatLeader metric={m} player="messi" /></div><div className="stat-track"><span className="messi-bar" style={{ width: `${m.values.messi / max * 100}%` }} /></div></td><th scope="row"><span className="metric-label">{m.label}{m.coverage && <small className="metric-coverage">{m.coverage}</small>}</span></th><td><div className="metric-number ronaldo-text"><StatLeader metric={m} player="ronaldo" />{m.values.ronaldo.toLocaleString("en-US", { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 })}{m.unit}</div><div className="stat-track"><span className="ronaldo-bar" style={{ width: `${m.values.ronaldo / max * 100}%` }} /></div></td></tr>;
      })}</tbody></table></div>
      <div className="stats-footnote"><span><ShieldCheck size={14} />Definitions and sources are in our methodology.</span><Link href="/methodology">How we count <ArrowRight size={13} /></Link></div>
    </div>
    <div className="context-note"><Info size={16} /><p>{scope.description} <span>Statistics cover the stated period; overlapping categories should not be added together.</span></p></div>
    <div className="answer-card"><span className="section-kicker">READING THE DATA</span><p>{scope.answer}</p><div>{scope.source.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].name}<ArrowUpRight size={12} /></a>)}</div></div>
  </section>;
}

function StatLeader({ metric, player }: { metric: Metric; player: PlayerId }) {
  const other = player === "messi" ? "ronaldo" : "messi";
  const value = metric.values[player];
  const otherValue = metric.values[other];
  const tied = value === otherValue;
  const leads = metric.lowerIsBetter ? value < otherValue : value > otherValue;
  if (!tied && !leads) return null;
  const description = `${players[player].short} ${tied ? "is tied for" : "leads"} ${metric.label.toLowerCase()}${tied ? "" : metric.lowerIsBetter ? " (lower is better)" : " (higher value)"}`;
  return <span className="leader-mark" role="img" aria-label={description} title={description}><Star size={14} fill="currentColor" strokeWidth={1.6} aria-hidden="true" /></span>;
}

export function ExploreCards() {
  const comparisons = [
    { href: "/champions-league", number: "01", title: "Champions League", detail: "Goals, assists and appearances in Europe’s top club competition." },
    { href: "/la-liga", number: "02", title: "La Liga", detail: "Their complete Spanish league careers, compared." },
    { href: "/seasons", number: "03", title: "Year by year", detail: "Career statistics from 2002 to 2026. Club and country." },
  ];
  return <section className="explore-section"><div className="section-title-row"><h2>Compare by competition</h2><Link href="/compare" className="text-link">All comparisons <ArrowRight size={15} /></Link></div><div className="explore-grid">{comparisons.map(item => <Link href={item.href} className="explore-card" key={item.href}><span className="explore-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><ArrowUpRight size={20} /></Link>)}</div></section>;
}
