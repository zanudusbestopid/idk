// Screenshots of the online build's title scene: home, lobby (one and two players,
// desktop and phone) and the hand-over of the scene into the game.
// Starts its own server on PORT (default 3991) and always shuts it down.
// Only two browser pages are open at once: software WebGL (SwiftShader) is slow, and
// idle pages are shrunk while another page loads so the loop rendering stays cheap.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT) || 3991;
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.OUT || 'shots';
const base = `http://localhost:${PORT}`;
const DESKTOP = { width: 1400, height: 900 };
const PHONE = { width: 390, height: 844 };
const TINY = { width: 320, height: 200 };
await mkdir(OUT, { recursive: true });

const server = spawn(process.execPath, ['dist/paper-tycoon.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
const stopServer = () => { if (!server.killed) server.kill('SIGKILL'); };
process.on('exit', stopServer);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { stopServer(); process.exit(1); });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('server did not start')), 15000);
  server.stdout.on('data', (d) => { if (String(d).includes(`localhost:${PORT}`)) { clearTimeout(t); res(); } });
  server.on('exit', (c) => rej(new Error(`server exited early (${c})`)));
});

const errors = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  async function mk(viewport) {
    const context = await browser.newContext({ viewport });
    await context.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);
    page.on('requestfailed', (r) => { if (r.url().startsWith(base)) errors.push(`requestfailed ${r.url()} ${r.failure()?.errorText}`); });
    page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(`console ${m.text()}`); });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
  const settle = (page, ms = 1200) => page.waitForTimeout(ms);

  // Home screen.
  const host = await mk(DESKTOP);
  await host.goto(base, { waitUntil: 'domcontentloaded' });
  await host.waitForSelector('#home-create');
  await settle(host, 2000);
  await shot(host, 'online-home');
  await host.click('.token-pick[title="Rocket"]');
  await settle(host, 800);
  await shot(host, 'online-home-token');

  // Create a room → lobby with one player.
  await host.fill('#home-name', 'Ada');
  await host.click('#home-create');
  await host.waitForSelector('#lobby-start');
  await settle(host, 1500);
  await shot(host, 'online-lobby-1');
  const code = (await host.textContent('.lobby .code')).trim();
  console.log('room', code, host.url());

  // Second player on a phone, arriving through the invite link.
  await host.setViewportSize(TINY);
  const guest = await mk(PHONE);
  await guest.goto(`${base}/${code}`, { waitUntil: 'domcontentloaded' });
  await guest.waitForSelector('#home-create');
  await settle(guest, 1500);
  await shot(guest, 'online-home-phone');
  await guest.fill('#home-name', 'Otto');
  await guest.click('.token-pick[title="Dog"]');
  await guest.click('#home-join');
  await guest.waitForSelector('.lobby .player-row');
  await settle(guest, 1500);
  await shot(guest, 'online-lobby-phone');
  await guest.evaluate(() => document.querySelector('.title-layer').scrollTo(0, 10000));
  await settle(guest, 400);
  await shot(guest, 'online-lobby-phone-bottom');

  // Same lobby on a desktop, non-host view; host sees two tokens on the board.
  await guest.setViewportSize(DESKTOP);
  await settle(guest, 1200);
  await shot(guest, 'online-lobby-guest');
  await guest.setViewportSize(TINY);
  await host.setViewportSize(DESKTOP);
  await host.waitForFunction(() => document.querySelectorAll('.lobby .player-row').length === 2);
  await settle(host, 1500);
  await shot(host, 'online-lobby-2');

  // Host starts the game: the title scene's board becomes the game board.
  await host.click('#lobby-start');
  await host.waitForSelector('.game');
  await host.waitForTimeout(150);
  await shot(host, 'online-game-transition');
  await host.waitForTimeout(1850);
  await shot(host, 'online-game');
  // The menu layer and the scene wrapper must be gone once the game runs (the board itself moved into the game).
  const leftover = await host.evaluate(() => document.querySelectorAll('.title-layer, .title-scene').length);
  const boards = await host.evaluate(() => document.querySelectorAll('.board3d-wrap').length);
  console.log('leftover title elements:', leftover, '| 3D boards in game:', boards);
  if (leftover !== 0 || boards !== 1) errors.push(`dom check failed: leftover=${leftover} boards=${boards}`);

  await host.setViewportSize(TINY);
  await guest.setViewportSize(DESKTOP);
  await guest.waitForSelector('.game');
  await settle(guest, 2000);
  await shot(guest, 'online-game-guest');
  await guest.setViewportSize(PHONE);
  await settle(guest, 800);
  await shot(guest, 'online-game-phone');

  // Leaving the game returns to a fresh title scene.
  await guest.setViewportSize(DESKTOP);
  await guest.click('.logbox .topbar button:has-text("Leave")');
  await guest.click('.dialog button:has-text("Leave")');
  await guest.waitForSelector('#home-create');
  await settle(guest, 1500);
  const fresh = await guest.evaluate(() => ({ scenes: document.querySelectorAll('.title-scene canvas').length, layers: document.querySelectorAll('.title-layer').length }));
  console.log('after leave:', fresh);
  if (fresh.scenes !== 1 || fresh.layers !== 1) errors.push(`after-leave check failed: ${JSON.stringify(fresh)}`);
  await shot(guest, 'online-home-after-leave');
  console.log('done; errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  stopServer();
}
