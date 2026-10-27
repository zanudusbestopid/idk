// Single-player smoke test: opens the standalone HTML from disk, starts a game
// against 3 computer players, plays the human's turns automatically for a while.
// Usage: node scripts/solo-test.mjs [turns] [--shots]
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const TURN_LIMIT = Number(process.argv[2]) || 40;
const SHOTS = process.argv.includes('--shots');
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`console ${m.text()}`); if (m.type() === 'warning' && m.text().includes('bot move refused')) errors.push(m.text()); });
await page.goto('file://' + resolve(process.env.PT_HTML ?? 'dist/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
if (SHOTS) await page.screenshot({ path: 'shots/solo-setup.png' });
await page.fill('#setup-name', 'Ava');
await page.locator('.token-pick').nth(6).click();
await page.click('.diff-row button:has-text("Hard")');
await page.click('.rules-fold summary');
await page.click('.rule:has-text("jackpot") .switch');
await page.click('#setup-start');
await page.waitForSelector('.game .board, .game .board3d-wrap');
await page.waitForTimeout(600);
if (SHOTS) await page.screenshot({ path: 'shots/solo-start.png' });

const rnd = (n) => Math.floor(Math.random() * n);
async function clickIf(sel) { const el = page.locator(sel).first(); if (await el.count() && await el.isEnabled().catch(() => false) && await el.isVisible().catch(() => false)) { await el.click({ timeout: 2000 }).catch(() => {}); return true; } return false; }
async function act() {
  if (await clickIf('.card-pop')) return 'card';
  if (await page.locator('.dialog:has-text("wins!")').count()) return 'over';
  if (await page.locator('.dialog:has-text("You owe money")').count()) {
    if (await clickIf('.dialog button:has-text("Pay $"):enabled')) return 'payDebt';
    if (await clickIf('.dialog button:has-text("Sell"):enabled')) return 'sell';
    if (await clickIf('.dialog button:has-text("Mortgage +"):enabled')) return 'mortgage';
    if (await clickIf('.dialog button:has-text("Declare bankruptcy"):enabled')) { await clickIf('.dialog button:has-text("Declare bankruptcy"):enabled'); return 'bankrupt'; }
    return null;
  }
  if (await page.locator('.dialog:has-text("Buy ")').count()) {
    if (rnd(4) !== 0 && await clickIf('.dialog button:has-text("Buy for"):enabled')) return 'buy';
    if (await clickIf('.dialog button:has-text("Decline"):enabled')) return 'decline';
  }
  if (await page.locator('.dialog .auction').count()) {
    if (await page.locator('.dialog .bidform:visible').count()) {
      if (rnd(3) === 0 && await clickIf('.dialog .bidform button:has-text("+10"):enabled')) return 'bid';
      if (await clickIf('.dialog .bidform button:has-text("Pass"):enabled')) return 'pass';
    }
    return null;
  }
  if (await page.locator('.dialog:has-text("proposes a trade")').count()) {
    if (rnd(2) === 0 && await clickIf('.dialog button:has-text("Accept"):enabled')) return 'accept';
    if (await clickIf('.dialog button:has-text("Reject")')) return 'reject';
  }
  if (await page.locator('.dialog .manage').count()) {
    if (await clickIf('.dialog button:has-text("Build"):enabled')) return 'build';
    await clickIf('.dialog button:has-text("Done")'); return 'closeManage';
  }
  if (await page.locator('.dialog .trade').count()) {
    const mine = page.locator('.dialog .trade .col').nth(0).locator('input[type=checkbox]:enabled');
    const theirs = page.locator('.dialog .trade .col').nth(1).locator('input[type=checkbox]:enabled');
    if (await mine.count() && await theirs.count() && rnd(2) === 0) {
      await mine.nth(rnd(await mine.count())).check().catch(() => {});
      await theirs.nth(rnd(await theirs.count())).check().catch(() => {});
      if (await clickIf('.dialog button:has-text("Propose trade")')) return 'propose';
    }
    await clickIf('.dialog button:has-text("Cancel")'); return 'cancelTrade';
  }
  if (await page.locator('.dialog').count()) { await clickIf('.dialog button:has-text("Close")'); }
  if (await clickIf('.actions button:has-text("Show offer")')) return 'showOffer';
  if (await clickIf('.actions button:has-text("Show auction")')) return 'showAuction';
  if (await clickIf('.actions button:has-text("Raise money")')) return 'raise';
  if (await clickIf('.actions button:has-text("Roll dice"):enabled')) return 'roll';
  if (await page.locator('.actions button:has-text("Roll for doubles"):enabled').count()) {
    if (rnd(3) === 0 && await clickIf('.actions button:has-text("Pay $"):enabled')) return 'payFine';
    if (await clickIf('.actions button:has-text("Use jail card"):enabled')) return 'useCard';
    if (await clickIf('.actions button:has-text("Roll for doubles"):enabled')) return 'rollJail';
  }
  if (await page.locator('.actions button:has-text("End turn"):enabled').count()) {
    if (rnd(3) === 0 && await clickIf('.actions button:has-text("Manage"):enabled')) return 'manage';
    if (rnd(8) === 0 && await clickIf('.actions button:has-text("Trade"):enabled')) return 'trade';
    if (await clickIf('.actions button:has-text("End turn"):enabled')) return 'endTurn';
  }
  return null;
}
const start = Date.now();
let lastTurn = 0, stall = 0, over = false, lastProgress = Date.now();
for (let i = 0; i < TURN_LIMIT * 40 && !over; i++) {
  const r = await act();
  if (r === 'over') { over = true; break; }
  const turn = await page.evaluate(() => { const m = document.querySelector('.log')?.textContent?.match(/Turn (\d+)/g); return m ? Number(m[m.length - 1].slice(5)) : 0; }).catch(() => 0);
  if (turn > lastTurn) { lastTurn = turn; stall = 0; lastProgress = Date.now(); if (turn % 10 === 0) console.log(`turn ${turn} (${((Date.now() - start) / 1000).toFixed(0)}s)`); if (turn >= TURN_LIMIT) break; if (SHOTS && turn % 20 === 0) await page.screenshot({ path: `shots/solo-turn-${String(turn).padStart(3, '0')}.png` }); }
  else if (!r) stall++;
  if (stall > 160 && Date.now() - lastProgress > 150_000) { errors.push(`stalled at turn ${turn}`); if (SHOTS) await page.screenshot({ path: 'shots/solo-stall.png' }); break; }
  if (errors.length > 20) break;
  await page.waitForTimeout(r ? 200 : 350);
}
if (SHOTS) await page.screenshot({ path: 'shots/solo-final.png' });
// Reload: the game should offer to resume (unless it ended).
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
const canResume = await page.locator('#setup-resume').count();
console.log(`played ${lastTurn} turns in ${((Date.now() - start) / 1000).toFixed(1)}s, game over: ${over}, resume offered after reload: ${!!canResume}`);
if (!over && !canResume) errors.push('no resume offered after reload');
if (canResume) { await page.click('#setup-resume'); await page.waitForSelector('.game .board, .game .board3d-wrap'); if (SHOTS) await page.screenshot({ path: 'shots/solo-resumed.png' }); }
const uniq = [...new Set(errors)];
if (uniq.length) { console.log('ERRORS:'); for (const e of uniq) console.log(' -', e); }
await browser.close();
process.exit(uniq.length ? 1 : 0);
