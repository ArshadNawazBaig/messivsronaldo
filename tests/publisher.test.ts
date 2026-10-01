import assert from "node:assert/strict";
import test from "node:test";
import { publisherConfiguration } from "../src/lib/publisher-config";
import { publicAnalyticsEvent } from "../src/lib/analytics-privacy";
import { articleReadingMinutes } from "../src/lib/article-reading-time";
import { articles } from "../src/lib/articles";

test("AdSense verification requires a real-shaped ID and analytics can be disabled", () => {
  assert.equal(publisherConfiguration({}).adsensePublisherId, undefined);
  assert.equal(publisherConfiguration({ ADSENSE_PUBLISHER_ID: "pub-invalid" }).adsensePublisherId, undefined);
  assert.equal(publisherConfiguration({ ADSENSE_PUBLISHER_ID: "ca-pub-1234567890123456" }).adsensePublisherId, "pub-1234567890123456");
  assert.equal(publisherConfiguration({ VERCEL: "1" }).analyticsEnabled, true);
  assert.equal(publisherConfiguration({ VERCEL: "1", WEB_ANALYTICS_ENABLED: "false" }).analyticsEnabled, false);
});
test("analytics strips page query/fragment data and drops private routes", () => {
  assert.deepEqual(publicAnalyticsEvent({ type: "pageview", url: "https://example.com/contact?email=reader@example.com#private" }), { type: "pageview", url: "https://example.com/contact" });
  for (const path of ["/admin", "/admin/support", "/api/support"]) assert.equal(publicAnalyticsEvent({ type: "pageview", url: `https://example.com${path}` }), null);
});
test("public editorial identity requires both supplied facts and a safe optional profile", () => {
  assert.equal(publisherConfiguration({ ADMIN_EMAIL: "private@example.com" }).editor, undefined);
  assert.equal(publisherConfiguration({ EDITOR_NAME: "Editor" }).editor, undefined);
  assert.equal(publisherConfiguration({ EDITOR_NAME: "  ", EDITOR_BIO: "Biography" }).editor, undefined);
  const facts = { EDITOR_NAME: "  Example Editor  ", EDITOR_BIO: "  Owner-supplied biography.  " };
  assert.deepEqual(publisherConfiguration({ ...facts, EDITOR_PROFILE_URL: "https://example.com/editor" }).editor,
    { name: "Example Editor", biography: "Owner-supplied biography.", profileUrl: "https://example.com/editor" });
  for (const profile of ["javascript:alert(1)", "http://example.com", "https://user:password@example.com", "invalid"]) {
    assert.equal(publisherConfiguration({ ...facts, EDITOR_PROFILE_URL: profile }).editor!.profileUrl, undefined);
  }
});
test("reading estimates use rendered text, including translations and rich bodies", () => {
  const article = { ...articles[0], description: "", summary: undefined, tables: [], sections: [{ heading: "", text: "placeholder" }], readTime: "99 min read" };
  assert.equal(articleReadingMinutes(article, "en"), 1);
  assert.equal(articleReadingMinutes(article, "es", value => value === "placeholder" ? "palabra ".repeat(401) : String(value)), 3);
  assert.equal(articleReadingMinutes({ ...article, managed: true, sections: [], body: { type: "doc", content: [{ type: "text", text: "word ".repeat(201) }] } }, "en"), 2);
});
