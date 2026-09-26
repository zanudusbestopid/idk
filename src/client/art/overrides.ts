// Art overrides: sprites, per-space art and scenery props edited in the game (the art editor)
// and kept in localStorage, or exported as a JSON file so they can be baked into a build.
import { setSpriteOverride, spriteOverrides } from './pack.js';

export interface PropDef { id: string; sprite: string; x: number; y: number; z: number; h: number; float?: boolean }
export interface SpaceArt { strip?: string; decor?: string; decorH?: number }
export interface ArtOverrides {
  version: 1;
  /** sprite name → PNG data URL */
  sprites: Record<string, string>;
  /** space index → art choices (empty string means "none") */
  spaces: Record<string, SpaceArt>;
  /** null: the build's default scenery */
  props: PropDef[] | null;
}

const KEY = 'pt.art';
export const art: ArtOverrides = { version: 1, sprites: {}, spaces: {}, props: null };
const listeners = new Set<() => void>();

export function onArtChange(fn: () => void): () => void { listeners.add(fn); return () => listeners.delete(fn); }
function notify(): void { for (const fn of listeners) fn(); }

function decode(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0); resolve(c); };
    img.onerror = () => reject(new Error('bad sprite image'));
    img.src = url;
  });
}

/** Apply a parsed art file: decode its sprites into overrides and adopt its space/prop choices. */
export async function applyArt(data: Partial<ArtOverrides>): Promise<void> {
  for (const name of Object.keys(art.sprites)) setSpriteOverride(name, null);
  art.sprites = { ...(data.sprites ?? {}) };
  art.spaces = { ...(data.spaces ?? {}) };
  art.props = Array.isArray(data.props) ? data.props.map((p) => ({ ...p })) : null;
  await Promise.all(Object.entries(art.sprites).map(async ([name, url]) => { try { setSpriteOverride(name, await decode(url)); } catch { delete art.sprites[name]; } }));
  notify();
}

/** Load the saved art from this browser (no-op when there is none). */
export async function loadArt(): Promise<void> {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { raw = null; }
  if (!raw) return;
  try { await applyArt(JSON.parse(raw) as ArtOverrides); } catch (e) { console.warn('saved art ignored', e); }
}

export function saveArt(): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(art)); return true; } catch { return false; }
}

export function exportArt(): string { return JSON.stringify(art, null, 1); }

export async function importArt(json: string): Promise<void> {
  const data = JSON.parse(json) as Partial<ArtOverrides>;
  await applyArt(data);
  saveArt();
}

export async function resetArt(): Promise<void> {
  await applyArt({ sprites: {}, spaces: {}, props: null });
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Store a canvas as a named sprite (replacing any pack sprite of that name). */
export function setArtSprite(name: string, canvas: HTMLCanvasElement): void {
  art.sprites[name] = canvas.toDataURL('image/png');
  setSpriteOverride(name, canvas);
  saveArt();
  notify();
}

export function removeArtSprite(name: string): void {
  delete art.sprites[name];
  setSpriteOverride(name, null);
  saveArt();
  notify();
}

export function isOverridden(name: string): boolean { return spriteOverrides().has(name); }

export function setSpaceArt(index: number, patch: SpaceArt): void {
  const cur = art.spaces[index] ?? {};
  const next: SpaceArt = { ...cur, ...patch };
  if (next.strip === undefined && next.decor === undefined && next.decorH === undefined) delete art.spaces[index];
  else art.spaces[index] = next;
  saveArt();
  notify();
}

export function setProps(props: PropDef[] | null): void {
  art.props = props ? props.map((p) => ({ ...p })) : null;
  saveArt();
  notify();
}
