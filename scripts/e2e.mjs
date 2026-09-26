// Smoke test: starts the built server, opens three browser players, and lets
// them play randomly for a while, failing on any page error or stall.
// Usage: node scripts/e2e.mjs [turns] [--shots]
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const TURN_LIMIT = Number(process.argv[2]) || 120;
const SHOTS = process.argv.includes('--shots');
const PORT = 3999;
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

await mkdir('shots', { recursive: true });
const server = spawn('node', ['dist/paper-tycoon.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const errors = [];
const names = ['Ava', 'Ben', 'Cleo'];
const pages = [];
for (const name of names) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`${name}: console ${m.text()}`); });
  pages.push(page);
}
const [p1, p2, p3] = pages;
const base = `http://localhost:${PORT}`;

await p1.goto(base, { waitUntil: 'domcontentloaded' });
await p1.fill('input[placeholder="Your name"]', 'Ava');
await p1.click('.token-pick[title="Sailboat"]');
await p1.click('text=Create a room');
await p1.waitForSelector('.lobby .code');
const code = (await p1.textContent('.lobby .code')).trim();
console.log('room code', code);

for (const [page, name] of [[p2, 'Ben'], [p3, 'Cleo']]) {
  await page.goto(`${base}/${code}`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder="Your name"]', name);
  await page.fill('.input--code', code);
  await page.click('button:has-text("Join")');
  await page.waitForSelector('.lobby');
}
await p1.waitForFunction(() => document.querySelectorAll('.lobby .player-row').length === 3);
// Toggle a couple of house rules to exercise the config path.
await p1.click('.rule:has-text("Free Parking jackpot") .switch');
await p1.waitForTimeout(150);
if (SHOTS) await p1.screenshot({ path: 'shots/lobby.png' });
await p1.click('text=Start game');
await Promise.all(pages.map((p) => p.waitForSelector('.game .board')));
await p1.waitForTimeout(800);
if (SHOTS) await p1.screenshot({ path: 'shots/game-start.png' });

const rnd = (n) => Math.floor(Math.random() * n);
let lastTurn = 0, stall = 0, over = false, shotN = 0;

async function clickIf(page, selector) {
  const el = page.locator(selector).first();
  if (await el.count() && await el.isEnabled().catch(() => false) && await el.isVisible().catch(() => false)) { await el.click({ timeout: 2000 }).catch(() => {}); return true; }
  return false;
}

async function act(page) {
  // Dismiss card popups
  if (await clickIf(page, '.card-pop')) return 'card';
  // Game over
  if (await page.locator('.dialog:has-text("wins!")').count()) { over = true; return 'over'; }
  // Debt dialog
  if (await page.locator('.dialog:has-text("You owe money")').count()) {
    if (await clickIf(page, '.dialog button:has-text("Pay $"):enabled')) return 'payDebt';
    if (await clickIf(page, '.dialog button:has-text("Sell"):enabled')) return 'sellHouse';
    if (await clickIf(page, '.dialog button:has-text("Mortgage +"):enabled')) return 'mortgage';
    page.once('dialog', (d) => d.accept());
    if (await clickIf(page, '.dialog button:has-text("Declare bankruptcy"):enabled')) return 'bankrupt';
    return null;
  }
  // Buy dialog
  if (await page.locator('.dialog:has-text("Buy ")').count()) {
    if (rnd(4) !== 0 && await clickIf(page, '.dialog button:has-text("Buy for"):enabled')) return 'buy';
    if (await clickIf(page, '.dialog button:has-text("Decline")')) return 'decline';
  }
  // Auction dialog
  if (await page.locator('.dialog .auction').count()) {
    if (await page.locator('.dialog .bidform:visible').count()) {
      if (rnd(3) === 0) { if (await clickIf(page, '.dialog .bidform button:has-text("+10"):enabled')) return 'bid'; }
      if (await clickIf(page, '.dialog .bidform button:has-text("Pass"):enabled')) return 'pass';
    }
    return null;
  }
  // Incoming trade
  if (await page.locator('.dialog:has-text("proposes a trade")').count()) {
    if (rnd(2) === 0 && await clickIf(page, '.dialog button:has-text("Accept"):enabled')) return 'accept';
    if (await clickIf(page, '.dialog button:has-text("Reject")')) return 'reject';
  }
  // Manage dialog open: build something or close
  if (await page.locator('.dialog .manage').count()) {
    if (await clickIf(page, '.dialog button:has-text("Build"):enabled')) return 'build';
    if (await clickIf(page, '.dialog button:has-text("Hotel"):enabled')) return 'hotel';
    if (rnd(6) === 0 && await clickIf(page, '.dialog button:has-text("Unmortgage"):enabled')) return 'unmortgage';
    await clickIf(page, '.dialog button:has-text("Done")');
    return 'closeManage';
  }
  if (await page.locator('.dialog .trade').count()) {
    // Trade composer: pick a property from each side if possible, propose.
    const mine = page.locator('.dialog .trade .col').nth(0).locator('input[type=checkbox]:enabled');
    const theirs = page.locator('.dialog .trade .col').nth(1).locator('input[type=checkbox]:enabled');
    if (await mine.count() && await theirs.count() && rnd(2) === 0) {
      await mine.nth(rnd(await mine.count())).check().catch(() => {});
      await theirs.nth(rnd(await theirs.count())).check().catch(() => {});
      if (await clickIf(page, '.dialog button:has-text("Propose trade")')) return 'propose';
    }
    await clickIf(page, '.dialog button:has-text("Cancel")');
    return 'cancelTrade';
  }
  if (await page.locator('.dialog').count()) { await page.keyboard.press('Escape'); await clickIf(page, '.dialog button:has-text("Close")'); }
  // Action bar
  if (await clickIf(page, '.actions button:has-text("Show offer")')) return 'showOffer';
  if (await clickIf(page, '.actions button:has-text("Show auction")')) return 'showAuction';
  if (await clickIf(page, '.actions button:has-text("Raise money")')) return 'raise';
  if (await clickIf(page, '.actions button:has-text("Roll dice"):enabled')) return 'roll';
  if (await page.locator('.actions button:has-text("Roll for doubles"):enabled').count()) {
    if (rnd(3) === 0 && await clickIf(page, '.actions button:has-text("Pay $"):enabled')) return 'payFine';
    if (await clickIf(page, '.actions button:has-text("Use jail card"):enabled')) return 'useCard';
    if (await clickIf(page, '.actions button:has-text("Roll for doubles"):enabled')) return 'rollJail';
  }
  if (await page.locator('.actions button:has-text("End turn"):enabled').count()) {
    if (rnd(3) === 0 && await clickIf(page, '.actions button:has-text("Manage"):enabled')) return 'manage';
    if (rnd(8) === 0 && await clickIf(page, '.actions button:has-text("Trade"):enabled')) return 'trade';
    if (await clickIf(page, '.actions button:has-text("End turn"):enabled')) return 'endTurn';
  }
  return null;
}

const start = Date.now();
for (let i = 0; i < TURN_LIMIT * 12 && !over; i++) {
  let did = false;
  for (const page of pages) {
    const r = await act(page);
    if (r) { did = true; }
  }
  const turn = await p1.evaluate(() => { const m = document.querySelector('.log')?.textContent?.match(/Turn (\d+)/g); return m ? Number(m[m.length - 1].slice(5)) : 0; }).catch(() => 0);
  if (turn > lastTurn) { lastTurn = turn; stall = 0; if (turn % 5 === 0) console.log(`turn ${turn} (${((Date.now() - start) / 1000).toFixed(0)}s)`); if (turn >= TURN_LIMIT) break; if (SHOTS && turn % 15 === 0) await p1.screenshot({ path: `shots/turn-${String(turn).padStart(3, '0')}.png` }); }
  else if (!did) stall++;
  if (stall > 40) { errors.push(`stalled at turn ${turn}`); break; }
  if (errors.length > 20) break;
  await p1.waitForTimeout(did ? 250 : 400);
}
if (SHOTS) await p1.screenshot({ path: 'shots/final.png' });
console.log(`played ${lastTurn} turns in ${((Date.now() - start) / 1000).toFixed(1)}s, game over: ${over}`);
const uniq = [...new Set(errors)];
if (uniq.length) { console.log('ERRORS:'); for (const e of uniq) console.log(' -', e); }
await browser.close();
server.kill();
process.exit(uniq.length ? 1 : 0);
