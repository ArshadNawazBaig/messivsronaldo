"use client";
import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, RotateCcw, Share2 } from "lucide-react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import Link from "./localized-link";
import { Select } from "./ui/select";
import { players, type PlayerId } from "@/lib/data";
import { calculatorHash, calculatorPresets, calculatorRecords, normalizeCalculator, parseCalculator, scoringProjection, type CalculatorPreset, type CalculatorState } from "@/lib/calculator";
import styles from "./scoring-calculator.module.css";

export function ScoringCalculator({ preset = "career" }: { preset?: CalculatorPreset }) {
  const data = useFootballData();
  const { t, numberLocale } = useI18n();
  const records = useMemo(() => calculatorRecords(data), [data]);
  const initial = calculatorPresets[preset].state;
  const [state, setState] = useState<CalculatorState>(initial);
  const [share, setShare] = useState({ url: "", message: "" });
  const uid = useId();
  useEffect(() => {
    function restore() { setState(parseCalculator(window.location.hash, records, initial)); setShare({ url: "", message: "" }); }
    restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
  }, [records, initial]);
  const selected = { messi: records.find(record => record.id === state.messi)!, ronaldo: records.find(record => record.id === state.ronaldo)! };
  const minutesAvailable = selected.messi.players.messi.minutes !== null && selected.ronaldo.players.ronaldo.minutes !== null;
  const results = { messi: scoringProjection(selected.messi.players.messi, state.basis, state.amount), ronaldo: scoringProjection(selected.ronaldo.players.ronaldo, state.basis, state.amount) };
  const max = Math.max(1, results.messi ?? 0, results.ronaldo ?? 0) * 1.1;
  const fmt = (number: number | null, decimals = 0) => number === null ? "—" : number.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  function update(next: CalculatorState) {
    const normalized = normalizeCalculator(next, records);
    setState(normalized); setShare({ url: "", message: "" });
    window.history.replaceState(null, "", calculatorHash(normalized));
  }
  async function copy() {
    const url = new URL(window.location.href); url.hash = calculatorHash(state);
    setShare({ url: url.href, message: "Copy this link to share your settings." });
    try { await navigator.clipboard.writeText(url.href); setShare({ url: url.href, message: "Comparison link copied." }); } catch { /* The visible link remains selectable. */ }
  }
  return <section className={styles.calculator} aria-label={t("Scoring calculator")} data-testid="scoring-calculator">
    <div className={styles.heading}><div><span className="section-kicker">{t("TRY THE NUMBERS")}</span><h2>{t("Scoring calculator")}</h2></div><button type="button" className="text-link" onClick={() => update(initial)}><RotateCcw size={14}/>{t("Reset options")}</button></div>
    <div className={styles.presets} aria-label={t("Suggested comparisons")}>{Object.entries(calculatorPresets).map(([key, value]) => <button type="button" key={key} onClick={() => update(value.state)} aria-pressed={JSON.stringify(state) === JSON.stringify(value.state)}>{t(value.label)}</button>)}</div>
    <div className={styles.records}>{(["messi", "ronaldo"] as const).map(player => <section key={player} className={styles.record} data-player={player}>
      <div className={styles.identity}><span className={`header-player-photo ${player}`}><Image src={players[player].image} width={players[player].imageWidth} height={players[player].imageHeight} sizes="52px" alt=""/></span><h3>{players[player].name}</h3></div>
      <label htmlFor={`${uid}-${player}`}>{t("Choose a record")}</label><Select id={`${uid}-${player}`} label={player === "messi" ? "Messi record" : "Ronaldo record"} value={state[player]} onValueChange={value => update({ ...state, [player]: value })} options={records.map(record => ({ value: record.id, label: record.label }))}/>
      <dl className={styles.facts}><div><dt>{t("Goals")}</dt><dd>{fmt(selected[player].players[player].goals)}</dd></div><div><dt>{t("Appearances")}</dt><dd>{fmt(selected[player].players[player].appearances)}</dd></div><div><dt>{t("Minutes played")}</dt><dd>{fmt(selected[player].players[player].minutes)}</dd></div></dl>
      <p className={styles.note}>{t(selected[player].coverage)}</p><Link className="text-link" href={selected[player].href}>{t("View original record")}<ArrowUpRight size={13}/></Link>
    </section>)}</div>
    <div className={styles.controls}>
      <div className={styles.basis} role="group" aria-label={t("Equal opportunity basis")}><button type="button" aria-pressed={state.basis === "minutes"} disabled={!minutesAvailable} onClick={() => update({ ...state, basis: "minutes", amount: 900 })}>{t("Equal minutes")}</button><button type="button" aria-pressed={state.basis === "appearances"} onClick={() => update({ ...state, basis: "appearances", amount: 10 })}>{t("Equal appearances")}</button></div>
      {!minutesAvailable && <p className={styles.note}>{t("Minutes are unavailable for this season archive. Compare appearances instead.")}</p>}
      <div className={styles.rangeLabel}><label htmlFor={`${uid}-amount`}>{t(state.basis === "minutes" ? "Minutes for each player" : "Appearances for each player")}</label><output htmlFor={`${uid}-amount`}>{fmt(state.amount)}</output></div>
      <input className={styles.slider} id={`${uid}-amount`} type="range" min={state.basis === "minutes" ? 90 : 1} max={state.basis === "minutes" ? 9000 : 100} step="1" value={state.amount} onChange={event => update({ ...state, amount: Number(event.target.value) })}/>
    </div>
    <figure className={styles.chart}>
      <figcaption><strong>{t("Goals at the selected rate")}</strong><span>{t("A calculation, not a prediction or an actual goal total.")}</span></figcaption>
      <div className={styles.results} aria-live="polite" aria-atomic="true">{(["messi", "ronaldo"] as const).map((player: PlayerId) => <div key={player} className={styles.barRow} data-player={player}><div><span>{players[player].short}</span><strong data-testid={`${player}-projection`}>{fmt(results[player], 2)}</strong></div><div className={styles.track} aria-hidden="true"><span style={{ width: `${(results[player] ?? 0) / max * 100}%` }}/></div><small>{t(selected[player].label)} · {t(state.basis === "minutes" ? "{0} goals per 90 minutes" : "{0} goals per appearance", { "0": fmt(scoringProjection(selected[player].players[player], state.basis, state.basis === "minutes" ? 90 : 1), 3) })}</small></div>)}</div>
      {(results.messi === null || results.ronaldo === null) && <p className={styles.note}>{t("No rate is available without recorded playing time or appearances.")}</p>}
    </figure>
    <div className={styles.method}><p>{t(state.basis === "minutes" ? "Formula: recorded goals ÷ recorded minutes × selected minutes." : "Formula: recorded goals ÷ recorded appearances × selected appearances.")}</p><p>{t("Equal playing time does not adjust for opponents, team strength, age or competition. A substitute appearance still counts as one match.")}</p><p>{t("Data updated {0}", { "0": t(data.snapshotLabel) })}</p><div className={styles.actions}><Link className="text-link" href="/methodology">{t("Sources & counting rules")}<ArrowUpRight size={13}/></Link><button type="button" className="text-link" onClick={copy}><Share2 size={14}/>{t("Share comparison")}</button></div>
      {share.url && <div className={styles.share}><p role="status">{t(share.message)}</p><input aria-label={t("Comparison link")} value={share.url} readOnly onFocus={event => event.currentTarget.select()}/></div>}
    </div>
  </section>;
}
