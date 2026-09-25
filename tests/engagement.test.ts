import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { buildPublishedData } from "../src/lib/published-data";
import { milestoneGames, normalizeMilestone, normalizeTimeline, quizQuestions, quizWinner, timelineRows } from "../src/lib/engagement";
import { toolPages, toolLinks, toolsUpdated } from "../src/lib/tools";
import { getPublicPages } from "../src/lib/public-pages";
import { locales } from "../src/lib/i18n/config";

const data = buildPublishedData();
test("quiz derives eight answers from published records, including ties and lower-is-better rates", () => {
  const questions = quizQuestions(data);
  assert.equal(questions.length, 8);
  assert.deepEqual(questions.map(q => quizWinner(q.values, q.lowerIsBetter)), ["ronaldo", "messi", "messi", "messi", "ronaldo", "messi", "ronaldo", "tie"]);
  assert.deepEqual(questions[7].values, { messi: 10, ronaldo: 10 });
  assert.equal(questions[2].lowerIsBetter, true);
  const edited = structuredClone(data);
  edited.scopes.career.metrics.find(m => m.id === "goals")!.values.messi = 1100;
  const changed = quizQuestions(edited)[0];
  assert.equal(quizWinner(changed.values), "messi", "answers must follow published corrections");
  for (const q of questions) assert.ok(q.explanation && q.href.startsWith("/"));
});
test("timeline totals reconcile with the career dataset and cumulative totals restart within the range", () => {
  for (const metric of ["goals", "assists", "contributions"]) {
    const state = normalizeTimeline(new URLSearchParams({ metric, cumulative: "1" }), data.calendarYears);
    const rows = timelineRows(data.calendarYears, state);
    for (const player of ["messi", "ronaldo"] as const) {
      const goals = data.scopes.career.goals[player];
      const assists = data.scopes.career.metrics.find(m => m.id === "assists")!.values[player];
      assert.equal(rows.at(-1)!.values[player], metric === "goals" ? goals : metric === "assists" ? assists : goals + assists);
    }
  }
  const state = normalizeTimeline(new URLSearchParams("from=2013&to=2012&cumulative=1"), data.calendarYears);
  assert.deepEqual(state, { from: 2012, to: 2013, metric: "goals", cumulative: true });
  const rows = timelineRows(data.calendarYears, state);
  assert.deepEqual(rows.map(r => r.values), [{ messi: 91, ronaldo: 63 }, { messi: 136, ronaldo: 132 }]);
  assert.deepEqual(rows[1].annual, { messi: 45, ronaldo: 69 });
  const single = timelineRows(data.calendarYears, { ...state, to: 2012 });
  assert.equal(single.length, 1);
  assert.deepEqual(single[0].values, rows[0].values);
  const invalid = normalizeTimeline(new URLSearchParams("from=NaN&to=9999&metric=bogus&cumulative=true"), data.calendarYears);
  assert.deepEqual(invalid, { from: 2002, to: 2026, metric: "goals", cumulative: false });
  assert.deepEqual(data, buildPublishedData(), "tool calculations must not mutate published data");
});
test("milestone scenarios handle zero pace, reached targets, whole appearances and floating point boundaries", () => {
  assert.equal(milestoneGames(979, 1000, 0.7), 30);
  assert.equal(milestoneGames(930, 1000, 0.8), 88);
  assert.equal(milestoneGames(979, 1000, 0.8), 27);
  assert.equal(milestoneGames(930, 900, 0), 0);
  assert.equal(milestoneGames(930, 1000, 0), null);
  for (const value of [NaN, Infinity, -1]) assert.equal(milestoneGames(930, 1000, value), null);
  assert.deepEqual(normalizeMilestone(new URLSearchParams("target=99999&messi=-3&ronaldo=0.735")), { target: 2000, messi: 0, ronaldo: 0.74 });
  assert.deepEqual(normalizeMilestone(new URLSearchParams("target=NaN&messi=Infinity&ronaldo=")), { target: 1000, messi: 0.8, ronaldo: 0.8 });
});
test("every tool and literal UI message has all translations and dated canonical sitemap entries", () => {
  const keys = new Set([...Object.values(toolPages).flatMap(p => Object.values(p)), ...toolLinks.flatMap(p => [p.label, p.description])]);
  for (const q of quizQuestions(data)) keys.add(q.prompt);
  for (const component of ["football-quiz", "career-timeline", "milestone-planner", "tool-cards"]) {
    const file = `src/components/${component}.tsx`;
    const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function collect(node: ts.Node) {
      if (ts.isStringLiteral(node)) keys.add(node.text);
      else if (ts.isConditionalExpression(node)) { collect(node.whenTrue); collect(node.whenFalse); }
    }
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(tree) === "t" && node.arguments[0]) collect(node.arguments[0]);
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  const pages = getPublicPages(data.calendarYears, data.snapshotDate);
  for (const slug of Object.keys(toolPages)) assert.equal(pages.find(p => p.path === `/${slug}`)?.updated, toolsUpdated);
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    for (const key of keys) assert.ok(messages[key], `${locale}: missing ${key}`);
  }
});
