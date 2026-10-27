// In-game art editor: cut sprites out of the source sheets, browse every sprite, give art to board
// spaces, named slots and scenery props, and watch the 3D board update. Choices live in
// localStorage (overrides.ts) and can be exported/imported as JSON. Every change can be undone.
import { h, append, clear, toast } from '../dom.js';
import { THEME, deckName } from '../theme.js';
import { packImage, sheetSources, spriteCanvas, spriteNames } from '../art/pack.js';
import { animNames, applyArt, art, exportArt, importArt, isOverridden, removeAnim, removeArtSprite, resetArt, saveArt, setAnim, setArtSprite, setProps, setSpaceArt, type PropDef, type SpaceArt } from '../art/overrides.js';
import { BOARD_HALF, propImage, type Board3D } from './board3d.js';
import { SheetView, decodeImage, sheetImage, type Cut, type SheetImage } from './sheetview.js';
import { Composer } from './composer.js';

type Tab = 'sheet' | 'compose' | 'animate' | 'sprites' | 'spaces' | 'scenery' | 'slots';
interface Current { kind: 'cut' | 'sprite'; name: string; canvas: HTMLCanvasElement; info: string }

/** Named sprites the board draws directly, so replacing them re-skins that part of the game. */
const SLOTS: { name: string; what: string }[] = [
  { name: 'logo', what: 'Logo in the middle of the board' },
  { name: 'house', what: 'House (one per level)' },
  { name: 'hotel', what: 'Hotel' },
  { name: 'deck_chance', what: `${deckName('chance')} deck picture` },
  { name: 'deck_chest', what: `${deckName('chest')} deck picture` },
  { name: 'die_face', what: 'Die face background' },
  { name: 'coin', what: 'Coin (prices, tax)' },
  { name: 'coin2', what: 'Coin, second frame' },
  { name: 'coin3', what: 'Coin, third frame' },
  { name: 'qblock', what: '? block (chance spaces)' },
  { name: 'ground_l', what: 'Ground strip, left end' },
  { name: 'ground_m', what: 'Ground strip, middle' },
  { name: 'ground_r', what: 'Ground strip, right end' },
  { name: 'bush_l', what: 'Bush, left end' },
  { name: 'bush_m', what: 'Bush, middle' },
  { name: 'bush_r', what: 'Bush, right end' },
  { name: 'pipe_top', what: 'Pipe top' },
  { name: 'pipe_body', what: 'Pipe body' },
  { name: 'hill', what: 'Big hill' },
  { name: 'hill_small', what: 'Small hill' },
  { name: 'castle_big', what: 'Big castle' },
  { name: 'castle_small', what: 'Small castle' },
];
const ASSEMBLED = ['bush:2', 'bush:3', 'bush:4', 'pipe:2', 'pipe:3', 'pipe:4'];
const SIDES = ['bottom', 'left', 'top', 'right'];
const WIDTH_KEY = 'pt.art.width';

function thumb(canvas: HTMLCanvasElement | null, max = 48): HTMLElement {
  const el = h('span', { class: 'arted__thumb' });
  if (canvas && canvas.width && canvas.height) {
    const s = Math.max(1, Math.min(4, Math.floor(max / Math.max(canvas.width, canvas.height))));
    const c = document.createElement('canvas');
    c.width = canvas.width * s; c.height = canvas.height * s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    c.style.maxWidth = `${max}px`; c.style.maxHeight = `${max}px`;
    el.appendChild(c);
  } else el.textContent = '—';
  return el;
}

function num(value: number, step: number, onChange: (v: number) => void, width = 66): HTMLInputElement {
  const i = h('input', { type: 'number', step: String(step), value: String(value), style: { width: `${width}px` } });
  i.addEventListener('input', () => { const v = Number(i.value); if (Number.isFinite(v)) onChange(v); });
  return i;
}

function select(options: { value: string; label: string }[], value: string, onChange: (v: string) => void): HTMLSelectElement {
  const s = h('select', null, ...options.map((o) => h('option', { value: o.value }, o.label)));
  s.value = value;
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

function sideOfSpace(i: number): string { return SIDES[Math.floor(i / 10)]; }

/** Open the editor over the current screen. Returns a handle to close it programmatically. */
export function openArtEditor(root: HTMLElement, opts: { board: Board3D | null; onClose: () => void }): { close(): void } {
  const board = opts.board;

  // ---------- state ----------
  let tab: Tab = 'sheet';
  let current: Current | null = null;
  const history: string[] = [];
  const redo: string[] = [];
  let spaceIdx = 1;
  let props: PropDef[] = freshProps();
  let propId: string | null = props[0]?.id ?? null;
  let moveMode = false;
  let tableDrag = false;
  let filter = '';
  const recent: string[] = [];
  const useButtons: HTMLButtonElement[] = [];
  const thumbCache = new Map<string, HTMLCanvasElement | null>();

  function freshProps(): PropDef[] { return (art.props ?? board?.defaultProps() ?? []).map((p) => ({ ...p })); }
  function propOf(id: string | null): PropDef | null { return props.find((q) => q.id === id) ?? null; }
  function spriteThumb(name: string): HTMLCanvasElement | null {
    if (!thumbCache.has(name)) thumbCache.set(name, name.includes(':') ? propImage(name) : spriteCanvas(name));
    return thumbCache.get(name) ?? null;
  }

  // ---------- undo ----------
  function snapshot(): void {
    history.push(exportArt());
    if (history.length > 40) history.shift();
    redo.length = 0;
    updateBar();
  }
  async function restore(json: string): Promise<void> {
    await applyArt(JSON.parse(json));
    saveArt();
    afterArt();
  }
  async function undo(): Promise<void> {
    const prev = history.pop();
    if (prev === undefined) return;
    redo.push(exportArt());
    await restore(prev);
    toast('Undone.');
  }
  async function redoLast(): Promise<void> {
    const next = redo.pop();
    if (next === undefined) return;
    history.push(exportArt());
    await restore(next);
    toast('Redone.');
  }
  /** After any change to the art data: fresh working copies, redraw the board, re-render. */
  function afterArt(): void {
    thumbCache.clear();
    props = freshProps();
    if (!propOf(propId)) propId = props[0]?.id ?? null;
    board?.refreshArt();
    board?.markProp(tab === 'scenery' ? propId : null);
    renderTab();
    updateBar();
  }

  // ---------- current art ----------
  function setCurrent(c: Current | null): void {
    current = c;
    for (const b of useButtons) { b.disabled = !c; b.title = c ? `Use ${c.info}` : 'Nothing selected yet: cut something on the Sheet tab or pick a sprite'; }
    composer.setStamp(c?.canvas ?? null, c ? (c.kind === 'cut' ? c.info : c.name) : '');
    if (tab === 'scenery' && board) renderPalette();
    updateBar();
  }
  function setCurrentSprite(name: string): void {
    const c = spriteThumb(name);
    if (!c) return;
    setCurrent({ kind: 'sprite', name, canvas: c, info: `${name} (${c.width}×${c.height})` });
  }
  /** The sprite name to assign: a cut is saved first (under the typed name or `autoName`). */
  function useCurrent(autoName: string): string | null {
    if (!current) { toast('Nothing to use yet: cut something on the Sheet tab or pick a sprite.', 'error'); return null; }
    if (current.kind === 'sprite') return current.name;
    const name = nameInput.value.trim() || autoName;
    setArtSprite(name, current.canvas);
    if (!recent.includes(name)) recent.unshift(name);
    recent.splice(10);
    thumbCache.delete(name);
    setCurrentSprite(name);
    return name;
  }
  function useBtn(autoName: string, assign: (name: string) => void, label = '← use'): HTMLButtonElement {
    const b = h('button', { class: 'btn btn--sm btn--blue', type: 'button', disabled: !current, onClick: () => {
      snapshot();
      const n = useCurrent(autoName);
      if (n === null) { history.pop(); return; }
      assign(n);
      afterArt();
    } }, label);
    useButtons.push(b);
    return b;
  }
  function usedBy(name: string): string[] {
    const out: string[] = [];
    for (const [i, s] of Object.entries(art.spaces)) {
      if (s.strip === name) out.push(`space ${i} strip`);
      if (s.decor === name) out.push(`space ${i} ${Number(i) % 10 === 0 ? 'picture' : 'decoration'}`);
    }
    for (const p of props) if (p.sprite === name) out.push(`prop “${p.id}”`);
    if (SLOTS.some((s) => s.name === name)) out.push('a board slot');
    return out;
  }

  // ---------- sheet tab ----------
  const sheet = new SheetView();
  sheet.onMessage = (t, k) => toast(t, k);
  sheet.onCut = (cut: Cut | null) => {
    if (!cut) { if (current?.kind === 'cut') setCurrent(null); return; }
    setCurrent({ kind: 'cut', name: '', canvas: cut.canvas, info: `cut ${cut.canvas.width}×${cut.canvas.height} from ${cut.source}` });
  };
  const nameInput = h('input', { type: 'text', placeholder: 'name for the cut (optional)', style: { width: '190px' } });
  nameInput.setAttribute('list', 'arted-names');
  const nameList = h('datalist', { id: 'arted-names' });
  function sheetTab(): HTMLElement {
    clear(nameList);
    for (const n of spriteNames()) nameList.appendChild(h('option', { value: n }));
    const saveBtn = h('button', { class: 'btn btn--sm btn--primary', type: 'button', onClick: () => {
      if (!current || current.kind !== 'cut') { toast('Select something on the sheet first.', 'error'); return; }
      const name = nameInput.value.trim();
      if (!name) { toast('Give the sprite a name first.', 'error'); nameInput.focus(); return; }
      snapshot();
      useCurrent(name);
      toast(`Saved sprite “${name}”.`);
      afterArt();
    } }, 'Save sprite');
    const recentRow = h('div', { class: 'arted__row arted__recent' }, h('label', null, 'Recent'));
    if (!recent.length) recentRow.append(h('span', { class: 'muted small' }, 'sprites you save show up here'));
    for (const n of recent) recentRow.append(h('button', { class: 'arted__card arted__card--mini', type: 'button', title: n, onClick: () => setCurrentSprite(n) }, thumb(spriteThumb(n), 32), h('span', null, n)));
    const el = h('div', { class: 'arted__tab arted__tab--sheet' },
      sheet.el,
      h('div', { class: 'arted__row' }, nameInput, nameList, saveBtn, h('span', { class: 'muted small' }, 'or use the cut straight from the other tabs')),
      recentRow);
    requestAnimationFrame(() => sheet.layout());
    return el;
  }

  // ---------- compose tab ----------
  const composer = new Composer();
  composer.onMessage = (t, k) => toast(t, k);
  composer.onResult = (c) => setCurrent({ kind: 'cut', name: '', canvas: c, info: `composition ${c.width}×${c.height}` });
  composer.onSave = (name, c) => {
    snapshot();
    setArtSprite(name, c);
    if (!recent.includes(name)) recent.unshift(name);
    recent.splice(10);
    thumbCache.delete(name);
    setCurrentSprite(name);
    afterArt();
    toast(`Saved sprite “${name}” (${c.width}×${c.height}).`);
  };
  function composeTab(): HTMLElement {
    const el = h('div', { class: 'arted__tab arted__tab--scroll' },
      h('p', { class: 'arted__hint' }, 'Connect tiles into one sprite: stamp the current art into the grid cell by cell (flip it for the other side of a hill), then use the result or save it.'),
      composer.el);
    requestAnimationFrame(() => composer.draw());
    return el;
  }

  // ---------- animate tab ----------
  let animName = '';
  let animFrames: string[] = [];
  let animMs = 150;
  let animTimer = 0;
  function frameThumb(name: string): HTMLCanvasElement | null { return spriteThumb(name); }
  function animateTab(): HTMLElement {
    const nameIn = h('input', { type: 'text', placeholder: 'animation name', value: animName, style: { width: '150px' } });
    nameIn.addEventListener('input', () => { animName = nameIn.value.trim(); });
    const msIn = num(animMs, 10, (v) => { animMs = Math.max(30, Math.round(v)); }, 64);
    const loadSel = select([{ value: '', label: 'load saved…' }, ...animNames().map((n) => ({ value: n, label: n }))], '', (v) => {
      const a = art.anims[v];
      if (!a) return;
      animName = v; animFrames = [...a.frames]; animMs = a.ms;
      renderTab();
    });
    const splitN = h('input', { type: 'number', min: '2', max: '32', step: '1', value: '4', style: { width: '52px' } });
    const addFrame = (): void => {
      if (!current) { toast('Nothing to add: cut a frame on the Sheet tab or pick a sprite.', 'error'); return; }
      snapshot();
      const base = animName || 'anim';
      const n = useCurrent(`${base}_f${animFrames.length + 1}`);
      if (!n) { history.pop(); return; }
      animFrames.push(n);
      afterArt();
    };
    const split = (): void => {
      if (!current) { toast('Nothing to split: select a strip of frames on the Sheet tab first.', 'error'); return; }
      const n = Math.max(2, Math.min(32, Math.round(Number(splitN.value)) || 4));
      const c = current.canvas;
      if (c.width % n !== 0) { toast(`${c.width} px does not divide into ${n} equal frames.`, 'error'); return; }
      snapshot();
      const base = animName || (current.kind === 'sprite' ? current.name : 'anim');
      const fw = c.width / n;
      const names: string[] = [];
      for (let i = 0; i < n; i++) {
        const f = document.createElement('canvas');
        f.width = fw; f.height = c.height;
        f.getContext('2d')!.drawImage(c, i * fw, 0, fw, c.height, 0, 0, fw, c.height);
        const name = `${base}_f${animFrames.length + i + 1}`;
        setArtSprite(name, f);
        names.push(name);
      }
      animFrames.push(...names);
      afterArt();
      toast(`Split into ${n} frames of ${fw}×${c.height}.`);
    };
    const save = (): void => {
      const name = nameIn.value.trim();
      if (!name) { toast('Give the animation a name.', 'error'); nameIn.focus(); return; }
      if (animFrames.length < 2) { toast('An animation needs at least two frames.', 'error'); return; }
      snapshot();
      animName = name;
      setAnim(name, { frames: animFrames, ms: animMs });
      afterArt();
      toast(`Saved animation “${name}”. Place it from the Scenery palette (Animations).`);
    };
    const del = (): void => {
      const name = nameIn.value.trim();
      if (!name || !art.anims[name]) return;
      snapshot();
      removeAnim(name);
      animFrames = []; animName = '';
      afterArt();
    };
    const strip = h('div', { class: 'arted__frames' });
    animFrames.forEach((f, i) => {
      const mv = (to: number) => { if (to < 0 || to >= animFrames.length) return; const [x] = animFrames.splice(i, 1); animFrames.splice(to, 0, x); renderTab(); };
      strip.append(h('div', { class: 'arted__frame' },
        thumb(frameThumb(f), 40), h('span', { title: f }, `${i + 1}`),
        h('span', { class: 'btns' },
          h('button', { class: 'btn btn--sm', type: 'button', title: 'earlier', onClick: () => mv(i - 1) }, '◀'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'later', onClick: () => mv(i + 1) }, '▶'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'remove this frame', onClick: () => { animFrames.splice(i, 1); renderTab(); } }, '✕'))));
    });
    if (!animFrames.length) strip.append(h('span', { class: 'muted small' }, 'no frames yet'));
    const prev = document.createElement('canvas');
    prev.className = 'arted__animprev';
    const drawPrev = () => {
      const frames = animFrames.map(frameThumb).filter((c): c is HTMLCanvasElement => !!c);
      if (!frames.length) { prev.width = 64; prev.height = 64; return; }
      const w = Math.max(...frames.map((c) => c.width)), hgt = Math.max(...frames.map((c) => c.height));
      const k = Math.max(1, Math.min(8, Math.floor(128 / Math.max(w, hgt))));
      if (prev.width !== w * k || prev.height !== hgt * k) { prev.width = w * k; prev.height = hgt * k; }
      const f = frames[Math.floor(performance.now() / animMs) % frames.length];
      const ctx = prev.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, prev.width, prev.height);
      ctx.drawImage(f, Math.floor((w - f.width) / 2) * k, (hgt - f.height) * k, f.width * k, f.height * k);
    };
    window.clearInterval(animTimer);
    animTimer = window.setInterval(drawPrev, 30);
    drawPrev();
    const saved = animName && art.anims[animName];
    return h('div', { class: 'arted__tab arted__tab--scroll' },
      h('p', { class: 'arted__hint' }, 'Build an animated piece from frames: cut each frame on the Sheet tab and add it, or select a whole strip of frames in one go and split it. Then save, and place it from the Scenery palette under “Animations”.'),
      h('div', { class: 'arted__row' }, h('label', null, 'Animation'), nameIn, loadSel, h('label', null, 'ms per frame'), msIn),
      h('div', { class: 'arted__row' },
        h('button', { class: 'btn btn--sm btn--blue', type: 'button', disabled: !current, onClick: addFrame }, current ? `Add “${current.kind === 'cut' ? 'cut' : current.name}” as frame` : 'Add current art as frame'),
        h('button', { class: 'btn btn--sm', type: 'button', disabled: !current, onClick: split }, 'Split current art into'), splitN, h('span', { class: 'muted small' }, 'frames'),
        h('button', { class: 'btn btn--sm', type: 'button', disabled: !animFrames.length, onClick: () => { animFrames = []; renderTab(); } }, 'Clear frames')),
      h('div', { class: 'arted__row arted__row--top' }, prev, h('div', { class: 'arted__fields' }, h('span', { class: 'muted small' }, `${animFrames.length} frame${animFrames.length === 1 ? '' : 's'} · ${animMs} ms each · ${animFrames.length ? (1000 / animMs).toFixed(1) : '0'} fps`), strip)),
      h('div', { class: 'arted__row' },
        h('button', { class: 'btn btn--sm btn--primary', type: 'button', onClick: save }, saved ? 'Save changes' : 'Save animation'),
        saved ? h('button', { class: 'btn btn--sm btn--warn', type: 'button', onClick: del }, 'Delete animation') : null,
        h('span', { class: 'muted small' }, `${animNames().length} saved`)));
  }

  // ---------- sprites tab ----------
  function spritesTab(): HTMLElement {
    const filterIn = h('input', { type: 'text', placeholder: 'filter by name', value: filter, style: { width: '160px' } });
    const count = h('span', { class: 'muted small' });
    filterIn.addEventListener('input', () => { filter = filterIn.value.trim().toLowerCase(); renderGrid(); });
    const grid = h('div', { class: 'arted__grid' });
    const detail = h('div', { class: 'arted__detail' });
    function renderGrid(): void {
      clear(grid);
      const all = spriteNames();
      const list = all.filter((n) => !filter || n.includes(filter));
      count.textContent = `${list.length} of ${all.length}`;
      for (const n of list) {
        const mine = isOverridden(n);
        grid.append(h('button', { class: `arted__card${mine ? ' is-mine' : ''}${current?.kind === 'sprite' && current.name === n ? ' is-current' : ''}`, type: 'button', title: n, onClick: () => { setCurrentSprite(n); renderGrid(); renderDetail(); } },
          thumb(spriteThumb(n), 40), h('span', null, n)));
      }
      if (!list.length) grid.append(h('p', { class: 'muted small' }, 'No sprite matches.'));
    }
    function renderDetail(): void {
      clear(detail);
      const c = current?.kind === 'sprite' ? current : null;
      if (!c) { detail.append(h('p', { class: 'arted__hint' }, 'Click a sprite to make it the current art, then use it from the Spaces, Scenery or Slots tab. ★ marks sprites you made.')); return; }
      const mine = isOverridden(c.name);
      const used = usedBy(c.name);
      const renameIn = h('input', { type: 'text', value: c.name, style: { width: '150px' } });
      append(detail, [
        h('div', { class: 'arted__row' }, thumb(c.canvas, 96), h('div', null, h('b', null, c.name), h('div', { class: 'muted small' }, `${c.canvas.width}×${c.canvas.height} px · ${mine ? 'yours' : 'from the pack'}`), h('div', { class: 'muted small' }, used.length ? `used by ${used.join(', ')}` : 'not used anywhere yet'))),
        h('div', { class: 'arted__row' },
          h('button', { class: 'btn btn--sm btn--blue', type: 'button', title: 'Open it on the Sheet tab to touch up (wand, trim, nudge) and save under the same name', onClick: () => editSprite(c.name) }, 'Edit in Sheet'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'Open it in the Compose grid as the stamp', onClick: () => { tab = 'compose'; renderTab(); } }, 'Compose with it')),
        mine ? h('div', { class: 'arted__row' },
          renameIn,
          h('button', { class: 'btn btn--sm', type: 'button', onClick: () => {
            const to = renameIn.value.trim();
            if (!to || to === c.name) return;
            if (spriteNames().includes(to)) { toast(`“${to}” already exists.`, 'error'); return; }
            snapshot();
            setArtSprite(to, c.canvas);
            removeArtSprite(c.name);
            for (const [i, s] of Object.entries(art.spaces)) setSpaceArt(Number(i), { strip: s.strip === c.name ? to : s.strip, decor: s.decor === c.name ? to : s.decor });
            if (props.some((p) => p.sprite === c.name)) { for (const p of props) if (p.sprite === c.name) p.sprite = to; setProps(props); }
            setCurrentSprite(to);
            afterArt();
          } }, 'Rename'),
          h('button', { class: 'btn btn--sm btn--warn', type: 'button', onClick: () => {
            snapshot();
            removeArtSprite(c.name);
            setCurrent(null);
            afterArt();
            if (used.length) toast(`Deleted. ${used.length} place(s) that used it fall back to the default.`);
          } }, 'Delete')) : null]);
    }
    renderGrid(); renderDetail();
    return h('div', { class: 'arted__tab arted__tab--scroll' },
      h('div', { class: 'arted__row' }, h('label', null, 'Sprites'), filterIn, count),
      detail, grid);
  }

  // ---------- spaces tab ----------
  function contentWidth(): number { return Math.max(280, Math.min(560, panel.clientWidth - 28)); }
  function drawBoardMap(canvas: HTMLCanvasElement, hoverIdx: number | null): void {
    if (!board) return;
    const img = board.boardImage();
    const w = contentWidth();
    canvas.width = w; canvas.height = w;
    const ctx = canvas.getContext('2d')!;
    const k = w / img.width;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, w, w);
    for (let i = 0; i < 40; i++) {
      const r = board.spaceTexRect(i);
      if (art.spaces[i]) { ctx.fillStyle = '#fbd000'; ctx.strokeStyle = '#161616'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((r.x + r.w / 2) * k, (r.y + r.h / 2) * k, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      if (i === hoverIdx && i !== spaceIdx) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(r.x * k + 1, r.y * k + 1, r.w * k - 2, r.h * k - 2); }
    }
    const r = board.spaceTexRect(spaceIdx);
    ctx.lineWidth = 3; ctx.strokeStyle = '#161616'; ctx.strokeRect(r.x * k, r.y * k, r.w * k, r.h * k);
    ctx.lineWidth = 2; ctx.strokeStyle = '#fbd000'; ctx.strokeRect(r.x * k + 1.5, r.y * k + 1.5, r.w * k - 3, r.h * k - 3);
  }
  function drawSpacePreview(canvas: HTMLCanvasElement): void {
    if (!board) return;
    const img = board.boardImage();
    const r = board.spaceTexRect(spaceIdx);
    const swap = Math.abs(Math.abs(r.angle) - Math.PI / 2) < 0.01;
    const ow = swap ? r.h : r.w, oh = swap ? r.w : r.h;
    const k = Math.min(1, 220 / Math.max(ow, oh));
    canvas.width = Math.round(ow * k); canvas.height = Math.round(oh * k);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-r.angle);
    ctx.drawImage(img, r.x, r.y, r.w, r.h, -r.w * k / 2, -r.h * k / 2, r.w * k, r.h * k);
  }
  function spacesTab(): HTMLElement {
    const names = THEME.spaceNames;
    const cur: SpaceArt = art.spaces[spaceIdx] ?? {};
    const isCorner = spaceIdx % 10 === 0;
    const set = (patch: SpaceArt): void => { snapshot(); setSpaceArt(spaceIdx, patch); afterArt(); };
    const map = document.createElement('canvas');
    map.className = 'arted__map';
    map.title = 'Click a space (or click it on the 3D board)';
    let hoverIdx: number | null = null;
    const hitSpace = (e: MouseEvent): number | null => {
      if (!board) return null;
      const rect = map.getBoundingClientRect();
      const k = board.boardImage().width / rect.width;
      return board.spaceAtTex((e.clientX - rect.left) * k, (e.clientY - rect.top) * k);
    };
    map.addEventListener('pointermove', (e) => { const i = hitSpace(e); if (i !== hoverIdx) { hoverIdx = i; drawBoardMap(map, hoverIdx); } map.style.cursor = i === null ? '' : 'pointer'; });
    map.addEventListener('pointerleave', () => { hoverIdx = null; drawBoardMap(map, null); });
    map.addEventListener('click', (e) => { const i = hitSpace(e); if (i !== null) { spaceIdx = i; renderTab(); } });
    const preview = document.createElement('canvas');
    preview.className = 'arted__spacepreview';
    const stripVal = cur.strip === undefined ? '(default)' : (cur.strip || '(none)');
    const decorVal = cur.decor === undefined ? '(default)' : (cur.decor || '(none)');
    const fromSel = (v: string): string | undefined => (v === '(default)' ? undefined : v === '(none)' ? '' : v);
    const baseH = isCorner ? 110 : 48;
    const heightLabel = h('span', { class: 'muted small', style: { minWidth: '3.5em' } }, `${cur.decorH ?? baseH} px`);
    const heightIn = h('input', { type: 'range', min: '12', max: '180', step: '2', value: String(cur.decorH ?? baseH), style: { width: '150px' } });
    let heightSnap = false, heightTimer = 0;
    heightIn.addEventListener('input', () => {
      if (!heightSnap) { snapshot(); heightSnap = true; }
      heightLabel.textContent = `${heightIn.value} px`;
      window.clearTimeout(heightTimer);
      heightTimer = window.setTimeout(() => { setSpaceArt(spaceIdx, { decorH: Number(heightIn.value) }); board?.refreshArt(); drawSpacePreview(preview); drawBoardMap(map, null); }, 90);
    });
    heightIn.addEventListener('change', () => { heightSnap = false; window.clearTimeout(heightTimer); setSpaceArt(spaceIdx, { decorH: Number(heightIn.value) }); afterArt(); });
    const options = (extra: string[]) => [...extra.map((v) => ({ value: v, label: v })), ...spriteNames().map((n) => ({ value: n, label: isOverridden(n) ? `${n} ★` : n }))];
    const sideBtn = isCorner ? null : h('button', { class: 'btn btn--sm', type: 'button', title: 'Give every space on this side the same ground strip', onClick: () => {
      snapshot();
      const side = sideOfSpace(spaceIdx);
      for (let i = 0; i < 40; i++) if (i % 10 !== 0 && sideOfSpace(i) === side) setSpaceArt(i, { strip: cur.strip });
      afterArt();
    } }, 'Strip → whole side');
    const lookBtn = board ? h('button', { class: 'btn btn--sm', type: 'button', title: 'Swing the camera to this space', onClick: () => {
      const r = board.spaceTexRect(spaceIdx);
      const k = 2 * BOARD_HALF / board.boardImage().width;
      board.focusPoint((r.x + r.w / 2) * k - BOARD_HALF, 0.2, (r.y + r.h / 2) * k - BOARD_HALF, 5);
    } }, 'Look at') : null;
    const el = h('div', { class: 'arted__tab arted__tab--scroll' },
      board ? map : null,
      h('div', { class: 'arted__row' }, h('label', null, 'Space'),
        select(names.map((n, i) => ({ value: String(i), label: `${i} · ${n}` })), String(spaceIdx), (v) => { spaceIdx = Number(v); renderTab(); }),
        h('button', { class: 'btn btn--sm', type: 'button', title: 'previous space', onClick: () => { spaceIdx = (spaceIdx + 39) % 40; renderTab(); } }, '◀'),
        h('button', { class: 'btn btn--sm', type: 'button', title: 'next space', onClick: () => { spaceIdx = (spaceIdx + 1) % 40; renderTab(); } }, '▶'),
        lookBtn),
      h('div', { class: 'arted__row arted__row--top' },
        board ? preview : null,
        h('div', { class: 'arted__fields' },
          isCorner ? h('p', { class: 'arted__hint' }, 'A corner: the picture replaces the whole drawing (the name stays).') : null,
          isCorner ? null : h('div', { class: 'arted__row' }, h('label', null, 'Ground strip'),
            select(options(['(default)', '(none)']), stripVal, (v) => set({ strip: fromSel(v) })),
            useBtn(`space${spaceIdx}_strip`, (n) => setSpaceArt(spaceIdx, { strip: n })),
            thumb(cur.strip ? spriteThumb(cur.strip) : null, 32)),
          h('div', { class: 'arted__row' }, h('label', null, isCorner ? 'Picture' : 'Decoration'),
            select(options(['(default)', '(none)']), decorVal, (v) => set({ decor: fromSel(v) })),
            useBtn(`space${spaceIdx}_${isCorner ? 'corner' : 'decor'}`, (n) => setSpaceArt(spaceIdx, { decor: n })),
            thumb(cur.decor ? spriteThumb(cur.decor) : null, 32)),
          h('div', { class: 'arted__row' }, h('label', null, 'Height'), heightIn, heightLabel),
          h('div', { class: 'arted__row' },
            h('button', { class: 'btn btn--sm', type: 'button', disabled: !art.spaces[spaceIdx], onClick: () => set({ strip: undefined, decor: undefined, decorH: undefined }) }, 'Reset this space'),
            sideBtn))),
      h('p', { class: 'arted__hint' }, `${Object.keys(art.spaces).length} of 40 spaces customised (yellow dots). Strips repeat one tile along the bottom edge; decorations sit above the strip. Click a space on the map or on the 3D board.`));
    requestAnimationFrame(() => { drawBoardMap(map, null); drawSpacePreview(preview); });
    return el;
  }

  // ---------- scenery tab ----------
  function commitProps(): void { setProps(props); }
  function sceneryTab(): HTMLElement {
    const p = propOf(propId);
    board?.markProp(p?.id ?? null);
    const list = h('select', { size: '12', class: 'arted__list' }, ...props.map((q) => h('option', { value: q.id }, `${q.id} · ${q.sprite}`)));
    list.value = propId ?? '';
    list.addEventListener('change', () => { propId = list.value; renderTab(); });
    const uniqueId = (base: string): string => { let i = 1; let id = base; while (props.some((q) => q.id === id)) id = `${base}-${++i}`; return id; };
    const add = (): void => {
      snapshot();
      const id = uniqueId(current?.kind === 'sprite' ? current.name.replace(/[:]/g, '') : 'prop');
      const def: PropDef = { id, sprite: 'bush:3', x: 0, y: 0, z: BOARD_HALF + 3, h: 1 };
      if (current) { const n = useCurrent(`${id}_art`); if (n) def.sprite = n; }
      props.push(def); propId = id; commitProps(); afterArt();
      toast(`Added “${id}” in front of the board. Drag it on the table to move it.`);
    };
    const dup = (): void => { if (!p) return; snapshot(); const id = uniqueId(p.id); props.push({ ...p, id, x: p.x + 1 }); propId = id; commitProps(); afterArt(); };
    const remove = (): void => { if (!p) return; snapshot(); props = props.filter((q) => q !== p); propId = props[0]?.id ?? null; commitProps(); afterArt(); };
    const reset = (): void => { snapshot(); setProps(null); afterArt(); toast('Scenery back to the built-in layout.'); };
    const moveLive = (): void => { if (p && board && !board.moveProp(p)) board.rebuildScenery(); commitProps(); };
    const posX = num(p?.x ?? 0, 0.5, (v) => { if (p) { p.x = v; moveLive(); } });
    const posZ = num(p?.z ?? 0, 0.5, (v) => { if (p) { p.z = v; moveLive(); } });
    const moveBtn = h('button', { class: `btn btn--sm${moveMode ? ' btn--blue' : ''}`, type: 'button', disabled: !p, title: 'Click or drag on the 3D table to put the selected prop there', onClick: () => { moveMode = !moveMode; renderTab(); if (moveMode) toast('Click or drag on the table. Esc stops.'); } }, moveMode ? 'Moving on table… (Esc)' : 'Move on table');
    const heightIn = h('input', { type: 'range', min: '0.2', max: '8', step: '0.1', value: String(p?.h ?? 1), style: { width: '120px' } });
    let hSnap = false;
    heightIn.addEventListener('input', () => { if (!p) return; if (!hSnap) { snapshot(); hSnap = true; } p.h = Number(heightIn.value); heightNum.value = heightIn.value; });
    heightIn.addEventListener('change', () => { hSnap = false; if (!p) return; commitProps(); board?.rebuildScenery(); board?.markProp(p.id); });
    const heightNum = num(p?.h ?? 1, 0.1, (v) => { if (p) { snapshot(); p.h = Math.max(0.1, v); heightIn.value = String(p.h); commitProps(); board?.rebuildScenery(); board?.markProp(p.id); } }, 60);
    const el = h('div', { class: 'arted__tab arted__tab--scroll' },
      h('p', { class: 'arted__hint' }, 'Drag art from the list on the right straight onto the 3D table, or grab a prop on the table to move it. Pick a prop below to edit it.'),
      h('div', { class: 'arted__row arted__row--top' }, list,
        h('div', { class: 'arted__btncol' },
          h('button', { class: 'btn btn--sm', type: 'button', disabled: !p, title: 'Swing the camera to the selected prop', onClick: () => { if (p) board?.focusPoint(p.x, p.y + p.h / 2, p.z, Math.max(6, p.h * 4)); } }, 'Look at'),
          h('button', { class: 'btn btn--sm btn--good', type: 'button', onClick: add }, current ? `Add “${current.kind === 'cut' ? 'cut' : current.name}”` : 'Add prop'),
          h('button', { class: 'btn btn--sm', type: 'button', disabled: !p, onClick: dup }, 'Duplicate'),
          h('button', { class: 'btn btn--sm btn--warn', type: 'button', disabled: !p, onClick: remove }, 'Remove'),
          h('button', { class: 'btn btn--sm', type: 'button', onClick: reset }, 'Default layout'))),
      p ? h('div', { class: 'arted__prop' },
        h('div', { class: 'arted__row' }, h('label', null, 'Name'), h('input', { type: 'text', value: p.id, style: { width: '130px' }, onChange: (e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); if (v && !props.some((q) => q !== p && q.id === v)) { snapshot(); p.id = v; propId = v; commitProps(); afterArt(); } } }),
          h('label', null, 'Art'),
          select([...animNames().map((a) => ({ value: `anim:${a}`, label: `anim: ${a}` })), ...ASSEMBLED.map((a) => ({ value: a, label: a })), ...spriteNames().map((n) => ({ value: n, label: isOverridden(n) ? `${n} ★` : n }))], p.sprite, (v) => { snapshot(); p.sprite = v; commitProps(); afterArt(); }),
          useBtn(`${p.id}_art`, (n) => { p.sprite = n; commitProps(); }),
          thumb(spriteThumb(p.sprite), 36)),
        h('div', { class: 'arted__row' },
          h('label', null, 'x'), posX, h('label', null, 'z'), posZ,
          h('label', null, 'y'), num(p.y, 0.25, (v) => { p.y = v; moveLive(); }),
          h('label', { class: 'arted__check' }, h('input', { type: 'checkbox', checked: !!p.float, onChange: (e: Event) => { snapshot(); p.float = (e.target as HTMLInputElement).checked; moveLive(); } }), ' floats')),
        h('div', { class: 'arted__row' }, h('label', null, 'Height'), heightIn, heightNum, h('span', { class: 'muted small' }, 'units (a token is about 0.8)'), moveBtn),
        h('p', { class: 'arted__hint' }, 'x runs left to right, z towards the camera (the board edge is at ±8.6), y lifts it off the table. Grab any prop on the 3D table to drag it, or type numbers. Delete removes the selected prop.')) : h('p', { class: 'arted__hint' }, 'No scenery yet. Drag art from the list on the right onto the table, add a prop, or restore the default layout.'));
    return el;
  }
  // moving props on the 3D table (capture phase, so the camera does not turn): grab a prop directly,
  // or, with "Move on table" on, click/drag anywhere to put the selected prop there
  let dragOff = { x: 0, z: 0 };
  let dragMoved = false;
  function onTableDown(e: PointerEvent): void {
    if (!board || e.button !== 0 || tab !== 'scenery') return;
    const hit = board.pickProp(e);
    if (!hit && !moveMode) return;
    if (hit) propId = hit;
    const p = propOf(propId);
    if (!p) return;
    e.stopPropagation(); e.preventDefault();
    const g = board.pickGround(e);
    dragOff = hit && g ? { x: p.x - g.x, z: p.z - g.z } : { x: 0, z: 0 };
    dragMoved = false;
    snapshot();
    tableDrag = true;
    board.markProp(p.id);
    if (!hit) onTableMove(e);
  }
  function onTableMove(e: PointerEvent): void {
    if (!tableDrag || !board) return;
    e.stopPropagation();
    const p = propOf(propId);
    const g = board.pickGround(e);
    if (!p || !g) return;
    const nx = Math.round((g.x + dragOff.x) * 4) / 4, nz = Math.round((g.z + dragOff.z) * 4) / 4;
    if (nx === p.x && nz === p.z) return;
    p.x = nx; p.z = nz; dragMoved = true;
    if (!board.moveProp(p)) board.rebuildScenery();
  }
  function onTableUp(e: PointerEvent): void {
    if (!tableDrag) return;
    e.stopPropagation();
    tableDrag = false;
    if (dragMoved) commitProps(); else history.pop(); // a plain click only selects
    updateBar();
    renderTab();
  }

  /** Open a sprite on the Sheet tab, whole and selected, so it can be touched up and saved under the same name. */
  function editSprite(name: string): void {
    const c = spriteThumb(name);
    if (!c) return;
    sheet.loadSprite(name, c);
    nameInput.value = name;
    tab = 'sheet';
    showPanel(true);
    renderTab();
    toast(`Editing “${name}”: use the wand, trim or nudge, then Save sprite to replace it.`);
  }

  // ---------- palette: drag art from a vertical list onto the table ----------
  const palette = h('div', { class: 'arted__palette paper paper--flat hidden' });
  let palFilter = '';
  function propHeightFor(name: string): number {
    const c = spriteThumb(name);
    return c ? Math.max(0.4, Math.min(6, Math.round(c.height * 0.05 * 10) / 10)) : 1;
  }
  function uniquePropId(base: string): string {
    const clean = base.replace(/[^a-z0-9_-]/gi, '') || 'prop';
    let i = 1; let id = clean;
    while (props.some((q) => q.id === id)) id = `${clean}-${++i}`;
    return id;
  }
  /** Start dragging `name` (or the current cut when null) from the palette onto the table. */
  function paletteDrag(item: HTMLElement, name: string | null, e: PointerEvent): void {
    if (!board || e.button !== 0) return;
    e.preventDefault();
    item.setPointerCapture(e.pointerId);
    item.classList.add('is-dragging');
    let def: PropDef | null = null;
    let sprite = name;
    const start = { x: e.clientX, y: e.clientY };
    const ensureSprite = (): string | null => {
      if (sprite) return sprite;
      sprite = useCurrent(uniquePropId('cut') + '_art'); // saves the cut under a name
      return sprite;
    };
    const move = (ev: PointerEvent) => {
      const over = board.isOverCanvas(ev.clientX, ev.clientY);
      if (over) {
        const g = board.pickGround(ev);
        if (!g) return;
        if (!def) {
          const sp = ensureSprite();
          if (!sp) return;
          def = { id: uniquePropId(sp.replace(/:/g, '')), sprite: sp, x: 0, y: 0, z: 0, h: propHeightFor(sp) };
          if (!board.addProp(def)) { def = null; return; }
        }
        def.x = Math.round(g.x * 4) / 4; def.z = Math.round(g.z * 4) / 4;
        board.moveProp(def);
      } else if (def) { board.removeProp(def.id); def = null; }
    };
    const up = (ev: PointerEvent) => {
      item.removeEventListener('pointermove', move);
      item.removeEventListener('pointerup', up);
      item.removeEventListener('pointercancel', up);
      item.classList.remove('is-dragging');
      if (def) {
        snapshot();
        props.push(def); propId = def.id; commitProps();
        board.markProp(def.id);
        renderTab();
        toast(`Placed “${def.id}”. Drag it on the table to move it, Delete removes it.`);
      } else if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) {
        // a plain click: put it in front of the board
        const sp = ensureSprite();
        if (!sp) return;
        snapshot();
        const id = uniquePropId(sp.replace(/:/g, ''));
        props.push({ id, sprite: sp, x: Math.round((Math.random() * 8 - 4) * 4) / 4, y: 0, z: BOARD_HALF + 3, h: propHeightFor(sp) });
        propId = id; commitProps(); afterArt();
        toast(`Added “${id}” in front of the board.`);
      }
    };
    item.addEventListener('pointermove', move);
    item.addEventListener('pointerup', up);
    item.addEventListener('pointercancel', up);
  }
  function renderPalette(): void {
    clear(palette);
    const filterIn = h('input', { type: 'text', placeholder: 'filter', value: palFilter });
    filterIn.addEventListener('input', () => { palFilter = filterIn.value.trim().toLowerCase(); renderList(); });
    const list = h('div', { class: 'arted__palette-list' });
    const item = (name: string | null, label: string, canvas: HTMLCanvasElement | null): HTMLElement => {
      const editable = !!name && !name.includes(':');
      const edit = editable ? h('button', { class: 'arted__pal-edit', type: 'button', title: 'Edit this sprite on the Sheet tab' }, '✎') : null;
      edit?.addEventListener('pointerdown', (e) => e.stopPropagation());
      edit?.addEventListener('click', (e) => { e.stopPropagation(); if (name) editSprite(name); });
      const el = h('div', { class: 'arted__pal', title: `Drag “${label}” onto the table (or click to add it in front of the board)` }, thumb(canvas, 40), h('span', null, label), edit);
      el.addEventListener('pointerdown', (e) => paletteDrag(el, name, e));
      return el;
    };
    function renderList(): void {
      clear(list);
      const f = palFilter;
      if (current && (!f || 'current art'.includes(f))) { list.append(h('div', { class: 'arted__pal-head' }, 'Current art'), item(current.kind === 'sprite' ? current.name : null, current.kind === 'cut' ? `cut ${current.canvas.width}×${current.canvas.height}` : current.name, current.canvas)); }
      const groups: [string, string[]][] = [
        ['Animations', animNames().map((n) => `anim:${n}`)],
        ['Assembled', ASSEMBLED],
        ['Yours', spriteNames().filter((n) => isOverridden(n))],
        ['Pack', spriteNames().filter((n) => !isOverridden(n))],
      ];
      for (const [head, names] of groups) {
        const shown = names.filter((n) => !f || n.includes(f));
        if (!shown.length) continue;
        list.append(h('div', { class: 'arted__pal-head' }, head));
        for (const n of shown) list.append(item(n, n, spriteThumb(n)));
      }
    }
    renderList();
    palette.append(h('b', { class: 'arted__pal-title' }, 'Drag onto the table'), filterIn, list);
  }

  // ---------- slots tab ----------
  function slotsTab(): HTMLElement {
    const rows = SLOTS.map((s) => {
      const c = spriteThumb(s.name);
      const mine = isOverridden(s.name);
      return h('div', { class: `arted__slot${mine ? ' is-mine' : ''}` },
        thumb(c, 44),
        h('div', { class: 'arted__slotname' }, h('b', null, s.name), h('span', { class: 'muted small' }, `${s.what} · ${mine ? 'yours' : c ? 'pack' : 'empty'}`)),
        useBtn(s.name, (n) => { if (n !== s.name) { const src = spriteThumb(n); if (src) setArtSprite(s.name, src); } }),
        select([{ value: '', label: 'copy from…' }, ...spriteNames().filter((n) => n !== s.name).map((n) => ({ value: n, label: n }))], '', (v) => { const src = v && spriteThumb(v); if (src) { snapshot(); setArtSprite(s.name, src); afterArt(); } }),
        mine ? h('button', { class: 'btn btn--sm', type: 'button', title: 'back to the pack sprite', onClick: () => { snapshot(); removeArtSprite(s.name); afterArt(); } }, 'Clear') : h('span'));
    });
    return h('div', { class: 'arted__tab arted__tab--scroll' },
      h('p', { class: 'arted__hint' }, 'Slots are sprites the board draws by name. Put the current art into one, copy another sprite into it, or clear it to get the pack art back. Corner pictures are on the Spaces tab (0, 10, 20, 30).'),
      ...rows);
  }

  // ---------- frame ----------
  const panel = h('div', { class: 'arted__panel paper paper--flat' });
  const body = h('div', { class: 'arted__body' });
  const foot = h('div', { class: 'arted__foot muted small' });
  const handle = h('div', { class: 'arted__handle', title: 'drag to resize' });
  panel.append(body, foot, handle);
  try { const w = Number(localStorage.getItem(WIDTH_KEY)); if (w >= 380) panel.style.width = `${w}px`; } catch { /* ignore */ }
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const left = panel.getBoundingClientRect().left;
    const move = (ev: PointerEvent) => { const w = Math.max(380, Math.min(window.innerWidth - left - 12, ev.clientX - left)); panel.style.width = `${w}px`; };
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); try { localStorage.setItem(WIDTH_KEY, String(panel.clientWidth)); } catch { /* ignore */ } renderTab(); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
  const tabBtns = new Map<Tab, HTMLButtonElement>();
  function renderTab(): void {
    useButtons.length = 0;
    window.clearInterval(animTimer);
    clear(body);
    if (tab !== 'scenery') { moveMode = false; tableDrag = false; board?.markProp(null); }
    palette.classList.toggle('hidden', tab !== 'scenery' || !board);
    overlay.classList.toggle('has-palette', tab === 'scenery' && !!board);
    if (tab === 'scenery' && board) renderPalette();
    board?.setSpaceClick(tab === 'spaces' ? (i) => { spaceIdx = i; renderTab(); } : () => {});
    body.appendChild(tab === 'sheet' ? sheetTab() : tab === 'compose' ? composeTab() : tab === 'animate' ? animateTab() : tab === 'sprites' ? spritesTab() : tab === 'spaces' ? spacesTab() : tab === 'scenery' ? sceneryTab() : slotsTab());
    for (const [t, b] of tabBtns) b.classList.toggle('btn--blue', t === tab);
    setCurrent(current);
    const mine = Object.keys(art.sprites).length, spaces = Object.keys(art.spaces).length;
    foot.textContent = `${mine} sprite${mine === 1 ? '' : 's'} of yours · ${spaces} space${spaces === 1 ? '' : 's'} customised · scenery: ${art.props ? `${art.props.length} props (custom)` : 'default layout'} · saved in this browser`;
  }
  const tabs = ([['sheet', 'Sheet'], ['compose', 'Compose'], ['animate', 'Animate'], ['sprites', 'Sprites'], ['spaces', 'Spaces'], ['scenery', 'Scenery'], ['slots', 'Slots']] as [Tab, string][]).map(([t, label]) => {
    const b = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { tab = t; showPanel(true); renderTab(); } }, label);
    tabBtns.set(t, b);
    return b;
  });
  const chip = h('button', { class: 'arted__chip', type: 'button', title: 'The current art: what the “← use” buttons apply. Click to browse sprites.', onClick: () => { tab = 'sprites'; showPanel(true); renderTab(); } });
  let panelShown = true;
  const panelBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Hide or show the editor panel (the palette stays)', onClick: () => showPanel(!panelShown) }, '◀ Panel');
  function showPanel(on: boolean): void {
    panelShown = on;
    panel.classList.toggle('hidden', !on);
    overlay.classList.toggle('panel-hidden', !on);
    panelBtn.textContent = on ? '◀ Panel' : '▶ Panel';
    panelBtn.classList.toggle('btn--blue', !on);
  }
  const undoBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Undo (Ctrl+Z)', onClick: () => void undo() }, 'Undo');
  const redoBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Redo (Ctrl+Shift+Z)', onClick: () => void redoLast() }, 'Redo');
  function updateBar(): void {
    clear(chip);
    if (current) chip.append(thumb(current.canvas, 28), h('span', null, current.kind === 'cut' ? `cut ${current.canvas.width}×${current.canvas.height}` : current.name));
    else chip.append(h('span', { class: 'muted' }, 'no current art'));
    undoBtn.disabled = !history.length; redoBtn.disabled = !redo.length;
    undoBtn.textContent = history.length ? `Undo (${history.length})` : 'Undo';
  }
  const importIn = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
  importIn.addEventListener('change', async () => {
    const f = importIn.files?.[0];
    if (!f) return;
    try { snapshot(); await importArt(await f.text()); afterArt(); toast('Art imported.'); } catch { history.pop(); toast('That file is not an art export.', 'error'); }
    importIn.value = '';
  });
  let resetArmed = 0;
  const resetBtn = h('button', { class: 'btn btn--sm btn--warn', type: 'button', title: 'Back to the built-in art (can be undone)', onClick: async () => {
    if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); resetBtn.textContent = 'Really reset?'; setTimeout(() => { resetBtn.textContent = 'Reset all'; }, 3000); return; }
    snapshot();
    await resetArt();
    afterArt();
    toast('Back to the built-in art.');
  } }, 'Reset all');
  const help = h('div', { class: 'arted__help paper paper--flat hidden' },
    h('b', null, 'How it works'),
    h('ol', null,
      h('li', null, h('b', null, 'Sheet'), ': drag over the tiles you want. The grid snaps a whole tile at a time and lines each tile up with the gaps around it, so nothing is cut off. Save it under a name, or just leave it as the current art.'),
      h('li', null, h('b', null, 'Background'), ': the key colours and whatever surrounds the selection are flooded away from the edges (“auto background”). Anything left over: click it in the preview to erase that patch, shift+click to make the colour transparent everywhere.'),
      h('li', null, h('b', null, 'Compose'), ': stamp the current art into a grid cell by cell to connect tiles into one bigger sprite (flip it for mirrored pieces), then use or save the result.'),
      h('li', null, h('b', null, 'Animate'), ': add frames (or split a strip of frames in one go), set the speed, save. The animation shows up in the Scenery palette and plays on the table.'),
      h('li', null, h('b', null, 'Sprites'), ': every sprite in the pack and every one you made. Click one to make it the current art, or “Edit in Sheet” to touch it up and save it under the same name.'),
      h('li', null, h('b', null, 'Spaces'), ': click a space on the mini board (or on the 3D board) and give it a ground strip and a decoration with “← use”.'),
      h('li', null, h('b', null, 'Scenery'), ': the hills, pipes and clouds around the table. Drag art from the list on the right straight onto the 3D table, or grab a prop on the table to move it. Pick one in the list to edit it. Delete removes the selected prop.'),
      h('li', null, h('b', null, 'Slots'), ': the logo, houses, decks, dice and other art the board draws by name.')),
    h('b', null, 'Shortcuts'),
    h('ul', null,
      h('li', null, 'Sheet: arrows nudge the selection, shift+arrows resize it, ctrl+arrows move a whole tile. Ctrl+wheel zooms, right-drag pans.'),
      h('li', null, 'Ctrl+Z undoes, Ctrl+Shift+Z redoes. Esc stops picking or moving. “◀ Panel” hides the panel to see more of the table.'),
      h('li', null, 'Everything saves in this browser as you go. Export JSON to keep a copy or move it to another browser.')));
  const bar = h('div', { class: 'arted__bar paper paper--flat' },
    h('b', { class: 'arted__title' }, 'Art editor'),
    h('span', { class: 'arted__tabs' }, ...tabs),
    panelBtn,
    chip,
    h('span', { class: 'arted__grow' }),
    undoBtn, redoBtn,
    h('button', { class: 'btn btn--sm', type: 'button', title: 'Download everything as art.json', onClick: () => {
      const blob = new Blob([exportArt()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'art.json' });
      document.body.appendChild(a); a.click(); a.remove();
    } }, 'Export JSON'),
    h('button', { class: 'btn btn--sm', type: 'button', onClick: () => importIn.click() }, 'Import JSON'), importIn,
    resetBtn,
    h('button', { class: 'btn btn--sm', type: 'button', title: 'How to use the editor', onClick: () => help.classList.toggle('hidden') }, '?'),
    h('button', { class: 'btn btn--sm btn--primary', type: 'button', id: 'arted-close', onClick: () => close() }, 'Close'));
  const overlay = h('div', { class: 'arted', id: 'art-editor' }, bar, panel, palette, help);
  root.appendChild(overlay);

  const boardEl = board?.wrap ?? null;
  boardEl?.classList.add('is-editing');
  boardEl?.addEventListener('pointerdown', onTableDown, true);
  boardEl?.addEventListener('pointermove', onTableMove, true);
  boardEl?.addEventListener('pointerup', onTableUp, true);
  const onKey = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    if (e.key === 'Escape') { if (moveMode) { moveMode = false; renderTab(); } help.classList.add('hidden'); return; }
    if (typing) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && tab === 'scenery' && propId) {
      const p = propOf(propId);
      if (p) { e.preventDefault(); snapshot(); props = props.filter((q) => q !== p); propId = props[0]?.id ?? null; commitProps(); afterArt(); toast(`Removed “${p.id}”.`); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); void (e.shiftKey ? redoLast() : undo()); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); void redoLast(); }
  };
  document.addEventListener('keydown', onKey);
  let resizeTimer = 0;
  const onResize = (): void => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => renderTab(), 120); };
  window.addEventListener('resize', onResize);

  function close(): void {
    window.clearInterval(animTimer);
    boardEl?.classList.remove('is-editing');
    boardEl?.removeEventListener('pointerdown', onTableDown, true);
    boardEl?.removeEventListener('pointermove', onTableMove, true);
    boardEl?.removeEventListener('pointerup', onTableUp, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    board?.setSpaceClick(() => {});
    board?.markProp(null);
    overlay.remove();
    opts.onClose();
  }

  // ---------- sources ----------
  const atlas = packImage();
  const atlasSheet = (): SheetImage | null => (atlas ? sheetImage('pack atlas', atlas, atlas.naturalWidth, atlas.naturalHeight, false) : null);
  if (!sheetSources().length) { const a = atlasSheet(); if (a) sheet.addSource(a); }
  renderTab();
  updateBar();
  void Promise.all(sheetSources().map(async (s) => {
    try { const img = await decodeImage(s.image); return sheetImage(s.name, img, img.naturalWidth, img.naturalHeight); } catch { return null; }
  })).then((loaded) => {
    sheet.prependSources(loaded.filter((s): s is SheetImage => s !== null));
    if (sheetSources().length) { const a = atlasSheet(); if (a) sheet.addSource(a); }
  });

  return { close };
}
