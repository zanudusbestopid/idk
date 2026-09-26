// Screenshots of the 3D board (single-player page) for a visual check.
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
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`console ${m.text()}`); if (m.type() === 'warning') errors.push(`warn ${m.text()}`); });
  return page;
}
async function clickIf(page, sel) { const el = page.locator(sel).first(); if (await el.count() && await el.isEnabled().catch(() => false) && await el.isVisible().catch(() => false)) { await el.click({ timeout: 2000 }).catch(() => {}); return true; } return false; }
async function humanTurns(page, n) {
  for (let i = 0; i < n * 30; i++) {
    if (await clickIf(page, '.card-pop')) continue;
    if (await clickIf(page, '.dialog button:has-text("Buy for"):enabled')) { await page.waitForTimeout(400); continue; }
    if (await clickIf(page, '.dialog button:has-text("Decline"):enabled')) { await page.waitForTimeout(400); continue; }
    if (await clickIf(page, '.dialog .bidform:visible button:has-text("Pass"):enabled')) { await page.waitForTimeout(400); continue; }
    if (await clickIf(page, '.dialog button:has-text("Reject")')) continue;
    if (await clickIf(page, '.actions button:has-text("Roll dice"):enabled')) { await page.waitForTimeout(600); continue; }
    if (await clickIf(page, '.actions button:has-text("Roll for doubles"):enabled')) { await page.waitForTimeout(600); continue; }
    if (await clickIf(page, '.actions button:has-text("End turn"):enabled')) { n--; if (n <= 0) return; await page.waitForTimeout(400); continue; }
    await page.waitForTimeout(350);
  }
}
const page = await mk({ width: 1400, height: 900 });
await page.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.fill('#setup-name', 'Ava');
await page.click('.token-pick[title="Rubber Duck"]');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/3d-start.png' });
// mid-throw and just-landed shots of the human's first roll
await page.click('.actions button:has-text("Roll dice")');
await page.waitForTimeout(650);
await page.screenshot({ path: 'shots/3d-dice-air.png' });
await page.waitForTimeout(1600);
await page.screenshot({ path: 'shots/3d-dice-landed.png' });
await humanTurns(page, 2);
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/3d-follow-bot.png' });
await humanTurns(page, 2);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/3d-midgame.png' });
await page.click('.cam-bar button:has-text("Top")');
await page.waitForTimeout(1400);
await page.screenshot({ path: 'shots/3d-topview.png' });
await page.click('.cam-bar button:has-text("Overview")');
await page.waitForTimeout(1400);
await page.screenshot({ path: 'shots/3d-overview.png' });
await page.click('.cam-bar button:has-text("Follow")');
// zoom in with the wheel over the canvas
const box = await page.locator('.game canvas').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, -900);
await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 40, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/3d-closeup.png' });
const mobile = await mk({ width: 390, height: 844 });
await mobile.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await mobile.waitForSelector('#setup-start');
await mobile.click('#setup-start');
await mobile.waitForSelector('.game canvas');
await mobile.waitForTimeout(1500);
await mobile.screenshot({ path: 'shots/3d-mobile.png' });
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close();
