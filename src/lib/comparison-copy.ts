import { snapshotLabel, sources, type Pair, type ScopeId } from "./data";
import type { PublishedData } from "./published-data";
import type { createTranslator } from "./i18n/translate";

type Translate = ReturnType<typeof createTranslator>;
export const comparisonContentUpdated = "2026-10-06";
export const refreshedComparisons = new Set(["goals", "free-kicks", "la-liga", "honours", "assists", "penalties", "hat-tricks", "compare"]);
export const internationalAnswerUpdated = "2026-10-15";
export const comparisonContentRevisions: Record<string, string> = {
  "2026": "2026-10-26", goals: "2026-10-26", compare: "2026-10-26",
};

// Match imports must not replace distinct page topics with a shared generic
// description. Goal-type pages retain their own verified classification cutoff.
export function comparisonDescription(page: { description: string; scope?: ScopeId; scoring?: boolean; focusMetric?: string }, data: PublishedData, t: Translate) {
  if (!page.scope) return t(page.description);
  const scope = data.scopes[page.scope];
  const metric = scope.metrics.find(item => item.id === page.focusMetric);
  const cutoff = page.scoring ? metric?.updatedThrough ?? data.baselineDate : scope.updatedThrough;
  return `${t(page.description)} ${t("Data cutoff: ")}${t(cutoff)}.`;
}

// Metadata and the visible introduction use the same published values. A new
// match must not make an older goal-type breakdown appear to be up to date.
export function comparisonIntro(slug: string, data: PublishedData, t: Translate, trophies?: Pair) {
  const career = data.scopes.career;
  if (slug === "international") {
    const scope = data.scopes.international;
    const assists = scope.metrics.find(metric => metric.id === "assists");
    if (!assists) return undefined;
    return t("International records: Messi {0} goals and {1} assists; Ronaldo {2} goals and {3} assists. {4}. See the counting rules and sources.", { 0: scope.goals.messi, 1: assists.values.messi, 2: scope.goals.ronaldo, 3: assists.values.ronaldo, 4: t(scope.period) });
  }
  if (slug === "2026") {
    const year = data.scopes["2026"];
    return t("2026 goals so far: Messi {0}, Ronaldo {1}. Club and country, from 1 January. {2}. Compare assists, appearances and minutes.", { 0: year.goals.messi, 1: year.goals.ronaldo, 2: t(year.period) });
  }
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
  const year = data.scopes["2026"];
  const yearQuestion = {
    question: t("How many goals have Messi and Ronaldo scored in 2026?"),
    answer: t("In the 2026 calendar year, Messi has {0} goals and Ronaldo has {1}. {2}. These are senior club and international goals from 1 January, not all-time career totals. The match update log documents later additions.", { 0: year.goals.messi, 1: year.goals.ronaldo, 2: t(year.period) }),
    href: slug === "2026" ? "/updates" : "/2026",
    link: t(slug === "2026" ? "Published match updates" : "Messi vs Ronaldo 2026 Goals, Assists & Stats"),
  };
  if (slug === "2026") return [
    yearQuestion,
    { question: t("Are 2026 goals the same as career totals?"), answer: t("No. The 2026 comparison counts matches from 1 January 2026. Career totals cover all included senior seasons: Messi {0} goals and Ronaldo {1}. {2}. A goal scored in 2026 belongs to both views, so the two totals must not be added together.", { 0: career.goals.messi, 1: career.goals.ronaldo, 2: t(career.period) }), href: "/goals", link: t("Messi vs Ronaldo career goals") },
    { question: t("Where the figures come from"), answer: t(sources[year.source[0]].note), href: sources[year.source[0]].url, link: t(sources[year.source[0]].name) },
  ];
  if (slug === "international") {
    const assists = international.metrics.find(metric => metric.id === "assists");
    if (!assists) return [];
    return [
      { question: t("How many international assists does Ronaldo have?"), answer: t("Ronaldo has {0} international assists in this dataset. {1}. Assist totals follow the named provider’s definition.", { 0: assists.values.ronaldo, 1: t(international.period) }), href: "/methodology", link: t("Sources & counting rules") },
      { question: t("Why can international assist totals differ?"), answer: t("Assist totals depend on the matches covered and the provider’s definition of the final action before a goal. Compare definitions and cutoff dates. Our baseline source and later match additions are documented separately."), href: "/insights/why-assist-totals-differ", link: t("Why assist totals differ") },
      { question: t("Do international friendlies and club friendlies count?"), answer: t("Career totals include senior competitive club games and recognized senior A internationals, including international friendlies.") + " " + t("Club friendlies, exhibitions, youth/reserve games and shootout kicks are excluded."), href: "/insights/what-counts-as-a-career-goal", link: t("How we count") },
    ];
  }
  if (slug === "goals" || slug === "compare") return [
    { question: t("How many matches have Messi and Ronaldo played?"), answer: t("Messi has {0} career appearances and Ronaldo has {1}. A substitute appearance counts as one match. {2}.", { 0: career.appearances.messi, 1: career.appearances.ronaldo, 2: t(career.period) }), href: "/compare", link: t("Messi vs Ronaldo Comparison Explorer") },
    { question: t("How many goals have Messi and Ronaldo scored for club and country?"), answer: t("Messi: {0} club goals and {1} international goals. Ronaldo: {2} club goals and {3} international goals. {4}.", { 0: club.goals.messi, 1: international.goals.messi, 2: club.goals.ronaldo, 3: international.goals.ronaldo, 4: t(career.period) }), href: "/international", link: t("Messi vs Ronaldo International Goals & Assists — 2026") },
    { question: t("Do international friendlies and club friendlies count?"), answer: t("Career totals include senior competitive club games and recognized senior A internationals, including international friendlies.") + " " + t("Club friendlies, exhibitions, youth/reserve games and shootout kicks are excluded."), href: "/insights/what-counts-as-a-career-goal", link: t("How we count") },
    yearQuestion,
  ];
  if (slug === "free-kicks") return [
    { question: t("What counts as a direct free-kick goal?"), answer: t("A direct free-kick goal is scored from the kick itself. A goal after a pass from a free kick is not a direct free-kick goal. Penalty goals are counted separately."), href: "/penalties", link: t("Messi vs Ronaldo Penalties: Scored, Missed & Conversion") },
    { question: t("How current are the free-kick totals?"), answer: t("Free-kick coverage: {0}. Verified match classifications update this total. Check the update log for evidence and any remaining coverage gaps.", { 0: t(career.metrics.find(metric => metric.id === "freeKicks")?.coverage ?? snapshotLabel) }), href: "/updates", link: t("Published match updates") },
  ];
  if (slug === "la-liga") return [
    { question: t("Who has more La Liga goals: Messi or Ronaldo?"), answer: comparisonIntro(slug, data, t)!, href: "/scoring-calculator", link: t("Messi vs Ronaldo Scoring Calculator: Compare Seasons & Rates") },
    { question: t("Does this comparison cover only the years they both played in Spain?"), answer: t("These are their complete La Liga careers, including Messi’s seasons before Ronaldo arrived and after he left. Use the season archive for the shared 2009/10–2017/18 period."), href: "/seasons/2017-18", link: t("Messi vs Ronaldo, 2017/18") },
  ];
  if (slug === "honours") return [
    { question: t("Are Ballon d’Or awards included in the trophy total?"), answer: t("Overall trophy totals sum the team honours listed in the table, including youth and Olympic titles and the MLS conference championship. Ballon d’Or and other individual awards are separate. The table identifies youth and Olympic awards, conference championships and senior titles. The Supporters’ Shield and MLS Cup are different achievements. Participation exceptions for super cups are stated next to the category."), href: "/ballon-dor", link: t("Ballon d’Or") },
  ];
  const scopeByPage: Record<string, ScopeId> = {
    "champions-league": "champions-league", international: "international", assists: "career", "2026": "2026",
    "world-cup": "world-cup", "copa-america-vs-euros": "copa-euros", "head-to-head": "head-to-head",
    clubs: "current-clubs", penalties: "career", "hat-tricks": "career", league: "league", "european-clubs": "european-clubs", records: "career",
  };
  const id = scopeByPage[slug];
  if (!id) return [];
  const scope = data.scopes[id];
  const metricId = slug === "assists" ? "assists" : slug === "penalties" ? "penalty-conversion" : slug === "hat-tricks" ? "hatTricks" : "goals-per-90";
  const metric = scope.metrics.find(item => item.id === metricId);
  const source = sources[scope.source[0]];
  return [
    ...(slug === "assists" ? [{ question: t("International goals and assists"), answer: comparisonIntro("international", data, t)!, href: "/international", link: t("International goals and assists") }] : []),
    { question: t("The comparison boundaries"), answer: t(scope.description), href: "/methodology", link: t("Sources & methodology") },
    ...(metric ? [{ question: t(metric.label), answer: `${t(metric.explanation)}${metric.coverage ? ` ${t(metric.coverage)}.` : ""}`, href: `/glossary#${metric.id}`, link: t("Football statistics glossary") }] : []),
    { question: t("Where the figures come from"), answer: t(source.note), href: source.url, link: t(source.name) },
  ];
}
