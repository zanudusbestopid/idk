// Exercises the in-game art editor end to end on the private build and captures each tab.
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HTML = process.env.PT_HTML ?? 'dist/private/paper-tycoon-solo.html';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
await ctx.route(/^https?:/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + resolve(HTML), { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.waitForTimeout(1500);
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('pt.art') ?? '{}'));
const numFields = () => page.$$eval('.sheetview input[type=number]', (is) => is.map((i) => i.value));

await page.click('#setup-art');
await page.waitForSelector('#art-editor');
await page.waitForTimeout(1200);
console.log('sheets:', await page.$$eval('.sheetview select >> nth=0 >> option', (os) => os.map((o) => o.textContent)));

// grid detection on the SMB1 sheet
await page.click('.sheetview button:has-text("Detect grid")');
await page.waitForTimeout(200);
console.log('detected grid (pitch,tile,ox,oy):', (await numFields()).slice(0, 4));

// select a 3x2 tile block by dragging (grid 17px, origin 1): tiles (c 2..4, r 1..2)
const canvas = page.locator('.arted__sheet');
const box = await canvas.boundingBox();
const zoom = 3;
const px = (c) => box.x + (1 + 17 * c + 8) * zoom, py = (r) => box.y + (1 + 17 * r + 8) * zoom;
await page.mouse.move(px(2), py(1)); await page.mouse.down(); await page.mouse.move(px(4), py(2), { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(200);
console.log('preview:', await page.textContent('.arted__row--preview .muted'));
console.log('selection (x,y,w,h):', (await numFields()).slice(4));
console.log('readout:', await page.textContent('.arted__readout'));
console.log('chip:', await page.textContent('.arted__chip'));
// keyboard nudge: focus the view and press shift+right (wider by 1)
await page.focus('.arted__view'); await page.keyboard.press('Shift+ArrowRight'); await page.waitForTimeout(150);
console.log('after shift+right (w):', (await numFields())[6]);
await page.keyboard.press('Shift+ArrowLeft'); await page.waitForTimeout(150);
await page.screenshot({ path: 'shots/arted-1-sheet.png' });

await page.fill('.arted input[list="arted-names"]', 'test_block');
await page.click('button:has-text("Save sprite")');
await page.waitForTimeout(500);
console.log('sprites after save:', Object.keys((await saved()).sprites ?? {}), 'chip:', await page.textContent('.arted__chip'));

// Sprites tab: the new sprite is listed and can be picked
await page.click('.arted__tabs button:has-text("Sprites")');
await page.waitForTimeout(300);
await page.fill('.arted__tab input[type=text]', 'test');
await page.waitForTimeout(150);
console.log('filtered cards:', await page.locator('.arted__card').count());
await page.click('.arted__card[title="test_block"]');
await page.waitForTimeout(200);
console.log('detail:', (await page.textContent('.arted__detail')).replace(/\s+/g, ' ').trim());
await page.screenshot({ path: 'shots/arted-2-sprites.png' });

// Spaces tab: click space 5 on the mini board, then "use" for the decoration
await page.click('.arted__tabs button:has-text("Spaces")');
await page.waitForTimeout(600);
const map = await page.locator('.arted__map').boundingBox();
// space 5 is on the bottom row: world x = HALF - CORNER - 5*UNIT - UNIT/2 = 8.625-2.1-7.25-0.725 = -1.45 → texture fraction (x+HALF)/(2*HALF)
const fx = (-1.45 + 8.625) / 17.25, fz = (8.625 - 1.05 + 8.625) / 17.25;
await page.mouse.click(map.x + fx * map.width, map.y + fz * map.height);
await page.waitForTimeout(600);
console.log('space select value:', await page.$eval('.arted__tab select', (s) => s.value));
const useBtns = page.locator('.arted__tab button:has-text("← use")');
console.log('use buttons on Spaces:', await useBtns.count(), 'disabled?', await useBtns.nth(1).isDisabled());
await useBtns.nth(1).click();
await page.waitForTimeout(1500);
console.log('spaces after use:', JSON.stringify((await saved()).spaces));
await page.screenshot({ path: 'shots/arted-3-spaces.png' });

// Scenery tab: add a prop from the current art, drag it on the map, then move it on the table
await page.click('.arted__tabs button:has-text("Scenery")');
await page.waitForTimeout(500);
const before = await page.$eval('.arted__list', (s) => s.options.length);
await page.click('.arted__btncol button:has-text("Add")');
await page.waitForTimeout(900);
const after = await page.$eval('.arted__list', (s) => s.options.length);
let prop = ((await saved()).props ?? []).find((p) => p.id === 'test_block');
console.log('props before/after add:', before, after, 'added:', JSON.stringify(prop));
const smap = await page.locator('.arted__map').boundingBox();
const R = 32;
const mx = (x) => smap.x + (x / R + 1) / 2 * smap.width, mz = (z) => smap.y + (z / R + 1) / 2 * smap.height;
await page.mouse.move(mx(prop.x), mz(prop.z)); await page.mouse.down(); await page.mouse.move(mx(prop.x) - 60, mz(prop.z) - 40, { steps: 5 }); await page.mouse.up();
await page.waitForTimeout(400);
prop = ((await saved()).props ?? []).find((p) => p.id === 'test_block');
console.log('after map drag:', JSON.stringify(prop));
await page.click('.arted__prop button:has-text("Move on table")');
await page.mouse.click(1100, 700);
await page.waitForTimeout(800);
prop = ((await saved()).props ?? []).find((p) => p.id === 'test_block');
console.log('after table click:', JSON.stringify(prop));
await page.screenshot({ path: 'shots/arted-4-scenery.png' });

// Slots tab: put the current art into 'house', then undo and redo it
await page.click('.arted__tabs button:has-text("Slots")');
await page.waitForTimeout(300);
const houseRow = page.locator('.arted__slot:has(b:text-is("house"))');
await houseRow.locator('button:has-text("← use")').click();
await page.waitForTimeout(1200);
console.log('sprites after slot:', Object.keys((await saved()).sprites), 'house status:', await houseRow.locator('.arted__slotname span').textContent());
await page.screenshot({ path: 'shots/arted-5-slots.png' });
await page.click('.arted__bar button:has-text("Undo")');
await page.waitForTimeout(1200);
console.log('after undo:', Object.keys((await saved()).sprites));
await page.click('.arted__bar button:has-text("Redo")');
await page.waitForTimeout(1200);
console.log('after redo:', Object.keys((await saved()).sprites));
await page.click('.arted__bar button:has-text("?")');
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/arted-6-help.png' });

const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.arted__bar button:has-text("Export JSON")')]);
const exported = JSON.parse(readFileSync(await dl.path(), 'utf8'));
console.log('export keys:', Object.keys(exported), 'sprites:', Object.keys(exported.sprites).length, 'props:', exported.props?.length);

await page.click('#arted-close');
await page.waitForTimeout(300);
console.log('editor closed:', (await page.$('#art-editor')) === null, 'title layer visible:', await page.isVisible('.title-layer'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.waitForTimeout(2500);
const persisted = await saved();
console.log('after reload:', JSON.stringify({ sprites: Object.keys(persisted.sprites), spaces: persisted.spaces, props: persisted.props?.length }));
await page.screenshot({ path: 'shots/arted-7-reload.png' });
console.log('errors:', errors);
await browser.close();
