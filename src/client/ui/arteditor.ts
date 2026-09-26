// In-game art editor: cut sprites out of the source sheets (grid snapping, gutter detection and a
// transparency key), give them to board spaces, art slots and scenery props, and watch the 3D board
// update. Choices live in localStorage (overrides.ts) and can be exported/imported as JSON.
import { h, clear, toast } from '../dom.js';
import { THEME, deckName } from '../theme.js';
import { packImage, sheetSources, spriteCanvas, spriteNames } from '../art/pack.js';
import { art, exportArt, importArt, isOverridden, removeArtSprite, resetArt, setArtSprite, setProps, setSpaceArt, type PropDef, type SpaceArt } from '../art/overrides.js';
import type { Board3D } from './board3d.js';

interface Source { name: string; img: CanvasImageSource; w: number; h: number; px: Uint8ClampedArray; grid: boolean }
interface Rect { x: number; y: number; w: number; h: number }
type Snap = 'auto' | 'grid' | 'off';
type Tab = 'sheet' | 'spaces' | 'scenery' | 'slots';

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

function checker(): string {
  return 'repeating-conic-gradient(#d9d0bd 0 25%, #f2ebdc 0 50%) 0 0 / 16px 16px';
}

function decode(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('bad image'));
    img.src = url;
  });
}

function makeSource(name: string, img: CanvasImageSource, w: number, h: number, grid = true): Source {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return { name, img: c, w, h, px: ctx.getImageData(0, 0, w, h).data, grid };
}

function thumb(canvas: HTMLCanvasElement | null, max = 64): HTMLElement {
  const el = h('span', { class: 'arted__thumb' });
  if (canvas) {
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
  const s = h('select', null, ...options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)));
  s.value = value;
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

/** Open the editor over the current screen. Returns a handle to close it programmatically. */
export function openArtEditor(root: HTMLElement, opts: { board: Board3D | null; onClose: () => void }): { close(): void } {
  const board = opts.board;

  // ---------- editor state ----------
  const sources: Source[] = [];
  let source: Source | null = null;
  let zoom = 3;
  let pitch = 17, tile = 16, ox = 1, oy = 1;
  let snap: Snap = 'auto';
  let degap = true;
  let trim = false;
  let keys = new Set<number>();
  let picking = false;
  let sel: Rect | null = null;
  let drag: { x: number; y: number } | null = null;
  let cut: HTMLCanvasElement | null = null;
  let tab: Tab = 'sheet';
  let spaceIdx = 1;
  let props: PropDef[] = (art.props ?? board?.defaultProps() ?? []).map((p) => ({ ...p }));
  let propId: string | null = props[0]?.id ?? null;
  let placing = false;

  const rgb = (r: number, g: number, b: number): number => (r << 16) | (g << 8) | b;
  const isBg = (src: Source, x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= src.w || y >= src.h) return true;
    const i = (y * src.w + x) * 4;
    return src.px[i + 3] === 0 || keys.has(rgb(src.px[i], src.px[i + 1], src.px[i + 2]));
  };

  // ---------- cutting ----------
  /** Nudge a tile's nominal left edge onto the gutter column next to it (sheets whose grid drifts a few px). */
  function gutterX(src: Source, cx: number, y: number): number {
    for (const d of [0, -1, 1, -2, 2, -3, 3]) {
      const xx = cx - 1 + d;
      if (xx < 0 || xx >= src.w) continue;
      let all = true;
      for (let yy = y; yy < Math.min(src.h, y + tile); yy++) if (!isBg(src, xx, yy)) { all = false; break; }
      if (all) return xx + 1;
    }
    return cx;
  }
  function gutterY(src: Source, x: number, cy: number): number {
    for (const d of [0, -1, 1, -2, 2, -3, 3]) {
      const yy = cy - 1 + d;
      if (yy < 0 || yy >= src.h) continue;
      let all = true;
      for (let xx = x; xx < Math.min(src.w, x + tile); xx++) if (!isBg(src, xx, yy)) { all = false; break; }
      if (all) return yy + 1;
    }
    return cy;
  }
  function tileOrigin(src: Source, c: number, r: number): { x: number; y: number } {
    if (!sel) return { x: 0, y: 0 };
    const nx = sel.x + c * pitch, ny = sel.y + r * pitch;
    if (snap !== 'auto') return { x: nx, y: ny };
    const x = gutterX(src, nx, ny);
    return { x, y: gutterY(src, x, ny) };
  }
  function tileCounts(): { cols: number; rows: number } {
    if (!sel || snap === 'off') return { cols: 1, rows: 1 };
    return { cols: Math.max(1, Math.round((sel.w - tile) / pitch) + 1), rows: Math.max(1, Math.round((sel.h - tile) / pitch) + 1) };
  }

  function buildCut(): HTMLCanvasElement | null {
    if (!source || !sel || sel.w <= 0 || sel.h <= 0) return null;
    const out = document.createElement('canvas');
    const octx = out.getContext('2d')!;
    const raw = snap === 'off' || !(Math.abs((sel.w - tile) % pitch) < 0.5 && Math.abs((sel.h - tile) % pitch) < 0.5);
    if (raw) {
      out.width = sel.w; out.height = sel.h;
      octx.drawImage(source.img, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);
    } else {
      const { cols, rows } = tileCounts();
      if (degap && pitch !== tile) {
        out.width = cols * tile; out.height = rows * tile;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const o = tileOrigin(source, c, r);
          octx.drawImage(source.img, o.x, o.y, tile, tile, c * tile, r * tile, tile, tile);
        }
      } else {
        const a = tileOrigin(source, 0, 0), b = tileOrigin(source, cols - 1, rows - 1);
        out.width = b.x + tile - a.x; out.height = b.y + tile - a.y;
        octx.drawImage(source.img, a.x, a.y, out.width, out.height, 0, 0, out.width, out.height);
      }
    }
    // key colours become transparent
    if (keys.size) {
      const id = octx.getImageData(0, 0, out.width, out.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) if (keys.has(rgb(d[i], d[i + 1], d[i + 2]))) d[i + 3] = 0;
      octx.putImageData(id, 0, 0);
    }
    if (trim) {
      const id = octx.getImageData(0, 0, out.width, out.height).data;
      let x0 = out.width, y0 = out.height, x1 = -1, y1 = -1;
      for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) if (id[(y * out.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 >= x0 && y1 >= y0 && (x0 > 0 || y0 > 0 || x1 < out.width - 1 || y1 < out.height - 1)) {
        const t = document.createElement('canvas');
        t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
        t.getContext('2d')!.drawImage(out, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
        return t;
      }
    }
    return out;
  }

  function refreshCut(): void {
    cut = buildCut();
    renderPreview();
    for (const b of useCutButtons) b.disabled = !cut;
  }

  /** Save the current cut under `name`, redraw the board, and refresh every list of sprite names. */
  function saveCutAs(name: string): boolean {
    const n = name.trim();
    if (!cut) { toast('Select something on the sheet first.', 'error'); return false; }
    if (!n) { toast('Give the sprite a name.', 'error'); return false; }
    setArtSprite(n, cut);
    board?.refreshArt();
    toast(`Saved sprite “${n}” (${cut.width}×${cut.height}).`);
    renderTab();
    return true;
  }

  // ---------- sheet view ----------
  const view = h('div', { class: 'arted__view' });
  const spacer = h('div', { class: 'arted__spacer' });
  const viewCanvas = document.createElement('canvas');
  viewCanvas.className = 'arted__sheet';
  view.append(spacer, viewCanvas);
  const preview = document.createElement('canvas');
  preview.className = 'arted__preview';
  const previewInfo = h('span', { class: 'muted small' }, 'nothing selected');
  const useCutButtons: HTMLButtonElement[] = [];

  function sheetPoint(e: PointerEvent): { x: number; y: number } {
    const r = viewCanvas.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left + view.scrollLeft) / zoom), y: Math.floor((e.clientY - r.top + view.scrollTop) / zoom) };
  }
  function clampSel(r: Rect): Rect {
    if (!source) return r;
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    return { x, y, w: Math.max(1, Math.min(source.w - x, r.w + (r.x - x))), h: Math.max(1, Math.min(source.h - y, r.h + (r.y - y))) };
  }
  function selFromDrag(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
    if (snap === 'off' || pitch <= 0) return clampSel({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    const c0 = Math.floor((x0 - ox) / pitch), c1 = Math.floor((x1 - ox) / pitch);
    const r0 = Math.floor((y0 - oy) / pitch), r1 = Math.floor((y1 - oy) / pitch);
    return clampSel({ x: ox + c0 * pitch, y: oy + r0 * pitch, w: (c1 - c0) * pitch + tile, h: (r1 - r0) * pitch + tile });
  }

  function paint(): void {
    const w = view.clientWidth, hgt = view.clientHeight;
    if (viewCanvas.width !== w || viewCanvas.height !== hgt) { viewCanvas.width = Math.max(1, w); viewCanvas.height = Math.max(1, hgt); }
    viewCanvas.style.left = `${view.scrollLeft}px`; viewCanvas.style.top = `${view.scrollTop}px`;
    const ctx = viewCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);
    if (!source) return;
    ctx.imageSmoothingEnabled = false;
    const sx = view.scrollLeft / zoom, sy = view.scrollTop / zoom;
    const sw = viewCanvas.width / zoom, sh = viewCanvas.height / zoom;
    ctx.drawImage(source.img, sx, sy, sw, sh, 0, 0, sw * zoom, sh * zoom);
    if (snap !== 'off' && zoom >= 2 && pitch > 0) {
      ctx.fillStyle = 'rgba(255, 0, 120, 0.25)';
      const gap = Math.max(0, pitch - tile);
      for (let c = Math.floor((sx - ox) / pitch) - 1; ox + c * pitch < sx + sw + pitch; c++) {
        const gx = ox + c * pitch - gap; // gutter sits just before each tile
        if (gap > 0) ctx.fillRect((gx - sx) * zoom, 0, gap * zoom, viewCanvas.height);
        else ctx.fillRect((gx - sx) * zoom, 0, 1, viewCanvas.height);
      }
      for (let r = Math.floor((sy - oy) / pitch) - 1; oy + r * pitch < sy + sh + pitch; r++) {
        const gy = oy + r * pitch - gap;
        if (gap > 0) ctx.fillRect(0, (gy - sy) * zoom, viewCanvas.width, gap * zoom);
        else ctx.fillRect(0, (gy - sy) * zoom, viewCanvas.width, 1);
      }
    }
    if (sel) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#161616';
      ctx.strokeRect((sel.x - sx) * zoom - 1, (sel.y - sy) * zoom - 1, sel.w * zoom + 2, sel.h * zoom + 2);
      ctx.strokeStyle = '#fbd000';
      ctx.strokeRect((sel.x - sx) * zoom + 1, (sel.y - sy) * zoom + 1, sel.w * zoom - 2, sel.h * zoom - 2);
    }
  }
  function layoutView(): void {
    spacer.style.width = `${(source?.w ?? 1) * zoom}px`;
    spacer.style.height = `${(source?.h ?? 1) * zoom}px`;
    paint();
  }
  view.addEventListener('scroll', paint);
  viewCanvas.addEventListener('pointerdown', (e) => {
    if (!source || e.button !== 0) return;
    const p = sheetPoint(e);
    if (picking) {
      if (!isBg(source, p.x, p.y) || source.px[(p.y * source.w + p.x) * 4 + 3] !== 0) {
        const i = (p.y * source.w + p.x) * 4;
        keys.add(rgb(source.px[i], source.px[i + 1], source.px[i + 2]));
      }
      picking = false;
      viewCanvas.style.cursor = 'crosshair';
      renderKeys();
      refreshCut();
      return;
    }
    drag = p;
    sel = selFromDrag(p, p);
    viewCanvas.setPointerCapture(e.pointerId);
    paint();
    renderSelFields();
  });
  viewCanvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    sel = selFromDrag(drag, sheetPoint(e));
    paint();
    renderSelFields();
  });
  viewCanvas.addEventListener('pointerup', (e) => {
    if (!drag) return;
    sel = selFromDrag(drag, sheetPoint(e));
    drag = null;
    paint();
    renderSelFields();
    refreshCut();
  });
  viewCanvas.style.cursor = 'crosshair';

  function renderPreview(): void {
    const pctx = preview.getContext('2d')!;
    if (!cut) { preview.width = 64; preview.height = 64; pctx.clearRect(0, 0, 64, 64); previewInfo.textContent = 'nothing selected'; return; }
    const s = Math.max(1, Math.min(6, Math.floor(200 / Math.max(cut.width, cut.height))));
    preview.width = cut.width * s; preview.height = cut.height * s;
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, preview.width, preview.height);
    pctx.drawImage(cut, 0, 0, preview.width, preview.height);
    const { cols, rows } = tileCounts();
    previewInfo.textContent = `${cut.width}×${cut.height} px` + (snap !== 'off' ? ` · ${cols}×${rows} tiles` : '');
  }

  // ---------- sheet tab ----------
  const sourceSel = h('select');
  const snapSel = select([{ value: 'auto', label: 'Snap to grid lines (auto)' }, { value: 'grid', label: 'Snap to fixed grid' }, { value: 'off', label: 'Free selection' }], snap, (v) => { snap = v as Snap; paint(); refreshCut(); });
  const keyRow = h('span', { class: 'arted__keys' });
  const selX = num(0, 1, (v) => { if (sel) { sel = clampSel({ ...sel, x: Math.round(v) }); paint(); refreshCut(); } }, 60);
  const selY = num(0, 1, (v) => { if (sel) { sel = clampSel({ ...sel, y: Math.round(v) }); paint(); refreshCut(); } }, 60);
  const selW = num(0, 1, (v) => { if (sel) { sel = clampSel({ ...sel, w: Math.round(v) }); paint(); refreshCut(); } }, 60);
  const selH = num(0, 1, (v) => { if (sel) { sel = clampSel({ ...sel, h: Math.round(v) }); paint(); refreshCut(); } }, 60);
  function renderSelFields(): void {
    selX.value = String(sel?.x ?? 0); selY.value = String(sel?.y ?? 0); selW.value = String(sel?.w ?? 0); selH.value = String(sel?.h ?? 0);
  }
  function renderKeys(): void {
    clear(keyRow);
    if (!keys.size) keyRow.append(h('span', { class: 'muted small' }, 'no key colour'));
    for (const k of keys) {
      const css = `#${k.toString(16).padStart(6, '0')}`;
      keyRow.append(h('button', { class: 'arted__swatch', type: 'button', title: `${css} — click to remove`, style: { background: css }, onClick: () => { keys.delete(k); renderKeys(); refreshCut(); } }));
    }
  }
  function renderSources(): void {
    clear(sourceSel);
    sources.forEach((s, i) => sourceSel.appendChild(h('option', { value: String(i) }, `${s.name} (${s.w}×${s.h})`)));
    sourceSel.value = String(Math.max(0, sources.indexOf(source as Source)));
  }
  sourceSel.addEventListener('change', () => { useSource(sources[Number(sourceSel.value)] ?? null); });
  function useSource(s: Source | null): void {
    source = s; sel = null; cut = null;
    keys = new Set<number>();
    if (s && s.px[3] === 255) keys.add(rgb(s.px[0], s.px[1], s.px[2])); // a solid sheet background is usually the key
    snap = s && !s.grid ? 'off' : 'auto'; // the packed atlas has no grid
    snapSel.value = snap;
    renderKeys();
    layoutView();
    renderSelFields();
    refreshCut();
  }
  function nudge(dx: number, dy: number, dw: number, dh: number): void {
    if (!sel) return;
    sel = clampSel({ x: sel.x + dx, y: sel.y + dy, w: sel.w + dw, h: sel.h + dh });
    paint(); renderSelFields(); refreshCut();
  }
  const nameInput = h('input', { type: 'text', placeholder: 'sprite name', style: { width: '150px' } });
  nameInput.setAttribute('list', 'arted-names'); // read-only as a property
  const nameList = h('datalist', { id: 'arted-names' });
  function renderNameList(): void { clear(nameList); for (const n of spriteNames()) nameList.appendChild(h('option', { value: n })); }

  function sheetTab(): HTMLElement {
    renderSources();
    renderNameList();
    const zoomIn = h('input', { type: 'range', min: '1', max: '8', step: '1', value: String(zoom), style: { width: '90px' } });
    zoomIn.addEventListener('input', () => { zoom = Number(zoomIn.value); layoutView(); });
    snapSel.value = snap;
    const degapIn = h('input', { type: 'checkbox', checked: degap });
    degapIn.addEventListener('change', () => { degap = degapIn.checked; refreshCut(); });
    const trimIn = h('input', { type: 'checkbox', checked: trim });
    trimIn.addEventListener('change', () => { trim = trimIn.checked; refreshCut(); });
    const fileIn = h('input', { type: 'file', accept: 'image/png,image/gif,image/webp', style: { display: 'none' } });
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files?.[0];
      if (!f) return;
      try {
        const img = await decode(URL.createObjectURL(f));
        const s = makeSource(f.name, img, img.naturalWidth, img.naturalHeight);
        sources.push(s); useSource(s); renderSources();
      } catch { toast('Could not read that image.', 'error'); }
      fileIn.value = '';
    });
    const saveBtn = h('button', { class: 'btn btn--sm btn--primary', type: 'button', onClick: () => { if (saveCutAs(nameInput.value)) renderNameList(); } }, 'Save sprite');
    const el = h('div', { class: 'arted__tab' },
      h('div', { class: 'arted__row' }, h('label', null, 'Sheet'), sourceSel, h('button', { class: 'btn btn--sm', type: 'button', onClick: () => fileIn.click() }, 'Load PNG…'), fileIn),
      h('div', { class: 'arted__row' },
        h('label', null, 'Zoom'), zoomIn, snapSel,
        h('label', { class: 'arted__check' }, degapIn, ' remove grid gaps'),
        h('label', { class: 'arted__check' }, trimIn, ' trim empty edges')),
      h('div', { class: 'arted__row' },
        h('label', null, 'Grid'), h('span', { class: 'muted small' }, 'pitch'), num(pitch, 1, (v) => { pitch = Math.max(1, Math.round(v)); paint(); refreshCut(); }, 50),
        h('span', { class: 'muted small' }, 'tile'), num(tile, 1, (v) => { tile = Math.max(1, Math.round(v)); paint(); refreshCut(); }, 50),
        h('span', { class: 'muted small' }, 'origin x'), num(ox, 1, (v) => { ox = Math.round(v); paint(); }, 46),
        h('span', { class: 'muted small' }, 'y'), num(oy, 1, (v) => { oy = Math.round(v); paint(); }, 46)),
      h('div', { class: 'arted__row' },
        h('label', null, 'Key colour'), keyRow,
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { picking = true; viewCanvas.style.cursor = 'copy'; toast('Click a background pixel on the sheet.'); } }, 'Pick…'),
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { keys.clear(); renderKeys(); refreshCut(); } }, 'None')),
      view,
      h('p', { class: 'arted__hint' }, 'Drag on the sheet to select. With snapping on, the selection grows a whole tile at a time and each tile is lined up with the grid lines around it.'),
      h('div', { class: 'arted__row' },
        h('label', null, 'x'), selX, h('label', null, 'y'), selY, h('label', null, 'w'), selW, h('label', null, 'h'), selH,
        h('span', { class: 'arted__nudge' },
          h('button', { class: 'btn btn--sm', type: 'button', title: 'move left', onClick: () => nudge(-1, 0, 0, 0) }, '◀'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'move right', onClick: () => nudge(1, 0, 0, 0) }, '▶'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'move up', onClick: () => nudge(0, -1, 0, 0) }, '▲'),
          h('button', { class: 'btn btn--sm', type: 'button', title: 'move down', onClick: () => nudge(0, 1, 0, 0) }, '▼'))),
      h('div', { class: 'arted__row arted__row--preview' }, preview, h('div', null, previewInfo, h('br'), h('span', { class: 'muted small' }, 'Selected art. Save it under a name, or use it straight from the other tabs.'))),
      h('div', { class: 'arted__row' }, nameInput, nameList, saveBtn));
    requestAnimationFrame(() => { layoutView(); renderSelFields(); });
    return el;
  }

  // ---------- spaces tab ----------
  function spriteOptions(extra: { value: string; label: string }[] = []): { value: string; label: string }[] {
    return [...extra, ...spriteNames().map((n) => ({ value: n, label: isOverridden(n) ? `${n} ★` : n }))];
  }
  function useCut(onSaved: (name: string) => void, autoName: string): HTMLButtonElement {
    const b = h('button', { class: 'btn btn--sm btn--blue', type: 'button', title: 'Use the art selected on the Sheet tab', disabled: !cut, onClick: () => { if (saveCutAs(autoName)) onSaved(autoName); } }, '← use cut');
    useCutButtons.push(b);
    return b;
  }
  function spacesTab(): HTMLElement {
    const names = THEME.spaceNames;
    const cur = art.spaces[spaceIdx] ?? {};
    const isCorner = spaceIdx % 10 === 0;
    const set = (patch: SpaceArt): void => {
      setSpaceArt(spaceIdx, patch);
      board?.refreshArt();
      renderTab();
    };
    const pickBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { toast('Click a space on the board.'); board?.setSpaceClick((i) => { spaceIdx = i; renderTab(); }); } }, 'Pick on board');
    const stripVal = cur.strip === undefined ? '(default)' : (cur.strip || '(none)');
    const decorVal = cur.decor === undefined ? '(default)' : (cur.decor || '(none)');
    const fromSel = (v: string): string | undefined => (v === '(default)' ? undefined : v === '(none)' ? '' : v);
    const heightIn = h('input', { type: 'range', min: '12', max: '160', step: '2', value: String(cur.decorH ?? (isCorner ? 110 : 48)), style: { width: '140px' } });
    heightIn.addEventListener('change', () => set({ decorH: Number(heightIn.value) }));
    const el = h('div', { class: 'arted__tab' },
      h('div', { class: 'arted__row' }, h('label', null, 'Space'),
        select(names.map((n, i) => ({ value: String(i), label: `${i} · ${n}` })), String(spaceIdx), (v) => { spaceIdx = Number(v); renderTab(); }),
        pickBtn),
      isCorner ? h('p', { class: 'arted__hint' }, 'Corner: the picture replaces the whole corner drawing (name stays). Height is in board pixels.') : null,
      isCorner ? null : h('div', { class: 'arted__row' }, h('label', null, 'Ground strip'),
        select(spriteOptions([{ value: '(default)', label: '(default)' }, { value: '(none)', label: '(none)' }]), stripVal, (v) => set({ strip: fromSel(v) })),
        useCut((n) => set({ strip: n }), `space${spaceIdx}_strip`),
        thumb(cur.strip ? spriteCanvas(cur.strip) : null, 40)),
      h('div', { class: 'arted__row' }, h('label', null, isCorner ? 'Picture' : 'Decoration'),
        select(spriteOptions([{ value: '(default)', label: '(default)' }, { value: '(none)', label: '(none)' }]), decorVal, (v) => set({ decor: fromSel(v) })),
        useCut((n) => set({ decor: n }), `space${spaceIdx}_${isCorner ? 'corner' : 'decor'}`),
        thumb(cur.decor ? spriteCanvas(cur.decor) : null, 40)),
      h('div', { class: 'arted__row' }, h('label', null, 'Height'), heightIn, h('span', { class: 'muted small' }, `${cur.decorH ?? (isCorner ? 110 : 48)} px`)),
      h('div', { class: 'arted__row' },
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => set({ strip: undefined, decor: undefined, decorH: undefined }) }, 'Reset this space'),
        h('span', { class: 'muted small' }, `${Object.keys(art.spaces).length} space(s) customised`)),
      h('p', { class: 'arted__hint' }, 'Strips repeat one tile along the bottom of the space. Decorations sit above the strip; ★ marks your own sprites.'));
    return el;
  }

  // ---------- scenery tab ----------
  function commitProps(rebuild: boolean): void {
    setProps(props);
    if (rebuild) { board?.rebuildScenery(); board?.markProp(propId); }
  }
  function sceneryTab(): HTMLElement {
    const p = props.find((q) => q.id === propId) ?? null;
    board?.markProp(p?.id ?? null);
    const list = h('select', { size: '8', class: 'arted__list' }, ...props.map((q) => h('option', { value: q.id, selected: q.id === propId }, `${q.id} · ${q.sprite}`)));
    list.addEventListener('change', () => { propId = list.value; placing = false; renderTab(); });
    const uniqueId = (base: string): string => { let i = 1; let id = base; while (props.some((q) => q.id === id)) id = `${base}-${++i}`; return id; };
    const add = (): void => {
      const id = uniqueId('prop');
      const def: PropDef = { id, sprite: cut ? '' : 'bush:3', x: 0, y: 0, z: 14, h: 1 };
      if (cut) { if (!saveCutAs(`${id}_art`)) return; def.sprite = `${id}_art`; }
      props.push(def); propId = id; commitProps(true); renderTab();
    };
    const dup = (): void => { if (!p) return; const id = uniqueId(p.id); props.push({ ...p, id, x: p.x + 1 }); propId = id; commitProps(true); renderTab(); };
    const remove = (): void => { if (!p) return; props = props.filter((q) => q !== p); propId = props[0]?.id ?? null; commitProps(true); renderTab(); };
    const reset = (): void => { setProps(null); props = (board?.defaultProps() ?? []).map((q) => ({ ...q })); propId = props[0]?.id ?? null; board?.rebuildScenery(); renderTab(); };
    const move = (): void => { if (p && board && !board.moveProp(p)) board.rebuildScenery(); setProps(props); };
    const placeBtn = h('button', { class: `btn btn--sm ${placing ? 'btn--blue' : ''}`, type: 'button', disabled: !p, onClick: () => { placing = !placing; renderTab(); if (placing) toast('Click on the table to put it there.'); } }, placing ? 'Placing… (click table)' : 'Place with a click');
    const el = h('div', { class: 'arted__tab' },
      h('div', { class: 'arted__row' }, list),
      h('div', { class: 'arted__row' },
        h('button', { class: 'btn btn--sm btn--good', type: 'button', onClick: add }, cut ? 'Add (from cut)' : 'Add'),
        h('button', { class: 'btn btn--sm', type: 'button', disabled: !p, onClick: dup }, 'Duplicate'),
        h('button', { class: 'btn btn--sm btn--warn', type: 'button', disabled: !p, onClick: remove }, 'Remove'),
        h('button', { class: 'btn btn--sm', type: 'button', onClick: reset }, 'Default layout')),
      p ? h('div', { class: 'arted__prop' },
        h('div', { class: 'arted__row' }, h('label', null, 'Name'), h('input', { type: 'text', value: p.id, style: { width: '120px' }, onChange: (e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); if (v && !props.some((q) => q !== p && q.id === v)) { p.id = v; propId = v; commitProps(true); renderTab(); } } })),
        h('div', { class: 'arted__row' }, h('label', null, 'Art'),
          select(spriteOptions(ASSEMBLED.map((a) => ({ value: a, label: a }))), p.sprite, (v) => { p.sprite = v; commitProps(true); renderTab(); }),
          useCut((n) => { p.sprite = n; commitProps(true); renderTab(); }, `${p.id}_art`),
          thumb(p.sprite.includes(':') ? null : spriteCanvas(p.sprite), 40)),
        h('div', { class: 'arted__row' },
          h('label', null, 'x'), num(p.x, 0.5, (v) => { p.x = v; move(); }),
          h('label', null, 'z'), num(p.z, 0.5, (v) => { p.z = v; move(); }),
          h('label', null, 'y'), num(p.y, 0.25, (v) => { p.y = v; move(); }),
          h('label', null, 'height'), num(p.h, 0.1, (v) => { p.h = Math.max(0.1, v); commitProps(true); })),
        h('div', { class: 'arted__row' },
          h('label', { class: 'arted__check' }, h('input', { type: 'checkbox', checked: !!p.float, onChange: (e: Event) => { p.float = (e.target as HTMLInputElement).checked; move(); } }), ' floats (clouds)'),
          placeBtn),
        h('p', { class: 'arted__hint' }, 'The board is about 22 units wide; its edge is at ±11. x runs left to right, z towards the camera, y is height off the table.')) : h('p', { class: 'arted__hint' }, 'No scenery. Add a prop from the current cut, or restore the default layout.'));
    return el;
  }
  function onBoardClick(e: PointerEvent): void {
    if (!placing || !board) return;
    const p = props.find((q) => q.id === propId);
    const g = board.pickGround(e);
    if (!p || !g) return;
    p.x = Math.round(g.x * 4) / 4; p.z = Math.round(g.z * 4) / 4;
    if (!board.moveProp(p)) board.rebuildScenery();
    setProps(props);
    renderTab();
  }

  // ---------- slots tab ----------
  function slotsTab(): HTMLElement {
    const rows = SLOTS.map((s) => {
      const c = spriteCanvas(s.name);
      const status = isOverridden(s.name) ? 'yours' : c ? 'pack' : 'empty';
      return h('div', { class: 'arted__slot' },
        thumb(c, 40),
        h('div', { class: 'arted__slotname' }, h('b', null, s.name), h('span', { class: 'muted small' }, ` ${s.what} · ${status}`)),
        useCut(() => renderTab(), s.name),
        select([{ value: '', label: 'copy from…' }, ...spriteNames().filter((n) => n !== s.name).map((n) => ({ value: n, label: n }))], '', (v) => { const src = v && spriteCanvas(v); if (src) { setArtSprite(s.name, src); board?.refreshArt(); renderTab(); } }),
        isOverridden(s.name) ? h('button', { class: 'btn btn--sm', type: 'button', title: 'back to the pack sprite', onClick: () => { removeArtSprite(s.name); board?.refreshArt(); renderTab(); } }, 'Clear') : null);
    });
    const mine = Object.keys(art.sprites).sort();
    const el = h('div', { class: 'arted__tab' },
      h('p', { class: 'arted__hint' }, 'Slots are the sprites the board draws by name. Replace one with the current cut, copy another sprite into it, or clear it to get the pack art back.'),
      ...rows,
      h('h3', { class: 'arted__h' }, `Your sprites (${mine.length})`),
      mine.length ? h('div', { class: 'arted__mine' }, ...mine.map((n) => h('div', { class: 'arted__slot' }, thumb(spriteCanvas(n), 40), h('div', { class: 'arted__slotname' }, h('b', null, n)),
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { removeArtSprite(n); board?.refreshArt(); renderTab(); } }, 'Delete')))) : h('p', { class: 'muted small' }, 'None yet. Cut something on the Sheet tab.'));
    return el;
  }

  // ---------- frame ----------
  const panel = h('div', { class: 'arted__panel paper paper--flat' });
  const tabBtns = new Map<Tab, HTMLButtonElement>();
  function renderTab(): void {
    useCutButtons.length = 0;
    clear(panel);
    if (tab !== 'spaces') board?.setSpaceClick(() => {});
    if (tab !== 'scenery') { placing = false; board?.markProp(null); }
    panel.appendChild(tab === 'sheet' ? sheetTab() : tab === 'spaces' ? spacesTab() : tab === 'scenery' ? sceneryTab() : slotsTab());
    for (const [t, b] of tabBtns) b.classList.toggle('btn--blue', t === tab);
  }
  const tabs = (['sheet', 'spaces', 'scenery', 'slots'] as Tab[]).map((t) => {
    const b = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { tab = t; renderTab(); } }, t[0].toUpperCase() + t.slice(1));
    tabBtns.set(t, b);
    return b;
  });
  const importIn = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
  importIn.addEventListener('change', async () => {
    const f = importIn.files?.[0];
    if (!f) return;
    try {
      await importArt(await f.text());
      props = (art.props ?? board?.defaultProps() ?? []).map((q) => ({ ...q })); propId = props[0]?.id ?? null;
      board?.refreshArt(); renderTab(); toast('Art imported.');
    } catch { toast('That file is not an art export.', 'error'); }
    importIn.value = '';
  });
  let resetArmed = 0;
  const resetBtn = h('button', { class: 'btn btn--sm btn--warn', type: 'button', onClick: async () => {
    if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); resetBtn.textContent = 'Really reset?'; setTimeout(() => { resetBtn.textContent = 'Reset all'; }, 3000); return; }
    await resetArt();
    props = (board?.defaultProps() ?? []).map((q) => ({ ...q })); propId = props[0]?.id ?? null;
    board?.refreshArt(); renderTab(); toast('Back to the built-in art.');
  } }, 'Reset all');
  const bar = h('div', { class: 'arted__bar paper paper--flat' },
    h('b', { class: 'arted__title' }, 'Art editor'),
    h('span', { class: 'arted__tabs' }, ...tabs),
    h('span', { class: 'arted__grow' }),
    h('span', { class: 'muted small' }, 'Changes save in this browser'),
    h('button', { class: 'btn btn--sm', type: 'button', onClick: () => {
      const blob = new Blob([exportArt()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'art.json' });
      document.body.appendChild(a); a.click(); a.remove();
    } }, 'Export JSON'),
    h('button', { class: 'btn btn--sm', type: 'button', onClick: () => importIn.click() }, 'Import JSON'), importIn,
    resetBtn,
    h('button', { class: 'btn btn--sm btn--primary', type: 'button', id: 'arted-close', onClick: () => close() }, 'Close'));
  const overlay = h('div', { class: 'arted', id: 'art-editor' }, bar, panel);
  root.appendChild(overlay);

  const boardEl = board?.wrap ?? null;
  boardEl?.classList.add('is-editing');
  boardEl?.addEventListener('pointerup', onBoardClick);
  const onResize = (): void => { if (tab === 'sheet') paint(); };
  window.addEventListener('resize', onResize);

  function close(): void {
    boardEl?.classList.remove('is-editing');
    boardEl?.removeEventListener('pointerup', onBoardClick);
    window.removeEventListener('resize', onResize);
    board?.setSpaceClick(() => {});
    board?.markProp(null);
    overlay.remove();
    opts.onClose();
  }

  // ---------- sources ----------
  const atlas = packImage();
  if (atlas) sources.push(makeSource('pack atlas', atlas, atlas.naturalWidth, atlas.naturalHeight, false));
  renderTab();
  void Promise.all(sheetSources().map(async (s) => {
    try { const img = await decode(s.image); return makeSource(s.name, img, img.naturalWidth, img.naturalHeight); } catch { return null; }
  })).then((loaded) => {
    sources.unshift(...loaded.filter((s): s is Source => s !== null)); // the build's sheets first, in their order
    if (!source && sources.length) useSource(sources[0]);
    renderSources();
  });
  if (!sheetSources().length && sources.length) useSource(sources[0]); // otherwise the first sheet, once decoded

  return { close };
}
