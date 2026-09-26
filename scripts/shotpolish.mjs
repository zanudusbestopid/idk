// Screenshots of the in-game polish: turn banner, card reveal, deed fly, pause menu, game over.
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`console ${m.text()}`); });
await page.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.click('.count-row button:has-text("2")');
await page.click('.diff-row button:has-text("Hard")');
await page.screenshot({ path: 'shots/polish-setup.png' });
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/polish-turn-toast.png' });
// pause menu
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/polish-pause.png' });
await page.click('#pause-resume');
await page.waitForTimeout(300);
// deed fly: force 1+2 → Baltic Avenue, buy
await page.evaluate(() => window.__pt.forceRoll(1, 2));
await page.click('.actions button:has-text("Roll dice")');
await page.waitForSelector('.dialog button:has-text("Buy for")', { timeout: 15000 });
await page.click('.dialog button:has-text("Buy for")');
for (let i = 0; i < 4; i++) { await page.waitForTimeout(220); await page.screenshot({ path: `shots/polish-deed-fly-${i}.png` }); }
await page.waitForTimeout(1200);
await page.click('.actions button:has-text("End turn")');
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/polish-turn-toast.png' });
// wait for my turn again, then force 2+2 from Baltic (3) → Chance (7)
await page.waitForSelector('.actions button:has-text("Roll dice"):enabled', { timeout: 60000 });
await page.evaluate(() => window.__pt.forceRoll(2, 2));
await page.click('.actions button:has-text("Roll dice")');
await page.waitForSelector('.card-pop', { timeout: 20000 }).catch(() => {});
for (let i = 0; i < 4; i++) { await page.waitForTimeout(500); await page.screenshot({ path: `shots/polish-card-${i}.png` }); }
for (let i = 0; i < 6; i++) { if (await page.locator('.card-pop').count()) await page.click('.card-pop').catch(() => {}); await page.waitForTimeout(500); }
// game over: every bot resigns
await page.evaluate(() => { const pt = window.__pt; for (const p of pt.local.state.players) if (p.id !== 'you' && !p.bankrupt) pt.local.debugApply(p.id, { type: 'resign' }); });
await page.waitForTimeout(1800);
await page.screenshot({ path: 'shots/polish-victory-1.png' });
await page.waitForTimeout(2200);
await page.screenshot({ path: 'shots/polish-victory-2.png' });
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close();
