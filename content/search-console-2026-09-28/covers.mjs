import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
const directory = '.artifacts/search-console-2026-09-28';
const drafts = JSON.parse(readFileSync(`${directory}/drafts.json`, 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const font = (path, type) => `data:font/${type};base64,${readFileSync(path).toString('base64')}`;
async function main() {
  mkdirSync(`${directory}/covers`, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for (const { command, cover } of drafts) {
      const values = [cover.left, cover.right].map(v => Number(v.replace(/\s/g, '')));
      await page.setContent(`<!doctype html><html lang="${esc(command.locale)}"><head><style>
        @font-face{font-family:Inter;src:url('${font('public/fonts/og/inter-latin-400.woff', 'woff')}')}@font-face{font-family:Display;src:url('${font('public/fonts/og/roboto-condensed-800.ttf', 'ttf')}')}@font-face{font-family:Arabic;src:url('${font('public/fonts/i18n/noto-sans-arabic.woff2', 'woff2')}')}
        *{box-sizing:border-box}body{margin:0;background:#f5f3ed;color:#1c2921;font-family:Inter,Arabic,sans-serif}.card{width:1200px;height:630px;padding:34px 48px;position:relative;overflow:hidden}.top{height:60px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #cbd1c5}.brand{display:flex;gap:10px;align-items:center}.brand svg{width:29px;height:33px}.brand strong{font-family:Display;font-size:27px;line-height:1}.brand small{font-size:10px;letter-spacing:3px;display:block}.issue{color:#5b6b60;font-size:12px;letter-spacing:2px;padding-top:10px}h1{font-family:Display,Arabic,sans-serif;font-size:46px;line-height:1.35;margin:21px 0 3px;white-space:nowrap}.scope{font-size:19px;color:#5b6b60;margin:0 0 24px}.players{display:grid;grid-template-columns:1fr 1fr;gap:20px}.player{height:276px;padding:27px 30px 24px;border-radius:14px;background:#1c2921;color:#f5f3ed;position:relative}.player::before{content:'';position:absolute;inset:0 0 auto;height:5px;border-radius:14px 14px 0 0;background:var(--color)}.name{font-size:15px;letter-spacing:3px}.value{font-family:Display;font-size:112px;line-height:1.25;letter-spacing:-2px;color:var(--color)}.bar{height:8px;background:#3b4840;border-radius:8px;margin-top:14px}.fill{height:100%;background:var(--color);border-radius:8px}.bottom{position:absolute;left:48px;right:48px;bottom:30px;padding-top:17px;border-top:1px solid #cbd1c5;display:flex;justify-content:space-between;font-size:13px;color:#5b6b60;letter-spacing:.8px}
      </style></head><body><main class="card"><div class="top"><div class="brand"><svg viewBox="0 0 39 38" aria-hidden="true"><path d="M0 33 11 4h6L6 33zm12 5L26 0h6L18 38zm13-9 8-22h6l-8 22z" fill="#74941d"/></svg><div><small>THE</small><strong>RIVALRY</strong></div></div><div class="issue">THE RECORD, IN CONTEXT</div></div><h1 dir="auto">${esc(cover.heading)}</h1><p class="scope" dir="auto">${esc(cover.label)}</p><div class="players">${['MESSI', 'RONALDO'].map((name, i) => `<div class="player" style="--color:${i ? '#eeaaa0' : '#85d2ed'}"><div class="name">${name}</div><div class="value">${esc(i ? cover.right : cover.left)}</div><div class="bar"><div class="fill" style="width:${values[i] / Math.max(...values) * 100}%"></div></div></div>`).join('')}</div><footer class="bottom"><span>MESSIVSRONALDO17.COM</span><span>${esc(cover.date)}</span></footer></main></body></html>`);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('h1,.scope,.value')].some(el => el.scrollWidth > el.clientWidth));
      if (overflow) throw new Error(`Cover overflow: ${command.locale}/${command.slug}`);
      const png = await page.locator('.card').screenshot();
      const image = await sharp(png).webp({ quality: 90 }).toBuffer();
      writeFileSync(`${directory}/covers/${command.locale}-${command.slug}.webp`, image);
    }
    console.log(`Generated ${drafts.length} original 1200×630 covers.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
