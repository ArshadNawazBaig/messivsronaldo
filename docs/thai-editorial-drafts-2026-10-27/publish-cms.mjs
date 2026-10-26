// Publish this fixed eight-article release through the existing authenticated
// CMS. Credentials stay in memory and never enter receipts or tool output.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { request } from '@playwright/test';
import { commandSchema, validatePublication } from '../../src/lib/blog/model.ts';

const release = path.dirname(fileURLToPath(import.meta.url));
const origin = 'https://messivsronaldo17.com';
const artifacts = path.resolve('.artifacts/thai-editorial-drafts-2026-10-27');
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const allowedSlugs = new Set([
  'ufabet-mobile-link-literacy', 'protect-accounts-after-data-exposure',
  'ufa169-names-and-website-identity', 'ufabet-official-website-claims',
]);
const urlFor = command => `${origin}${command.locale === 'en' ? '' : '/th'}/insights/${command.slug}`;
const writeJson = (name, value) => fs.writeFileSync(path.join(release, name), JSON.stringify(value, null, 2) + '\n');

async function main() {
  assert.equal(process.argv[2], '--publish-eight-reviewed-articles', 'Explicit release flag required.');
  const bundle = JSON.parse(fs.readFileSync(path.join(release, 'cms-payloads.json'), 'utf8'));
  const commands = bundle.commands.map(input => commandSchema.parse({ ...input, action: 'publish' }));
  assert.equal(commands.length, 8);
  assert.equal(new Set(commands.map(c => `${c.locale}/${c.slug}`)).size, 8);
  assert.equal(new Set(commands.map(c => c.id)).size, 8);
  for (const command of commands) {
    assert(['en', 'th'].includes(command.locale) && allowedSlugs.has(command.slug));
    assert.equal(command.revision, 0, 'This release only creates new records.');
    assert(command.draft);
    validatePublication(command.draft);
  }
  for (const slug of allowedSlugs) assert.equal(commands.filter(c => c.slug === slug).length, 2);
  fs.mkdirSync(artifacts, { recursive: true });
  const api = await request.newContext({ baseURL: origin, extraHTTPHeaders: { origin }, timeout: 45000 });
  let loggedIn = false;
  try {
    const password = fs.readFileSync('.artifacts/admin-access.txt', 'utf8').match(/^Password: (.+)$/m)?.[1];
    assert(password && process.env.ADMIN_EMAIL, 'Existing admin credentials unavailable.');
    const login = await api.post('/api/admin/login', { data: { email: process.env.ADMIN_EMAIL, password } });
    assert.equal(login.status(), 200, 'Administrator sign-in failed.');
    loggedIn = true;
    const readAll = async () => {
      const posts = [];
      for (const locale of ['en', 'th']) {
        const response = await api.get(`/api/admin/blog?locale=${locale}`);
        assert(response.ok(), `CMS read failed for ${locale}: HTTP ${response.status()}`);
        posts.push(...(await response.json()).posts);
      }
      return posts;
    };
    const before = await readAll();
    const baseline = before.filter(post => !allowedSlugs.has(post.slug)).map(post => ({
      id: post.id, revision: post.revision, hash: digest(post),
    }));
    fs.writeFileSync(path.join(artifacts, 'unrelated-records-before.json'), JSON.stringify(baseline, null, 2) + '\n');
    const receipts = [];
    const receiptFor = post => ({
      id: post.id, locale: post.locale, slug: post.slug, title: post.published.title,
      url: urlFor(post), revision: post.revision, publishedAt: post.published.published,
      updatedAt: post.updatedAt, draftHash: digest(post.draft),
    });
    const verifyPost = (post, command) => {
      assert.equal(post.id, command.id, `Different record occupies ${command.locale}/${command.slug}`);
      assert(!post.deleted && post.published && !post.draftChanged, `Record is not cleanly published: ${command.slug}`);
      assert.equal(digest(post.draft), digest(command.draft), `Saved draft differs: ${command.slug}`);
      assert.equal(digest(post.published.body), digest(command.draft.body), `Published body differs: ${command.slug}`);
      for (const key of ['title', 'description', 'category', 'summary']) {
        assert.equal(post.published[key], command.draft[key], `Published ${key} differs: ${command.slug}`);
      }
    };
    // Check the entire release before the first write. A retry adopts only an
    // identical published record with the release's own UUID; it never overwrites
    // an existing editor's article, pending draft, or deleted record.
    for (const command of commands) {
      const existing = before.find(p => p.locale === command.locale && p.slug === command.slug);
      if (existing) { verifyPost(existing, command); receipts.push(receiptFor(existing)); }
    }
    console.log('Preflight passed for all eight article URLs.');
    for (const command of commands) {
      if (receipts.some(receipt => receipt.id === command.id)) continue;
      const response = await api.post('/api/admin/blog', { data: command });
      assert(response.ok(), `Publication stopped for ${command.locale}/${command.slug}: HTTP ${response.status()}`);
      const { post } = await response.json();
      verifyPost(post, command);
      assert.equal(post.revision, 1);
      receipts.push(receiptFor(post));
      writeJson('publication-receipts.json', { origin, releaseHash: digest(commands), receipts });
      console.log(`${receipts.length}/8 published: ${urlFor(command)}`);
    }
    const after = await readAll();
    for (const command of commands) {
      const post = after.find(p => p.id === command.id);
      assert(post, `Published record missing on reread: ${command.slug}`);
      verifyPost(post, command);
    }
    const changedUnrelatedRecords = baseline.filter(prior => {
      const post = after.find(p => p.id === prior.id);
      return !post || digest(post) !== prior.hash;
    }).map(post => post.id);
    writeJson('publication-receipts.json', {
      origin, releaseHash: digest(commands), verifiedAt: new Date().toISOString(),
      allEightCmsRecordsVerified: true, unrelatedRecordsChecked: baseline.length,
      changedUnrelatedRecords, receipts,
    });
    console.log(`All eight CMS records reread successfully; ${changedUnrelatedRecords.length} unrelated records changed during publication.`);
  } finally {
    if (loggedIn) await api.post('/api/admin/logout', { data: {} }).catch(() => {});
    await api.dispose();
  }
}

main().catch(error => {
  // Never print a request dump, authentication payload, or environment value.
  console.error(error instanceof assert.AssertionError ? error.message : 'Publication stopped. Reconcile CMS state before retrying.');
  process.exitCode = 1;
});
