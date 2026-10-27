// Close-ups of the corners, a few spaces and the board middle, for checking tile strips and clipping.
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HTML = process.env.PT_HTML ?? 'dist/paper-tycoon-solo.html';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto('file://' + resolve(HTML), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(2500);
for (const [i, name] of [[0, 'go'], [10, 'jail'], [20, 'parking'], [30, 'gotojail'], [2, 'mid'], [24, 'top-mid']]) {
  await page.evaluate((idx) => { window.__pt.screen.board.focusSpace = idx; }, i);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `shots/corner-${name}.png`, clip: { x: 305, y: 10, width: 770, height: 795 } });
}
await page.evaluate(() => { window.__pt.screen.board.focusSpace = null; });
await page.click('.cam-bar button:has-text("Top")');
await page.waitForTimeout(2200);
await page.screenshot({ path: 'shots/corner-topview.png', clip: { x: 305, y: 10, width: 770, height: 795 } });
await browser.close();
