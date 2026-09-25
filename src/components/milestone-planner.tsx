"use client";
import { StatImageButton } from "@/components/admin-stat-export";
import { useEffect, useId, useState } from "react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import Link from "./localized-link";
import { RangeSlider } from "./ui/range-slider";
import { useToolUrl } from "./use-tool-url";
import { milestoneGames, normalizeMilestone, type MilestoneState } from "@/lib/engagement";
import { ToolShare } from "./tool-shared";
import styles from "./interactive-tools.module.css";

const hash = (state: MilestoneState) => `#${new URLSearchParams({ target: String(state.target), messi: String(state.messi), ronaldo: String(state.ronaldo) })}`;
export function MilestonePlanner() {
  const { scopes, calendarYears, snapshotLabel } = useFootballData();
  const { t, numberLocale } = useI18n();
  const uid = useId();
  const updateUrl = useToolUrl();
  const [state, setState] = useState(() => normalizeMilestone(new URLSearchParams()));
  const [draft, setDraft] = useState("1000");
  useEffect(() => {
    function restore() { const next = normalizeMilestone(new URLSearchParams(window.location.hash.slice(1))); setState(next); setDraft(String(next.target)); }
    restore(); window.addEventListener("hashchange", restore); window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore); };
  }, []);
  function update(next: MilestoneState) {
    const safe = normalizeMilestone(new URLSearchParams(hash(next).slice(1)));
    setState(safe); setDraft(String(safe.target)); updateUrl(hash(safe));
  }
  function applyRates(latest: boolean) {
    const sample = latest ? calendarYears.at(-1)!.career : scopes.career;
    update({ ...state, messi: sample.appearances.messi ? sample.goals.messi / sample.appearances.messi : 0, ronaldo: sample.appearances.ronaldo ? sample.goals.ronaldo / sample.appearances.ronaldo : 0 });
  }
  const fmt = (value: number, decimals = 0) => value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const draftValid = /^\d+$/.test(draft) && Number(draft) >= 100 && Number(draft) <= 2000;
  return <section className={styles.panel} aria-label={t("Milestone planner")} data-testid="milestone-planner">
    <div className={styles.heading}><div><span className="section-kicker">{t("YOUR SCENARIO")}</span><h2>{t("Set the next milestone")}</h2></div><span className={styles.muted}>{t("Data updated {0}", { "0": t(snapshotLabel) })}</span></div>
    <form className={styles.controls} onSubmit={event => { event.preventDefault(); if (draftValid) update({ ...state, target: Number(draft) }); }}><div className={styles.control}><label htmlFor={`${uid}-target`}>{t("Target career goals")}</label><input id={`${uid}-target`} type="number" min="100" max="2000" step="1" required value={draft} aria-describedby={`${uid}-help`} onChange={event => setDraft(event.target.value)}/></div><div className={styles.actions}><button type="submit">{t("Apply target")}</button>{[1000,1100,1200].map(target => <button type="button" key={target} aria-pressed={state.target === target} onClick={() => update({ ...state, target })}>{fmt(target)}</button>)}</div></form>
    <p id={`${uid}-help`} className={styles.muted}>{t("Choose a target from 100 to 2,000 goals. Rates use two decimal places.")}</p>
    <div className={styles.actions}><button type="button" onClick={() => applyRates(false)}>{t("Use career rates")}</button><button type="button" onClick={() => applyRates(true)}>{t("Use latest year rates")}</button></div>
    <div className={styles.grid} style={{ marginTop: 24 }}>{(["messi", "ronaldo"] as const).map(player => {
      const goals = scopes.career.goals[player], remaining = Math.max(0, state.target - goals);
      const games = milestoneGames(goals, state.target, state[player]);
      return <section className={styles.scenario} key={player} data-player={player}><h3 className={styles[player]}>{player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"}</h3><dl><div><dt>{t("Career goals")}</dt><dd>{fmt(goals)}</dd></div><div><dt>{t("Goals remaining")}</dt><dd>{fmt(remaining)}</dd></div></dl>
        <RangeSlider id={`${uid}-${player}`} label={t("Goals per appearance")} ariaLabel={t(player === "messi" ? "Messi scoring pace" : "Ronaldo scoring pace")} tone={player} min={0} max={3} step={0.01} value={state[player]} formatValue={value => fmt(value, 2)} onValueChange={value => update({ ...state, [player]: value })}/>
        <p className={styles.muted}>{t("Additional appearances needed")}</p><strong className={`${styles.number} ${styles[player]}`} data-testid={`${player}-games`}>{games === null ? "—" : fmt(games)}</strong>
        <p className={styles.muted}>{t(games === 0 ? "Target already reached in this dataset." : games === null ? "A zero scoring rate cannot reach a higher target." : "Rounded up to a whole appearance.")}</p>
      </section>;
    })}</div>
    <StatImageButton placement="toolbar" stats={[
      { title: "Additional appearances needed", context: `Scenario · Target ${state.target.toLocaleString("en-US")} career goals`, values: { messi: milestoneGames(scopes.career.goals.messi, state.target, state.messi), ronaldo: milestoneGames(scopes.career.goals.ronaldo, state.target, state.ronaldo) }, lowerIsBetter: true, note: `Assumption, not a forecast. Goals per appearance: Messi ${state.messi.toFixed(2)}, Ronaldo ${state.ronaldo.toFixed(2)}. Rounded up. A dash means this rate cannot reach the target.` },
      { title: "Goals remaining", context: `Target ${state.target.toLocaleString("en-US")} career goals`, values: { messi: Math.max(0, state.target - scopes.career.goals.messi), ronaldo: Math.max(0, state.target - scopes.career.goals.ronaldo) }, lowerIsBetter: true },
      { title: "Selected goals per appearance", context: "Milestone planner · Your scenario", values: { messi: state.messi, ronaldo: state.ronaldo }, decimals: 2, note: "User-selected scoring rates; assumptions, not actual totals or a forecast." },
    ]}/>
    <div className={styles.note}><p>{t("Formula: remaining goals ÷ your selected goals per appearance, rounded up. The rate is an assumption, not a forecast.")}</p><p>{t("No future match dates, injuries, retirements or changes in playing time are predicted. Historical rates describe past records and may not continue.")}</p><div className={styles.actions}><Link className="text-link" href="/records">{t("Career milestones")}</Link><ToolShare key={hash(state)} hash={hash(state)}/></div></div>
  </section>;
}
