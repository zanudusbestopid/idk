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

console.log('auto keys on smb1:', await page.locator('.arted__swatch').count());

// SMB3 sheet: free selection of the ? block; auto keys + auto background must clear the cyan corners
await page.selectOption('.sheetview select >> nth=0', { label: 'smb3-tiles.png (924×1173)' });
await page.waitForTimeout(400);
console.log('auto keys on smb3:', await page.$$eval('.arted__swatch', (bs) => bs.map((b) => b.title.split(' ')[0])));
await page.selectOption('.sheetview select >> nth=1', 'off');
await page.$eval('.sheetview input[type=range]', (el) => { el.value = '1'; el.dispatchEvent(new Event('input')); }); // zoom 1× so x=325 is on screen
await page.waitForTimeout(200);
const box3 = await canvas.boundingBox();
const p3 = (x, y) => [box3.x + x + 0.5, box3.y + y + 0.5];
await page.mouse.move(...p3(325, 14)); await page.mouse.down(); await page.mouse.move(...p3(340, 29), { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(300);
console.log('smb3 free cut:', await page.textContent('.arted__row--preview .muted'));
const alphas = await page.$eval('.arted__preview', (c) => { const ctx = c.getContext('2d'); const s = c.width / 16; const at = (x, y) => ctx.getImageData(Math.floor(x * s + s / 2), Math.floor(y * s + s / 2), 1, 1).data[3]; return { corner: at(0, 0), corner2: at(15, 15), middle: at(8, 8), edgeMid: at(8, 0) }; });
console.log('cut alphas (corners should be 0, middle 255):', JSON.stringify(alphas));
// wand: click the middle pixel of the preview → erases that colour patch
const pv = await page.locator('.arted__preview').boundingBox();
await page.mouse.click(pv.x + pv.width / 2, pv.y + pv.height / 2);
await page.waitForTimeout(200);
const afterWand = await page.$eval('.arted__preview', (c) => c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data[3]);
console.log('middle after wand click:', afterWand, '·', await page.textContent('.arted__row--preview .muted'));
await page.click('.sheetview button:has-text("Reset wand")');
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/arted-8-smb3cut.png' });

// Compose tab: stamp the ? block twice side by side, use it, then save it
await page.click('.arted__tabs button:has-text("Compose")');
await page.waitForTimeout(400);
const comp = await page.locator('.composer__canvas').boundingBox();
const cz = comp.width / (6 * 16);
await page.mouse.click(comp.x + 8 * cz, comp.y + 8 * cz);
await page.click('.composer button:has-text("Flip ↔")');
await page.mouse.click(comp.x + (16 + 8) * cz, comp.y + 8 * cz);
await page.mouse.click(comp.x + (32 + 8) * cz, comp.y + 8 * cz, { button: 'right' });
await page.waitForTimeout(200);
console.log('composer info:', await page.textContent('.composer .arted__row:nth-of-type(3) .muted'));
await page.screenshot({ path: 'shots/arted-9-compose.png' });
await page.click('.composer button:has-text("Use as current art")');
await page.waitForTimeout(200);
console.log('chip after compose:', await page.textContent('.arted__chip'));
await page.fill('.composer input[type=text]', 'combo');
await page.click('.composer button:has-text("Save sprite")');
await page.waitForTimeout(500);
console.log('sprites after compose save:', Object.keys((await saved()).sprites ?? {}), 'chip:', await page.textContent('.arted__chip'));

// back to the SMB1 sheet for the rest of the run
await page.click('.arted__tabs button:has-text("Sheet")');
await page.waitForTimeout(400);
await page.selectOption('.sheetview select >> nth=0', { label: 'smb1-tiles.png (669×515)' });
await page.$eval('.sheetview input[type=range]', (el) => { el.value = '3'; el.dispatchEvent(new Event('input')); });
await page.waitForTimeout(300);
const box1 = await canvas.boundingBox();
const q = (c, r) => [box1.x + (1 + 17 * c + 8) * zoom, box1.y + (1 + 17 * r + 8) * zoom];
await page.mouse.move(...q(2, 1)); await page.mouse.down(); await page.mouse.move(...q(4, 2), { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(300);
await page.fill('.arted input[list="arted-names"]', 'test_block');
await page.click('button:has-text("Save sprite")');
await page.waitForTimeout(500);
console.log('sprites after save:', Object.keys((await saved()).sprites ?? {}), 'chip:', await page.textContent('.arted__chip'));
await page.click('.arted__tabs button:has-text("Sprites")'); // filter below expects the test sprite

// Sprites tab: the new sprite is listed and can be picked
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

// Palette: drag "hill" from the vertical list onto the table, then grab it in 3D, drag it, and delete it
console.log('palette visible:', await page.isVisible('.arted__palette'), 'items:', await page.locator('.arted__pal').count());
await page.fill('.arted__palette input', 'hill');
await page.waitForTimeout(150);
const hillItem = page.locator('.arted__pal', { hasText: /^hill$/ }).first();
const hb = await hillItem.boundingBox();
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
await page.mouse.move(900, 600, { steps: 6 }); await page.mouse.move(950, 620, { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(800);
let dropped = ((await saved()).props ?? []).find((p) => p.sprite === 'hill' && p.id.startsWith('hill') && !/^hill-[ewns]$|^hill-/.test(p.id)) ?? ((await saved()).props ?? []).slice(-1)[0];
console.log('dropped from palette:', JSON.stringify(dropped), 'selected in list:', await page.$eval('.arted__list', (s) => s.value));
await page.click('.arted__tab button:has-text("Look at")');
await page.waitForTimeout(400);
await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(760, 470, { steps: 5 }); await page.mouse.move(800, 480, { steps: 3 }); await page.mouse.up();
await page.waitForTimeout(600);
const moved = ((await saved()).props ?? []).find((p) => p.id === dropped.id);
console.log('after 3D drag:', JSON.stringify(moved), 'moved?', moved.x !== dropped.x || moved.z !== dropped.z);
await page.screenshot({ path: 'shots/arted-10-palette.png' });
await page.keyboard.press('Delete');
await page.waitForTimeout(600);
console.log('after Delete, still there?', !!((await saved()).props ?? []).find((p) => p.id === dropped.id));

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
