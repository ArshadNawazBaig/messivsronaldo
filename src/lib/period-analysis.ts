import type { Pair } from "./data";

export type PeriodSample = { goals: Pair; assists: Pair; minutes: Pair; appearances: Pair };
export type PeriodChange = { goals: number; assists: number; minutes: number; rate: number | null };

// Interpret the published sample, never infer causes, missing minutes or future output.
export function periodAnalysis(current: PeriodSample, previous?: PeriodSample) {
  const contribution = (id: keyof Pair) => current.goals[id] + current.assists[id];
  const rate = (sample: PeriodSample, id: keyof Pair) => sample.minutes[id] > 0 ? sample.goals[id] * 90 / sample.minutes[id] : null;
  const rates = { messi: rate(current, "messi"), ronaldo: rate(current, "ronaldo") };
  const commonMinutes = Math.min(current.minutes.messi, current.minutes.ronaldo);
  const changes = previous ? Object.fromEntries((["messi", "ronaldo"] as const).map(id => {
    const before = rate(previous, id);
    return [id, { goals: current.goals[id] - previous.goals[id], assists: current.assists[id] - previous.assists[id],
      minutes: current.minutes[id] - previous.minutes[id], rate: rates[id] !== null && before !== null ? rates[id]! - before : null }];
  })) as Record<keyof Pair, PeriodChange> : undefined;
  return {
    rates, commonMinutes,
    equalMinutes: commonMinutes > 0 ? {
      messi: current.goals.messi * commonMinutes / current.minutes.messi,
      ronaldo: current.goals.ronaldo * commonMinutes / current.minutes.ronaldo,
    } : null,
    goalsGap: current.goals.messi - current.goals.ronaldo,
    contributionGap: contribution("messi") - contribution("ronaldo"),
    contributions: { messi: contribution("messi"), ronaldo: contribution("ronaldo") },
    changes,
  };
}

// Editorial observations tied to the checked club-season snapshot. These are
// interpretations of the record, not invented match reports or causal claims.
export const clubSeasonNotes: Record<string, string> = {
  "2002-2003": "This is the opening of Ronaldo’s recorded club career, not a head-to-head season. Messi has no senior playing sample here. The useful question is how Ronaldo’s balance of goals and assists develops in later seasons; a zero beside Messi cannot establish a difference in ability.",
  "2003-2004": "Ronaldo’s additional playing time does not produce a matching jump in goals from the previous season. That separates gaining a larger playing role from scoring more frequently. Messi still has no recorded senior minutes, so an equal-time comparison would invent a sample that does not exist.",
  "2004-2005": "Messi’s first scoring sample is only 234 minutes. One extra goal would double his displayed scoring rate. Ronaldo’s much larger sample makes his total more established, but the nine-to-one goal comparison cannot be read as a nine-to-one difference in performance.",
  "2005-2006": "The goal gap narrows despite Messi playing less than half Ronaldo’s minutes. This is an early example of total output and scoring frequency answering different questions. The record establishes the opportunity gap; it does not tell us whether selection, fitness or team tactics caused it.",
  "2006-2007": "Assists widen a comparison that goals alone make look closer. Ronaldo’s recorded involvement in the final pass adds substantially to his scoring output. That is a reason to examine both columns, while remembering that an assist count omits the earlier work in a move.",
  "2007-2008": "The players’ changes from the previous season point in different directions. Ronaldo’s goal total rises sharply, while Messi’s largest increase is in assists. A single goals-only ranking would conceal that distinction, although the numbers alone cannot establish either player’s tactical role.",
  "2008-2009": "The goal-total lead reverses from the previous season. Messi scores more despite recording fewer minutes than Ronaldo, so playing-time volume alone cannot explain the new lead. The simultaneous assist comparison makes this a broader change in recorded attacking output.",
  "2009-2010": "The larger goal total and the higher scoring rate belong to different players. Messi’s extra minutes matter to the final tally; Ronaldo’s shorter sample produces goals more frequently. An equal-minute calculation makes that distinction visible without pretending the opponents or chances were identical.",
  "2010-2011": "Equal goal totals make this an unusually clean starting point for asking what the headline omits. The minute totals are close, but the assist totals are not. Adding assists changes the comparison without changing a single goal, which shows why the chosen metric must match the question.",
  "2011-2012": "Messi leads both goals and recorded assists in a very large playing sample. The size of the goal total is not simply the result of playing more minutes: the rate comparison also favours him. Keep the all-competition total separate from the famous league-only scoring record.",
  "2012-2013": "Messi’s goal total falls from his previous season while his scoring frequency rises. Fewer recorded minutes explain how those statements can coexist. Calling the lower total a decline in finishing would therefore go beyond what this record establishes.",
  "2013-2014": "Recorded assists are equal, so including them preserves the absolute gap in goals plus assists. The Champions League archive adds another question: how much of each player’s output belongs to Europe? Keep that subset separate instead of adding it to the club total again.",
  "2014-2015": "Ronaldo’s goal lead becomes a Messi lead when recorded assists are included. That reversal is the central finding of this season’s comparison. It is not a formula for the better player: a goal and an assist describe different actions, and neither measures the whole attacking contribution.",
  "2015-2016": "The minute totals are close, which limits how much the goal gap can be attributed to playing-time volume. Messi’s assist advantage narrows the difference in combined output. Read that alongside the separate league and European samples before treating all matches as equivalent.",
  "2016-2017": "Messi’s club goal lead coexists with Ronaldo’s higher goal total in the Champions League archive. The answer changes when the competition changes. This is why a European tournament comparison cannot stand in for the full club season, or vice versa.",
  "2017-2018": "A one-goal difference hides a much larger difference in minutes. Messi leads the total; Ronaldo leads goals per 90. Assists then bring their combined per-90 figures close together. This season rewards reading volume, frequency and final-pass involvement in that order.",
  "2018-2019": "Messi’s lead remains substantial after accounting for recorded playing time. That distinguishes this season from cases where a larger total comes with a lower rate. The calculation still does not equalise competitions, teammates or chance quality, so it describes the samples rather than a controlled contest.",
  "2019-2020": "Ronaldo leads goals, but Messi’s assist total reverses the ranking for goals plus assists. The size of that reversal makes a goals-only summary particularly incomplete. It still cannot prove how much either player created before the final pass or how their teams distributed attacking work.",
  "2020-2021": "A narrow Messi lead in goals becomes a Ronaldo lead in goals per 90 because their minute totals differ. Adding assists gives another perspective on Messi’s output. Each result is valid within its definition; choosing one without naming the denominator would obscure the comparison.",
  "2021-2022": "Messi records more assists than goals, while Ronaldo’s contributions are much more concentrated in finishing. This is a change in the composition of recorded output, not proof of a specific position. Compare each player with his own previous season before drawing conclusions from their head-to-head totals.",
  "2022-2023": "Messi’s goals and assists are almost balanced in this sample. Ronaldo’s output is more concentrated in goals, with fewer recorded minutes. The difference is useful for describing final actions, but assists should not be treated as a complete measure of creativity.",
  "2023-2024": "Ronaldo scores twice as many goals while playing almost twice as many minutes. The rate comparison is consequently much closer than the total suggests. Messi’s record is aligned to Ronaldo’s season dates here; it is not his complete MLS calendar season.",
  "2024-2025": "A two-goal Ronaldo lead reverses on a per-90 basis. Messi’s assist advantage also changes the combined-output comparison. The aligned date window makes these arithmetic comparisons possible, but it cannot make the two leagues equally difficult.",
  "2025-2026": "The recorded minutes and goal totals are close, while the assist totals are far apart. That makes final-pass involvement the main source of the gap in combined output. The source’s assist convention and aligned club-season window are essential to interpreting this difference.",
  "2026-2027": "This is an unfinished, uneven playing sample. Comparing its totals with a completed season would turn a shorter observation window into an apparent decline. Use the dated rates cautiously and return after further updates; this record does not support a full-season forecast.",
};
