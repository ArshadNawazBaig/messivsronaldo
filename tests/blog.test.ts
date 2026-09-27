import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { openStore } from "../src/lib/admin/store";
import { articles } from "../src/lib/articles";
import { cleanDocument, draftSchema, emptyDocument, seedDraft, type BlogDraft, type RichNode } from "../src/lib/blog/model";
import { mediaIsPublic, mergePublished, readMedia, readPosts, saveMedia, seedPost, writePost } from "../src/lib/blog/store";
import { getPublicPages } from "../src/lib/public-pages";
import { relatedContent } from "../src/lib/content-discovery";

const body = (text: string): RichNode => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const draft = (title = "A synthetic article"): BlogDraft => ({ title, description: "An isolated test article, not real football news.", category: "Testing", summary: "", image: null, citations: [], body: body("Original published text") });

test("blog lifecycle isolates drafts, rejects stale edits, publishes per language, and restores from Trash", async () => {
  const db = openStore(":memory:");
  try {
    const command = { id: randomUUID(), locale: "es", slug: "test-story", revision: 0, draft: draft(), action: "save" };
    let post = await writePost(command, db);
    assert.equal(post.revision, 1);
    assert.equal(mergePublished("es", await readPosts(db)).some(article => article.slug === post.slug), false);
    await assert.rejects(writePost({ ...command, action: "publish" }, db), /another session/);
    post = await writePost({ ...command, action: "publish", revision: post.revision }, db);
    assert.equal(post.published?.title, command.draft.title);
    assert.equal(mergePublished("en", await readPosts(db)).some(article => article.slug === post.slug), false);
    assert.equal(mergePublished("es", await readPosts(db))[0].slug, post.slug);
    const firstPublished = post.published?.published;
    post = await writePost({ ...command, revision: post.revision, draft: draft("Draft edit") }, db);
    assert.equal(post.draft.title, "Draft edit"); assert.equal(post.published?.title, command.draft.title); assert.equal(post.draftChanged, true);
    post = await writePost({ ...command, revision: post.revision, action: "publish", draft: post.draft }, db);
    assert.equal(post.published?.title, "Draft edit"); assert.equal(post.published?.published, firstPublished);
    const published = mergePublished("es", await readPosts(db));
    assert.ok(getPublicPages([], "2026-09-28", published).some(page => page.path === `/insights/${post.slug}`));
    assert.ok(relatedContent(`/insights/${post.slug}`, 4, published).length);
    post = await writePost({ ...command, revision: post.revision, action: "unpublish" }, db);
    assert.equal(post.published, null); assert.equal(post.deleted, false);
    post = await writePost({ ...command, revision: post.revision, action: "delete" }, db);
    assert.equal(post.deleted, true);
    await assert.rejects(writePost({ ...command, revision: post.revision, action: "publish" }, db), /Restore/);
    post = await writePost({ ...command, revision: post.revision, action: "restore", draft: undefined }, db);
    assert.equal(post.deleted, false); assert.equal(post.published, null); assert.equal(post.draft.title, "Draft edit");
  } finally { db.close(); }
});

test("existing articles retain live content until publication and never reappear after deletion", async () => {
  const db = openStore(":memory:");
  try {
    const original = articles.find(article => article.preset)!;
    const seed = seedPost(original, "en");
    const command = { action: "save", id: seed.id, slug: seed.slug, locale: seed.locale, revision: 0, draft: { ...seed.draft, title: "Edited guide" } };
    let post = await writePost(command, db);
    assert.equal(mergePublished("en", await readPosts(db)).find(article => article.slug === seed.slug)?.title, original.title);
    post = await writePost({ ...command, action: "publish", revision: post.revision }, db);
    assert.equal(post.published?.title, "Edited guide"); assert.deepEqual(post.published?.preset, original.preset);
    post = await writePost({ ...command, action: "delete", revision: post.revision }, db);
    const entries = mergePublished("en", await readPosts(db));
    assert.equal(entries.some(article => article.slug === seed.slug), false);
    assert.equal(mergePublished("es", await readPosts(db)).some(article => article.slug === seed.slug), true);
    assert.equal(relatedContent("/scoring-calculator", 50, entries).some(item => item.path === `/insights/${seed.slug}`), false);
    assert.equal(getPublicPages([], "2026-09-28", entries).some(item => item.path === `/insights/${seed.slug}`), false);
    await assert.rejects(writePost({ ...command, id: randomUUID() }, db), /existing article/);
    post = await writePost({ ...command, action: "restore", revision: post.revision, draft: undefined }, db);
    assert.equal(post.published, null); assert.equal(post.deleted, false);
    for (const article of articles) assert.doesNotThrow(() => draftSchema.parse(seedDraft(article)));
  } finally { db.close(); }
});

test("article identity and unique URLs are protected against competing writers", async () => {
  const db = openStore(":memory:");
  try {
    const command = { id: randomUUID(), locale: "en", slug: "unique-test", revision: 0, action: "save", draft: draft() };
    const first = await Promise.allSettled([writePost(command, db), writePost({ ...command, id: randomUUID() }, db)]);
    assert.equal(first.filter(result => result.status === "fulfilled").length, 1);
    const [post] = await readPosts(db);
    await assert.rejects(writePost({ ...command, id: post.id, revision: 1, slug: "changed-url" }, db), /cannot change/);
    const edits = await Promise.allSettled([1, 2].map(number => writePost({ ...command, id: post.id, revision: 1, draft: draft(`Concurrent ${number}`) }, db)));
    assert.equal(edits.filter(result => result.status === "fulfilled").length, 1);
    assert.equal((await readPosts(db))[0].revision, 2);
    await writePost({ ...command, id: randomUUID(), locale: "ar" }, db);
    assert.equal((await readPosts(db)).length, 2);
  } finally { db.close(); }
});

test("rich text rejects executable content, malformed documents and missing publication fields", async () => {
  const db = openStore(":memory:");
  try {
    for (const href of ["javascript:alert(1)", "data:text/html,hello", "//attacker.example", "/\\attacker.example", "https://x\n.example"]) assert.throws(() => cleanDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Link", marks: [{ type: "link", attrs: { href } }] }] }] }));
    assert.throws(() => cleanDocument({ type: "doc", content: [{ type: "script", text: "alert(1)" }] }));
    assert.throws(() => cleanDocument({ type: "doc", content: [{ type: "image", attrs: { src: "data:image/svg+xml,<svg/>" } }] }));
    assert.throws(() => cleanDocument({ type: "doc", content: [{ type: "text", text: "Invalid child" }] }));
    const cleaned = cleanDocument({ type: "doc", attrs: { onclick: "alert(1)" }, content: [{ type: "paragraph", attrs: { style: "bad" }, content: [{ type: "text", text: "<script>plain text</script>" }] }] });
    assert.equal(JSON.stringify(cleaned).includes("onclick"), false);
    const command = { id: randomUUID(), locale: "en", slug: "invalid", revision: 0, action: "publish", draft: { ...draft(), body: emptyDocument } };
    await assert.rejects(writePost(command, db), /article text/);
    await assert.rejects(writePost({ ...command, draft: { ...draft(), title: "" } }, db), /title/);
    assert.equal((await readPosts(db)).length, 0);
  } finally { db.close(); }
});

test("media persists independently and is public only when referenced by a published article", async () => {
  const db = openStore(":memory:");
  try {
    const data = Buffer.from("test-image-bytes"); const path = await saveMedia(data, db); const id = path.split("/").at(-1)!;
    assert.deepEqual(await readMedia(id, db), data);
    const command = { id: randomUUID(), locale: "en", slug: "with-image", revision: 0, action: "save", draft: { ...draft(), image: { path, alt: "Image description" } } };
    let post = await writePost(command, db);
    assert.equal(mediaIsPublic(id, await readPosts(db)), false);
    await assert.rejects(writePost({ ...command, action: "publish", revision: 1, draft: { ...command.draft, image: { path, alt: "" } } }, db), /alt text/);
    post = await writePost({ ...command, action: "publish", revision: post.revision }, db);
    assert.equal(mediaIsPublic(id, await readPosts(db)), true);
    await writePost({ ...command, action: "delete", revision: post.revision }, db);
    assert.equal(mediaIsPublic(id, await readPosts(db)), false);
    assert.deepEqual(await readMedia(id, db), data);
  } finally { db.close(); }
});
