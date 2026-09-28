import assert from "node:assert/strict";
import { test } from "node:test";
import { articleWordCount } from "../src/lib/blog/word-count";
import { publishedArticle, type BlogPost } from "../src/lib/blog/model";

test("Thai article length counts words without requiring spaces between them", () => {
  const sentence = "เมสซียิงประตูให้ทีมชาติอาร์เจนตินา";
  assert.ok(articleWordCount(sentence, "th") > 3);
  assert.equal(articleWordCount("  Goals and assists.  ", "en"), 3);
  assert.equal(articleWordCount("", "th"), 0);
  assert.equal(articleWordCount("  ", "en"), 0);
  const body = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: sentence.repeat(100) }] }] };
  const post = { locale: "th", slug: "thai-stats", draft: { title: "สถิติ", description: "ประตูและแอสซิสต์", category: "ฟุตบอล", summary: "", body, image: null, citations: [] }, published: null } as unknown as BlogPost;
  const article = publishedArticle(post, "2026-09-28");
  assert.ok(Number.parseInt(article.readTime) > 1, "A long Thai article must not collapse to a one-minute read");
});
