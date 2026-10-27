// Visual audit: captures every major screen of the single-player build into shots/audit-*.png.
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HTML = process.env.PT_HTML ?? 'dist/paper-tycoon-solo.html';
const P = process.env.PT_PREFIX ?? 'audit';
const W = Number(process.env.PT_W ?? 1400), H = Number(process.env.PT_H ?? 900);
await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = (name) => page.screenshot({ path: `shots/${P}-${name}.png` });
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log(`step ${name} failed: ${String(e).split('\n')[0]}`); } };
await page.goto('file://' + resolve(HTML), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.waitForTimeout(3500);
await shot('01-title');
await page.click('.rules-fold summary');
await page.waitForTimeout(400);
await shot('02-setup-rules');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(3000);
await shot('03-follow-start');
await page.click('.cam-bar button:has-text("Overview")');
await page.waitForTimeout(2000);
await shot('04-overview');
await page.click('.cam-bar button:has-text("Top")');
await page.waitForTimeout(2000);
await shot('05-top');
await page.click('.cam-bar button:has-text("Follow")');
// corner and space close-ups via the focus camera
for (const [i, name] of [[10, 'corner-jail'], [20, 'corner-parking'], [30, 'corner-gotojail'], [0, 'corner-go'], [5, 'space-railroad'], [12, 'space-utility'], [4, 'space-tax'], [17, 'space-chest'], [36, 'space-chance'], [39, 'space-top']]) {
  await page.evaluate((idx) => { window.__pt.screen.board.focusSpace = idx; }, i);
  await page.waitForTimeout(2200);
  await shot(`06-${name}`);
}
await page.evaluate(() => { window.__pt.screen.board.focusSpace = null; });
// ownership: buildings, mortgage, pegs
await page.evaluate(() => {
  const g = window.__pt.local;
  const props = { ...g.state.properties, 1: { owner: 'you', houses: 3, mortgaged: false }, 3: { owner: 'you', houses: 5, mortgaged: false }, 6: { owner: 'bot1', houses: 2, mortgaged: false }, 8: { owner: 'bot1', houses: 0, mortgaged: true }, 9: { owner: 'bot1', houses: 4, mortgaged: false }, 5: { owner: 'bot2', houses: 0, mortgaged: false }, 12: { owner: 'bot3', houses: 0, mortgaged: false } };
  g.state = { ...g.state, properties: props };
  window.__pt.screen.board.updateStatic(g.state);
  window.__pt.screen.onState(g.state, []);
});
await page.evaluate(() => { window.__pt.screen.board.focusSpace = 2; });
await page.waitForTimeout(2200);
await shot('07-buildings');
await page.evaluate(() => { window.__pt.screen.board.focusSpace = 8; });
await page.waitForTimeout(2200);
await shot('08-mortgaged');
await page.evaluate(() => { window.__pt.screen.board.focusSpace = null; });
// dialogs
for (const [name, sel] of [['09-properties', '.actions button:has-text("Manage"), .actions button:has-text("Properties")'], ['10-trade', '.actions button:has-text("Trade")'], ['11-pause', '.actions .menu-btn']]) {
  await step(name, async () => {
    await page.locator(sel).first().click({ timeout: 5000 });
    await page.waitForTimeout(700);
    await shot(name);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.evaluate(() => { document.querySelectorAll('.overlay').forEach((el) => el.remove()); });
    await page.waitForTimeout(200);
  });
}
const closeModals = async () => { for (let k = 0; k < 3; k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } await page.evaluate(() => { document.querySelectorAll('.overlay').forEach((el) => el.remove()); }); };
await closeModals();
// card draw: 3+4 lands on the first chance space
await step('12-card', async () => {
  await page.evaluate(() => window.__pt.forceRoll(3, 4));
  await page.click('.actions button:has-text("Roll dice")', { timeout: 5000 });
  await page.waitForTimeout(3400); await shot('12-card-a');
  await page.waitForTimeout(1200); await shot('12-card-b');
  await page.waitForTimeout(1500); await shot('12-card-c');
  await page.waitForTimeout(3000);
});
await closeModals();
// jail
await step('13-jail', async () => {
  await page.evaluate(() => {
    const g = window.__pt.local;
    g.state = { ...g.state, players: g.state.players.map((p) => (p.id === 'you' ? { ...p, inJail: true, position: 10 } : p)) };
    window.__pt.screen.board.placeTokens(g.state, false);
    window.__pt.screen.board.focusSpace = 10;
  });
  await page.waitForTimeout(2200);
  await shot('13-jail');
  await page.evaluate(() => { window.__pt.screen.board.focusSpace = null; });
});
// 2D board
await step('14-board2d', async () => {
  await page.click('button:has-text("2D")', { timeout: 5000 });
  await page.waitForTimeout(1200);
  await shot('14-board2d');
});
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close();
