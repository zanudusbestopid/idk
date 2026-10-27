// Title screen screenshots over time, then the Start transition.
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
async function mk(vp) {
  const ctx = await browser.newContext({ viewport: vp });
  await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`console ${m.text()}`); });
  return page;
}
const page = await mk({ width: 1400, height: 900 });
const t0 = Date.now();
await page.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
for (const [ms, name] of [[1800, 'title-a'], [9000, 'title-b'], [20000, 'title-c'], [29000, 'title-d']]) {
  const wait = ms - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/${name}.png` });
}
await page.click('.token-pick[title="Rocket"]');
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/title-token-changed.png' });
await page.click('#setup-start');
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/title-transition-1.png' });
await page.waitForTimeout(1600);
await page.screenshot({ path: 'shots/title-transition-2.png' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/title-transition-3.png' });
const mobile = await mk({ width: 390, height: 844 });
await mobile.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await mobile.waitForSelector('#setup-start');
await mobile.waitForTimeout(1500);
await mobile.screenshot({ path: 'shots/title-mobile.png' });
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close();
