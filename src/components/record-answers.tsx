"use client";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "./localized-link";
import { useI18n } from "./i18n-provider";
import { filterRecordAnswers, type RecordAnswer } from "@/lib/record-answers";
import { sources } from "@/lib/data";
import styles from "./discovery.module.css";

export function RecordAnswers({ answers, compact = false }: { answers: RecordAnswer[]; compact?: boolean }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const shown = compact ? answers.slice(0, 3) : filterRecordAnswers(answers, query);
  return <section className={styles.answers} aria-label={t("Quick answers")} data-quick-answers>
    {compact ? <div className={styles.heading}><h2>{t("Quick answers")}</h2><Link href="/answers">{t("All answers")}<ArrowUpRight size={16} aria-hidden="true"/></Link></div> : <div className={styles.search}>
      <label htmlFor="answer-search">{t("Find an answer")}</label>
      <div><Search size={19} aria-hidden="true"/><input id="answer-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Try goals, assists or free kicks")} autoComplete="off" aria-controls="answer-results"/></div>
      <p role="status">{t("{0} answers", { 0: shown.length })}</p>
    </div>}
    <div id={compact ? undefined : "answer-results"} className={compact ? styles.preview : styles.answerList}>
      {shown.map(answer => <article key={answer.id} id={answer.id} className={styles.answer}>
        <span className={styles.context}>{answer.context}</span><h2>{answer.question}</h2>
        <p className={styles.direct}>{answer.answer}</p>{!compact && <p>{answer.detail}</p>}
        <div className={styles.coverage}>{t("Data cutoff:")} <time dateTime={answer.date}>{t(answer.date)}</time></div>
        <Link href={answer.href}>{t("Explore the comparison")}<ArrowUpRight size={16} aria-hidden="true"/></Link>
        {!compact && <details><summary>{t("Sources & counting rules")}</summary><ul>{answer.sourceIds.map(id => <li key={id}>{sources[id].url.startsWith("/") ? <Link href={sources[id].url}>{t(sources[id].name)}</Link> : <a href={sources[id].url} target="_blank" rel="noreferrer">{t(sources[id].name)}<ArrowUpRight size={12} aria-hidden="true"/></a>}</li>)}<li><Link href="/methodology">{t("How we count")}</Link></li></ul></details>}
      </article>)}
    </div>
    {!shown.length && <div className={styles.empty}><p>{t("No matching answers. Try a shorter search or browse all answers.")}</p><button className="small-button" onClick={() => setQuery("")}>{t("Clear search")}</button></div>}
  </section>;
}
