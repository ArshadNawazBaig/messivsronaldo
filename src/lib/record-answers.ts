import type { ScopeId, SourceId } from "./data";
import type { PublishedData } from "./published-data";
import type { createTranslator } from "./i18n/translate";

export const answersUpdated = "2026-09-27";
type Translate = ReturnType<typeof createTranslator>;
export type RecordAnswer = {
  id: string; question: string; answer: string; detail: string;
  context: string; date: string; href: string; sourceIds: SourceId[];
};
const records: { id: string; question: string; scope: ScopeId; metric: string; href: string }[] = [
  { id: "career-goals", question: "How many career goals have Messi and Ronaldo scored?", scope: "career", metric: "goals", href: "/goals" },
  { id: "career-assists", question: "How many assists do Messi and Ronaldo have?", scope: "career", metric: "assists", href: "/assists" },
  { id: "appearances", question: "How many matches have Messi and Ronaldo played?", scope: "career", metric: "appearances", href: "/compare" },
  { id: "free-kicks", question: "How many direct free kicks have Messi and Ronaldo scored?", scope: "career", metric: "freeKicks", href: "/free-kicks" },
  { id: "penalties", question: "How many penalties have Messi and Ronaldo scored?", scope: "career", metric: "penalties", href: "/penalties" },
  { id: "hat-tricks", question: "How many hat-tricks have Messi and Ronaldo scored?", scope: "career", metric: "hatTricks", href: "/hat-tricks" },
  { id: "international", question: "How many international goals do Messi and Ronaldo have?", scope: "international", metric: "goals", href: "/international" },
  { id: "world-cup", question: "How many World Cup goals have Messi and Ronaldo scored?", scope: "world-cup", metric: "goals", href: "/world-cup" },
  { id: "champions-league", question: "How many Champions League goals have Messi and Ronaldo scored?", scope: "champions-league", metric: "goals", href: "/champions-league" },
  { id: "la-liga", question: "Who has more La Liga goals: Messi or Ronaldo?", scope: "la-liga", metric: "goals", href: "/la-liga" },
];

// Only a verified goal-type addition advances that metric's own date.
export function buildRecordAnswers(data: PublishedData, t: Translate): RecordAnswer[] {
  return records.flatMap(record => {
    const scope = data.scopes[record.scope];
    const metric = scope.metrics.find(item => item.id === record.metric);
    if (!metric) return [];
    return [{
      id: record.id, question: t(record.question),
      answer: t("{0}: Messi {1}; Ronaldo {2}.", { 0: t(metric.label), 1: metric.values.messi, 2: metric.values.ronaldo }),
      detail: `${t(metric.explanation)} ${t(scope.description)}`, context: t(scope.label),
      date: metric.updatedThrough ?? (metric.group === "scoring" ? data.baselineDate : scope.updatedThrough),
      href: record.href, sourceIds: [...metric.source],
    }];
  });
}
export function filterRecordAnswers(answers: RecordAnswer[], query: string) {
  const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return answers.filter(item => {
    const haystack = normalize(`${item.question} ${item.answer} ${item.context} ${item.detail}`);
    return words.every(word => haystack.includes(word));
  });
}
