"use client";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import Link from "./localized-link";
import { quizQuestions, quizWinner, type QuizAnswer } from "@/lib/engagement";
import styles from "./interactive-tools.module.css";

export function FootballQuiz() {
  const data = useFootballData();
  const { t, numberLocale } = useI18n();
  const questions = useMemo(() => quizQuestions(data), [data]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const finished = index >= questions.length;
  const question = questions[Math.min(index, questions.length - 1)];
  const answer = answers[index];
  const correct = quizWinner(question.values, question.lowerIsBetter);
  const score = answers.filter((value, i) => value === quizWinner(questions[i].values, questions[i].lowerIsBetter)).length;
  const name = (choice: QuizAnswer) => choice === "tie" ? t("Both are tied") : choice === "messi" ? "Messi" : "Ronaldo";
  const fmt = (value: number, decimals = 0) => value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  function next() { setIndex(index + 1); requestAnimationFrame(() => title.current?.focus()); }
  function restart() { setAnswers([]); setIndex(0); requestAnimationFrame(() => title.current?.focus()); }
  return <section className={styles.panel} aria-label={t("Football quiz")} data-testid="football-quiz">
    <div className={styles.heading}><span className="section-kicker">{t("PLAY THE RECORDS")}</span><span className={styles.muted}>{t("Data updated {0}", { "0": t(data.snapshotLabel) })}</span></div>
    <div className={styles.progress} aria-hidden="true"><span style={{ width: `${answers.length / questions.length * 100}%` }}/></div>
    {!finished ? <>
      <p className={styles.muted}>{t("Question {0} of {1}", { "0": index + 1, "1": questions.length })} · {t(question.context)}</p>
      <h2 className={styles.question} ref={title} tabIndex={-1}>{t(question.prompt)}</h2>
      <div className={styles.answers} role="group" aria-label={t("Choose your answer")}>{(["messi", "ronaldo", "tie"] as const).map(choice => <button type="button" key={choice} className={styles.answer} disabled={answer !== undefined} aria-pressed={answer === choice} data-correct={answer !== undefined && choice === correct} onClick={() => setAnswers(current => current.length === index ? [...current, choice] : current)}>{name(choice)}</button>)}</div>
      {answer !== undefined && <div className={styles.feedback} role="status"><strong>{t(answer === correct ? "Correct answer." : "Not this time.")} {t("Answer: {0}", { "0": name(correct) })}</strong><p>{t(question.metric)} · Messi <b>{fmt(question.values.messi, question.decimals)}</b> / Ronaldo <b>{fmt(question.values.ronaldo, question.decimals)}</b></p><p>{t(question.explanation)}</p><Link className="text-link" href={question.href} target="_blank" rel="noreferrer">{t("Check the record")}<ArrowUpRight size={14}/></Link></div>}
      <div className={styles.actions}>{answer !== undefined && <button type="button" onClick={next}>{t(index === questions.length - 1 ? "See my results" : "Next question")}<ArrowRight size={14}/></button>}<span className={styles.muted}>{t("Score: {0} / {1}", { "0": score, "1": questions.length })}</span></div>
    </> : <>
      <h2 className={styles.question} ref={title} tabIndex={-1}>{t("Full time. Here is your score.")}</h2>
      <div className={styles.number}>{fmt(score)} / {fmt(questions.length)}</div>
      <p className={styles.muted}>{t("Review every answer below, then try the records yourself.")}</p>
      <div className={styles.actions}><button type="button" onClick={restart}><RotateCcw size={14}/>{t("Play again")}</button></div>
      <div>{questions.map((item, i) => <section className={styles.review} key={item.id}><h3>{i + 1}. {t(item.prompt)}</h3><p>{t("Your answer: {0}", { "0": name(answers[i]) })} · {t("Answer: {0}", { "0": name(quizWinner(item.values, item.lowerIsBetter)) })}</p><p>{t(item.metric)} · Messi {fmt(item.values.messi, item.decimals)} / Ronaldo {fmt(item.values.ronaldo, item.decimals)}</p><Link className="text-link" href={item.href}>{t("Check the record")}<ArrowUpRight size={13}/></Link></section>)}</div>
    </>}
    <div className={styles.note}><p>{t("Every answer is calculated from the same published records used in our comparisons. Ties are valid answers; lower minutes per goal is better.")}</p><p>{t("Your answers stay in this page and reset on reload. No account, public leaderboard or personal data is required.")}</p></div>
  </section>;
}
