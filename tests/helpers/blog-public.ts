import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { articles } from "../../src/lib/articles";
import { readArticleIndex, readMediaVisibility, readPublicPosts } from "../../src/lib/blog/public-store";
import { mediaChunkBytes, mergeArticleIndex, mergePublished, readMediaChunk, readMediaSize, readPosts, saveMedia, seedPost, writePost } from "../../src/lib/blog/store";

// Exercise identical privacy and publication behavior through both SQL engines.
export async function checkPublicBlogReads(db?: Database.Database) {
  const cover = await saveMedia(Buffer.from("cover bytes"), db);
  const inlineBytes = randomBytes(mediaChunkBytes * 2 + 17);
  const inline = await saveMedia(inlineBytes, db);
  const coverId = cover.split("/").at(-1)!;
  const inlineId = inline.split("/").at(-1)!;
  const command = { id: randomUUID(), locale: "es" as const, slug: `public-${randomUUID()}`, revision: 0, action: "save", draft: {
    title: "Published title", description: "A synthetic public article.", category: "Test", summary: "", citations: [], image: { path: cover, alt: "Cover" },
    body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Published body" }] },
      { type: "blockquote", content: [{ type: "image", attrs: { src: inline, alt: "Nested inline" } }] }] },
  } };
  let post = await writePost(command, db);
  assert.equal((await readPosts(db, "es")).some(entry => entry.id === post.id), true);
  assert.equal((await readPosts(db, "en")).some(entry => entry.id === post.id), false);
  assert.equal(await readMediaVisibility(coverId, db), false);
  assert.equal(await readMediaVisibility(inlineId, db), false);
  post = await writePost({ ...command, action: "publish", revision: post.revision }, db);
  assert.equal(await readMediaVisibility(coverId, db), true);
  assert.equal(await readMediaVisibility(inlineId, db), true);
  assert.equal(await readMediaVisibility(`${randomUUID()}.webp`, db), false);
  const unpublishedImage = await saveMedia(Buffer.from("private replacement"), db);
  post = await writePost({ ...command, revision: post.revision, draft: { ...command.draft, title: "PRIVATE DRAFT TITLE", image: { path: unpublishedImage, alt: "Private" } } }, db);
  assert.equal(await readMediaVisibility(unpublishedImage.split("/").at(-1)!, db), false);
  const publicPosts = await readPublicPosts("es", db);
  assert.equal(publicPosts.some(entry => entry.locale !== "es"), false);
  const projection = publicPosts.find(entry => entry.slug === post.slug)!;
  assert.equal(projection.published?.title, "Published title");
  assert.equal("draft" in projection, false);
  assert.equal(JSON.stringify(publicPosts).includes("PRIVATE DRAFT TITLE"), false);
  const index = await readArticleIndex(db);
  const summary = index.find(entry => entry.slug === post.slug)!;
  assert.equal(summary.published?.title, "Published title");
  assert.equal("body" in summary.published!, false);
  assert.equal(JSON.stringify(summary).includes("PRIVATE DRAFT TITLE"), false);
  assert.equal(mergeArticleIndex("en", index).some(entry => entry.slug === post.slug), false);
  assert.equal(mergeArticleIndex("es", index).some(entry => entry.slug === post.slug), true);
  assert.equal(await readMediaSize(inlineId, db), inlineBytes.length);
  const parts = await Promise.all([0, mediaChunkBytes, mediaChunkBytes * 2].map(offset => readMediaChunk(inlineId, offset, db)));
  assert.deepEqual(Buffer.concat(parts as Buffer[]), inlineBytes);
  assert.equal(await readMediaSize("missing.webp", db), null);
  assert.equal(await readMediaChunk("missing.webp", 0, db), null);
  post = await writePost({ ...command, action: "unpublish", revision: post.revision }, db);
  assert.equal(await readMediaVisibility(coverId, db), false);
  assert.equal(await readMediaVisibility(inlineId, db), false);
  assert.equal(mergeArticleIndex("es", await readArticleIndex(db)).some(entry => entry.slug === post.slug), false);
  // Unpublished built-in overrides must continue suppressing the built-in copy.
  const seed = seedPost(articles[0], "es");
  const savedSeed = await writePost({ ...seed, action: "save" }, db);
  assert.equal(mergePublished("es", await readPublicPosts("es", db)).some(entry => entry.slug === seed.slug), true);
  await writePost({ ...savedSeed, action: "delete" }, db);
  assert.equal(mergePublished("es", await readPublicPosts("es", db)).some(entry => entry.slug === seed.slug), false);
  assert.equal(mergeArticleIndex("es", await readArticleIndex(db)).some(entry => entry.slug === seed.slug), false);
  assert.equal(mergeArticleIndex("en", await readArticleIndex(db)).some(entry => entry.slug === seed.slug), true);
}
