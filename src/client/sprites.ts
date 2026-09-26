// Pixel-sprite characters for the tokens. Frames come from the built-in pixel maps
// (src/client/art/sprites.ts) or from a custom sheet PNG the player loads locally.
import { SPRITES, SPRITE_H, SPRITE_W, type FrameName, type SpriteDef } from './art/sprites.js';
import { TOKEN_LIST } from '../shared/tokens.js';

// Build-time constants (scripts/build.mjs `define`). A private build can bake a
// default sheet and token names in; the public build defines both as null.
declare const __DEFAULT_SHEET__: string | null;
declare const __TOKEN_NAMES__: { name: string; color?: string }[] | null;
const DEFAULT_SHEET: string | null = typeof __DEFAULT_SHEET__ === 'string' ? __DEFAULT_SHEET__ : null;
const DEFAULT_NAMES: { name: string; color?: string }[] | null = Array.isArray(__TOKEN_NAMES__) ? __TOKEN_NAMES__ : null;
const ORIGINAL = TOKEN_LIST.map((t) => ({ name: t.name, color: t.color }));

export const FRAME_NAMES: FrameName[] = ['idle1', 'idle2', 'walk1', 'walk2', 'walk3', 'jump'];
const SHEET_KEY = 'pt.sheet';

export interface Character {
  w: number;
  h: number;
  frames: Record<FrameName, HTMLCanvasElement>;
}

function frameCanvas(def: SpriteDef, frame: FrameName): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W; c.height = SPRITE_H;
  const ctx = c.getContext('2d')!;
  const rows = def.frames[frame];
  for (let y = 0; y < SPRITE_H; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < SPRITE_W; x++) {
      const ch = row[x] ?? '.';
      if (ch === '.') continue;
      const idx = Number(ch);
      ctx.fillStyle = def.palette[idx] ?? def.palette[0] ?? '#000';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** SVG markup of one frame as crisp pixel rects (for the UI: pickers, player cards). */
export function spriteSvg(def: SpriteDef, frame: FrameName = 'idle1'): string {
  const rows = def.frames[frame];
  let rects = '';
  for (let y = 0; y < SPRITE_H; y++) {
    const row = rows[y] ?? '';
    let x = 0;
    while (x < SPRITE_W) {
      const ch = row[x] ?? '.';
      if (ch === '.') { x++; continue; }
      let run = 1;
      while (x + run < SPRITE_W && row[x + run] === ch) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${def.palette[Number(ch)] ?? '#000'}"/>`;
      x += run;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" shape-rendering="crispEdges">${rects}</svg>`;
}

// ---------- custom sheet (6 columns of frames × 8 rows of characters) ----------

let customSheet: { url: string; frames: Map<string, Character> } | null | undefined;

/** The sheet the player loaded themselves (null when using the built-in characters). */
export function getCustomSheetUrl(): string | null {
  try { return localStorage.getItem(SHEET_KEY); } catch { return null; }
}

/** True when this build ships its own default sheet (so "built-in" means that sheet). */
export const HAS_DEFAULT_SHEET = DEFAULT_SHEET !== null;

function applyNames(useDefault: boolean): void {
  TOKEN_LIST.forEach((t, i) => {
    const d = useDefault && DEFAULT_NAMES ? DEFAULT_NAMES[i] : undefined;
    t.name = d?.name || ORIGINAL[i].name;
    t.color = d?.color || ORIGINAL[i].color;
  });
}

export function setCustomSheetUrl(url: string | null): void {
  try { if (url) localStorage.setItem(SHEET_KEY, url); else localStorage.removeItem(SHEET_KEY); } catch { /* ignore */ }
  customSheet = undefined;
  characterCache.clear();
  svgCache.clear();
}

async function loadCustomSheet(): Promise<Map<string, Character> | null> {
  if (customSheet !== undefined) return customSheet?.frames ?? null;
  const stored = getCustomSheetUrl();
  const url = stored ?? DEFAULT_SHEET;
  applyNames(!stored);
  if (!url) { customSheet = null; return null; }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('bad image')); i.src = url; });
    const cw = Math.floor(img.width / 6), ch = Math.floor(img.height / 8);
    if (cw < 4 || ch < 4) throw new Error('sheet too small');
    const frames = new Map<string, Character>();
    TOKEN_LIST.forEach((t, row) => {
      const rec = {} as Record<FrameName, HTMLCanvasElement>;
      FRAME_NAMES.forEach((name, col) => {
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
        rec[name] = c;
      });
      frames.set(t.id, { w: cw, h: ch, frames: rec });
    });
    customSheet = { url, frames };
    return frames;
  } catch {
    customSheet = null;
    return null;
  }
}

/** Describes what a custom sheet must look like, for the setup screen. */
export const SHEET_HELP = 'PNG with 6 columns (idle, idle 2, walk 1, walk 2, walk 3, jump) and 8 rows, one per token in picker order. Any cell size; transparent background.';

// ---------- characters ----------

const characterCache = new Map<string, Promise<Character>>();
const svgCache = new Map<string, string>();

export function getCharacter(tokenId: string): Promise<Character> {
  let p = characterCache.get(tokenId);
  if (!p) {
    p = (async () => {
      const custom = await loadCustomSheet();
      const fromSheet = custom?.get(tokenId);
      if (fromSheet) return fromSheet;
      const def = SPRITES[tokenId] ?? SPRITES[Object.keys(SPRITES)[0]];
      const frames = {} as Record<FrameName, HTMLCanvasElement>;
      for (const f of FRAME_NAMES) frames[f] = frameCanvas(def, f);
      return { w: SPRITE_W, h: SPRITE_H, frames };
    })();
    characterCache.set(tokenId, p);
  }
  return p;
}

/** Synchronous SVG for the UI. Built-in characters render as pixel rects; a custom sheet renders its cell as an image. */
export function characterSvg(tokenId: string): string {
  const cached = svgCache.get(tokenId);
  if (cached) return cached;
  let out: string;
  if (customSheet?.frames.get(tokenId)) {
    const ch = customSheet.frames.get(tokenId)!;
    out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ch.w} ${ch.h}" style="image-rendering:pixelated"><image href="${ch.frames.idle1.toDataURL()}" width="${ch.w}" height="${ch.h}" style="image-rendering:pixelated"/></svg>`;
  } else {
    const def = SPRITES[tokenId] ?? SPRITES[Object.keys(SPRITES)[0]];
    out = spriteSvg(def, 'idle1');
  }
  svgCache.set(tokenId, out);
  return out;
}

/** Kick off loading the custom sheet so characterSvg can use it; resolves when ready. */
export function warmCharacters(): Promise<void> {
  return loadCustomSheet().then(() => { svgCache.clear(); });
}
