import { resolve } from 'node:path';
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await page.goto('file://' + resolve('dist/private/paper-tycoon-solo.html'), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.click('#setup-start');
await page.waitForSelector('.game canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const b = window.__pt.screen?.board ?? window.__pt.title?.board;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#333;padding:8px;display:flex;flex-wrap:wrap;gap:6px;width:1400px';
  const boards = [];
  document.querySelectorAll('canvas').forEach(() => {});
  const list = (window.__pt.screen?.board?.billboards) ?? [];
  for (const m of list) {
    const img = m.material.map.image;
    const c = document.createElement('canvas'); c.width = img.width * 3; c.height = img.height * 3;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, c.width, c.height);
    const wrap = document.createElement('div'); wrap.style.cssText = 'color:#ff0;font:12px monospace';
    wrap.textContent = `${m.position.x.toFixed(1)},${m.position.z.toFixed(1)} ${img.width}x${img.height}`;
    wrap.appendChild(c); host.appendChild(wrap);
  }
  document.body.appendChild(host);
});
await page.screenshot({ path: 'shots/pk-textures.png' });
await browser.close();
