// The art editor's composer: a small grid where tiles and sprites are stamped next to each other
// (with flips) to build one bigger sprite, e.g. a hill from its slope and middle tiles, a pipe from
// top and body pieces, or a castle from parts spread over the sheet.
import { h, clear } from '../dom.js';

function numInput(value: number, min: number, max: number, width: number, onChange: (v: number) => void): HTMLInputElement {
  const i = h('input', { type: 'number', step: '1', min: String(min), max: String(max), value: String(value), style: { width: `${width}px` } });
  i.addEventListener('change', () => { const v = Math.round(Number(i.value)); if (Number.isFinite(v)) { const c = Math.max(min, Math.min(max, v)); i.value = String(c); onChange(c); } });
  return i;
}

export class Composer {
  readonly el: HTMLElement;
  cols = 6; rows = 4; cell = 16;
  stamp: HTMLCanvasElement | null = null;
  stampName = '';
  flipH = false; flipV = false;
  eraser = false;
  onResult: (canvas: HTMLCanvasElement) => void = () => {};
  onSave: (name: string, canvas: HTMLCanvasElement) => void = () => {};
  onMessage: (text: string, kind?: 'info' | 'error') => void = () => {};

  private layer = document.createElement('canvas');
  private view = document.createElement('canvas');
  private zoom = 4;
  private hover: { cx: number; cy: number } | null = null;
  private undoStack: ImageData[] = [];
  private flipped: HTMLCanvasElement | null = null;
  private stampBox = h('span', { class: 'arted__thumb' });
  private stampLabel = h('span', { class: 'muted small' }, 'nothing to stamp yet');
  private flipHBtn: HTMLButtonElement;
  private flipVBtn: HTMLButtonElement;
  private eraserBtn: HTMLButtonElement;
  private undoBtn: HTMLButtonElement;
  private info = h('span', { class: 'muted small' });
  private nameIn = h('input', { type: 'text', placeholder: 'name for the composition', style: { width: '180px' } });

  constructor() {
    this.layer.width = this.cols * this.cell; this.layer.height = this.rows * this.cell;
    this.view.className = 'composer__canvas';
    this.flipHBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Mirror the stamp left/right', onClick: () => { this.flipH = !this.flipH; this.flipped = null; this.renderStamp(); this.draw(); } }, 'Flip ↔');
    this.flipVBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Mirror the stamp top/bottom', onClick: () => { this.flipV = !this.flipV; this.flipped = null; this.renderStamp(); this.draw(); } }, 'Flip ↕');
    this.eraserBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Clear cells instead of stamping (right-click does the same)', onClick: () => { this.eraser = !this.eraser; this.renderStamp(); this.draw(); } }, 'Eraser');
    this.undoBtn = h('button', { class: 'btn btn--sm', type: 'button', disabled: true, onClick: () => this.undo() }, 'Undo');
    const colsIn = numInput(this.cols, 1, 32, 52, (v) => this.resize(v, this.rows, this.cell));
    const rowsIn = numInput(this.rows, 1, 32, 52, (v) => this.resize(this.cols, v, this.cell));
    const cellIn = numInput(this.cell, 1, 64, 52, (v) => this.resize(this.cols, this.rows, v));
    this.el = h('div', { class: 'composer' },
      h('div', { class: 'arted__row' }, h('label', null, 'Stamp'), this.stampBox, this.stampLabel, this.flipHBtn, this.flipVBtn, this.eraserBtn),
      h('div', { class: 'arted__row' },
        h('label', null, 'Grid'), h('span', { class: 'muted small' }, 'cols'), colsIn, h('span', { class: 'muted small' }, 'rows'), rowsIn, h('span', { class: 'muted small' }, 'cell px'), cellIn,
        this.undoBtn,
        h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { this.pushUndo(); this.layer.getContext('2d')!.clearRect(0, 0, this.layer.width, this.layer.height); this.draw(); } }, 'Clear')),
      this.view,
      h('div', { class: 'arted__row' }, this.info),
      h('p', { class: 'arted__hint' }, 'Click a cell to stamp the current art with its top-left corner there. Right-click clears a cell. Set the cell size to 8 or 1 for finer placement. Use the result as the current art, or save it as a sprite.'),
      h('div', { class: 'arted__row' },
        h('button', { class: 'btn btn--sm btn--blue', type: 'button', title: 'Make the composition the current art (trimmed)', onClick: () => { const c = this.result(); if (!c) { this.onMessage('The grid is empty.', 'error'); return; } this.onResult(c); this.onMessage(`Composition ${c.width}×${c.height} is now the current art.`); } }, 'Use as current art'),
        this.nameIn,
        h('button', { class: 'btn btn--sm btn--primary', type: 'button', onClick: () => {
          const c = this.result();
          const name = this.nameIn.value.trim();
          if (!c) { this.onMessage('The grid is empty.', 'error'); return; }
          if (!name) { this.onMessage('Give the composition a name first.', 'error'); this.nameIn.focus(); return; }
          this.onSave(name, c);
        } }, 'Save sprite')));
    this.bind();
    this.renderStamp();
    this.draw();
  }

  setStamp(canvas: HTMLCanvasElement | null, name: string): void {
    this.stamp = canvas; this.stampName = name; this.flipped = null;
    this.renderStamp();
    this.draw();
  }

  private renderStamp(): void {
    clear(this.stampBox);
    const s = this.stampCanvas();
    if (s) {
      const k = Math.max(1, Math.min(3, Math.floor(40 / Math.max(s.width, s.height))));
      const c = document.createElement('canvas');
      c.width = s.width * k; c.height = s.height * k;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s, 0, 0, c.width, c.height);
      this.stampBox.appendChild(c);
      this.stampLabel.textContent = `${this.stampName || 'cut'} · ${s.width}×${s.height}`;
    } else { this.stampBox.textContent = '—'; this.stampLabel.textContent = 'nothing to stamp yet: cut something or pick a sprite'; }
    this.flipHBtn.classList.toggle('btn--blue', this.flipH);
    this.flipVBtn.classList.toggle('btn--blue', this.flipV);
    this.eraserBtn.classList.toggle('btn--blue', this.eraser);
  }

  /** The stamp with the current flips applied. */
  private stampCanvas(): HTMLCanvasElement | null {
    if (!this.stamp) return null;
    if (!this.flipH && !this.flipV) return this.stamp;
    if (!this.flipped) {
      const c = document.createElement('canvas');
      c.width = this.stamp.width; c.height = this.stamp.height;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.translate(this.flipH ? c.width : 0, this.flipV ? c.height : 0);
      ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
      ctx.drawImage(this.stamp, 0, 0);
      this.flipped = c;
    }
    return this.flipped;
  }

  private resize(cols: number, rows: number, cell: number): void {
    const keep = document.createElement('canvas');
    keep.width = this.layer.width; keep.height = this.layer.height;
    keep.getContext('2d')!.drawImage(this.layer, 0, 0);
    this.cols = cols; this.rows = rows; this.cell = cell;
    this.layer.width = cols * cell; this.layer.height = rows * cell;
    this.layer.getContext('2d')!.drawImage(keep, 0, 0);
    this.undoStack = [];
    this.undoBtn.disabled = true;
    this.draw();
  }

  private pushUndo(): void {
    this.undoStack.push(this.layer.getContext('2d')!.getImageData(0, 0, this.layer.width, this.layer.height));
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.undoBtn.disabled = false;
  }
  private undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.layer.getContext('2d')!.putImageData(prev, 0, 0);
    this.undoBtn.disabled = !this.undoStack.length;
    this.draw();
  }

  private cellAt(e: PointerEvent): { cx: number; cy: number } | null {
    const r = this.view.getBoundingClientRect();
    const k = this.layer.width / r.width;
    const cx = Math.floor((e.clientX - r.left) * k / this.cell), cy = Math.floor((e.clientY - r.top) * k / this.cell);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return null;
    return { cx, cy };
  }
  private bind(): void {
    this.view.addEventListener('contextmenu', (e) => e.preventDefault());
    this.view.addEventListener('pointerdown', (e) => {
      const c = this.cellAt(e);
      if (!c) return;
      if (e.button === 2 || this.eraser) { this.pushUndo(); this.layer.getContext('2d')!.clearRect(c.cx * this.cell, c.cy * this.cell, this.cell, this.cell); this.draw(); return; }
      if (e.button !== 0) return;
      const s = this.stampCanvas();
      if (!s) { this.onMessage('Nothing to stamp: cut something on the Sheet tab or pick a sprite first.', 'error'); return; }
      this.pushUndo();
      const ctx = this.layer.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s, c.cx * this.cell, c.cy * this.cell);
      this.draw();
    });
    this.view.addEventListener('pointermove', (e) => { const c = this.cellAt(e); if (c?.cx !== this.hover?.cx || c?.cy !== this.hover?.cy) { this.hover = c; this.draw(); } });
    this.view.addEventListener('pointerleave', () => { this.hover = null; this.draw(); });
  }

  draw(): void {
    const W = this.layer.width, H = this.layer.height;
    this.zoom = Math.max(1, Math.min(8, Math.floor(460 / Math.max(W, 1))));
    this.view.width = W * this.zoom; this.view.height = H * this.zoom;
    const ctx = this.view.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.view.width, this.view.height);
    ctx.drawImage(this.layer, 0, 0, this.view.width, this.view.height);
    ctx.fillStyle = 'rgba(22, 22, 22, 0.25)';
    for (let c = 1; c < this.cols; c++) ctx.fillRect(c * this.cell * this.zoom, 0, 1, this.view.height);
    for (let r = 1; r < this.rows; r++) ctx.fillRect(0, r * this.cell * this.zoom, this.view.width, 1);
    if (this.hover) {
      const x = this.hover.cx * this.cell * this.zoom, y = this.hover.cy * this.cell * this.zoom;
      const s = this.stampCanvas();
      if (this.eraser || !s) {
        ctx.strokeStyle = this.eraser ? '#d9413a' : '#fbd000'; ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, this.cell * this.zoom - 2, this.cell * this.zoom - 2);
      } else {
        ctx.globalAlpha = 0.65;
        ctx.drawImage(s, x, y, s.width * this.zoom, s.height * this.zoom);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fbd000'; ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, s.width * this.zoom - 2, s.height * this.zoom - 2);
      }
    }
    const box = this.bounds();
    this.info.textContent = box ? `content ${box.w}×${box.h} px in a ${W}×${H} grid · shown ${this.zoom}×` : `empty ${W}×${H} grid · shown ${this.zoom}×`;
  }

  private bounds(): { x: number; y: number; w: number; h: number } | null {
    const W = this.layer.width, H = this.layer.height;
    const d = this.layer.getContext('2d')!.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /** The composition trimmed to its content, or null when empty. */
  result(): HTMLCanvasElement | null {
    const b = this.bounds();
    if (!b) return null;
    const c = document.createElement('canvas');
    c.width = b.w; c.height = b.h;
    c.getContext('2d')!.drawImage(this.layer, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    return c;
  }
}
