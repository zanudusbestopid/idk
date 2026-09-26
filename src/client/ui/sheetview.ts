// The sprite-sheet widget of the art editor: shows a sheet with its tile grid, lets the user
// select a region (snapped to tiles, with gutter detection), pan and zoom, pick key colours, and
// turns the selection into a clean sprite canvas.
import { h, clear } from '../dom.js';

export interface Rect { x: number; y: number; w: number; h: number }
export interface SheetImage { name: string; img: CanvasImageSource; w: number; h: number; px: Uint8ClampedArray; grid: boolean }
export interface Cut { canvas: HTMLCanvasElement; cols: number; rows: number; rect: Rect; source: string }
export type Snap = 'auto' | 'grid' | 'off';

export function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('bad image'));
    img.src = url;
  });
}

/** Wrap an image as an editable sheet (pixels are read once into memory). */
export function sheetImage(name: string, img: CanvasImageSource, w: number, h: number, grid = true): SheetImage {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return { name, img: c, w, h, px: ctx.getImageData(0, 0, w, h).data, grid };
}

const rgb = (r: number, g: number, b: number): number => (r << 16) | (g << 8) | b;
const NUDGE = [0, -1, 1, -2, 2, -3, 3];

function numInput(value: number, step: number, width: number, onChange: (v: number) => void): HTMLInputElement {
  const i = h('input', { type: 'number', step: String(step), value: String(value), style: { width: `${width}px` } });
  i.addEventListener('input', () => { const v = Number(i.value); if (Number.isFinite(v)) onChange(v); });
  return i;
}

export class SheetView {
  readonly el: HTMLElement;
  readonly sources: SheetImage[] = [];
  source: SheetImage | null = null;
  zoom = 3;
  pitch = 17; tile = 16; ox = 1; oy = 1;
  snap: Snap = 'auto';
  degap = true;
  trim = false;
  keys = new Set<number>();
  sel: Rect | null = null;
  cut: Cut | null = null;
  onCut: (cut: Cut | null) => void = () => {};
  onMessage: (text: string, kind?: 'info' | 'error') => void = () => {};

  private picking = false;
  private drag: { x: number; y: number } | null = null;
  private pan: { x: number; y: number; sx: number; sy: number } | null = null;
  private hover: { x: number; y: number } | null = null;
  private view = h('div', { class: 'arted__view', tabIndex: 0, title: 'Drag: select · wheel: scroll · ctrl+wheel: zoom · right-drag: pan · arrows: nudge (shift: resize, ctrl: whole tiles)' });
  private spacer = h('div', { class: 'arted__spacer' });
  private canvas = document.createElement('canvas');
  private readout = h('span', { class: 'arted__readout muted small' }, 'hover the sheet for coordinates');
  private sourceSel = h('select');
  private zoomIn = h('input', { type: 'range', min: '1', max: '10', step: '1', value: '3', style: { width: '80px' } });
  private zoomLabel = h('span', { class: 'muted small', style: { minWidth: '2.2em' } }, '3×');
  private snapSel = h('select', null,
    h('option', { value: 'auto' }, 'Snap to grid lines (auto)'),
    h('option', { value: 'grid' }, 'Snap to fixed grid'),
    h('option', { value: 'off' }, 'Free selection'));
  private pitchIn = numInput(17, 1, 50, (v) => { this.pitch = Math.max(1, Math.round(v)); this.paint(); this.rebuild(); });
  private tileIn = numInput(16, 1, 50, (v) => { this.tile = Math.max(1, Math.round(v)); this.paint(); this.rebuild(); });
  private oxIn = numInput(1, 1, 46, (v) => { this.ox = Math.round(v); this.paint(); });
  private oyIn = numInput(1, 1, 46, (v) => { this.oy = Math.round(v); this.paint(); });
  private keyRow = h('span', { class: 'arted__keys' });
  private preview = document.createElement('canvas');
  private previewInfo = h('span', { class: 'muted small' }, 'nothing selected');
  private selX = numInput(0, 1, 58, (v) => this.editSel({ x: Math.round(v) }));
  private selY = numInput(0, 1, 58, (v) => this.editSel({ y: Math.round(v) }));
  private selW = numInput(0, 1, 58, (v) => this.editSel({ w: Math.round(v) }));
  private selH = numInput(0, 1, 58, (v) => this.editSel({ h: Math.round(v) }));

  constructor() {
    this.canvas.className = 'arted__sheet';
    this.preview.className = 'arted__preview';
    this.view.append(this.spacer, this.canvas);
    this.sourceSel.addEventListener('change', () => this.useSource(this.sources[Number(this.sourceSel.value)] ?? null));
    this.zoomIn.addEventListener('input', () => this.setZoom(Number(this.zoomIn.value)));
    this.snapSel.addEventListener('change', () => { this.snap = this.snapSel.value as Snap; this.paint(); this.rebuild(); });
    const degapIn = h('input', { type: 'checkbox', checked: this.degap });
    degapIn.addEventListener('change', () => { this.degap = degapIn.checked; this.rebuild(); });
    const trimIn = h('input', { type: 'checkbox', checked: this.trim });
    trimIn.addEventListener('change', () => { this.trim = trimIn.checked; this.rebuild(); });
    const fileIn = h('input', { type: 'file', accept: 'image/png,image/gif,image/webp,image/bmp', style: { display: 'none' } });
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files?.[0];
      if (!f) return;
      try {
        const img = await decodeImage(URL.createObjectURL(f));
        this.addSource(sheetImage(f.name, img, img.naturalWidth, img.naturalHeight), true);
      } catch { this.onMessage('Could not read that image.', 'error'); }
      fileIn.value = '';
    });
    const nudgeBtn = (label: string, title: string, dx: number, dy: number, dw: number, dh: number) =>
      h('button', { class: 'btn btn--sm', type: 'button', title, onClick: () => this.nudge(dx, dy, dw, dh) }, label);
    this.el = h('div', { class: 'sheetview' },
      h('div', { class: 'arted__row' },
        h('label', null, 'Sheet'), this.sourceSel,
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => fileIn.click() }, 'Load PNG…'), fileIn,
        h('button', { class: 'btn btn--sm', type: 'button', title: 'Work out the tile grid from the gaps between tiles', onClick: () => this.detectGrid() }, 'Detect grid')),
      h('div', { class: 'arted__row' },
        h('label', null, 'Zoom'), this.zoomIn, this.zoomLabel, this.snapSel,
        h('label', { class: 'arted__check', title: 'Reassemble multi-tile cuts without the gaps between tiles' }, degapIn, ' no gaps'),
        h('label', { class: 'arted__check', title: 'Crop transparent edges off the cut' }, trimIn, ' trim')),
      h('div', { class: 'arted__row' },
        h('label', null, 'Grid'), h('span', { class: 'muted small' }, 'pitch'), this.pitchIn,
        h('span', { class: 'muted small' }, 'tile'), this.tileIn,
        h('span', { class: 'muted small' }, 'origin'), this.oxIn, this.oyIn),
      h('div', { class: 'arted__row' },
        h('label', null, 'Key colour'), this.keyRow,
        h('button', { class: 'btn btn--sm', type: 'button', title: 'Pick a background colour on the sheet; it becomes transparent', onClick: () => this.startPick() }, 'Pick…'),
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { this.keys.clear(); this.renderKeys(); this.rebuild(); } }, 'None')),
      this.view,
      h('div', { class: 'arted__row' }, this.readout),
      h('div', { class: 'arted__row' },
        h('label', null, 'x'), this.selX, h('label', null, 'y'), this.selY, h('label', null, 'w'), this.selW, h('label', null, 'h'), this.selH,
        h('span', { class: 'arted__nudge' },
          nudgeBtn('◀', 'move left (or press ←)', -1, 0, 0, 0), nudgeBtn('▶', 'move right (→)', 1, 0, 0, 0),
          nudgeBtn('▲', 'move up (↑)', 0, -1, 0, 0), nudgeBtn('▼', 'move down (↓)', 0, 1, 0, 0),
          nudgeBtn('−w', 'narrower (shift+←)', 0, 0, -1, 0), nudgeBtn('+w', 'wider (shift+→)', 0, 0, 1, 0),
          nudgeBtn('−h', 'shorter (shift+↑)', 0, 0, 0, -1), nudgeBtn('+h', 'taller (shift+↓)', 0, 0, 0, 1))),
      h('div', { class: 'arted__row arted__row--preview' }, this.preview, this.previewInfo));
    this.bindPointer();
    this.renderKeys();
    this.renderPreview();
  }

  // ---------- sources ----------
  addSource(s: SheetImage, use = false): void {
    this.sources.push(s);
    this.renderSources();
    if (use || !this.source) this.useSource(s);
  }
  /** Put sheets in front of the list (the build's own sheets come first, in their order). */
  prependSources(list: SheetImage[]): void {
    this.sources.unshift(...list);
    this.renderSources();
    if (!this.source && this.sources.length) this.useSource(this.sources[0]);
  }
  useSource(s: SheetImage | null): void {
    this.source = s;
    this.sel = null; this.hover = null;
    this.keys = new Set<number>();
    if (s && s.px[3] === 255) this.keys.add(rgb(s.px[0], s.px[1], s.px[2])); // a solid sheet background is usually the key
    this.snap = s && !s.grid ? 'off' : 'auto';
    this.snapSel.value = this.snap;
    this.renderSources();
    this.renderKeys();
    this.layout();
    this.renderSelFields();
    this.rebuild();
  }
  private renderSources(): void {
    clear(this.sourceSel);
    this.sources.forEach((s, i) => this.sourceSel.appendChild(h('option', { value: String(i) }, `${s.name} (${s.w}×${s.h})`)));
    this.sourceSel.value = String(Math.max(0, this.sources.indexOf(this.source as SheetImage)));
  }

  // ---------- pixels ----------
  private isBg(src: SheetImage, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= src.w || y >= src.h) return true;
    const i = (y * src.w + x) * 4;
    return src.px[i + 3] === 0 || this.keys.has(rgb(src.px[i], src.px[i + 1], src.px[i + 2]));
  }
  private gutterX(src: SheetImage, cx: number, y: number): number {
    for (const d of NUDGE) {
      const xx = cx - 1 + d;
      if (xx < 0 || xx >= src.w) continue;
      let all = true;
      for (let yy = y; yy < Math.min(src.h, y + this.tile); yy++) if (!this.isBg(src, xx, yy)) { all = false; break; }
      if (all) return xx + 1;
    }
    return cx;
  }
  private gutterY(src: SheetImage, x: number, cy: number): number {
    for (const d of NUDGE) {
      const yy = cy - 1 + d;
      if (yy < 0 || yy >= src.h) continue;
      let all = true;
      for (let xx = x; xx < Math.min(src.w, x + this.tile); xx++) if (!this.isBg(src, xx, yy)) { all = false; break; }
      if (all) return yy + 1;
    }
    return cy;
  }
  private tileOrigin(src: SheetImage, c: number, r: number): { x: number; y: number } {
    const sel = this.sel!;
    const nx = sel.x + c * this.pitch, ny = sel.y + r * this.pitch;
    if (this.snap !== 'auto') return { x: nx, y: ny };
    const x = this.gutterX(src, nx, ny);
    return { x, y: this.gutterY(src, x, ny) };
  }
  private tileCounts(): { cols: number; rows: number } {
    if (!this.sel || this.snap === 'off') return { cols: 1, rows: 1 };
    return { cols: Math.max(1, Math.round((this.sel.w - this.tile) / this.pitch) + 1), rows: Math.max(1, Math.round((this.sel.h - this.tile) / this.pitch) + 1) };
  }
  private onTileGrid(): boolean {
    const s = this.sel;
    return !!s && this.snap !== 'off' && (s.w - this.tile) % this.pitch === 0 && (s.h - this.tile) % this.pitch === 0;
  }

  /** Work out pitch, tile size and origin from fully-background columns and rows. */
  detectGrid(): boolean {
    const src = this.source;
    if (!src) return false;
    const runs = (n: number, isGap: (i: number) => boolean): { start: number; len: number }[] => {
      const out: { start: number; len: number }[] = [];
      let i = 0;
      while (i < n) {
        if (isGap(i)) { const s = i; while (i < n && isGap(i)) i++; out.push({ start: s, len: i - s }); } else i++;
      }
      return out;
    };
    const sampleLen = Math.min(400, src.h), sampleW = Math.min(400, src.w);
    const colGap = (x: number) => { for (let y = 0; y < sampleLen; y++) if (!this.isBg(src, x, y)) return false; return true; };
    const rowGap = (y: number) => { for (let x = 0; x < sampleW; x++) if (!this.isBg(src, x, y)) return false; return true; };
    const mode = (vals: number[]): number | null => {
      const m = new Map<number, number>();
      for (const v of vals) m.set(v, (m.get(v) ?? 0) + 1);
      let best: number | null = null, n = 0;
      for (const [v, c] of m) if (c > n) { best = v; n = c; }
      return best;
    };
    const cols = runs(src.w, colGap).filter((r) => r.len <= 4), rows = runs(src.h, rowGap).filter((r) => r.len <= 4);
    const gaps = cols.slice(1).map((r, i) => r.start - cols[i].start).filter((d) => d > 4 && d < 64);
    const pitch = mode(gaps);
    const gapW = mode(cols.map((r) => r.len));
    if (!pitch || gapW === null) { this.onMessage('No regular tile grid found; set it by hand or use a free selection.', 'error'); return false; }
    this.pitch = pitch; this.tile = pitch - gapW;
    const firstCol = cols.find((r) => r.start + r.len < src.w), firstRow = rows.find((r) => r.start + r.len < src.h);
    this.ox = firstCol ? (firstCol.start + firstCol.len) % pitch : 0;
    this.oy = firstRow ? (firstRow.start + firstRow.len) % pitch : 0;
    this.pitchIn.value = String(this.pitch); this.tileIn.value = String(this.tile); this.oxIn.value = String(this.ox); this.oyIn.value = String(this.oy);
    this.onMessage(`Grid: ${this.tile} px tiles every ${this.pitch} px, origin ${this.ox},${this.oy}.`);
    this.paint(); this.rebuild();
    return true;
  }

  // ---------- selection ----------
  private clampSel(r: Rect): Rect {
    const src = this.source;
    if (!src) return r;
    const x = Math.max(0, Math.min(src.w - 1, r.x)), y = Math.max(0, Math.min(src.h - 1, r.y));
    return { x, y, w: Math.max(1, Math.min(src.w - x, r.w + (r.x - x))), h: Math.max(1, Math.min(src.h - y, r.h + (r.y - y))) };
  }
  private selFromDrag(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
    if (this.snap === 'off' || this.pitch <= 0) return this.clampSel({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    const c0 = Math.floor((x0 - this.ox) / this.pitch), c1 = Math.floor((x1 - this.ox) / this.pitch);
    const r0 = Math.floor((y0 - this.oy) / this.pitch), r1 = Math.floor((y1 - this.oy) / this.pitch);
    return this.clampSel({ x: this.ox + c0 * this.pitch, y: this.oy + r0 * this.pitch, w: (c1 - c0) * this.pitch + this.tile, h: (r1 - r0) * this.pitch + this.tile });
  }
  setSelection(r: Rect | null): void {
    this.sel = r ? this.clampSel(r) : null;
    this.paint(); this.renderSelFields(); this.rebuild();
  }
  private editSel(patch: Partial<Rect>): void { if (this.sel) this.setSelection({ ...this.sel, ...patch }); }
  nudge(dx: number, dy: number, dw: number, dh: number): void {
    if (!this.sel) return;
    this.setSelection({ x: this.sel.x + dx, y: this.sel.y + dy, w: this.sel.w + dw, h: this.sel.h + dh });
  }
  private renderSelFields(): void {
    const s = this.sel;
    this.selX.value = String(s?.x ?? 0); this.selY.value = String(s?.y ?? 0); this.selW.value = String(s?.w ?? 0); this.selH.value = String(s?.h ?? 0);
  }

  // ---------- cut ----------
  private buildCut(): Cut | null {
    const src = this.source, sel = this.sel;
    if (!src || !sel || sel.w <= 0 || sel.h <= 0) return null;
    const out = document.createElement('canvas');
    const octx = out.getContext('2d', { willReadFrequently: true })!;
    let { cols, rows } = this.tileCounts();
    if (!this.onTileGrid()) {
      cols = 1; rows = 1;
      out.width = sel.w; out.height = sel.h;
      octx.drawImage(src.img, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);
    } else if (this.degap && this.pitch !== this.tile) {
      out.width = cols * this.tile; out.height = rows * this.tile;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const o = this.tileOrigin(src, c, r);
        octx.drawImage(src.img, o.x, o.y, this.tile, this.tile, c * this.tile, r * this.tile, this.tile, this.tile);
      }
    } else {
      const a = this.tileOrigin(src, 0, 0), b = this.tileOrigin(src, cols - 1, rows - 1);
      out.width = b.x + this.tile - a.x; out.height = b.y + this.tile - a.y;
      octx.drawImage(src.img, a.x, a.y, out.width, out.height, 0, 0, out.width, out.height);
    }
    if (this.keys.size) {
      const id = octx.getImageData(0, 0, out.width, out.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) if (this.keys.has(rgb(d[i], d[i + 1], d[i + 2]))) d[i + 3] = 0;
      octx.putImageData(id, 0, 0);
    }
    let canvas = out;
    if (this.trim) {
      const d = octx.getImageData(0, 0, out.width, out.height).data;
      let x0 = out.width, y0 = out.height, x1 = -1, y1 = -1;
      for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) if (d[(y * out.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 >= x0 && y1 >= y0 && (x0 > 0 || y0 > 0 || x1 < out.width - 1 || y1 < out.height - 1)) {
        canvas = document.createElement('canvas');
        canvas.width = x1 - x0 + 1; canvas.height = y1 - y0 + 1;
        canvas.getContext('2d')!.drawImage(out, x0, y0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      }
    }
    return { canvas, cols, rows, rect: { ...sel }, source: src.name };
  }
  private rebuild(): void {
    this.cut = this.buildCut();
    this.renderPreview();
    this.onCut(this.cut);
  }
  private renderPreview(): void {
    const ctx = this.preview.getContext('2d')!;
    const c = this.cut;
    if (!c) { this.preview.width = 48; this.preview.height = 48; ctx.clearRect(0, 0, 48, 48); this.previewInfo.textContent = 'nothing selected'; return; }
    const s = Math.max(1, Math.min(6, Math.floor(160 / Math.max(c.canvas.width, c.canvas.height))));
    this.preview.width = c.canvas.width * s; this.preview.height = c.canvas.height * s;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.preview.width, this.preview.height);
    ctx.drawImage(c.canvas, 0, 0, this.preview.width, this.preview.height);
    this.previewInfo.textContent = `${c.canvas.width}×${c.canvas.height} px` + (this.onTileGrid() ? ` · ${c.cols}×${c.rows} tiles` : ' · free cut') + ` · shown ${s}×`;
  }

  // ---------- keys ----------
  private startPick(): void { this.picking = true; this.canvas.style.cursor = 'copy'; this.onMessage('Click a background pixel on the sheet.'); }
  private renderKeys(): void {
    clear(this.keyRow);
    if (!this.keys.size) this.keyRow.append(h('span', { class: 'muted small' }, 'none'));
    for (const k of this.keys) {
      const css = `#${k.toString(16).padStart(6, '0')}`;
      this.keyRow.append(h('button', { class: 'arted__swatch', type: 'button', title: `${css} is transparent — click to remove`, style: { background: css }, onClick: () => { this.keys.delete(k); this.renderKeys(); this.rebuild(); } }));
    }
  }

  // ---------- view ----------
  setZoom(z: number, at?: { x: number; y: number }): void {
    const old = this.zoom;
    this.zoom = Math.max(1, Math.min(10, Math.round(z)));
    if (this.zoom === old) return;
    this.zoomIn.value = String(this.zoom);
    this.zoomLabel.textContent = `${this.zoom}×`;
    // keep the sheet point under the cursor (or the middle) where it is
    const vx = at ? at.x : this.view.clientWidth / 2, vy = at ? at.y : this.view.clientHeight / 2;
    const px = (this.view.scrollLeft + vx) / old, py = (this.view.scrollTop + vy) / old;
    this.layout();
    this.view.scrollLeft = px * this.zoom - vx;
    this.view.scrollTop = py * this.zoom - vy;
    this.paint();
  }
  layout(): void {
    this.spacer.style.width = `${(this.source?.w ?? 1) * this.zoom}px`;
    this.spacer.style.height = `${(this.source?.h ?? 1) * this.zoom}px`;
    this.paint();
  }
  private sheetPoint(e: PointerEvent | WheelEvent): { x: number; y: number; vx: number; vy: number } {
    const r = this.canvas.getBoundingClientRect();
    const vx = e.clientX - r.left, vy = e.clientY - r.top;
    return { x: Math.floor((vx + this.view.scrollLeft) / this.zoom), y: Math.floor((vy + this.view.scrollTop) / this.zoom), vx, vy };
  }
  private bindPointer(): void {
    const v = this.view, c = this.canvas;
    c.style.cursor = 'crosshair';
    v.addEventListener('scroll', () => this.paint());
    v.addEventListener('contextmenu', (e) => e.preventDefault());
    v.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = this.sheetPoint(e);
      this.setZoom(this.zoom + (e.deltaY < 0 ? 1 : -1), { x: p.vx, y: p.vy });
    }, { passive: false });
    c.addEventListener('pointerdown', (e) => {
      const src = this.source;
      if (!src) return;
      v.focus();
      const p = this.sheetPoint(e);
      if (e.button === 1 || e.button === 2) {
        this.pan = { x: e.clientX, y: e.clientY, sx: v.scrollLeft, sy: v.scrollTop };
        c.setPointerCapture(e.pointerId);
        c.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      if (this.picking) {
        if (p.x >= 0 && p.y >= 0 && p.x < src.w && p.y < src.h) {
          const i = (p.y * src.w + p.x) * 4;
          if (src.px[i + 3] !== 0) this.keys.add(rgb(src.px[i], src.px[i + 1], src.px[i + 2]));
        }
        this.picking = false;
        c.style.cursor = 'crosshair';
        this.renderKeys();
        this.rebuild();
        return;
      }
      this.drag = p;
      this.sel = this.selFromDrag(p, p);
      c.setPointerCapture(e.pointerId);
      this.paint();
      this.renderSelFields();
    });
    c.addEventListener('pointermove', (e) => {
      const p = this.sheetPoint(e);
      if (this.pan) {
        v.scrollLeft = this.pan.sx - (e.clientX - this.pan.x);
        v.scrollTop = this.pan.sy - (e.clientY - this.pan.y);
        return;
      }
      this.hover = p;
      if (this.drag) { this.sel = this.selFromDrag(this.drag, p); this.renderSelFields(); }
      this.renderReadout();
      this.paint();
    });
    const finish = (e: PointerEvent) => {
      if (this.pan) { this.pan = null; c.style.cursor = this.picking ? 'copy' : 'crosshair'; return; }
      if (!this.drag) return;
      this.sel = this.selFromDrag(this.drag, this.sheetPoint(e));
      this.drag = null;
      this.paint();
      this.renderSelFields();
      this.rebuild();
    };
    c.addEventListener('pointerup', finish);
    c.addEventListener('pointercancel', finish);
    c.addEventListener('pointerleave', () => { if (!this.drag && !this.pan) { this.hover = null; this.renderReadout(); this.paint(); } });
    v.addEventListener('keydown', (e) => {
      const step = e.ctrlKey || e.metaKey ? this.pitch : 1;
      const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      if (e.shiftKey) this.nudge(0, 0, d[0], d[1]); else this.nudge(d[0], d[1], 0, 0);
    });
  }
  private renderReadout(): void {
    const p = this.hover;
    if (!p || !this.source) { this.readout.textContent = this.sel ? `selection ${this.sel.x},${this.sel.y} ${this.sel.w}×${this.sel.h}` : 'hover the sheet for coordinates'; return; }
    const c = Math.floor((p.x - this.ox) / this.pitch), r = Math.floor((p.y - this.oy) / this.pitch);
    this.readout.textContent = `x ${p.x}, y ${p.y} · tile ${c},${r}` + (this.sel ? ` · selection ${this.sel.x},${this.sel.y} ${this.sel.w}×${this.sel.h}` : '');
  }
  paint(): void {
    const v = this.view, cv = this.canvas;
    const w = Math.max(1, v.clientWidth), hgt = Math.max(1, v.clientHeight);
    if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; }
    cv.style.left = `${v.scrollLeft}px`; cv.style.top = `${v.scrollTop}px`;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, w, hgt);
    const src = this.source;
    if (!src) return;
    const z = this.zoom;
    ctx.imageSmoothingEnabled = false;
    const sx = v.scrollLeft / z, sy = v.scrollTop / z, sw = w / z, sh = hgt / z;
    ctx.drawImage(src.img, sx, sy, sw, sh, 0, 0, sw * z, sh * z);
    const X = (x: number) => (x - sx) * z, Y = (y: number) => (y - sy) * z;
    if (this.snap !== 'off' && z >= 2 && this.pitch > 0) {
      const gap = Math.max(0, this.pitch - this.tile);
      ctx.fillStyle = 'rgba(255, 0, 120, 0.28)';
      for (let c = Math.floor((sx - this.ox) / this.pitch) - 1; this.ox + c * this.pitch < sx + sw + this.pitch; c++) {
        const gx = this.ox + c * this.pitch - gap;
        ctx.fillRect(X(gx), 0, Math.max(1, gap * z), hgt);
      }
      for (let r = Math.floor((sy - this.oy) / this.pitch) - 1; this.oy + r * this.pitch < sy + sh + this.pitch; r++) {
        const gy = this.oy + r * this.pitch - gap;
        ctx.fillRect(0, Y(gy), w, Math.max(1, gap * z));
      }
      if (this.hover && !this.drag) { // the tile under the cursor
        const c = Math.floor((this.hover.x - this.ox) / this.pitch), r = Math.floor((this.hover.y - this.oy) / this.pitch);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(X(this.ox + c * this.pitch), Y(this.oy + r * this.pitch), this.tile * z, this.tile * z);
      }
    }
    const s = this.sel;
    if (s) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#161616';
      ctx.strokeRect(X(s.x) - 1, Y(s.y) - 1, s.w * z + 2, s.h * z + 2);
      ctx.strokeStyle = '#fbd000';
      ctx.strokeRect(X(s.x) + 1, Y(s.y) + 1, s.w * z - 2, s.h * z - 2);
      const label = this.onTileGrid() ? `${this.tileCounts().cols}×${this.tileCounts().rows} tiles · ${s.w}×${s.h}` : `${s.w}×${s.h}`;
      ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
      const tw = ctx.measureText(label).width + 8;
      let lx = X(s.x), ly = Y(s.y) - 16;
      if (ly < 0) ly = Y(s.y + s.h) + 2;
      if (lx + tw > w) lx = w - tw;
      ctx.fillStyle = 'rgba(22, 22, 22, 0.85)'; ctx.fillRect(lx, ly, tw, 14);
      ctx.fillStyle = '#fbd000'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx + 4, ly + 7);
    }
  }
  focus(): void { this.view.focus(); }
}
