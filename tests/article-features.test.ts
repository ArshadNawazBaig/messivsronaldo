import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { articles } from "../src/lib/articles";
import { articleWordCount } from "../src/lib/blog/word-count";
import { seedDraft } from "../src/lib/blog/model";
import { locales } from "../src/lib/i18n/config";
import type { Article } from "../src/lib/article-types";

const minimums = [300, 400, 500, 400, 300, 1];

test("every feature edition meets the requested prose and section lengths", () => {
  assert.equal(articles.length, 9);
  for (const locale of locales) {
    const catalog = JSON.parse(readFileSync(`src/lib/i18n/article-messages/${locale}.json`, "utf8"));
    const shared = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
    for (const article of articles) {
      const label = `${locale}/${article.slug}`;
      assert.equal(article.sections.length, 6, label);
      if (locale !== "en") {
        assert.ok(shared[article.title] && shared[article.title] !== article.title, `${label}: localized headline missing`);
        assert.equal(catalog[article.title], shared[article.title], `${label}: page and metadata titles differ`);
        assert.equal(catalog[article.description], shared[article.description], `${label}: page and metadata descriptions differ`);
      }
      const paragraphs = new Set<string>();
      const counts = article.sections.map((section, index) => {
        const text = locale === "en" ? section.text : catalog[section.text];
        assert.ok(text, `${label}: missing section ${index + 1}`);
        assert.ok(!Object.hasOwn(shared, section.text), `${label}: long prose belongs in the server catalog`);
        const count = articleWordCount(text, locale);
        assert.ok(count >= minimums[index], `${label}: section ${index + 1} has ${count} words; needs ${minimums[index]}`);
        assert.ok(text.split(/\n\s*\n/).length >= 2, `${label}: paragraphs lost`);
        if (locale !== "en") assert.notEqual(text, section.text, `${label}: untranslated prose`);
        for (const paragraph of text.split(/\n\s*\n/)) {
          assert.ok(!paragraphs.has(paragraph), `${label}: repeated paragraph`);
          paragraphs.add(paragraph);
        }
        if (index === article.sections.length - 1) assert.match(text, /[?؟]\s*$/, `${label}: missing discussion question`);
        return count;
      });
      assert.ok(counts.reduce((sum, count) => sum + count, 0) >= 2000, `${label}: prose alone must exceed 2,000 words`);
    }
  }
});

test("the separate Thai CMS feature meets the same editorial requirements", () => {
  const article = JSON.parse(readFileSync("src/lib/article-features/th/messi-vs-ronaldo-stats-guide.json", "utf8")) as Article;
  assert.equal(article.sections.length, 6);
  let total = 0;
  article.sections.forEach((section, index) => {
    const words = articleWordCount(section.text, "th");
    assert.ok(words >= minimums[index], `Thai guide section ${index + 1}: ${words}`);
    total += words;
  });
  assert.ok(total >= 2000);
  assert.ok((article.citations?.length ?? 0) >= 3);
});

test("features have distinct paragraphs, discussion questions and primary references", () => {
  const paragraphs = new Set<string>();
  for (const article of articles) {
    const text = article.sections.map(section => section.text).join("\n\n");
    assert.doesNotMatch(text, /\b(delve|tapestry|testament|in conclusion|furthermore|dynamic landscape|it['’]s important to note|undeniably|ultimate debate)\b/i);
    assert.match(article.sections.at(-1)!.text, /\?$/);
    assert.ok((article.citations?.length ?? 0) >= 3);
    for (const paragraph of text.split(/\n\s*\n/)) {
      assert.ok(!paragraphs.has(paragraph), `${article.slug}: reused paragraph`);
      paragraphs.add(paragraph);
    }
  }
});

test("opening a feature in the CMS preserves translated paragraph boundaries", () => {
  const original = articles[0];
  const section = original.sections[0];
  const draft = seedDraft({ ...original, sections: [section], tables: [] }, value => value === section.text ? "Premier paragraphe.\n\nDeuxième paragraphe." : String(value));
  assert.deepEqual(draft.body.content?.filter(node => node.type === "paragraph").map(node => node.content?.[0].text), ["Premier paragraphe.", "Deuxième paragraphe."]);
});
