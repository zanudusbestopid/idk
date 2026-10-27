// Gives the human a few built-up properties and screenshots the buildings on the board.
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
await page.evaluate(() => {
  const g = window.__pt.local;
  const props = { ...g.state.properties, 1: { owner: 'you', houses: 3, mortgaged: false }, 3: { owner: 'you', houses: 5, mortgaged: false }, 6: { owner: 'bot1', houses: 2, mortgaged: false }, 8: { owner: 'bot1', houses: 0, mortgaged: true }, 5: { owner: 'bot2', houses: 0, mortgaged: false } };
  g.state = { ...g.state, properties: props };
  window.__pt.screen.board.updateStatic(g.state);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'shots/build-follow.png' });
await page.evaluate(() => { window.__pt.screen.board.focusSpace = 2; });
await page.waitForTimeout(2200);
await page.screenshot({ path: 'shots/build-focus.png' });
await browser.close();
