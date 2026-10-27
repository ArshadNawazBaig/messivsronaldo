// Publish only this reviewed three-language release through the existing CMS.
// Administrator credentials and session cookies stay in memory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { request } from '@playwright/test';
import { commandSchema, documentText, validatePublication } from '../../src/lib/blog/model.ts';
import { articleWordCount } from '../../src/lib/blog/word-count.ts';

const release = path.dirname(fileURLToPath(import.meta.url));
const artifacts = path.resolve('.artifacts/kane-ballon-dor-2026');
const origin = 'https://messivsronaldo17.com';
const slug = 'ballon-dor-winner-2026-harry-kane';
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const urlFor = post => `${origin}${post.locale === 'en' ? '' : `/${post.locale}`}/insights/${post.slug}`;
const writeReceipt = data => fs.writeFileSync(path.join(release, 'publication-receipts.json'), JSON.stringify(data, null, 2) + '\n');

async function main() {
  assert.equal(process.argv[2], '--publish-reviewed-editions', 'Explicit release flag required.');
  const { commands: input } = JSON.parse(fs.readFileSync(path.join(release, 'cms-payloads.json'), 'utf8'));
  const commands = input.map(value => commandSchema.parse(value));
  const validation = JSON.parse(fs.readFileSync(path.join(release, 'validation.json'), 'utf8'));
  assert.equal(commands.length, 3);
  assert.deepEqual(commands.map(command => command.locale), ['en', 'fr', 'es']);
  assert.equal(new Set(commands.map(command => command.id)).size, 3);
  for (const command of commands) {
    assert.equal(command.slug, slug);
    assert.equal(command.action, 'publish');
    assert.equal(command.revision, 0, 'Only create new article records.');
    validatePublication(command.draft);
    assert(articleWordCount(documentText(command.draft.body), command.locale) >= 1200);
    assert.equal(digest(command.draft), validation.find(row => row.locale === command.locale)?.draftHash, 'Draft changed after validation.');
  }
  fs.mkdirSync(artifacts, { recursive: true });
  const api = await request.newContext({ baseURL: origin, extraHTTPHeaders: { origin }, timeout: 45000 });
  let loggedIn = false;
  try {
    const password = fs.readFileSync('.artifacts/admin-access.txt', 'utf8').match(/^Password: (.+)$/m)?.[1];
    assert(password && process.env.ADMIN_EMAIL, 'Existing administrator credentials unavailable.');
    const login = await api.post('/api/admin/login', { data: { email: process.env.ADMIN_EMAIL, password } });
    assert.equal(login.status(), 200, 'Administrator sign-in failed.');
    loggedIn = true;
    async function readAll() {
      const posts = [];
      for (const locale of ['en', 'fr', 'es']) {
        const response = await api.get(`/api/admin/blog?locale=${locale}`);
        assert(response.ok(), `CMS read failed for ${locale}: HTTP ${response.status()}`);
        posts.push(...(await response.json()).posts);
      }
      return posts;
    }
    function verify(post, command) {
      assert.equal(post.id, command.id, `Another article occupies ${command.locale}/${slug}`);
      assert(post.published && !post.deleted && !post.draftChanged, `Article is not cleanly published: ${command.locale}`);
      assert.equal(digest(post.draft), digest(command.draft), `Saved draft differs: ${command.locale}`);
      assert.equal(digest(post.published.body), digest(command.draft.body), `Published body differs: ${command.locale}`);
      assert.equal(digest(post.published.citations), digest(command.draft.citations), `Published sources differ: ${command.locale}`);
      for (const key of ['title', 'description', 'category', 'summary']) assert.equal(post.published[key], command.draft[key], `Published ${key} differs: ${command.locale}`);
    }
    function receipt(post) {
      return { id: post.id, locale: post.locale, slug, title: post.published.title, url: urlFor(post), revision: post.revision, publishedAt: post.published.published, updatedAt: post.updatedAt, draftHash: digest(post.draft) };
    }
    const before = await readAll();
    const baseline = before.filter(post => post.slug !== slug).map(post => ({ id: post.id, revision: post.revision, hash: digest(post) }));
    fs.writeFileSync(path.join(artifacts, 'unrelated-records-before.json'), JSON.stringify(baseline, null, 2) + '\n');
    const receipts = [];
    // Reconcile the complete release before any write. Retries adopt only an
    // identical published record created with this release's own stable UUID.
    for (const command of commands) {
      const existing = before.find(post => post.locale === command.locale && post.slug === slug);
      if (existing) { verify(existing, command); receipts.push(receipt(existing)); }
    }
    console.log('Preflight passed for all three editions.');
    for (const command of commands) {
      if (receipts.some(row => row.id === command.id)) continue;
      const response = await api.post('/api/admin/blog', { data: command });
      assert(response.ok(), `Publication stopped for ${command.locale}: HTTP ${response.status()}`);
      const { post } = await response.json();
      verify(post, command);
      assert.equal(post.revision, 1);
      receipts.push(receipt(post));
      writeReceipt({ origin, releaseHash: digest(commands), receipts });
      console.log(`${receipts.length}/3 published: ${urlFor(post)}`);
    }
    const after = await readAll();
    for (const command of commands) {
      const post = after.find(value => value.id === command.id);
      assert(post, `Published article missing on reread: ${command.locale}`);
      verify(post, command);
    }
    const changedUnrelatedRecords = baseline.filter(prior => {
      const post = after.find(value => value.id === prior.id);
      return !post || digest(post) !== prior.hash;
    }).map(post => post.id);
    writeReceipt({ origin, releaseHash: digest(commands), verifiedAt: new Date().toISOString(), allThreeCmsRecordsVerified: true, unrelatedRecordsChecked: baseline.length, changedUnrelatedRecords, receipts });
    console.log(`All three CMS records verified; ${changedUnrelatedRecords.length} unrelated records changed during publication.`);
  } finally {
    if (loggedIn) await api.post('/api/admin/logout', { data: {} }).catch(() => {});
    await api.dispose();
  }
}

main().catch(error => {
  console.error(error instanceof assert.AssertionError ? error.message : 'Publication stopped. Reconcile CMS state before retrying.');
  process.exitCode = 1;
});
