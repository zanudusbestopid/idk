// Optional themed pixel-art atlas baked into a private build (scripts/build.mjs, PT_PACK).
// The public build has no pack, and every helper here degrades to "not available".
export interface PackSprite { x: number; y: number; w: number; h: number }
interface ThemePack { image: string; sprites: Record<string, PackSprite> }

declare const __THEME_PACK__: ThemePack | null | undefined;
const PACK: ThemePack | null = typeof __THEME_PACK__ === 'object' && __THEME_PACK__ ? __THEME_PACK__ : null;

let atlas: HTMLImageElement | null = null;
let loading: Promise<void> | null = null;
const canvasCache = new Map<string, HTMLCanvasElement>();

/** True when this build ships a themed atlas (whether or not it has loaded yet). */
export function hasPack(): boolean { return PACK !== null; }
/** True once the atlas image is decoded and sprites can be drawn. */
export function packReady(): boolean { return atlas !== null; }

export function loadPack(): Promise<void> {
  if (!PACK) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => { atlas = img; resolve(); };
      img.onerror = () => resolve();
      img.src = PACK.image;
    });
  }
  return loading;
}

export function sprite(name: string): PackSprite | null { return PACK?.sprites[name] ?? null; }

/** Draw a sprite scaled to (dw, dh) with crisp pixels. Returns false when unavailable. */
export function drawSprite(ctx: CanvasRenderingContext2D, name: string, dx: number, dy: number, dw?: number, dh?: number): boolean {
  const s = sprite(name);
  if (!s || !atlas) return false;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, s.x, s.y, s.w, s.h, dx, dy, dw ?? s.w, dh ?? s.h);
  ctx.imageSmoothingEnabled = prev;
  return true;
}

const stripCache = new Map<string, HTMLCanvasElement>();

/**
 * Fill a rectangle with a sprite repeated at about `scale` pixels per sprite pixel. A whole
 * number of tiles is fitted (each stretched slightly) and the strip is built once as a single
 * image, so there are no seams between tiles and no tile is cut off at the end.
 */
export function tileSprite(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number, scale: number): boolean {
  const s = sprite(name);
  if (!s || !atlas || w <= 0 || h <= 0) return false;
  const nx = Math.max(1, Math.round(w / (s.w * scale)));
  const ny = Math.max(1, Math.round(h / (s.h * scale)));
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const key = `${name}:${W}x${H}:${nx}x${ny}`;
  let strip = stripCache.get(key);
  if (!strip) {
    strip = document.createElement('canvas');
    strip.width = W; strip.height = H;
    const sc = strip.getContext('2d')!;
    sc.imageSmoothingEnabled = false;
    for (let j = 0; j < ny; j++) {
      const y0 = Math.round(j * H / ny), y1 = Math.round((j + 1) * H / ny);
      for (let i = 0; i < nx; i++) {
        const x0 = Math.round(i * W / nx), x1 = Math.round((i + 1) * W / nx);
        sc.drawImage(atlas, s.x, s.y, s.w, s.h, x0, y0, x1 - x0, y1 - y0);
      }
    }
    stripCache.set(key, strip);
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(strip, x, y, w, h);
  ctx.imageSmoothingEnabled = prev;
  return true;
}

export interface StripParts { left: string; mid: string; right: string }

/**
 * A horizontal strip made of an edge tile at each end and the middle tile repeated between
 * them (the way All-Stars ground, clouds and bushes are assembled). Built once as one image.
 */
export function stripSprite(ctx: CanvasRenderingContext2D, parts: StripParts, x: number, y: number, w: number, h: number, scale: number): boolean {
  const l = sprite(parts.left), m = sprite(parts.mid), r = sprite(parts.right);
  if (!l || !m || !r || !atlas || w <= 0 || h <= 0) return false;
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const key = `strip:${parts.left}|${parts.mid}|${parts.right}:${W}x${H}:${scale.toFixed(2)}`;
  let strip = stripCache.get(key);
  if (!strip) {
    strip = document.createElement('canvas');
    strip.width = W; strip.height = H;
    const sc = strip.getContext('2d')!;
    sc.imageSmoothingEnabled = false;
    const edge = Math.min(Math.round(l.w * scale), Math.floor(W / 2));
    const midW = W - 2 * edge;
    sc.drawImage(atlas, l.x, l.y, l.w, l.h, 0, 0, edge, H);
    if (midW > 0) {
      const n = Math.max(1, Math.round(midW / (m.w * scale)));
      for (let i = 0; i < n; i++) {
        const x0 = edge + Math.round(i * midW / n), x1 = edge + Math.round((i + 1) * midW / n);
        sc.drawImage(atlas, m.x, m.y, m.w, m.h, x0, 0, x1 - x0, H);
      }
    }
    sc.drawImage(atlas, r.x, r.y, r.w, r.h, W - edge, 0, edge, H);
    stripCache.set(key, strip);
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(strip, x, y, w, h);
  ctx.imageSmoothingEnabled = prev;
  return true;
}

/** A standalone canvas holding one sprite at an integer scale (cached), e.g. for cutouts and textures. */
export function spriteCanvas(name: string, scale = 1): HTMLCanvasElement | null {
  const s = sprite(name);
  if (!s || !atlas) return null;
  const key = `${name}@${scale}`;
  let c = canvasCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = s.w * scale; c.height = s.h * scale;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, s.x, s.y, s.w, s.h, 0, 0, c.width, c.height);
    canvasCache.set(key, c);
  }
  return c;
}

/** Stack sprites vertically (centered) into one canvas, e.g. a mushroom cap over its stem. */
export function stackCanvas(names: string[], scale = 1): HTMLCanvasElement | null {
  const parts = names.map((n) => sprite(n));
  if (!atlas || parts.some((p) => !p)) return null;
  const w = Math.max(...parts.map((p) => p!.w)), h = parts.reduce((a, p) => a + p!.h, 0);
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  let y = 0;
  for (const p of parts) { ctx.drawImage(atlas, p!.x, p!.y, p!.w, p!.h, Math.floor((w - p!.w) / 2) * scale, y * scale, p!.w * scale, p!.h * scale); y += p!.h; }
  return c;
}
