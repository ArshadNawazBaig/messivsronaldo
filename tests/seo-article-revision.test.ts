import assert from "node:assert/strict";
import test from "node:test";
import { prepareSeoArticle } from "../scripts/prepare-seo-articles";
import { documentText, publishedArticle, type BlogPost } from "../src/lib/blog/model";

const fixture: BlogPost = {
  id: "test-article", locale: "en", slug: "messi-ronaldo-penalty-records", revision: 7, draftChanged: false, deleted: false,
  createdAt: "2026-09-21", updatedAt: "2026-10-01",
  draft: { title: "Original title", description: "Original description", category: "Analysis", summary: "Original summary", image: null,
    citations: [{ title: "Original source", url: "https://example.com/source" }],
    body: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Existing analysis" }] }, { type: "paragraph", content: [{ type: "text", text: "Keep this analysis." }] }] } },
  published: { slug: "messi-ronaldo-penalty-records", title: "Original title", description: "Original description", category: "Analysis", sections: [], sourceIds: [], readTime: "2 min read", color: "blue", number: "01", published: "2026-09-21", updated: "2026-10-01", managed: true },
};

test("SEO drafts preserve existing analysis, sources and publication history", () => {
  const original = structuredClone(fixture);
  const command = prepareSeoArticle(fixture);
  assert.equal(command.action, "save");
  assert.equal(command.revision, 7);
  assert.equal(command.draft!.body.content![0].type, "table");
  assert.deepEqual(command.draft!.body.content!.slice(-2), fixture.draft.body.content);
  assert.deepEqual(command.draft!.citations, fixture.draft.citations);
  assert.match(documentText(command.draft!.body), /114 ÷ 149/);
  const article = publishedArticle({ ...fixture, draft: command.draft! }, "2026-10-15", fixture.published!);
  assert.equal(article.published, "2026-09-21");
  assert.match(article.summary!, /21 September 2026/);
  assert.deepEqual(fixture, original, "preparation must not mutate the source record");
  const repeated = prepareSeoArticle({ ...fixture, draft: command.draft! });
  assert.deepEqual(repeated.draft, command.draft, "do not duplicate the opening table on a repeated preparation");
});

test("pending editorial work and unrelated articles cannot be replaced", () => {
  assert.throws(() => prepareSeoArticle({ ...fixture, draftChanged: true }), /pending editorial draft/);
  assert.throws(() => prepareSeoArticle({ ...fixture, locale: "fr" }), /English/);
  assert.throws(() => prepareSeoArticle({ ...fixture, slug: "unrelated" }), /No SEO revision/);
});

test("the peak-year revision leaves its body intact for the shared study component", () => {
  const command = prepareSeoArticle({ ...fixture, slug: "messi-2012-vs-ronaldo-2013-goals" });
  assert.deepEqual(command.draft!.body, fixture.draft.body);
  assert.match(command.draft!.title, /Goals and Scoring Rates/);
  assert.match(command.draft!.summary, /91 goals in 69 appearances/);
});
