"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Vote } from "lucide-react";
import Link from "./localized-link";
import { useI18n } from "./i18n-provider";
import { players } from "@/lib/data";
import { startingVotes, type VotePlayer, type VoteState } from "@/lib/voting/model";
import styles from "./fan-vote.module.css";

async function requestVote(player?: VotePlayer): Promise<VoteState> {
  const send = async () => {
    const response = await fetch("/api/vote", {
      method: player ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
      ...(player ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player }) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "unavailable");
    return result as VoteState;
  };
  // Serialize initialization and voting across tabs before a browser has a cookie.
  return navigator.locks ? navigator.locks.request("rivalry-fan-vote", send) : send();
}

export function FanVote() {
  const { t, numberLocale } = useI18n();
  const [state, setState] = useState<VoteState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const submitting = useRef(false);
  const number = (value: number) => value.toLocaleString(numberLocale);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (submitting.current) return;
      try {
        const result = await requestVote();
        if (active) { setState(result); setError(""); }
      } catch { if (active) setError("Voting is temporarily unavailable. Please try again."); }
      finally { if (active) setLoading(false); }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("rivalry-fan-vote");
    if (channel) channel.onmessage = refresh;
    return () => { active = false; window.removeEventListener("focus", refresh); channel?.close(); };
  }, [reload]);

  async function vote(player: VotePlayer) {
    if (submitting.current || !state || state.choice) return;
    submitting.current = true; setSaving(true); setError("");
    try {
      setState(await requestVote(player));
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("rivalry-fan-vote"); channel.postMessage("voted"); channel.close();
      }
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setError(code === "cookies" ? "Allow this site’s voting cookie, then reload to vote."
        : code === "rate-limit" ? "Too many votes from this network. Please try again in an hour."
        : "Could not confirm your vote. Retry to check; your vote will not be counted twice.");
    } finally { submitting.current = false; setSaving(false); }
  }

  const total = state ? state.totals.messi + state.totals.ronaldo : 0;
  const messiShare = state ? state.totals.messi / total * 100 : 50;
  const share = (player: VotePlayer) => new Intl.NumberFormat(numberLocale, { style: "percent", maximumFractionDigits: 1 }).format((player === "messi" ? messiShare : 100 - messiShare) / 100);
  return <section className={styles.poll} aria-label={t("Fan vote")} data-fan-vote>
    <p className={styles.disclosure}>{t("Starting totals set by the publisher: Messi {0}, Ronaldo {1}. These are not visitor votes; new votes are added separately.", { "0": number(startingVotes.messi), "1": number(startingVotes.ronaldo) })}</p>
    <div className={styles.cards}>
      {(["messi", "ronaldo"] as const).map(player => <article className={`${styles.card} ${styles[player]}`} key={player} data-vote-player={player}>
        <div className={styles.identity}><Image src={players[player].image} alt="" width={players[player].imageWidth} height={players[player].imageHeight} sizes="100px"/><div><span className="section-kicker">{t(player === "messi" ? "ARGENTINA" : "PORTUGAL")}</span><h2>{players[player].name}</h2></div></div>
        <strong className={styles.count} data-vote-total={player}>{state ? number(state.totals[player]) : "—"}</strong>
        <span className={styles.totalLabel}>{t("Total including starting votes")}</span>
        <p className={styles.breakdown}>{t("Starting: {0} · Visitor votes: {1}", { "0": number(startingVotes[player]), "1": state ? number(state.visitors[player]) : "—" })}</p>
        <button type="button" className={styles.voteButton} disabled={loading || saving || !state || !!state.choice} onClick={() => void vote(player)} data-vote-button={player}>
          {state?.choice === player ? <Check size={18} aria-hidden="true"/> : <Vote size={18} aria-hidden="true"/>}
          {t(state?.choice === player ? "Your vote" : player === "messi" ? "Vote for Messi" : "Vote for Ronaldo")}
        </button>
      </article>)}
    </div>
    <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
      {saving ? t("Saving your vote…") : state?.choice ? t("Your vote for {0} is saved. This browser has already voted.", { "0": players[state.choice].name }) : loading ? t("Loading voting results…") : t("Choose one player. Your vote is final for this browser.")}
    </div>
    {error && <div className={styles.error} role="alert"><p>{t(error)}</p><button type="button" onClick={() => { setLoading(true); setReload(value => value + 1); }} disabled={saving || loading}>{t("Try again")}</button></div>}
    {state && <section className={styles.results} aria-labelledby="vote-results-title">
      <div className={styles.resultHeading}><h2 id="vote-results-title">{t("Poll results")}</h2><span>{t("{0} visitor votes added", { "0": number(state.visitors.messi + state.visitors.ronaldo) })}</span></div>
      <div className={styles.shares}><span>Messi <strong>{share("messi")}</strong></span><span>Ronaldo <strong>{share("ronaldo")}</strong></span></div>
      <div className={styles.bar} aria-hidden="true"><span style={{ width: `${messiShare}%` }}/><span style={{ width: `${100 - messiShare}%` }}/></div>
      <p>{t("Percentages include the publisher’s starting totals. Results update when you vote or return to this page.")}</p>
    </section>}
    <div className={styles.notes}><h2>{t("How voting works")}</h2><p>{t("One vote per browser while its voting cookie is kept. Clearing site data or using another browser can allow another vote. No account is required.")}</p><p>{t("This is an informal fan poll, not a representative survey or a measure of either player’s ability.")}</p><Link href="/cookies#fan-voting">{t("Voting cookie and privacy")}</Link><noscript><p>{t("Enable JavaScript to load the results and cast your vote.")}</p></noscript></div>
  </section>;
}
