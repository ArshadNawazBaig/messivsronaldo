import type { Pair } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { scoringComparison } from "@/lib/scoring-comparison";
import styles from "./archive-summary.module.css";

export async function ScoringAnalysis({ goals, appearances, minutes, context }: {
  goals: Pair; appearances: Pair; minutes?: Pair; context: string;
}) {
  const { t, numberLocale } = await getI18n();
  const comparison = scoringComparison(goals, appearances, minutes);
  const fmt = (value: number) => value.toLocaleString(numberLocale);
  const rate = (value: number | null) => value === null ? "—" : value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const name = (id: "messi" | "ronaldo") => t(id === "messi" ? "Messi" : "Ronaldo");
  let interpretation: string;
  if (!comparison.comparable) {
    interpretation = t("A rate comparison is unavailable because at least one player has no recorded appearances or playing time in this sample.");
  } else if (!comparison.rateLeader) {
    interpretation = t("The scoring rates are equal in this sample.");
  } else if (!comparison.goalLeader) {
    interpretation = t("With equal goal totals, {0} has the higher scoring rate.", { 0: name(comparison.rateLeader) });
  } else if (comparison.rateLeader !== comparison.goalLeader) {
    interpretation = t("The total and rate have different leaders: {0} leads on scoring rate.", { 0: name(comparison.rateLeader) });
  } else {
    interpretation = t("The same player leads both the total and the scoring rate.");
  }
  return <section className={styles.analysis} data-scoring-analysis>
    <h3>{t("Reading the comparison: {0}", { 0: context })}</h3>
    <p>{comparison.goalLeader ? t("{0} leads the goal total by {1}.", { 0: name(comparison.goalLeader), 1: fmt(comparison.goalGap) }) : t("Both players have {0} goals in this sample.", { 0: fmt(goals.messi) })} {t(comparison.basis === "minutes" ? "Per 90 minutes: Messi {0}, Ronaldo {1}." : "Per appearance: Messi {0}, Ronaldo {1}.", { 0: rate(comparison.rates.messi), 1: rate(comparison.rates.ronaldo) })}</p>
    <p>{interpretation} {comparison.rateLeader && rate(comparison.rates.messi) === rate(comparison.rates.ronaldo) && t("The displayed rates round to the same value; the unrounded rates differ.")}</p>
    <p>{t("These calculations use the table’s goals and playing sample. Rates do not adjust for opponents, teammates or role.")}</p>
  </section>;
}
