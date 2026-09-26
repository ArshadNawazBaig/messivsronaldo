import { snapshotLabel, type Pair } from "./data";
import type { PublishedData } from "./published-data";
import type { createTranslator } from "./i18n/translate";

type Translate = ReturnType<typeof createTranslator>;
export const comparisonContentUpdated = "2026-09-26";
export const refreshedComparisons = new Set(["goals", "free-kicks", "la-liga", "honours", "assists", "penalties", "hat-tricks", "compare"]);

// Metadata and the visible introduction use the same published values. A new
// match must not make an older goal-type breakdown appear to be up to date.
export function comparisonIntro(slug: string, data: PublishedData, t: Translate, trophies?: Pair) {
  const career = data.scopes.career;
  if (slug === "goals") return t("Messi has {0} career goals and Ronaldo has {1}. Compare club and international totals, appearances and scoring rates. {2}.", { 0: career.goals.messi, 1: career.goals.ronaldo, 2: t(career.period) });
  if (slug === "free-kicks") {
    const metric = career.metrics.find(item => item.id === "freeKicks");
    if (!metric) return undefined;
    return t("Direct free-kick goals: Messi {0}, Ronaldo {1}. Compare their totals and see what counts as a free-kick goal. {2}.", { 0: metric.values.messi, 1: metric.values.ronaldo, 2: t(metric.coverage ?? `Through ${snapshotLabel}`) });
  }
  if (slug === "la-liga") {
    const liga = data.scopes["la-liga"];
    return t("Messi scored {0} La Liga goals in {1} appearances; Ronaldo scored {2} in {3}. Compare career totals and goals per game.", { 0: liga.goals.messi, 1: liga.appearances.messi, 2: liga.goals.ronaldo, 3: liga.appearances.ronaldo });
  }
  if (slug === "honours" && trophies) return t("Messi: {0} team trophies. Ronaldo: {1}. Compare the trophy list, counting rules and individual awards separately. {2}.", { 0: trophies.messi, 1: trophies.ronaldo, 2: t(`Through ${snapshotLabel}`) });
}

export function comparisonQuestions(slug: string, data: PublishedData, t: Translate) {
  const { career, club, international } = data.scopes;
  if (slug === "goals" || slug === "compare") return [
    { question: t("How many matches have Messi and Ronaldo played?"), answer: t("Messi has {0} career appearances and Ronaldo has {1}. A substitute appearance counts as one match. {2}.", { 0: career.appearances.messi, 1: career.appearances.ronaldo, 2: t(career.period) }), href: "/compare", link: t("Messi vs Ronaldo Comparison Explorer") },
    { question: t("How many goals have Messi and Ronaldo scored for club and country?"), answer: t("Messi: {0} club goals and {1} international goals. Ronaldo: {2} club goals and {3} international goals. {4}.", { 0: club.goals.messi, 1: international.goals.messi, 2: club.goals.ronaldo, 3: international.goals.ronaldo, 4: t(career.period) }), href: "/international", link: t("Messi vs Ronaldo International Goals & Assists — 2026") },
    { question: t("Do international friendlies and club friendlies count?"), answer: t("Career totals include senior competitive club games and recognized senior A internationals, including international friendlies.") + " " + t("Club friendlies, exhibitions, youth/reserve games and shootout kicks are excluded."), href: "/insights/what-counts-as-a-career-goal", link: t("How we count") },
  ];
  if (slug === "free-kicks") return [
    { question: t("What counts as a direct free-kick goal?"), answer: t("A direct free-kick goal is scored from the kick itself. A goal after a pass from a free kick is not a direct free-kick goal. Penalty goals are counted separately."), href: "/penalties", link: t("Messi vs Ronaldo Penalties: Scored, Missed & Conversion") },
    { question: t("How current are the free-kick totals?"), answer: t("Free-kick totals cover {0}. Later match updates can change career goals without changing this breakdown. Check each statistic’s cutoff before comparing totals.", { 0: t(snapshotLabel) }), href: "/updates", link: t("Published match updates") },
  ];
  if (slug === "la-liga") return [
    { question: t("Who has more La Liga goals: Messi or Ronaldo?"), answer: comparisonIntro(slug, data, t)!, href: "/scoring-calculator", link: t("Messi vs Ronaldo Scoring Calculator: Compare Seasons & Rates") },
    { question: t("Does this comparison cover only the years they both played in Spain?"), answer: t("These are their complete La Liga careers, including Messi’s seasons before Ronaldo arrived and after he left. Use the season archive for the shared 2009/10–2017/18 period."), href: "/seasons/2017-18", link: t("Messi vs Ronaldo, 2017/18") },
  ];
  if (slug === "honours") return [
    { question: t("Are Ballon d’Or awards included in the trophy total?"), answer: t("Overall trophy totals sum the team honours listed in the table, including youth and Olympic titles and the MLS conference championship. Ballon d’Or and other individual awards are separate. The table identifies youth and Olympic awards, conference championships and senior titles. The Supporters’ Shield and MLS Cup are different achievements. Participation exceptions for super cups are stated next to the category."), href: "/ballon-dor", link: t("Ballon d’Or") },
  ];
  return [];
}
