// Freezes a paper flip at fixed progress points and screenshots each.
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file://' + resolve(process.env.PT_HTML ?? 'dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(2500);
await page.evaluate(() => window.__pt.forceRoll(2, 4));
await page.click('.actions button:has-text("Roll dice")');
await page.waitForTimeout(6500);
await page.addStyleTag({ content: '.modal, .modal-backdrop, dialog, .overlay { display:none !important }' });
await page.waitForTimeout(400);
for (const prog of [0.2, 0.5, 0.8]) {
  await page.evaluate((p) => { const t = window.__pt.screen.board.tokens.get('you'); const MS = 1e7; t.flip = { from: t.yaw, to: t.yaw + Math.PI, start: performance.now() - MS * p, ms: MS }; }, prog);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/flipmid-${prog}.png` });
}
await browser.close();
