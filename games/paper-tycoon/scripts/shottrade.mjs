// Trade flow check: propose cash for a bot's street, confirm the composer closes and the bot answers;
// then confirm the Manage dialog stays usable after building.
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(m.text()); });
await page.goto('file://' + resolve('dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.click('.count-row button:has-text("1")');
await page.click('.diff-row button:has-text("Easy")');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(800);
// Give the bot Baltic and me Mediterranean + Oriental/Vermont/Connecticut set for building, via the debug hook
await page.evaluate(() => { const pt = window.__pt; const st = pt.local.state; st.properties[3] = { owner: 'bot1', houses: 0, mortgaged: false }; st.properties[1] = { owner: 'you', houses: 0, mortgaged: false }; for (const i of [6, 8, 9]) st.properties[i] = { owner: 'you', houses: 0, mortgaged: false }; pt.screen.onState(st, []); });
await page.waitForTimeout(600);
// Trade: open composer, request Baltic for $150
await page.click('.actions button:has-text("Trade")');
await page.waitForSelector('.dialog .trade');
const theirs = page.locator('.dialog .trade .col').nth(1).locator('input[type=checkbox]');
console.log('their checkboxes:', await theirs.count());
await theirs.first().check();
await page.locator('.dialog .trade .col').nth(0).locator('input[type=number]').first().fill('150');
await page.locator('.dialog .trade .col').nth(0).locator('input[type=number]').first().dispatchEvent('change');
await page.click('.dialog button:has-text("Propose trade")');
await page.waitForTimeout(1500);
console.log('composer still open:', await page.locator('.dialog .trade').count(), '| open trade dialogs disabled buttons:', await page.locator('.dialog button:disabled').count());
await page.waitForTimeout(2500);
const log = await page.locator('.log').textContent();
console.log('log mentions trade:', /proposed a trade/.test(log), '| answered:', /accepted a trade|was declined/.test(log));
await page.screenshot({ path: 'shots/trade-after.png' });
// Manage: build a house, then Done must still work
await page.click('.actions button:has-text("Manage")');
await page.waitForSelector('.dialog .manage');
await page.click('.dialog button:has-text("Build"):enabled');
await page.waitForTimeout(900);
const doneDisabled = await page.locator('.dialog button:has-text("Done")').isDisabled();
console.log('Done disabled after build:', doneDisabled);
await page.click('.dialog button:has-text("Done")').catch(() => console.log('could not click Done'));
await page.waitForTimeout(300);
console.log('manage still open:', await page.locator('.dialog .manage').count());
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close();
