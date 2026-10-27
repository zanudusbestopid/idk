// Captures a paper flip: forces the human's standee to turn around and screenshots the turn.
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
// walk to Oriental Avenue (2+4) so the standee stands alone, then hide the buy dialog and force a turn-around
await page.evaluate(() => window.__pt.forceRoll(2, 4));
await page.click('.actions button:has-text("Roll dice")');
await page.waitForTimeout(6500);
await page.addStyleTag({ content: '.modal, .modal-backdrop, dialog, .overlay { display:none !important }' });
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/flip-0.png' });
await page.evaluate(() => { const b = window.__pt.screen.board; const t = b.tokens.get('you'); t.facing = -t.facing; });
const times = [40, 120, 200, 280, 360, 600];
let elapsed = 0;
for (const t of times) { await page.waitForTimeout(t - elapsed); elapsed = t; await page.screenshot({ path: `shots/flip-${t}.png` }); }
const info = await page.evaluate(() => { const t = window.__pt.screen.board.tokens.get('you'); return { yaw: t.yaw, facing: t.facing, flip: t.flip }; });
console.log(JSON.stringify(info));
await browser.close();
