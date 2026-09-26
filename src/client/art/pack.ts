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

/** Fill a rectangle with a sprite repeated at `scale` pixels per sprite pixel (clipped to the rect). */
export function tileSprite(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number, scale: number): boolean {
  const s = sprite(name);
  if (!s || !atlas) return false;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  const tw = s.w * scale, th = s.h * scale;
  for (let yy = y; yy < y + h; yy += th) for (let xx = x; xx < x + w; xx += tw) ctx.drawImage(atlas, s.x, s.y, s.w, s.h, xx, yy, tw, th);
  ctx.restore();
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
