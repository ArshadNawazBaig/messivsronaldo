// Publishes only the fixed, reviewed release. Credentials are read in memory;
// receipts contain public article identifiers and hashes, never session data.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { request } from '@playwright/test';
const origin = 'https://messivsronaldo17.com';
const release = 'content/content-quality-2026-10-15/';
const artifacts = '.artifacts/content-quality-2026-10-15/';
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function main() {
  if (process.argv[2] !== '--publish-reviewed-content') throw Error('Pass --publish-reviewed-content to publish the reviewed release.');
  const { commands } = JSON.parse(fs.readFileSync(release + 'commands.json', 'utf8'));
  assert.equal(commands.length, 102);
  assert.deepEqual(JSON.parse(fs.readFileSync(release + 'translation-review.json', 'utf8')), []);
  const preview = JSON.parse(fs.readFileSync(artifacts + 'preview-render-checks.json', 'utf8'));
  assert.equal(preview.length, 24);
  assert(preview.every(row => row.summaryMatches && row.anchorsValid && !row.overflow && row.axeViolations === 0));
  const priorReceipts = fs.existsSync(artifacts + 'publish-receipts.json') ? JSON.parse(fs.readFileSync(artifacts + 'publish-receipts.json','utf8')) : [];
  const receipts = [...priorReceipts];
  const api = await request.newContext({ baseURL: origin, extraHTTPHeaders: { origin }, timeout: 45000 });
  try {
    const password = fs.readFileSync('.artifacts/admin-access.txt', 'utf8').match(/^Password: (.+)$/m)?.[1];
    if (!password || !process.env.ADMIN_EMAIL) throw Error('Admin credentials unavailable.');
    const login = await api.post('/api/admin/login', { data: { email: process.env.ADMIN_EMAIL, password } });
    if (login.status() !== 200) throw Error('Login failed: ' + login.status());
    const posts = [];
    for (const locale of [...new Set(commands.map(c => c.locale))]) {
      const response = await api.get('/api/admin/blog?locale=' + locale);
      assert(response.ok(), 'CMS read failed: ' + locale);
      const data = await response.json();
      fs.writeFileSync(artifacts + locale + '-prepublication.json', JSON.stringify(data, null, 2));
      posts.push(...data.posts);
    }
    // Check the entire batch before the first write. A pending human edit or
    // changed revision stops the release instead of silently replacing it.
    for (const command of commands) {
      const current = posts.find(p => p.id === command.id);
      assert(current && current.published && !current.deleted && !current.draftChanged, 'Unavailable/pending article: ' + command.slug);
      const receipt = receipts.find(r => r.id === command.id);
      if (receipt) {
        assert.equal(current.revision, receipt.revision, 'Published article changed since receipt');
        assert.equal(digest(current.draft), receipt.draftHash, 'Published article no longer matches receipt');
        assert.equal(digest(command.draft), receipt.draftHash, 'Release changed since publication');
      } else {
        const baseline = JSON.parse(fs.readFileSync(artifacts + command.locale + '-before.json','utf8')).posts.find(p => p.id === command.id);
        assert.equal(current.revision, command.revision, 'Concurrent revision: ' + command.slug);
        assert.equal(digest(current.draft), digest(baseline.draft), 'Concurrent content change: ' + command.slug);
      }
    }
    console.log('All 102 current records match reviewed revisions; no pending drafts.');
    const first = ['messi-final-match-argentina-2026', 'messi-ronaldo-penalty-records', 'what-counts-as-a-career-goal'];
    const ordered = [...commands].sort((a,b) => (a.locale === 'en' && first.includes(a.slug) ? first.indexOf(a.slug) : 99) - (b.locale === 'en' && first.includes(b.slug) ? first.indexOf(b.slug) : 99));
    for (const command of ordered) {
      if (receipts.some(r => r.id === command.id)) continue;
      const response = await api.post('/api/admin/blog', { data: command });
      if (!response.ok()) throw Error(`Publication stopped at ${command.locale}/${command.slug}: HTTP ${response.status()}`);
      const { post } = await response.json();
      const before = posts.find(p => p.id === post.id);
      assert.equal(post.revision, command.revision + 1);
      assert.equal(post.draftChanged, false);
      assert.equal(digest(post.draft), digest(command.draft));
      assert.equal(post.published.published, before.published.published);
      assert.equal(post.published.image?.path, before.published.image?.path);
      receipts.push({ id: post.id, locale: post.locale, slug: post.slug, revision: post.revision, publishedAt: post.updatedAt, originalPublicationDate: post.published.published, draftHash: digest(post.draft) });
      fs.writeFileSync(artifacts + 'publish-receipts.json', JSON.stringify(receipts, null, 2));
      console.log(`${receipts.length}/102 published: ${post.locale}/${post.slug}`);
    }
    for (const locale of [...new Set(commands.map(c => c.locale))]) {
      const response = await api.get('/api/admin/blog?locale=' + locale);
      assert(response.ok());
      const data = await response.json();
      for (const command of commands.filter(c => c.locale === locale)) {
        const post = data.posts.find(p => p.id === command.id);
        assert.equal(digest(post.draft), digest(command.draft));
        assert.equal(digest(post.published.body), digest(command.draft.body));
        assert.equal(post.draftChanged, false);
      }
      fs.writeFileSync(artifacts + locale + '-after.json', JSON.stringify(data, null, 2));
    }
    fs.writeFileSync(release + 'publication-receipts.json', JSON.stringify(receipts, null, 2));
    console.log('All 102 live CMS records reread and verified.');
  } finally {
    await api.post('/api/admin/logout', { data: {} }).catch(() => {});
    await api.dispose();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
