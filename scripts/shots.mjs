// Visual check: scripted two-player game, screenshots of the main screens and dialogs
// at desktop and phone sizes. Usage: node scripts/shots.mjs
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const PORT = 3998;
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
await mkdir('shots', { recursive: true });
const server = spawn('node', ['dist/paper-tycoon.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const errors = [];
async function mk(name, viewport) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`${name}: ${m.text()}`); });
  return page;
}
const base = `http://localhost:${PORT}`;
const p1 = await mk('Ava', { width: 1400, height: 900 });
const p2 = await mk('Ben', { width: 390, height: 844 });
await p1.goto(base, { waitUntil: 'domcontentloaded' });
await p1.screenshot({ path: 'shots/home.png' });
await p1.fill('input[placeholder="Your name"]', 'Ava');
await p1.click('.token-pick[title="Rubber Duck"]');
await p1.click('text=Create a room');
const code = (await p1.textContent('.lobby .code')).trim();
await p2.goto(`${base}/${code}`, { waitUntil: 'domcontentloaded' });
await p2.fill('input[placeholder="Your name"]', 'Ben');
await p2.click('.token-pick[title="Robot"]');
await p2.click('button:has-text("Join")');
await p2.waitForSelector('.lobby');
await p2.screenshot({ path: 'shots/mobile-lobby.png' });
await p1.click('.rule:has-text("Turn timer") select');
await p1.selectOption('.rule:has-text("Turn timer") select', '90');
await p1.click('text=Start game');
await Promise.all([p1, p2].map((p) => p.waitForSelector('.game .board')));
await p1.waitForTimeout(500);

async function tryClick(page, sel) { try { await page.click(sel, { timeout: 2500 }); return true; } catch { return false; } }
async function waitIdle(page) { await page.waitForFunction(() => !document.querySelector('.actions .hint')?.textContent?.includes('…'), null, { timeout: 15000 }).catch(() => {}); }
async function playTurn(page, other) {
  // roll, buy if offered, dismiss cards, end turn
  for (let i = 0; i < 14; i++) {
    await waitIdle(page);
    if (await page.locator('.card-pop').count()) { await tryClick(page, '.card-pop'); continue; }
    if (await page.locator('.dialog button:has-text("Buy for"):enabled').count()) { await tryClick(page, '.dialog button:has-text("Buy for"):enabled'); await page.waitForTimeout(500); continue; }
    if (await page.locator('.dialog button:has-text("Decline"):enabled').count()) { await tryClick(page, '.dialog button:has-text("Decline"):enabled'); await page.waitForTimeout(500); continue; }
    if (await page.locator('.actions button:has-text("Roll dice"):enabled').count()) { await tryClick(page, '.actions button:has-text("Roll dice"):enabled'); await page.waitForTimeout(500); continue; }
    if (await page.locator('.actions button:has-text("Roll for doubles"):enabled').count()) { await tryClick(page, '.actions button:has-text("Roll for doubles"):enabled'); await page.waitForTimeout(500); continue; }
    if (await page.locator('.actions button:has-text("End turn"):enabled').count()) { await tryClick(page, '.actions button:has-text("End turn"):enabled'); await page.waitForTimeout(300); return; }
    // auction: other passes, we pass
    if (await other.locator('.dialog .bidform:visible button:has-text("Pass"):enabled').count()) { await tryClick(other, '.dialog .bidform:visible button:has-text("Pass"):enabled'); }
    if (await page.locator('.dialog .bidform:visible button:has-text("Pass"):enabled').count()) { await tryClick(page, '.dialog .bidform:visible button:has-text("Pass"):enabled'); }
    await page.waitForTimeout(400);
  }
}
for (let t = 0; t < 6; t++) { await playTurn(p1, p2); await playTurn(p2, p1); }
await waitIdle(p1); await p1.waitForTimeout(600);
await p1.screenshot({ path: 'shots/desktop-midgame.png' });
await p2.screenshot({ path: 'shots/mobile-midgame.png' });
await p2.screenshot({ path: 'shots/mobile-midgame-full.png', fullPage: true });
// deed dialog
await p1.click('.space[data-index="39"]');
await p1.waitForTimeout(300);
await p1.screenshot({ path: 'shots/desktop-deed.png' });
await p1.keyboard.press('Escape'); await p1.click('.dialog button:has-text("Close")').catch(() => {});
// manage dialog
if (await p1.locator('.actions button:has-text("Manage"), .actions button:has-text("Properties")').count()) {
  await p1.click('.actions button:has-text("Manage"), .actions button:has-text("Properties")');
  await p1.waitForTimeout(300);
  await p1.screenshot({ path: 'shots/desktop-manage.png' });
  await p1.click('.dialog button:has-text("Done")').catch(() => {});
}
// trade dialog
if (await p1.locator('.actions button:has-text("Trade"):enabled').count()) {
  await p1.click('.actions button:has-text("Trade")');
  await p1.waitForTimeout(300);
  await p1.screenshot({ path: 'shots/desktop-trade.png' });
  const mine = p1.locator('.dialog .trade .col').nth(0).locator('input[type=checkbox]:enabled');
  const theirs = p1.locator('.dialog .trade .col').nth(1).locator('input[type=checkbox]:enabled');
  if (await mine.count() && await theirs.count()) {
    await mine.first().check(); await theirs.first().check();
    await p1.click('.dialog button:has-text("Propose trade")');
    await p2.waitForSelector('.dialog:has-text("proposes a trade")', { timeout: 5000 }).catch(() => {});
    await p2.screenshot({ path: 'shots/mobile-trade-offer.png' });
    await p2.click('.dialog button:has-text("Accept")').catch(() => {});
  } else {
    await p1.click('.dialog button:has-text("Cancel")').catch(() => {});
  }
}
// chat
await p2.fill('.chatform .input', 'gg ez'); await p2.press('.chatform .input', 'Enter');
await p1.waitForTimeout(400);
await p1.screenshot({ path: 'shots/desktop-after.png' });
// Ben leaves mid-game → Ava wins → standings dialog
p2.once('dialog', (d) => d.accept());
await p2.click('.logbox button:has-text("Leave")');
await p1.waitForSelector('.dialog:has-text("wins!")', { timeout: 8000 }).catch(() => errors.push('no game-over dialog'));
await p1.waitForTimeout(700);
await p1.screenshot({ path: 'shots/desktop-gameover.png' });
await p2.waitForSelector('.home', { timeout: 5000 }).catch(() => errors.push('leaver not returned home'));
await p1.click('.dialog button:has-text("Back to lobby")').catch(() => errors.push('no back-to-lobby button'));
await p1.waitForSelector('.lobby', { timeout: 5000 }).catch(() => errors.push('host not returned to lobby'));
console.log('done; errors:', errors.length ? errors : 'none');
await browser.close(); server.kill();
process.exit(errors.length ? 1 : 0);
