// Exercises the in-game art editor end to end on the private build.
import { resolve } from 'node:path';
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
const url = 'file://' + resolve(HTML);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.waitForTimeout(1500);

// open the editor from the setup card
await page.click('#setup-art');
await page.waitForSelector('#art-editor');
await page.waitForTimeout(1200);
const sheets = await page.$$eval('.arted select >> nth=0 >> option', (os) => os.map((o) => o.textContent));
console.log('sheets:', sheets);
await page.screenshot({ path: 'shots/arted-1-sheet.png' });

// select a 3x2 tile block on the sheet by dragging (grid 17px, origin 1): tiles (c 2..4, r 1..2)
const canvas = page.locator('.arted__sheet');
const box = await canvas.boundingBox();
const zoom = 3;
const px = (c) => box.x + (1 + 17 * c + 8) * zoom, py = (r) => box.y + (1 + 17 * r + 8) * zoom;
await page.mouse.move(px(2), py(1)); await page.mouse.down(); await page.mouse.move(px(4), py(2), { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(200);
const info = await page.textContent('.arted__row--preview .muted');
console.log('preview:', info);
const selVals = await page.$$eval('.arted__row input[type=number]', (is) => is.map((i) => i.value));
console.log('fields (pitch,tile,ox,oy,x,y,w,h):', selVals);

// name and save the sprite
await page.fill('.arted input[list="arted-names"]', 'test_block');
await page.click('button:has-text("Save sprite")');
await page.waitForTimeout(400);
let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pt.art') ?? '{}'));
console.log('sprites after save:', Object.keys(saved.sprites ?? {}));

// Spaces tab: give space 5 this cut as decoration via "use cut"
await page.click('.arted__tabs button:has-text("Spaces")');
await page.selectOption('.arted__tab select >> nth=0', '5');
await page.waitForTimeout(200);
const useCut = page.locator('.arted__tab button:has-text("use cut")');
console.log('use-cut buttons on Spaces:', await useCut.count(), 'disabled?', await useCut.nth(1).isDisabled());
await useCut.nth(1).click();
await page.waitForTimeout(1500);
saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pt.art') ?? '{}'));
console.log('spaces after use cut:', JSON.stringify(saved.spaces), 'sprites:', Object.keys(saved.sprites));
await page.screenshot({ path: 'shots/arted-2-spaces.png' });

// Scenery tab: add a prop from the cut, then place it with a click on the table
await page.click('.arted__tabs button:has-text("Scenery")');
await page.waitForTimeout(300);
const before = await page.$eval('.arted__list', (s) => s.options.length);
await page.click('.arted__tab button:has-text("Add (from cut)")');
await page.waitForTimeout(800);
const after = await page.$eval('.arted__list', (s) => s.options.length);
console.log('props before/after add:', before, after);
await page.click('.arted__tab button:has-text("Place with a click")');
await page.mouse.click(1100, 700);
await page.waitForTimeout(600);
saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pt.art') ?? '{}'));
const added = (saved.props ?? []).find((p) => p.sprite === 'prop_art');
console.log('placed prop:', JSON.stringify(added));
await page.screenshot({ path: 'shots/arted-3-scenery.png' });

// Slots tab: put the cut into the 'house' slot
await page.click('.arted__tabs button:has-text("Slots")');
await page.waitForTimeout(300);
const houseRow = page.locator('.arted__slot:has(b:text-is("house"))');
await houseRow.locator('button:has-text("use cut")').click();
await page.waitForTimeout(1200);
saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pt.art') ?? '{}'));
console.log('sprites after slot:', Object.keys(saved.sprites));
const status = await houseRow.locator('.arted__slotname span').textContent();
console.log('house slot status:', status);
await page.screenshot({ path: 'shots/arted-4-slots.png' });

// export
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.arted__bar button:has-text("Export JSON")')]);
const dlPath = await dl.path();
const { readFileSync } = await import('node:fs');
const exported = JSON.parse(readFileSync(dlPath, 'utf8'));
console.log('export keys:', Object.keys(exported), 'sprites:', Object.keys(exported.sprites).length, 'props:', exported.props?.length);

// close and reload: the art must persist and apply
await page.click('#arted-close');
await page.waitForTimeout(300);
console.log('editor closed:', (await page.$('#art-editor')) === null, 'title layer visible:', await page.isVisible('.title-layer'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#setup-start');
await page.waitForTimeout(2500);
const persisted = await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('pt.art') ?? '{}'); return { sprites: Object.keys(a.sprites), spaces: a.spaces, props: a.props?.length }; });
console.log('after reload:', JSON.stringify(persisted));
await page.screenshot({ path: 'shots/arted-5-reload.png' });
console.log('errors:', errors);
await browser.close();
