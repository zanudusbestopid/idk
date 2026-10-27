// The board as a 3D paper diorama: a paper board on a wooden table, upright
// paper-cutout tokens that hop and flip, 3D houses, hotels and dice. Same public
// interface as the flat Board so the game screen can use either.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GameState, Space } from '../../shared/types.js';
import { dieFace } from '../art/dice.js';
import { ICONS } from '../art/icons.js';
import { sfx } from '../audio.js';
import { h, clear, sleep } from '../dom.js';
import { GROUP_COLORS, LIGHT_GROUPS, sideOf, spaceColor, type BoardView } from './board.js';
import { tokenSvg } from './home.js';
import { faceNumbers, simulateThrow } from './dicephysics.js';
import { pixelCutout } from './cutout.js';
import { getCharacter, type Character } from '../sprites.js';
import type { FrameName } from '../art/sprites.js';
import { dur } from '../settings.js';
import { drawSprite, packReady, sprite as packSprite, spriteCanvas, stackCanvas, stripSprite, tileSprite, type StripParts } from '../art/pack.js';
import { art, type PropDef } from '../art/overrides.js';
import { THEME, T, deckName } from '../theme.js';
import { money } from '../dom.js';

const UNIT = 1.45;   // width of a regular space (was 1): room for several standees side by side
const CORNER = 2.1;
const HALF = (2 * CORNER + 9 * UNIT) / 2; // 8.625
const K = HALF / 6.05; // scale factor relative to the original board, for hand-tuned camera distances
const TOKEN = 0.8;
const TEX = 2048;
const S = TEX / (2 * HALF); // canvas px per world unit
const BOARD_Y = 0.12; // top surface height
const INK = '#2b2118';
const PAPER = '#fffaf0';

interface Rect { x: number; z: number; w: number; d: number }

/** World-space footprint of a space: x/z of the far-left corner, width along x, depth along z. */
export function spaceRect(i: number): Rect {
  if (i === 0) return { x: HALF - CORNER, z: HALF - CORNER, w: CORNER, d: CORNER };
  if (i < 10) return { x: HALF - CORNER - i * UNIT, z: HALF - CORNER, w: UNIT, d: CORNER };
  if (i === 10) return { x: -HALF, z: HALF - CORNER, w: CORNER, d: CORNER };
  if (i < 20) return { x: -HALF, z: HALF - CORNER - (i - 10) * UNIT, w: CORNER, d: UNIT };
  if (i === 20) return { x: -HALF, z: -HALF, w: CORNER, d: CORNER };
  if (i < 30) return { x: -HALF + CORNER + (i - 21) * UNIT, z: -HALF, w: UNIT, d: CORNER };
  if (i === 30) return { x: HALF - CORNER, z: -HALF, w: CORNER, d: CORNER };
  return { x: HALF - CORNER, z: -HALF + CORNER + (i - 31) * UNIT, w: CORNER, d: UNIT };
}

function indexAt(x: number, z: number): number | null {
  if (Math.abs(x) > HALF || Math.abs(z) > HALF) return null;
  for (let i = 0; i < 40; i++) {
    const r = spaceRect(i);
    if (x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d) return i;
  }
  return null;
}

/** Rotation (radians, canvas clockwise) that puts a space's inner edge at the top of its local frame. */
function sideAngle(i: number): number {
  const side = sideOf(i);
  return side === 'bottom' ? 0 : side === 'left' ? Math.PI / 2 : side === 'top' ? Math.PI : -Math.PI / 2;
}

/** Unit vectors in world space for a space's local frame: `along` the edge (local +x) and `inward` (local -y). */
function frame(i: number): { along: [number, number]; inward: [number, number] } {
  const side = sideOf(i);
  if (i % 10 === 0) return { along: [1, 0], inward: [0, -1] };
  if (side === 'bottom') return { along: [1, 0], inward: [0, -1] };
  if (side === 'left') return { along: [0, -1], inward: [1, 0] };
  if (side === 'top') return { along: [-1, 0], inward: [0, 1] };
  return { along: [0, 1], inward: [-1, 0] };
}

function spaceCenter(i: number): [number, number] {
  const r = spaceRect(i);
  return [r.x + r.w / 2, r.z + r.d / 2];
}


function svgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('svg failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

async function svgTexture(svg: string, size = 256): Promise<THREE.CanvasTexture> {
  const img = await svgImage(svg);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  c.getContext('2d')!.drawImage(img, 0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${40 + Math.random() * 30}, ${20 + Math.random() * 20}, 10, ${0.12 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const y = Math.random() * 1024;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x / 90 + i) * 6 + Math.random() * 3);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) { // planks
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, i * 128 - 2, 1024, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, i * 128 + 1, 1024, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}

function fontStack(): string { return 'Fredoka, "Trebuchet MS", "Segoe UI", sans-serif'; }
function pixelFont(): string { return '"Press Start 2P", "Courier New", monospace'; }
/** True when the build ships a pixel-art theme pack and it has loaded: the board renders in that style. */
function themed(): boolean { return packReady(); }
const SKY = '#6fa8ff';
const PIXEL_INK = '#161616';
const GROUND = { left: 'ground_l', mid: 'ground_m', right: 'ground_r' };
const BUSH = { left: 'bush_l', mid: 'bush_m', right: 'bush_r' };

/** Per-space ground strip (a tile name repeated, or an edge/middle/edge set) and a decoration, by space index. */
const WORLD_STRIP: Record<number, string | StripParts> = {
  3: 'cave_top', 6: 'water3_top', 8: 'wood3_top', 9: 'sky_platform',
  11: 'g3_top', 13: 'o3_top', 14: 't3_top', 16: 'water3_top', 18: 'sand_top', 19: 'sky_platform',
  21: 'g3_top', 23: 'sand_top', 24: 'water3_top', 26: 'snow_top', 27: 'sky_platform', 29: 'brick3',
  31: 'wood_block', 32: 'sky_platform', 34: 'g3_top', 37: 'lava3', 39: 'castle_wall',
};
const WORLD_DECOR: Record<number, { name: string; h: number }> = {
  1: { name: 'hill3_green', h: 54 }, 3: { name: 'cave_block', h: 44 }, 6: { name: 'giant_coral', h: 40 }, 8: { name: 'treetop_green', h: 30 }, 9: { name: 'cloud3_face', h: 40 },
  11: { name: 'bumps3_green', h: 30 }, 13: { name: 'hill3_orange', h: 54 }, 14: { name: 'bumps3_tan', h: 30 }, 16: { name: 'giant_coral', h: 40 }, 18: { name: 'palm', h: 60 }, 19: { name: 'cloud3_big', h: 34 },
  21: { name: 'bushes3', h: 30 }, 23: { name: 'pyramid2', h: 48 }, 24: { name: 'cave_water_block', h: 44 }, 26: { name: 'snow_cloud', h: 40 }, 27: { name: 'sky_platform', h: 22 }, 29: { name: 'gold_block', h: 34 },
  31: { name: 'giant_q', h: 48 }, 32: { name: 'giant_cloud', h: 46 }, 34: { name: 'giant_pipe', h: 52 }, 37: { name: 'dungeon_lantern', h: 48 }, 39: { name: 'throne', h: 64 },
};
/** The strip for a space: the art editor's choice, else the theme default ('' means none). */
function spaceStripFor(i: number): string | StripParts | undefined {
  const o = art.spaces[i]?.strip;
  if (o !== undefined) return o || undefined;
  return WORLD_STRIP[i];
}
function spaceDecorFor(i: number): { name: string; h: number } | undefined {
  const o = art.spaces[i];
  if (o?.decor !== undefined) return o.decor ? { name: o.decor, h: o.decorH ?? 48 } : undefined;
  const d = WORLD_DECOR[i];
  return d ? { name: d.name, h: o?.decorH ?? d.h } : undefined;
}
/** Half the board's width in world units (the art editor's maps use it). */
export const BOARD_HALF = HALF;
/** A canvas for a scenery prop: a sprite name, or 'bush:N' / 'pipe:N' for assembled strips and stacks. */
export function propImage(name: string): HTMLCanvasElement | null { return propCanvas(name); }
const animCache = new Map<string, { frames: HTMLCanvasElement[]; ms: number } | null>();
/** Frames of an animation, normalised to one size (bottom-centre aligned), or null when it has none. */
function animFrames(name: string): { frames: HTMLCanvasElement[]; ms: number } | null {
  if (animCache.has(name)) return animCache.get(name) ?? null;
  const a = art.anims[name];
  let out: { frames: HTMLCanvasElement[]; ms: number } | null = null;
  if (a && a.frames.length) {
    const srcs = a.frames.map((f) => (f.startsWith('anim:') ? null : propCanvas(f))).filter((c): c is HTMLCanvasElement => !!c);
    if (srcs.length) {
      const w = Math.max(...srcs.map((c) => c.width)), hgt = Math.max(...srcs.map((c) => c.height));
      const frames = srcs.map((c) => {
        const n = document.createElement('canvas');
        n.width = w; n.height = hgt;
        n.getContext('2d')!.drawImage(c, Math.floor((w - c.width) / 2), hgt - c.height);
        return n;
      });
      out = { frames, ms: Math.max(30, a.ms || 150) };
    }
  }
  animCache.set(name, out);
  return out;
}
function propCanvas(name: string): HTMLCanvasElement | null {
  if (name.startsWith('anim:')) return animFrames(name.slice(5))?.frames[0] ?? null;
  const m = /^(bush|pipe):(\d+)$/.exec(name);
  if (m) {
    const n = Math.max(1, Math.min(8, Number(m[2])));
    if (m[1] === 'bush') { const c = document.createElement('canvas'); c.width = 16 * n; c.height = 16; stripSprite(c.getContext('2d')!, BUSH, 0, 0, 16 * n, 16, 1); return c; }
    return stackCanvas(['pipe_top', ...Array.from({ length: n - 1 }, () => 'pipe_body')], 1);
  }
  return spriteCanvas(name, 1);
}

/** Open ground for the pixel theme: a two-tone green checker. */
function grassTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5cb84a'; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#57ae45';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) ctx.fillRect(x * 64, y * 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(20, 20);
  return t;
}

/** Pixel text with a dark outline and a hard drop shadow, All-Stars title style. */
function pixelTitle(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, fill: string, shadow = Math.round(px * 0.09)): void {
  ctx.save();
  ctx.font = `${px}px ${pixelFont()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'miter'; ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(4, px * 0.16); ctx.strokeStyle = PIXEL_INK;
  ctx.fillStyle = PIXEL_INK; ctx.fillText(text, x + shadow, y + shadow); ctx.strokeText(text, x + shadow, y + shadow);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, hgt: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + hgt - r); ctx.quadraticCurveTo(x + w, y + hgt, x + w - r, y + hgt);
  ctx.lineTo(x + r, y + hgt); ctx.quadraticCurveTo(x, y + hgt, x, y + hgt - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function spaceIconKey(space: Space): string | null {
  switch (space.type) {
    case 'go': return 'go'; case 'chance': return 'chance'; case 'chest': return 'chest'; case 'railroad': return 'railroad';
    case 'utility': return /water/i.test(space.name) ? 'water' : 'electric';
    case 'tax': return /luxury/i.test(space.name) ? 'luxurytax' : 'incometax';
    case 'jail': return 'jail'; case 'freeparking': return 'freeparking'; case 'gotojail': return 'gotojail';
    default: return null;
  }
}

interface Tween { update(now: number, dt: number): boolean } // returns false when finished; `now` is performance.now()

function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }

/** A tween driven by wall-clock time: `step(t, dt)` gets t in [0,1] and finishes when t reaches 1. */
function timed(ms: number, step: (t: number, dt: number) => void, done?: () => void): Tween {
  const start = performance.now();
  return { update: (now, dt) => { const t = Math.min(1, (now - start) / ms); step(t, dt); if (t >= 1) { done?.(); return false; } return true; } };
}

/** Simple cubic ease-in-out. */
function easeInOut(t: number): number { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

class TokenObj {
  group = new THREE.Group();
  /** The standee mesh (a plane until the character's frames are ready). */
  sprite: THREE.Mesh;
  shadow: THREE.Mesh;
  facing = 1;     // 1: front side toward the camera (art looks right); -1: flipped over, showing the mirrored back
  yaw = 0;        // current world heading of the cutout's face (radians about Y)
  flip: { from: number; to: number; start: number; ms: number } | null = null; // paper flip in progress
  baseY = BOARD_Y + 0.47;
  phase = Math.random() * 10;
  walkStep = 0;
  squash = 0; // 0..1 landing squash amount, decays
  contentScale = 1; // enlarges characters that only fill part of their cell (small sprites)
  private faceMat: THREE.MeshBasicMaterial;
  private frames: Partial<Record<FrameName, { geometry: THREE.ExtrudeGeometry; texture: THREE.CanvasTexture }>> = {};
  frame: FrameName | null = null;
  private depthMat: THREE.MeshDepthMaterial | null = null;
  constructor(material: THREE.MeshBasicMaterial) {
    this.faceMat = material;
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(TOKEN, TOKEN), material);
    this.sprite.position.y = 0.47;
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: 0x2b2118, transparent: true, opacity: 0.3, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.012;
    this.shadow.scale.set(1.25, 0.7, 1);
    this.group.add(this.sprite, this.shadow);
  }
  /** Swap the flat plane for an extruded pixel-art standee with animation frames. */
  useCharacter(ch: Character): void {
    this.contentScale = contentScaleFor(ch.frames.idle1);
    for (const name of Object.keys(ch.frames) as FrameName[]) this.frames[name] = pixelCutout(ch.frames[name]);
    const first = this.frames.idle1 ?? Object.values(this.frames)[0]!;
    const old = this.sprite;
    this.faceMat.map = first.texture;
    this.faceMat.transparent = true;
    this.faceMat.alphaTest = 0.05;
    this.faceMat.side = THREE.DoubleSide;
    this.faceMat.needsUpdate = true;
    const edge = new THREE.MeshLambertMaterial({ color: INK });
    const mesh = new THREE.Mesh(first.geometry, [this.faceMat, edge]);
    mesh.castShadow = true;
    this.depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: first.texture, alphaTest: 0.5 });
    mesh.customDepthMaterial = this.depthMat;
    this.group.remove(old);
    old.geometry.dispose();
    this.group.add(mesh);
    this.sprite = mesh;
    this.frame = 'idle1';
    this.baseY = 0;
    this.applyPose(0, 0);
  }
  setFrame(name: FrameName): void {
    if (this.frame === name) return;
    const f = this.frames[name] ?? this.frames.idle1;
    if (!f) return;
    this.frame = name;
    this.sprite.geometry = f.geometry;
    this.faceMat.map = f.texture;
    this.faceMat.needsUpdate = true;
    if (this.depthMat) { this.depthMat.map = f.texture; this.depthMat.needsUpdate = true; }
  }
  /** Procedural pose (breathing, waddle, squash) plus the sprite frame for this moment. */
  applyPose(hop: number, tilt: number, now = performance.now(), walkT: number | null = null): void {
    const m = this.sprite;
    const isSprite = this.frame !== null;
    if (isSprite) {
      if (walkT !== null) {
        if (hop > 0.16) this.setFrame('jump');
        else if (walkT < 0.2) this.setFrame(this.walkStep % 2 ? 'walk1' : 'walk3');
        else this.setFrame('walk2');
      } else {
        const blink = ((now + this.phase * 1000) % 2600) < 170;
        this.setFrame(blink ? 'idle2' : 'idle1');
      }
    }
    const breathe = isSprite ? 1 : 1 + Math.sin(now / 520 + this.phase) * 0.018;
    const sq = this.squash;
    const sy = breathe * (1 - sq * 0.22);
    const sx = 1 + sq * 0.18;
    // The pixel cutout geometry is already w/h wide for a height of 1, so it scales uniformly (square pixels).
    const hgt = isSprite ? TOKEN * SPRITE_SCALE * this.contentScale : TOKEN;
    const w = isSprite ? hgt : TOKEN;
    m.scale.set(w * sx, hgt * sy, 1);
    m.position.y = (isSprite ? 0 : TOKEN / 2) + hop;
    m.rotation.z = tilt + (isSprite ? 0 : Math.sin(now / 900 + this.phase) * 0.015);
  }
  setBankrupt(b: boolean): void { this.faceMat.opacity = b ? 0.35 : 1; this.faceMat.transparent = true; this.faceMat.color.setScalar(b ? 0.55 : 1); }
  /**
   * Turn toward a heading. Small differences ease smoothly (a billboard tracking the camera);
   * large ones flip the cutout over on its vertical axis, paper-style, showing the edge mid-turn.
   */
  turnToward(target: number, now: number, dt: number): void { turnCutout(this, target, now, dt); }
  snapYaw(target: number): void { this.flip = null; this.yaw = target; this.group.rotation.y = target; }
}

const SPRITE_SCALE = 1.45; // standee height relative to TOKEN
const FLIP_AT = 0.95;      // heading difference (radians) beyond which a standee flips over instead of turning smoothly

/** Smooth billboard turning for small differences, a paper flip over the vertical axis for large ones. */
function turnCutout(obj: { yaw: number; flip: { from: number; to: number; start: number; ms: number } | null; group: THREE.Group }, target: number, now: number, dt: number): void {
  if (obj.flip) {
    const t = Math.min(1, (now - obj.flip.start) / obj.flip.ms);
    obj.yaw = obj.flip.from + (obj.flip.to - obj.flip.from) * easeInOut(t);
    if (t >= 1) obj.flip = null;
  } else {
    let d = target - obj.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) > FLIP_AT) obj.flip = { from: obj.yaw, to: obj.yaw + d, start: now, ms: dur(340) };
    else obj.yaw += d * (1 - Math.exp(-dt / 220));
  }
  obj.group.rotation.y = obj.yaw;
}

/** A scenery cutout: a pixel sprite extruded one pixel thick with an inked edge, standing on the table. */
class PropObj {
  group = new THREE.Group();
  id = '';
  yaw = 0;
  flip: { from: number; to: number; start: number; ms: number } | null = null;
  private baseY: number;
  private floating: boolean;
  private phase = Math.random() * 10;
  private frames: { geometry: THREE.BufferGeometry; texture: THREE.Texture }[] | null = null;
  private frameMs = 150;
  private frameIdx = 0;
  private mesh: THREE.Mesh;
  private face: THREE.MeshBasicMaterial;
  private depthMat: THREE.MeshDepthMaterial;
  /** `frames` (all the same size) make an animated cutout: each frame has its own silhouette and picture. */
  constructor(canvas: HTMLCanvasElement, height: number, frames?: HTMLCanvasElement[], frameMs = 150) {
    const first = frames && frames.length > 1 ? frames[0] : canvas;
    const { geometry, texture } = pixelCutout(first, 1 / first.height); // depth of one sprite pixel, in the unit-height frame
    this.face = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geometry, [this.face, new THREE.MeshLambertMaterial({ color: INK })]);
    this.mesh.scale.set(height, height, height);
    this.mesh.castShadow = true;
    this.depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 });
    this.mesh.customDepthMaterial = this.depthMat;
    if (frames && frames.length > 1) {
      this.frames = frames.map((f) => pixelCutout(f, 1 / f.height)); // cached per frame canvas, so swapping is free
      this.frameMs = frameMs;
    }
    this.group.add(this.mesh);
    this.baseY = 0;
    this.floating = false;
  }
  /** Animated props swap to their next frame (shape and picture) when its time comes. */
  animate(now: number): void {
    if (!this.frames) return;
    const f = Math.floor(now / this.frameMs) % this.frames.length;
    if (f === this.frameIdx) return;
    this.frameIdx = f;
    const fr = this.frames[f];
    this.mesh.geometry = fr.geometry;
    this.face.map = fr.texture;
    this.depthMat.map = fr.texture;
  }
  /** Clouds drift up and down a little; grounded props stay put. */
  setFloating(base: number, on = true): void { this.floating = on; this.baseY = base; }
  turnToward(target: number, now: number, dt: number): void { turnCutout(this, target, now, dt); }
  bob(now: number): void { if (this.floating) this.group.position.y = this.baseY + Math.sin(now / 1400 + this.phase) * 0.12; }
}

/** How much to enlarge a character whose pixels fill only part of the cell height (kept within 1–1.6×). */
function contentScaleFor(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return 1;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let top = canvas.height, bottom = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 8) { if (y < top) top = y; if (y > bottom) bottom = y; break; }
    }
  }
  if (bottom < top) return 1;
  const frac = (bottom - top + 1) / canvas.height;
  return Math.min(1.6, Math.max(1, 1 / frac));
}

export class Board3D implements BoardView {
  readonly wrap: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOARD_Y);
  private boardTex: THREE.CanvasTexture;
  private boardCanvas: HTMLCanvasElement;
  private icons = new Map<string, HTMLImageElement>();
  private tokens = new Map<string, TokenObj>();
  private busyTokens = new Set<TokenObj>();
  private tokenPos = new Map<string, number>();
  private dynamic = new THREE.Group(); // owner marks, houses, mortgages
  private props: PropObj[] = []; // themed scenery cutouts that turn to face the camera like the standees
  private propMarker!: THREE.Mesh;
  private hover: THREE.Mesh;
  private select: THREE.Mesh;
  private flashMesh: THREE.Mesh;
  private ring: THREE.Mesh;
  private dice: THREE.Mesh[] = [];
  private dieTextures: THREE.Texture[] = [];
  private tweens: Tween[] = [];
  private raf = 0;
  private last = performance.now();
  private state: GameState | null = null;
  private bannerWho: HTMLElement;
  private banner: HTMLElement;
  private pot: HTMLElement;
  private onSpaceClick: (index: number) => void;
  private destroyed = false;
  private pointerDown: { x: number; y: number } | null = null;
  private ro: ResizeObserver;
  // Camera director
  private camMode: 'follow' | 'overview' | 'top' | 'free' | 'cinematic' | 'victory' = 'follow';
  private victoryId: string | null = null;
  private victoryStart = 0;
  private spot: THREE.SpotLight | null = null;
  private cinStart = performance.now();
  private cameraPlaced = false;
  private flyInUntil = 0;
  private ambientTimer: number | null = null;
  private ambientTick = 0;
  private followId: string | null = null;
  private followZoom = 1;
  private camPos = new THREE.Vector3(0, 13, 15);
  private camLook = new THREE.Vector3(0, 0, 0.4);
  private smoothOut = new THREE.Vector2(0, 1);
  private smoothTravel = new THREE.Vector2(-1, 0);
  private diceFocusUntil = 0;
  private diceFocusPose: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  private focusSpace: number | null = null;
  private camButtons = new Map<string, HTMLButtonElement>();
  private camLabel: HTMLElement;

  constructor(onSpaceClick: (index: number) => void) {
    this.onSpaceClick = onSpaceClick;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board3d-canvas';
    this.bannerWho = h('span', { class: 'who' });
    this.banner = h('div', { class: 'turn-banner paper paper--flat' }, this.bannerWho, h('span', null, "'s turn"));
    this.pot = h('div', { class: 'pot paper paper--flat hidden' });
    const camBar = h('div', { class: 'cam-bar' });
    for (const [mode, label, title] of [['follow', 'Follow', 'Camera follows whoever is on turn'], ['overview', 'Overview', 'See the whole board'], ['top', 'Top', 'Straight down']] as const) {
      const b = h('button', { class: 'btn btn--sm', type: 'button', title, onClick: () => this.setMode(mode) }, label) as HTMLButtonElement;
      this.camButtons.set(mode, b);
      camBar.appendChild(b);
    }
    this.camLabel = h('div', { class: 'cam-label' });
    const hint = h('div', { class: 'board3d-hint' }, 'Drag to look around · scroll to zoom · click a street for its deed');
    setTimeout(() => hint.classList.add('is-fading'), 7000);
    this.wrap = h('div', { class: 'board3d-wrap' }, this.canvas, h('div', { class: 'board3d-overlay' }, this.banner, this.pot), h('div', { class: 'cam-ui' }, camBar, this.camLabel), hint);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The classic board sits on a wooden table; the pixel theme sits on open ground under a sky, with
    // fog the colour of the sky so the ground and the far hills fade into the horizon (no walls).
    this.scene.background = new THREE.Color(themed() ? SKY : '#7d4d22');
    this.scene.fog = new THREE.Fog(themed() ? SKY : '#7d4d22', themed() ? 20 * K : 30 * K, themed() ? 62 * K : 60 * K);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.camera.position.copy(this.camPos);
    this.scene.add(this.camera); // so objects attached to the camera (card reveals) render
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 34;
    this.controls.maxPolarAngle = 1.32;
    this.controls.minPolarAngle = 0.05;
    this.controls.enablePan = false;
    this.controls.enableZoom = false; // the director handles zoom until the viewer takes over
    this.controls.target.copy(this.camLook);
    this.canvas.addEventListener('wheel', (e) => {
      if (this.camMode === 'free') return;
      e.preventDefault();
      this.followZoom = Math.min(2.4, Math.max(0.55, this.followZoom * (e.deltaY > 0 ? 1.1 : 0.9)));
    }, { passive: false });
    this.setMode('follow');

    // Lights
    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6b4a2b, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(7, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9 * K; sun.shadow.camera.right = 9 * K; sun.shadow.camera.top = 9 * K; sun.shadow.camera.bottom = -9 * K;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    // Table
    const table = new THREE.Mesh(new THREE.PlaneGeometry(themed() ? 160 : 80, themed() ? 160 : 80), new THREE.MeshLambertMaterial({ map: themed() ? grassTexture() : woodTexture() }));
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    this.scene.add(table);
    if (themed()) this.addScenery();

    // Board: white sticker edge, ink body, paper top
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF + 0.5, 0.05, 2 * HALF + 0.5), new THREE.MeshLambertMaterial({ color: themed() ? '#5a3a1e' : PAPER }));
    edge.position.y = 0.025; edge.castShadow = true; edge.receiveShadow = true;
    edge.rotation.y = -0.006;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF + 0.16, BOARD_Y - 0.05, 2 * HALF + 0.16), new THREE.MeshLambertMaterial({ color: themed() ? '#3b2412' : INK }));
    body.position.y = 0.05 + (BOARD_Y - 0.05) / 2; body.castShadow = true;
    this.boardCanvas = document.createElement('canvas');
    this.boardCanvas.width = TEX; this.boardCanvas.height = TEX;
    this.boardTex = new THREE.CanvasTexture(this.boardCanvas);
    this.boardTex.colorSpace = THREE.SRGBColorSpace;
    this.boardTex.anisotropy = 8;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF, 2 * HALF), new THREE.MeshLambertMaterial({ map: this.boardTex }));
    top.rotation.x = -Math.PI / 2; top.position.y = BOARD_Y + 0.001; top.receiveShadow = true;
    this.scene.add(edge, body, top);

    // Decks
    this.rebuildDecks();

    // Highlights
    const mk = (color: number, opacity: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = BOARD_Y + 0.004; m.visible = false; this.scene.add(m); return m; };
    this.hover = mk(0x2f7fd6, 0.22);
    this.select = mk(0x2f7fd6, 0.35);
    this.flashMesh = mk(0xfff3a6, 0.7);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.5, 40), new THREE.MeshBasicMaterial({ color: 0xd9413a, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = BOARD_Y + 0.006; this.ring.visible = false;
    this.propMarker = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 40), new THREE.MeshBasicMaterial({ color: 0xfbd000, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    this.propMarker.rotation.x = -Math.PI / 2; this.propMarker.visible = false;
    this.scene.add(this.ring, this.dynamic, this.propMarker);

    // Dice
    for (let i = 0; i < 2; i++) {
      const die = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), new THREE.MeshLambertMaterial({ color: PAPER }));
      die.castShadow = true;
      die.position.set(i === 0 ? -0.5 : 0.5, BOARD_Y + 0.31, 1.3);
      const outline = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
      outline.scale.setScalar(1.07);
      die.add(outline);
      this.scene.add(die);
      this.dice.push(die);
    }
    void this.loadDiceFaces();

    // Interaction
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.pointerDown && this.camMode !== 'free' && Math.hypot(e.clientX - this.pointerDown.x, e.clientY - this.pointerDown.y) > 6) this.setMode('free');
      this.onPointerMove(e);
    });
    this.canvas.addEventListener('pointerdown', (e) => { this.pointerDown = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointerleave', () => { this.hover.visible = false; });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.wrap);

    void this.loadIcons();
    this.loop();
  }

  /** Hills and clouds around a themed board, as upright cutouts that keep facing the camera. */
  /** The build's own scenery layout (what the art editor starts from). */
  defaultProps(): PropDef[] {
    const far = HALF + 1.6;
    const P = (id: string, sprite: string, x: number, y: number, z: number, h: number, float = false): PropDef => ({ id, sprite, x, y, z, h, float });
    return [
      P('hill-w', 'hill', -far - 2.4, 0, -3, 2.4), P('hill-e', 'hill', far + 2.6, 0, 4.5, 2.7), P('hill-n', 'hill', 3, 0, -far - 2.6, 2.3), P('hill-s', 'hill', -6, 0, far + 2.8, 2.1),
      P('mound-e', 'hill_small', far + 1, 0, -6.5, 0.9), P('mound-w', 'hill_small', -far - 1, 0, 6.5, 0.9),
      P('castle', 'castle_big', far + 4.5, 0, -far - 2.5, 4.2), P('castle-sm', 'castle_small', -far - 3.5, 0, far + 1.5, 2.6),
      P('bush-1', 'bush:3', -far - 0.3, 0, 2, 0.75), P('bush-2', 'bush:2', far + 0.4, 0, -2.5, 0.7), P('bush-3', 'bush:4', -3, 0, far + 0.6, 0.85), P('bush-4', 'bush:2', 7.5, 0, far + 0.9, 0.7), P('bush-5', 'bush:3', 6, 0, -far - 0.5, 0.75), P('bush-6', 'bush:2', -far - 0.5, 0, -far, 0.7),
      P('pipe-1', 'pipe:3', far + 0.6, 0, 7.5, 1.6), P('pipe-2', 'pipe:2', -far - 0.8, 0, -7, 1.1),
      P('hill3-w', 'hill3_green', -far - 5, 0, 1, 2.6), P('hill3-stripe', 'hill3_stripe', far + 5.5, 0, -3, 3.4), P('hill3-n', 'hill3_orange', 8, 0, -far - 5, 2.4),
      P('bumps-1', 'bumps3_green', -far - 2, 0, -9, 0.9), P('bushes-1', 'bushes3', far + 2.2, 0, 9.5, 0.9), P('bumps-2', 'bumps3_tan', -9, 0, far + 3, 0.9),
      P('pyramid', 'pyramid_big', far + 8, 0, 9, 3), P('pyramid-2', 'pyramid3', far + 11, 0, 6.5, 2.2), P('palm', 'palm', far + 6, 0, 11, 2.2),
      P('giant-pipe', 'giant_pipe', -far - 7, 0, -12, 2.8), P('giant-q', 'giant_q', -far - 3.5, 2.2, -14, 1.2, true), P('cactus', 'cactus', far + 9.5, 0, 11.5, 0.6),
      P('cloud-1', 'cloud3_face', -far - 3, 4.2, far - 3, 2, true), P('cloud-2', 'cloud_mid', far + 3, 5, -1, 1.8, true), P('cloud-3', 'cloud3_big', 1, 5.6, -far - 4, 1.6, true), P('cloud-4', 'cloud_big', far * 0.6, 4.6, far + 3.5, 2.1, true), P('cloud-5', 'cloud3_face', -far * 0.7, 5.4, -far - 3, 1.7, true), P('cloud-6', 'giant_cloud', far + 6, 6.5, 2, 2.2, true),
      P('ring-1', 'hill', 0, 0, 26, 5.5), P('ring-2', 'hill', 21.2, 0, 21.2, 4.5), P('ring-3', 'hill', 26.9, 0, -2.4, 6), P('ring-4', 'hill', 19.9, 0, -23.7, 5), P('ring-5', 'hill', -2.3, 0, -25.9, 5.5), P('ring-6', 'hill', -21.2, 0, -21.2, 4.8), P('ring-7', 'hill', -27.9, 0, 2.4, 6), P('ring-8', 'hill', -19.9, 0, 23.7, 5),
      P('ring-bush-1', 'bush:3', 8.2, 0, 22.6, 1.2), P('ring-bush-2', 'bush:3', 7.9, 0, -21.6, 1.2), P('ring-bush-3', 'bush:3', -23.5, 0, -8.6, 1.2), P('ring-bush-4', 'bush:3', -19.1, 0, 11, 1.2),
    ];
  }

  /** Scenery around the board in the pixel theme: paper cutouts standing on the table, like the standees. */
  private addScenery(): void { this.rebuildScenery(); }

  rebuildScenery(): void {
    for (const p of this.props) this.scene.remove(p.group);
    this.props = [];
    if (!themed()) return;
    for (const def of art.props ?? this.defaultProps()) {
      const prop = this.makeProp(def);
      if (!prop) continue;
      this.scene.add(prop.group);
      this.props.push(prop);
    }
  }
  private makeProp(def: PropDef): PropObj | null {
    const anim = def.sprite.startsWith('anim:') ? animFrames(def.sprite.slice(5)) : null;
    const canvas = propCanvas(def.sprite);
    if (!canvas) return null;
    const prop = new PropObj(canvas, def.h, anim?.frames, anim?.ms);
    prop.id = def.id;
    prop.group.position.set(def.x, def.y, def.z);
    if (def.float) prop.setFloating(def.y);
    return prop;
  }

  /** Art editor: the board face texture (a 2048² canvas) as drawn right now. */
  boardImage(): HTMLCanvasElement { return this.boardCanvas; }
  /** Art editor: where a space sits on the board texture, and the rotation (radians) that puts it upright. */
  spaceTexRect(i: number): { x: number; y: number; w: number; h: number; angle: number } {
    const r = spaceRect(i);
    return { x: (r.x + HALF) * S, y: (r.z + HALF) * S, w: r.w * S, h: r.d * S, angle: i % 10 === 0 ? 0 : sideAngle(i) };
  }
  /** Art editor: the space under a board-texture point (texture px), or null. */
  spaceAtTex(x: number, y: number): number | null { return indexAt(x / S - HALF, y / S - HALF); }
  /** Art editor: in free look, swing the camera to look at a point from a comfortable distance. */
  focusPoint(x: number, y: number, z: number, dist = 9): void {
    if (this.camMode !== 'free') this.setMode('free');
    const target = new THREE.Vector3(x, y, z);
    const dir = new THREE.Vector3(x, 0, z).normalize();
    if (!dir.lengthSq()) dir.set(0, 0, 1);
    // stand outside the point (further from the board middle), slightly above
    const pos = new THREE.Vector3(x + dir.x * dist * 0.8, y + dist * 0.55, z + dir.z * dist * 0.8);
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
  }

  /** Art editor: the table point under a pointer event, or null. */
  pickGround(e: PointerEvent): { x: number; z: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return null;
    return { x: hit.x, z: hit.z };
  }

  /** Art editor: the prop under a pointer event (its id), or null. */
  pickProp(e: PointerEvent): string | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hits = ray.intersectObjects(this.props.map((p) => p.group), true);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !this.props.some((p) => p.group === o)) o = o.parent;
      const prop = this.props.find((p) => p.group === o);
      if (prop) return prop.id;
    }
    return null;
  }
  /** Art editor: put one prop into the scene right away (no rebuild). False when its art is missing. */
  addProp(def: PropDef): boolean {
    const prop = this.makeProp(def);
    if (!prop) return false;
    this.removeProp(def.id);
    this.scene.add(prop.group);
    this.props.push(prop);
    return true;
  }
  /** Art editor: take one prop out of the scene (no rebuild). */
  removeProp(id: string): void {
    const i = this.props.findIndex((p) => p.id === id);
    if (i < 0) return;
    this.scene.remove(this.props[i].group);
    this.props.splice(i, 1);
  }
  /** Art editor: whether a client point is over the 3D canvas itself (not a panel drawn over it). */
  isOverCanvas(x: number, y: number): boolean { return document.elementFromPoint(x, y) === this.canvas; }

  /** Art editor: move one prop in place (no rebuild). False when the prop is not in the scene. */
  moveProp(def: PropDef): boolean {
    const p = this.props.find((q) => q.id === def.id);
    if (!p) return false;
    p.group.position.set(def.x, def.y, def.z);
    p.setFloating(def.y, !!def.float);
    this.markProp(def.id);
    return true;
  }

  /** Art editor: mark one prop (or none) with a ring on the table. */
  markProp(id: string | null): void {
    const p = id ? this.props.find((q) => q.id === id) : undefined;
    this.propMarker.visible = !!p;
    if (p) this.propMarker.position.set(p.group.position.x, 0.02, p.group.position.z);
  }

  private deckGroups: THREE.Group[] = [];
  private rebuildDecks(): void {
    for (const g of this.deckGroups) this.scene.remove(g);
    this.deckGroups = [this.deck('chance', -2.7 * K, 0.2, -0.12), this.deck('chest', 2.7 * K, 0.2, 0.09)];
  }

  /** Redraw everything that comes from the art pack after the art editor changed it. */
  refreshArt(): void {
    animCache.clear();
    if (this.state) { this.drawBoard(this.state); this.updateStatic(this.state); }
    this.rebuildDecks();
    this.rebuildScenery();
    void this.loadDiceFaces();
  }

  private deckColor(kind: 'chance' | 'chest'): string {
    if (themed()) return kind === 'chance' ? '#f8d020' : '#f9f1dc';
    return kind === 'chance' ? '#ffe1b3' : '#dff1fa';
  }

  private deck(kind: 'chance' | 'chest', x: number, z: number, rot: number): THREE.Group {
    const g = new THREE.Group();
    const label = deckName(kind).toUpperCase();
    const color = this.deckColor(kind);
    const c = document.createElement('canvas'); c.width = 512; c.height = 340;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 340);
    if (themed()) {
      ctx.lineWidth = 16; ctx.strokeStyle = PIXEL_INK; ctx.strokeRect(8, 8, 496, 324);
      ctx.fillStyle = PIXEL_INK; ctx.font = `36px ${pixelFont()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lines = label.split(' ');
      lines.forEach((l, i) => ctx.fillText(l, 256, 262 + i * 44 - (lines.length - 1) * 22));
      const slot = packSprite(kind === 'chance' ? 'deck_chance' : 'deck_chest');
      if (slot) { const sh = 150, sw = sh * slot.w / slot.h; drawSprite(ctx, kind === 'chance' ? 'deck_chance' : 'deck_chest', 256 - sw / 2, 30, sw, sh); }
      else if (kind === 'chance') drawSprite(ctx, 'qblock', 196, 36, 120, 120);
      else { drawSprite(ctx, 'mushroom_top', 166, 40, 180, 60); drawSprite(ctx, 'mushroom_stem', 226, 96, 60, 90); }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
      const mat = [new THREE.MeshLambertMaterial({ color: PIXEL_INK }), new THREE.MeshLambertMaterial({ color: PIXEL_INK }), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ color: PIXEL_INK }), new THREE.MeshLambertMaterial({ color: PIXEL_INK }), new THREE.MeshLambertMaterial({ color: PIXEL_INK })];
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 1.0), mat);
      box.castShadow = true; box.position.y = BOARD_Y + 0.045;
      g.add(box);
      g.position.set(x, 0, z); g.rotation.y = rot;
      this.scene.add(g);
      return g;
    }
    ctx.lineWidth = 14; ctx.strokeStyle = INK; roundRect(ctx, 7, 7, 498, 326, 30); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `700 54px ${fontStack()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = label.split(' ');
    lines.forEach((l, i) => ctx.fillText(l, 256, 250 + i * 54 - (lines.length - 1) * 27));
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    void svgImage(kind === 'chance' ? ICONS.chance : ICONS.chest).then((img) => { ctx.drawImage(img, 196, 30, 120, 120); tex.needsUpdate = true; });
    const mat = [new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK })];
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 1.0), mat);
    box.castShadow = true; box.position.y = BOARD_Y + 0.045;
    g.add(box);
    g.position.set(x, 0, z); g.rotation.y = rot;
    this.scene.add(g);
    return g;
  }

  /** A die face drawn as a bevelled block from the theme pack, with pips. */
  private blockFace(n: number): THREE.CanvasTexture {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d')!;
    drawSprite(ctx, packSprite('die_face') ? 'die_face' : 'used_block', 0, 0, 256, 256);
    const pips: Record<number, [number, number][]> = { 1: [[128, 128]], 2: [[80, 80], [176, 176]], 3: [[72, 72], [128, 128], [184, 184]], 4: [[80, 80], [176, 80], [80, 176], [176, 176]], 5: [[76, 76], [180, 76], [128, 128], [76, 180], [180, 180]], 6: [[80, 68], [176, 68], [80, 128], [176, 128], [80, 188], [176, 188]] };
    for (const [x, y] of pips[n] ?? []) {
      ctx.fillStyle = PIXEL_INK; ctx.fillRect(x - 22, y - 22, 44, 44);
      ctx.fillStyle = '#fff4d6'; ctx.fillRect(x - 16, y - 16, 32, 32);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    return t;
  }

  private async loadDiceFaces(): Promise<void> {
    const faces = themed() ? [1, 2, 3, 4, 5, 6].map((n) => this.blockFace(n)) : await Promise.all([1, 2, 3, 4, 5, 6].map((n) => svgTexture(dieFace(n), 256)));
    this.dieTextures = faces;
    // material order: +x, -x, +y, -y, +z, -z  → pips 1,6,2,5,3,4 (opposites sum to 7)
    const order = [1, 6, 2, 5, 3, 4];
    for (const die of this.dice) {
      die.material = order.map((n) => new THREE.MeshLambertMaterial({ map: faces[n - 1] }));
    }
    const d = this.state?.dice ?? [1, 1];
    this.setDieFace(this.dice[0], d[0], 0.3); this.setDieFace(this.dice[1], d[1], -0.4);
  }

  private setDieFace(die: THREE.Mesh, n: number, yaw: number): void {
    const e = new THREE.Euler();
    switch (n) { case 1: e.set(0, 0, Math.PI / 2); break; case 6: e.set(0, 0, -Math.PI / 2); break; case 2: e.set(0, 0, 0); break; case 5: e.set(Math.PI, 0, 0); break; case 3: e.set(-Math.PI / 2, 0, 0); break; case 4: e.set(Math.PI / 2, 0, 0); break; }
    const q = new THREE.Quaternion().setFromEuler(e);
    const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    die.quaternion.copy(yawQ.multiply(q));
  }

  private async loadIcons(): Promise<void> {
    const keys = Object.keys(ICONS);
    await Promise.all(keys.map(async (k) => { try { this.icons.set(k, await svgImage(ICONS[k])); } catch { /* skip */ } }));
    if (this.state) this.drawBoard(this.state);
    try { await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready; if (this.state) this.drawBoard(this.state); } catch { /* ignore */ }
  }

  // ---------- board texture ----------

  private drawBoard(state: GameState): void {
    const ctx = this.boardCanvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (themed()) { this.drawThemedBoard(ctx, state); this.boardTex.needsUpdate = true; return; }
    ctx.fillStyle = '#fbf3e0'; ctx.fillRect(0, 0, TEX, TEX);
    // Subtle grain
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(43,33,24,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * TEX, Math.random() * TEX, 2, 2); }
    // Center title
    ctx.save();
    ctx.translate(TEX / 2, TEX / 2 - 300);
    ctx.rotate(-0.07);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 190px ${fontStack()}`;
    ctx.lineWidth = 16; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.fillStyle = '#d9413a';
    const [t1, t2raw] = THEME.title;
    const t2 = t2raw.split('').join(' ');
    ctx.fillText(t1, 14, 14); ctx.strokeText(t1, 0, 0); ctx.fillStyle = '#fbf3e0'; ctx.fillText(t1, 0, 0);
    ctx.font = `700 92px ${fontStack()}`;
    ctx.lineWidth = 10; ctx.fillStyle = '#d9413a';
    ctx.fillText(t2, 8, 150); ctx.strokeText(t2, 0, 142); ctx.fillStyle = '#fbf3e0'; ctx.fillText(t2, 0, 142);
    ctx.restore();

    for (const space of state.board) this.drawSpace(ctx, space);
    this.boardTex.needsUpdate = true;
  }

  /** Board face in the pixel-art theme: sky, scenery and a logo in the middle, block-style spaces around. */
  private drawThemedBoard(ctx: CanvasRenderingContext2D, state: GameState): void {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = SKY; ctx.fillRect(0, 0, TEX, TEX);
    const inner = CORNER * S;
    const x0 = inner + 8, x1 = TEX - inner - 8, y1 = TEX - inner - 8;
    // ground along the bottom of the middle, hills and bushes on it, clouds above
    stripSprite(ctx, GROUND, x0, y1 - 48, x1 - x0, 48, 3);
    drawSprite(ctx, 'hill3_green', x0 + 20, y1 - 48 - 240, 48 * 5, 48 * 5);
    drawSprite(ctx, 'hill3_stripe', x1 - 20 - 32 * 4, y1 - 48 - 64 * 4, 32 * 4, 64 * 4);
    drawSprite(ctx, 'bumps3_green', x0 + 520, y1 - 48 - 48, 48 * 3, 16 * 3);
    drawSprite(ctx, 'bushes3', x1 - 560, y1 - 48 - 48, 48 * 3, 16 * 3);
    stripSprite(ctx, BUSH, x0 + 430, y1 - 48 - 48, 16 * 3 * 5, 16 * 3, 3);
    stripSprite(ctx, BUSH, x1 - 420, y1 - 48 - 48, 16 * 3 * 3, 16 * 3, 3);
    drawSprite(ctx, 'castle_small', x1 - 300, y1 - 48 - 80 * 3, 96 * 3, 80 * 3);
    drawSprite(ctx, 'cloud3_face', x0 + 90, inner + 70, 48 * 4, 32 * 4);
    drawSprite(ctx, 'cloud3_big', x1 - 380, inner + 40, 48 * 5, 32 * 5);
    drawSprite(ctx, 'cloud_mid', x0 + 560, inner + 190, 32 * 4, 32 * 4);
    drawSprite(ctx, 'cloud3_face', x1 - 700, inner + 130, 48 * 3, 32 * 3);
    for (let i = 0; i < 5; i++) drawSprite(ctx, i % 2 ? 'coin' : 'coin2', x0 + 520 + i * 60, y1 - 48 - 330, 40, 40);
    // logo
    const [t1, t2] = THEME.title;
    const cx = TEX / 2, cy = TEX / 2 - 250;
    const logo = packSprite('logo');
    if (logo) {
      const lw = 1040, lh = lw * logo.h / logo.w;
      drawSprite(ctx, 'logo', cx - lw / 2, cy - lh + 20, lw, lh);
      pixelTitle(ctx, t2, cx, cy + 95, 132, '#fbd000');
    } else {
      pixelTitle(ctx, t1, cx, cy - 70, 96, '#e52521');
      pixelTitle(ctx, t2, cx, cy + 70, 150, '#fbd000');
    }
    for (const space of state.board) this.drawThemedSpace(ctx, space);
  }

  private drawThemedSpace(ctx: CanvasRenderingContext2D, space: Space): void {
    const i = space.index;
    const r = spaceRect(i);
    const corner = i % 10 === 0;
    const cx = (r.x + r.w / 2 + HALF) * S;
    const cy = (r.z + r.d / 2 + HALF) * S;
    const angle = corner ? 0 : sideAngle(i);
    const w = (corner ? CORNER : UNIT) * S;
    const d = CORNER * S;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Panel: black border (adjacent borders merge into the board's grid lines), cream face
    const b = 5;
    const left = -w / 2, top = -d / 2, iw = w, ih = d;
    ctx.fillStyle = PIXEL_INK; ctx.fillRect(left, top, iw, ih);
    ctx.fillStyle = '#f9f1dc'; ctx.fillRect(left + b, top + b, iw - 2 * b, ih - 2 * b);
    // Ground strip along an edge, grass blades toward the inside of the panel
    const gh = 42;
    const strip = (edge: 'top' | 'bottom' | 'left' | 'right', lava: boolean) => {
      const len = (edge === 'top' || edge === 'bottom' ? iw : ih) - 2 * b;
      ctx.save();
      if (edge === 'bottom') ctx.translate(0, top + ih - b);
      else if (edge === 'top') { ctx.translate(0, top + b); ctx.rotate(Math.PI); }
      else if (edge === 'left') { ctx.translate(left + b, 0); ctx.rotate(Math.PI / 2); }
      else { ctx.translate(left + iw - b, 0); ctx.rotate(-Math.PI / 2); }
      if (lava) { ctx.fillStyle = '#c8321e'; ctx.fillRect(-len / 2, -gh, len, gh); }
      const ws = spaceStripFor(i);
      if (lava && ws === undefined) tileSprite(ctx, 'lava_top', -len / 2, -gh, len, gh, gh / 16);
      else if (typeof ws === 'string') tileSprite(ctx, ws, -len / 2, -gh, len, gh, gh / 16);
      else stripSprite(ctx, ws ?? GROUND, -len / 2, -gh, len, gh, gh / 16);
      ctx.restore();
    };
    const draw = (name: string, x: number, yy: number, sw: number, sh: number) => drawSprite(ctx, name, x, yy, sw, sh);
    const nameOf = () => (space.type === 'jail' ? space.name.split(' / ')[0] : space.name);
    ctx.fillStyle = PIXEL_INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    /** Upper-case pixel text, wrapped, shrunk to fit; returns the y below the last line. */
    const label = (text: string, px: number, yy: number, maxW: number): number => {
      ctx.font = `${px}px ${pixelFont()}`;
      const lines = wrapText(ctx, text.toUpperCase(), maxW);
      let fs = px;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest > maxW) { fs = Math.floor(px * maxW / widest); ctx.font = `${fs}px ${pixelFont()}`; }
      for (const line of lines) { ctx.fillText(line, 0, yy); yy += fs * 1.5; }
      return yy;
    };
    if (corner) {
      const lava = space.type === 'gotojail';
      strip(i === 0 || i === 10 ? 'bottom' : 'top', lava);
      strip(i === 0 || i === 30 ? 'right' : 'left', lava);
      // Content sits in a diagonal frame whose "up" points at the board's middle, so it reads from outside the corner
      ctx.save();
      ctx.beginPath(); ctx.rect(left + b, top + b, iw - 2 * b, ih - 2 * b); ctx.clip();
      ctx.rotate(i === 0 ? -Math.PI / 4 : i === 10 ? Math.PI / 4 : i === 20 ? 3 * Math.PI / 4 : -3 * Math.PI / 4);
      // The panel is a square seen along its diagonal: content must satisfy |x| + |y| < ~160 to stay inside.
      const maxW = 150;
      const override = art.spaces[i]?.decor;
      const osp = override ? packSprite(override) : null;
      if (override !== undefined && osp) {
        label(nameOf(), 22, -100, maxW);
        const oh = art.spaces[i]?.decorH ?? 110;
        const ow = oh * osp.w / osp.h;
        drawSprite(ctx, override, -ow / 2, 0, ow, oh);
      } else if (space.type === 'go') {
        const yy = label(nameOf(), 30, -88, maxW);
        ctx.font = `12px ${pixelFont()}`; ctx.fillText('COLLECT 200', 0, yy);
        draw('castle_small', -36, 14, 96 * 0.9, 80 * 0.9);
        draw('flag_pole', -66, 12, 16, 66); draw('flag_ball', -68, 2, 20, 20); draw('goal_flag', -56, 14, 22, 22);
      } else if (space.type === 'jail') {
        const yy = label(nameOf(), 18, -90, maxW);
        ctx.font = `10px ${pixelFont()}`; ctx.fillText(T.justVisiting.toUpperCase(), 0, yy);
        draw('chain_fence', -42, -4, 96 * 0.88, 128 * 0.72);
      } else if (space.type === 'freeparking') {
        label(nameOf(), 20, -88, maxW);
        draw('cloud_big', -60, -26, 48 * 2.4, 32 * 2.4); draw('cloud_small', -28, 56, 48 * 1.6, 16 * 1.6);
        for (let k = 0; k < 3; k++) draw(k % 2 ? 'coin' : 'coin3', -42 + k * 32, 20, 26, 26);
      } else {
        label(nameOf(), 18, -92, maxW);
        draw('cannon', -58, -18, 16 * 2.6, 48 * 2.6); draw('hard_block_gray', -8, 30, 48, 48); draw('hard_block_gray', 40, 30, 48, 48); draw('hard_block_gray', 16, -18, 48, 48);
      }
      ctx.restore();
      ctx.restore();
      return;
    }
    strip('bottom', false);
    const gy = top + ih - b - gh;
    let y = top + b + 12;
    const textW = iw - 2 * b - 14;
    if (space.type === 'property') {
      const bandH = Math.round(d * 0.2);
      ctx.fillStyle = spaceColor(space); ctx.fillRect(left + b, top + b, iw - 2 * b, bandH);
      ctx.fillStyle = PIXEL_INK; ctx.fillRect(left + b, top + b + bandH, iw - 2 * b, 5);
      y = top + b + bandH + 16;
    }
    let iconH = 0;
    switch (space.type) {
      case 'railroad': draw('pipe_top', -32, y, 64, 32); draw('pipe_body', -32, y + 32, 64, 32); iconH = 72; break;
      case 'utility': draw(i === 12 ? 'qblock' : 'qblock3', -32, y, 64, 64); iconH = 72; break;
      case 'chance': draw('qblock', -38, y, 76, 76); iconH = 84; break;
      case 'chest': draw('mushroom_top', -42, y, 84, 28); draw('mushroom_stem', -14, y + 28, 28, 56); iconH = 92; break;
      case 'tax': draw('coin', -36, y, 32, 32); draw('coin2', 4, y, 32, 32); iconH = 40; break;
      default: break;
    }
    y += iconH;
    ctx.fillStyle = PIXEL_INK;
    const after = label(nameOf(), 18, y, textW);
    if (space.price) {
      const text = String(space.price);
      ctx.font = `20px ${pixelFont()}`;
      const tw = ctx.measureText(text).width;
      const x0 = -(tw + 30) / 2;
      draw('coin', x0, after + 2, 26, 26);
      ctx.textAlign = 'left'; ctx.fillText(text, x0 + 30, after + 6); ctx.textAlign = 'center';
    }
    if (space.type === 'tax') { ctx.font = `16px ${pixelFont()}`; ctx.fillText(`PAY ${space.amount}`, 0, after + 6); }
    const deco = spaceDecorFor(i);
    const sp = deco ? packSprite(deco.name) : null;
    if (deco && sp) {
      const dh = Math.min(deco.h, gy - (after + 30) - 4);
      if (dh > 14) { const dw = dh * sp.w / sp.h; drawSprite(ctx, deco.name, -dw / 2, gy - dh - 2, dw, dh); }
    }
    ctx.restore();
  }

  private drawSpace(ctx: CanvasRenderingContext2D, space: Space): void {
    const i = space.index;
    const r = spaceRect(i);
    const corner = i % 10 === 0;
    const cx = (r.x + r.w / 2 + HALF) * S;
    const cy = (r.z + r.d / 2 + HALF) * S;
    const angle = corner ? 0 : sideAngle(i);
    // local frame: width along the edge, depth toward the outer edge; inner edge at top
    const w = (corner ? CORNER : UNIT) * S;
    const d = CORNER * S;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const pad = 6;
    ctx.fillStyle = PAPER;
    roundRect(ctx, -w / 2 + pad, -d / 2 + pad, w - 2 * pad, d - 2 * pad, 12);
    ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    let textTop = -d / 2 + pad + 16;
    if (space.type === 'property') {
      const bandH = d * 0.24;
      ctx.fillStyle = spaceColor(space);
      roundRect(ctx, -w / 2 + pad, -d / 2 + pad, w - 2 * pad, bandH, 12);
      ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillRect(-w / 2 + pad + 3, -d / 2 + pad + bandH - 14, w - 2 * pad - 6, 12);
      textTop = -d / 2 + pad + bandH + 14;
    }
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const iconKey = spaceIconKey(space);
    const img = iconKey ? this.icons.get(iconKey) : undefined;
    let y = textTop;
    if (img) {
      const size = corner ? 150 : 66;
      ctx.drawImage(img, -size / 2, y, size, size);
      y += size + 6;
    } else if (iconKey) {
      y += corner ? 156 : 68;
    }
    const name = space.type === 'chest' ? 'Community Chest' : space.type === 'jail' ? 'Jail' : space.name;
    const fontPx = corner ? 36 : 27;
    ctx.font = `600 ${fontPx}px ${fontStack()}`;
    const lines = wrapText(ctx, name, w - 2 * pad - 14);
    for (const line of lines) { ctx.fillText(line, 0, y); y += fontPx * 1.08; }
    if (space.price) { ctx.font = `600 25px ${fontStack()}`; ctx.fillStyle = '#5b4a3a'; ctx.fillText(`$${space.price}`, 0, y + 4); }
    if (space.type === 'tax') { ctx.font = `600 25px ${fontStack()}`; ctx.fillStyle = '#5b4a3a'; ctx.fillText(`Pay $${space.amount}`, 0, y + 4); }
    if (space.type === 'jail') { ctx.font = `500 20px ${fontStack()}`; ctx.fillStyle = '#5b4a3a'; ctx.fillText('just visiting', 0, y + 4); }
    ctx.restore();
  }

  // ---------- public interface ----------

  build(state: GameState): void {
    this.state = state;
    this.drawBoard(state);
    for (const t of this.tokens.values()) this.scene.remove(t.group);
    this.tokens.clear();
    this.tokenPos.clear();
    for (const p of state.players) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, depthWrite: true });
      mat.visible = false;
      const tok = new TokenObj(mat);
      this.scene.add(tok.group);
      this.tokens.set(p.id, tok);
      this.tokenPos.set(p.id, p.position);
      tok.snapYaw(this.headingFor(tok));
      void getCharacter(p.token).then((ch) => { if (this.tokens.get(p.id) === tok) { tok.useCharacter(ch); mat.visible = true; } }).catch(() => { void svgTexture(tokenSvg(p.token), 512).then((tex) => { mat.map = tex; mat.visible = true; mat.needsUpdate = true; }); });
    }
    this.resize();
    if (!this.cameraPlaced) {
      const ov = this.camMode === 'cinematic' ? this.cinematicPose(performance.now()) : this.overviewPose();
      this.camPos.copy(ov.pos); this.camLook.copy(ov.look);
      this.cameraPlaced = true;
    }
    this.followId = state.players[state.currentPlayer]?.id ?? null;
    this.updateStatic(state);
    this.placeTokens(state, false);
    if (state.dice) void this.showDice(state.dice, false);
    this.updateCamLabel();
  }

  resize(): void {
    const w = this.wrap.clientWidth || 600;
    const hgt = this.wrap.clientHeight || 500;
    this.renderer.setSize(w, hgt, false);
    this.camera.aspect = w / hgt;
    this.camera.updateProjectionMatrix();
  }

  setSpaceClick(fn: (index: number) => void): void { this.onSpaceClick = fn; }
  private viewer: string | null = null;
  setViewer(id: string | null): void { this.viewer = id; if (this.state) this.updateStatic(this.state); }

  // ---------- camera director ----------

  setCameraMode(mode: 'follow' | 'overview' | 'top'): void { this.setMode(mode); }

  setMode(mode: 'follow' | 'overview' | 'top' | 'free' | 'cinematic' | 'victory'): void {
    if (mode !== 'free' && this.camMode === 'free') {
      // resume from wherever the viewer left the camera
      this.camPos.copy(this.camera.position);
      this.camLook.copy(this.controls.target);
    }
    if (this.camMode === 'cinematic' && mode !== 'cinematic') {
      this.stopAmbient();
      this.flyInUntil = performance.now() + 2600; // long sweeping move from the title camera into the game
    }
    if (mode === 'cinematic') { this.cinStart = performance.now(); this.startAmbient(); }
    if (mode !== 'victory' && this.spot) { this.scene.remove(this.spot, this.spot.target); this.spot = null; }
    this.camMode = mode;
    this.wrap.classList.toggle('is-cinematic', mode === 'cinematic');
    this.controls.enableZoom = mode === 'free';
    for (const [m, b] of this.camButtons) b.classList.toggle('btn--blue', m === mode);
    this.updateCamLabel();
  }

  /** Title-screen camera: a loop of slow shots around the board. */
  private cinematicPose(now: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const t = ((now - this.cinStart) / 1000) % 42;
    const center = new THREE.Vector3(0, 0.1, 0.4);
    if (t < 16) { // slow low orbit
      const a = 0.6 + t * 0.085, r = 12.5 * K;
      return { pos: new THREE.Vector3(Math.sin(a) * r, 4.6 * K, Math.cos(a) * r + 0.4), look: center };
    }
    if (t < 26) { // glide along the near row, street level
      const u = easeInOut((t - 16) / 10);
      const x = (5.6 - 11.2 * u) * K;
      return { pos: new THREE.Vector3(x, 1.9, 8.4 * K), look: new THREE.Vector3(x - 1.2, 0.3, 4.6 * K) };
    }
    if (t < 34) { // push in over the middle
      const u = easeInOut((t - 26) / 8);
      return { pos: new THREE.Vector3((-3.2 + 4.6 * u) * K, (7.6 - 2.8 * u) * K, (6.8 - 3.4 * u) * K), look: new THREE.Vector3(0.3, 0.2, -0.2) };
    }
    // high sweep back around
    const a = 3.9 + (t - 34) * 0.14, r = 14.5 * K;
    return { pos: new THREE.Vector3(Math.sin(a) * r, 8.5 * K, Math.cos(a) * r + 0.4), look: center };
  }

  /** Little bits of life for the title screen: tokens hop, dice get thrown now and then. */
  private startAmbient(): void {
    this.stopAmbient();
    this.ambientTimer = window.setInterval(() => {
      if (this.destroyed || this.camMode !== 'cinematic') return;
      this.ambientTick++;
      const toks = [...this.tokens.values()];
      if (toks.length && this.ambientTick % 4 !== 0) {
        const tok = toks[Math.floor(Math.random() * toks.length)];
        void this.tweenTo(tok, tok.group.position.clone(), 320, true);
      }
      if (this.ambientTick % 4 === 0) void this.showDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] as [number, number], true);
    }, 2400);
  }

  private stopAmbient(): void {
    if (this.ambientTimer !== null) { clearInterval(this.ambientTimer); this.ambientTimer = null; }
  }

  private updateCamLabel(): void {
    const who = this.followId === this.viewer ? 'you' : this.state?.players.find((p) => p.id === this.followId)?.name;
    this.camLabel.textContent = this.camMode === 'follow' ? (who ? `Following ${who}` : '') : this.camMode === 'free' ? 'Free look · press Follow to return' : '';
  }

  /** Distance at which the whole board fits the current canvas. */
  private fitDistance(margin: number): number {
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const vHalf = Math.tan(fov / 2);
    const hHalf = vHalf * this.camera.aspect;
    const extent = HALF + margin;
    return Math.max(extent / hHalf, (extent / vHalf) * 0.78) * 1.06;
  }

  private overviewPose(): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const dist = this.fitDistance(0.6);
    const elev = 0.78;
    return { pos: new THREE.Vector3(0, Math.sin(elev) * dist, Math.cos(elev) * dist + 0.4), look: new THREE.Vector3(0, 0, 0.4) };
  }

  private topPose(): { pos: THREE.Vector3; look: THREE.Vector3 } {
    return { pos: new THREE.Vector3(0, this.fitDistance(0.8) * 0.96, 0.41), look: new THREE.Vector3(0, 0, 0.4) };
  }

  /** Where a space's outer edge faces, and the direction of travel (increasing index) along it. */
  private spaceDirs(i: number): { out: THREE.Vector2; travel: THREE.Vector2 } {
    if (i % 10 === 0) {
      const [cx, cz] = spaceCenter(i);
      const out = new THREE.Vector2(Math.sign(cx), Math.sign(cz)).normalize();
      const travel = i === 0 ? new THREE.Vector2(-1, 0) : i === 10 ? new THREE.Vector2(0, -1) : i === 20 ? new THREE.Vector2(1, 0) : new THREE.Vector2(0, 1);
      return { out, travel };
    }
    const side = sideOf(i);
    if (side === 'bottom') return { out: new THREE.Vector2(0, 1), travel: new THREE.Vector2(-1, 0) };
    if (side === 'left') return { out: new THREE.Vector2(-1, 0), travel: new THREE.Vector2(0, -1) };
    if (side === 'top') return { out: new THREE.Vector2(0, -1), travel: new THREE.Vector2(1, 0) };
    return { out: new THREE.Vector2(1, 0), travel: new THREE.Vector2(0, 1) };
  }

  /** A view of one space from its outer side (used for auctions). */
  private spacePose(i: number, distScale = 1): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const [cx, cz] = spaceCenter(i);
    const { out } = this.spaceDirs(i);
    const d = 5.2 * distScale;
    return { pos: new THREE.Vector3(cx + out.x * d * 0.75, BOARD_Y + d * 0.85, cz + out.y * d * 0.75), look: new THREE.Vector3(cx - out.x * 0.8, BOARD_Y + 0.2, cz - out.y * 0.8) };
  }

  private desiredPose(now: number, dt: number): { pos: THREE.Vector3; look: THREE.Vector3; tau: number } {
    if (this.camMode === 'cinematic') return { ...this.cinematicPose(now), tau: 1.3 };
    if (this.camMode === 'victory') {
      const tok = this.victoryId ? this.tokens.get(this.victoryId) : undefined;
      if (tok) {
        const a = (now - this.victoryStart) / 1000 * 0.45 + 0.8;
        const p = tok.group.position;
        return { pos: new THREE.Vector3(p.x + Math.sin(a) * 4.2, BOARD_Y + 2.6, p.z + Math.cos(a) * 4.2), look: new THREE.Vector3(p.x, BOARD_Y + 0.55, p.z), tau: 0.5 };
      }
      return { ...this.overviewPose(), tau: 0.6 };
    }
    if (this.camMode === 'overview') return { ...this.overviewPose(), tau: 0.6 };
    if (this.camMode === 'top') return { ...this.topPose(), tau: 0.6 };
    // follow
    if (now < this.diceFocusUntil && this.diceFocusPose) return { ...this.diceFocusPose, tau: 0.3 };
    if (this.focusSpace !== null) return { ...this.spacePose(this.focusSpace), tau: 0.5 };
    const tok = this.followId ? this.tokens.get(this.followId) : undefined;
    const idx = this.followId ? this.tokenPos.get(this.followId) : undefined;
    if (!tok || idx === undefined) return { ...this.overviewPose(), tau: 0.6 };
    const dirs = this.spaceDirs(idx);
    const k = 1 - Math.exp(-dt / 450);
    this.smoothOut.lerp(dirs.out, k).normalize();
    this.smoothTravel.lerp(dirs.travel, k).normalize();
    const z = this.followZoom;
    const p = tok.group.position;
    // Mostly in front of the standee (its face points off the board) and a little behind its direction of travel.
    const pos = new THREE.Vector3(
      p.x + this.smoothOut.x * 4.2 * z - this.smoothTravel.x * 1.5 * z,
      BOARD_Y + 3.3 * z,
      p.z + this.smoothOut.y * 4.2 * z - this.smoothTravel.y * 1.5 * z,
    );
    const look = new THREE.Vector3(p.x + this.smoothTravel.x * 1.0 - this.smoothOut.x * 0.5, BOARD_Y + 0.45, p.z + this.smoothTravel.y * 1.0 - this.smoothOut.y * 0.5);
    return { pos, look, tau: 0.3 };
  }

  private updateCamera(now: number, dt: number): void {
    if (this.camMode === 'free') { this.controls.update(); return; }
    const desired = this.desiredPose(now, dt);
    const { pos, look } = desired;
    let tau = desired.tau;
    if (now < this.flyInUntil) tau = Math.max(tau, 0.35 + ((this.flyInUntil - now) / 2600) * 1.1);
    const k = 1 - Math.exp(-dt / (tau * 1000));
    this.camPos.lerp(pos, k);
    this.camLook.lerp(look, k);
    if (this.camPos.y < 0.9) this.camPos.y = 0.9;
    this.camera.position.copy(this.camPos);
    this.controls.target.copy(this.camLook);
    this.controls.update(); // keeps OrbitControls' internal state in sync so a drag takes over smoothly
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  updateStatic(state: GameState): void {
    this.state = state;
    const byId = new Map(state.players.map((p) => [p.id, p]));
    clear3(this.dynamic);
    for (const space of state.board) {
      const ps = state.properties[space.index];
      if (!ps?.owner) continue;
      const owner = byId.get(ps.owner);
      const r = spaceRect(space.index);
      const f = frame(space.index);
      const [cx, cz] = spaceCenter(space.index);
      const halfAlong = (sideOf(space.index) === 'bottom' || sideOf(space.index) === 'top' ? r.w : r.d) / 2;
      const halfDepth = CORNER / 2;
      // owner peg at the outer corner
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), new THREE.MeshLambertMaterial({ color: owner?.color ?? '#999' }));
      const pegOutline = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
      pegOutline.scale.set(1.25, 1.4, 1.25);
      peg.add(pegOutline);
      const px = cx + f.along[0] * (halfAlong - 0.16) - f.inward[0] * (halfDepth - 0.16);
      const pz = cz + f.along[1] * (halfAlong - 0.16) - f.inward[1] * (halfDepth - 0.16);
      peg.position.set(px, BOARD_Y + 0.025, pz);
      peg.castShadow = true;
      this.dynamic.add(peg);
      // houses / hotel along the inner band
      if (ps.houses > 0) {
        const bandY = BOARD_Y;
        const inX = cx + f.inward[0] * (halfDepth - 0.2), inZ = cz + f.inward[1] * (halfDepth - 0.2);
        if (ps.houses === 5) {
          this.dynamic.add(this.building(inX, bandY, inZ, true, f));
        } else {
          for (let k = 0; k < ps.houses; k++) {
            const t = (k - (ps.houses - 1) / 2) * 0.22;
            this.dynamic.add(this.building(inX + f.along[0] * t, bandY, inZ + f.along[1] * t, false, f));
          }
        }
      }
      if (ps.mortgaged) {
        const cover = new THREE.Mesh(new THREE.PlaneGeometry(r.w - 0.08, r.d - 0.08), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.55, depthWrite: false }));
        cover.rotation.x = -Math.PI / 2; cover.position.set(cx, BOARD_Y + 0.003, cz);
        const band = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(r.w, r.d) * 0.9, 0.16), new THREE.MeshBasicMaterial({ color: 0xd9413a, depthWrite: false }));
        band.rotation.x = -Math.PI / 2; band.rotation.z = -0.5; band.position.set(cx, BOARD_Y + 0.0045, cz);
        this.dynamic.add(cover, band);
      }
    }
    const cur = state.players[state.currentPlayer];
    if (cur) {
      const mine = cur.id === this.viewer;
      this.bannerWho.textContent = mine ? 'Your' : cur.name;
      (this.banner.lastChild as HTMLElement).textContent = mine ? ' turn' : "'s turn";
      this.banner.style.setProperty('--who', cur.color); (this.ring.material as THREE.MeshBasicMaterial).color.set(cur.color);
    }
    if (cur && cur.id !== this.followId) { this.followId = cur.id; this.updateCamLabel(); }
    this.focusSpace = state.phase === 'auction' && state.auction ? state.auction.space : null;
    if (state.phase === 'ended' && state.winner) {
      const w = byId.get(state.winner);
      const mine = state.winner === this.viewer;
      this.bannerWho.textContent = mine ? 'You' : (w?.name ?? '');
      (this.banner.lastChild as HTMLElement).textContent = mine ? ' win!' : ' wins!';
      this.ring.visible = false;
      if (this.camMode === 'follow') this.setMode('overview');
    } else this.ring.visible = !!cur;
    this.pot.classList.toggle('hidden', !state.config.freeParkingJackpot);
    this.pot.textContent = `${T.freeParking} pot: ${money(state.freeParkingPot)}`;
    for (const p of state.players) this.tokens.get(p.id)?.setBankrupt(p.bankrupt);
    this.updateRing();
  }

  private building(x: number, y: number, z: number, hotel: boolean, f: { along: [number, number]; inward: [number, number] }): THREE.Group {
    const g = new THREE.Group();
    if (themed()) {
      const canvas = hotel ? (spriteCanvas('hotel', 1) ?? spriteCanvas('castle_small', 1)) : (spriteCanvas('house', 1) ?? stackCanvas(['mushroom_top', 'mushroom_stem'], 1));
      if (canvas) {
        const { geometry, texture } = pixelCutout(canvas, 0.05);
        const face = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, [face, new THREE.MeshLambertMaterial({ color: INK })]);
        const hgt = hotel ? 0.5 : 0.3;
        mesh.scale.set(hgt, hgt, 1);
        mesh.castShadow = true;
        mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 });
        g.add(mesh);
        g.position.set(x, y, z);
        g.rotation.y = Math.atan2(-f.inward[0], -f.inward[1]); // faces off the board, like the standees
        return g;
      }
    }
    const w = hotel ? 0.36 : 0.17, hgt = hotel ? 0.2 : 0.13, dpt = hotel ? 0.2 : 0.17;
    const color = hotel ? '#d9413a' : '#3aa655';
    const roofColor = hotel ? '#a8302b' : '#2c7f41';
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, dpt), new THREE.MeshLambertMaterial({ color }));
    base.position.y = hgt / 2; base.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, dpt) * 0.72, hgt * 0.8, 4), new THREE.MeshLambertMaterial({ color: roofColor }));
    roof.position.y = hgt + hgt * 0.4; roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, dpt), 1, dpt / Math.max(w, dpt)); roof.castShadow = true;
    const outline = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, dpt), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    outline.position.y = hgt / 2; outline.scale.set(1.18, 1.12, 1.18);
    g.add(outline, base, roof);
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(f.along[0], f.along[1]);
    return g;
  }

  /**
   * Where the n-th standee on a space stands: two abreast along the edge, rows from the
   * outer edge inward (a corner fits three abreast). Jailed tokens use the inner cell.
   */
  private slotPosition(index: number, slot: number, jailed: boolean): THREE.Vector3 {
    const [cx, cz] = spaceCenter(index);
    const f = frame(index);
    const corner = index % 10 === 0;
    const cols = corner ? 3 : 2;
    const pitch = TOKEN * 0.86;
    const col = slot % cols, row = Math.floor(slot / cols);
    const along = (col - (cols - 1) / 2) * pitch;
    // depth: positive = toward the outer edge; front row sits near the outer edge, next rows step inward
    let depth = (corner ? 0.55 : 0.5) - row * 0.42;
    let alongShift = 0;
    if (corner && index === 10) { depth = jailed ? -0.45 : 0.55; alongShift = jailed ? 0.45 : 0; }
    const x = cx + f.along[0] * (along + alongShift) - f.inward[0] * depth;
    const z = cz + f.along[1] * (along + alongShift) - f.inward[1] * depth;
    return new THREE.Vector3(x, BOARD_Y, z);
  }

  /** Heading that points the standee's shown side at the camera (its back when flipped). */
  private headingFor(tok: TokenObj): number {
    const p = tok.group.position;
    return Math.atan2(this.camPos.x - p.x, this.camPos.z - p.z) + (tok.facing < 0 ? Math.PI : 0);
  }

  /** Which way (screen right = 1, screen left = -1) a move in world direction (dx, dz) goes as seen from the camera. */
  private facingFor(dx: number, dz: number, tok: TokenObj): number {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const rightX = -dir.z, rightZ = dir.x; // camera's right, flattened onto the board
    const dot = dx * rightX + dz * rightZ;
    if (Math.abs(dot) < 0.05) return tok.facing;
    return dot >= 0 ? 1 : -1;
  }

  private slotsAt(index: number, state: GameState): string[] {
    return state.players.filter((p) => !p.bankrupt && (this.tokenPos.get(p.id) ?? p.position) === index).map((p) => p.id);
  }

  placeTokens(state: GameState, animate: boolean): void {
    for (const p of state.players) this.tokenPos.set(p.id, p.position);
    for (const p of state.players) {
      const tok = this.tokens.get(p.id);
      if (!tok) continue;
      const slots = this.slotsAt(p.position, state);
      const target = this.slotPosition(p.position, Math.max(0, slots.indexOf(p.id)), p.inJail);
      if (animate) this.tweenTo(tok, target, 250, false);
      else { tok.group.position.copy(target); tok.snapYaw(this.headingFor(tok)); }
    }
    this.updateRing();
  }

  private updateRing(): void {
    const s = this.state; if (!s) return;
    const cur = s.players[s.currentPlayer];
    const tok = cur ? this.tokens.get(cur.id) : undefined;
    if (tok) this.ring.position.set(tok.group.position.x, BOARD_Y + 0.006, tok.group.position.z);
  }

  private tweenTo(tok: TokenObj, target: THREE.Vector3, ms: number, hop: boolean): Promise<void> {
    return new Promise((resolveOuter) => {
      const resolve = () => { this.busyTokens.delete(tok); resolveOuter(); };
      this.busyTokens.add(tok);
      const from = tok.group.position.clone();
      if (hop) tok.walkStep++;
      const side = tok.walkStep % 2 === 0 ? 1 : -1;
      this.tweens.push(timed(ms, (t) => {
        const k = easeInOut(t);
        tok.group.position.lerpVectors(from, target, k);
        const lift = hop ? Math.sin(t * Math.PI) * 0.42 : 0;
        tok.applyPose(lift, hop ? Math.sin(t * Math.PI) * 0.14 * side : 0, performance.now(), hop ? t : null);
        const sh = tok.shadow.scale; const shrink = hop ? 1 - Math.sin(t * Math.PI) * 0.35 : 1; sh.set(1.25 * shrink, 0.7 * shrink, 1);
      }, () => { if (hop) tok.squash = 1; resolve(); }));
    });
  }

  /** Turning around is a paper flip: the render loop sees the new heading and rotates the cutout over. */
  private setFacing(tok: TokenObj, facing: number): void { tok.facing = facing; }

  async moveToken(playerId: string, from: number, to: number, opts: { direct?: boolean; backward?: boolean }, state: GameState): Promise<void> {
    const tok = this.tokens.get(playerId);
    if (!tok) return;
    const player = state.players.find((p) => p.id === playerId);
    if (opts.direct) {
      this.tokenPos.set(playerId, to);
      const slot = Math.max(0, this.slotsAt(to, state).indexOf(playerId));
      const target = this.slotPosition(to, slot, to === 10 ? true : !!player?.inJail);
      const d = target.clone().sub(tok.group.position);
      this.setFacing(tok, this.facingFor(d.x, d.z, tok));
      // one big leap
      const startPos = tok.group.position.clone();
      this.busyTokens.add(tok);
      await new Promise<void>((resolve) => this.tweens.push(timed(dur(650), (t) => {
        const k = easeInOut(t);
        tok.group.position.lerpVectors(startPos, target, k);
        tok.applyPose(Math.sin(t * Math.PI) * 1.6, Math.sin(t * Math.PI * 2) * 0.2, performance.now(), t);
      }, () => { tok.squash = 1; this.busyTokens.delete(tok); resolve(); })));
      this.flash(to);
      this.updateRing();
      return;
    }
    const backward = opts.backward ?? ((from - to + 40) % 40 === 3);
    const steps = backward ? (from - to + 40) % 40 : (to - from + 40) % 40;
    const stepMs = dur(steps > 12 ? 110 : 190);
    let pos = from;
    for (let s = 0; s < steps; s++) {
      pos = backward ? (pos + 39) % 40 : (pos + 1) % 40;
      this.tokenPos.set(playerId, pos);
      const slot = pos === to ? Math.max(0, this.slotsAt(pos, state).indexOf(playerId)) : 0;
      const target = this.slotPosition(pos, slot, false);
      const d = target.clone().sub(tok.group.position);
      this.setFacing(tok, this.facingFor(d.x, d.z, tok));
      sfx.step();
      await this.tweenTo(tok, target, stepMs, true);
    }
    this.placeTokens({ ...state, players: state.players.map((p) => (p.id === playerId ? { ...p, position: to } : { ...p, position: this.tokenPos.get(p.id) ?? p.position })) }, true);
    this.flash(to);
  }

  flash(index: number): void {
    const r = spaceRect(index);
    this.flashMesh.scale.set(r.w - 0.06, r.d - 0.06, 1);
    this.flashMesh.position.set(r.x + r.w / 2, BOARD_Y + 0.005, r.z + r.d / 2);
    this.flashMesh.visible = true;
    const m = this.flashMesh.material as THREE.MeshBasicMaterial;
    this.tweens.push(timed(900, (t) => { m.opacity = 0.7 * (1 - easeOut(t)); }, () => { this.flashMesh.visible = false; }));
  }

  highlight(index: number | null): void {
    if (index === null) { this.select.visible = false; return; }
    const r = spaceRect(index);
    this.select.scale.set(r.w - 0.06, r.d - 0.06, 1);
    this.select.position.set(r.x + r.w / 2, BOARD_Y + 0.0045, r.z + r.d / 2);
    this.select.visible = true;
  }

  async showDice(dice: [number, number], animate: boolean): Promise<void> {
    const yaws = [0.3 + Math.random() * 0.6, -0.4 - Math.random() * 0.6];
    if (!animate) {
      this.dice.forEach((d, i) => { d.position.set(i === 0 ? -0.5 : 0.5, BOARD_Y + 0.31, 1.3); this.setDieFace(d, dice[i], yaws[i]); });
      return;
    }
    // Throw from the side of the player on turn, toward the middle of the board.
    const tok = this.followId ? this.tokens.get(this.followId) : undefined;
    const from2 = tok ? new THREE.Vector2(tok.group.position.x, tok.group.position.z) : new THREE.Vector2(0, HALF);
    if (from2.lengthSq() < 0.01) from2.set(0, 1);
    const dir = from2.clone().normalize(); // center → thrower
    const side = new THREE.Vector2(-dir.y, dir.x);
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const launch = dir.clone().multiplyScalar(3.7 * K);
    const speed = rnd(3.2, 4.6);
    const start = [0, 1].map((i) => { const o = side.clone().multiplyScalar(i === 0 ? -0.36 : 0.36); return [launch.x + o.x, BOARD_Y + rnd(1.5, 2.1), launch.y + o.y] as [number, number, number]; });
    const velocity = [0, 1].map(() => { const lat = side.clone().multiplyScalar(rnd(-1.2, 1.2)); return [-dir.x * speed + lat.x, rnd(1.2, 2.4), -dir.y * speed + lat.y] as [number, number, number]; });
    const angular = [0, 1].map(() => [rnd(-16, 16), rnd(-16, 16), rnd(-16, 16)] as [number, number, number]);
    const half = 0.31;
    const result = simulateThrow({
      start, velocity, angular, groundY: BOARD_Y, halfSize: half,
      bounds: { minX: -4.1 * K, maxX: 4.1 * K, minZ: -4.1 * K, maxZ: 4.1 * K },
      obstacles: [{ x: -2.7 * K, y: BOARD_Y + 0.045, z: 0.2, w: 1.5, h: 0.09, d: 1.0, rotY: -0.12 }, { x: 2.7 * K, y: BOARD_Y + 0.045, z: 0.2, w: 1.5, h: 0.09, d: 1.0, rotY: 0.09 }],
    });
    // Pips: the face that lands on top shows the rolled value.
    if (this.dieTextures.length === 6) {
      this.dice.forEach((d, i) => {
        const faces = faceNumbers(result.topAxis[i], dice[i]);
        const old = d.material as THREE.Material[] | THREE.Material;
        d.material = faces.map((n) => new THREE.MeshLambertMaterial({ map: this.dieTextures[n - 1] }));
        if (Array.isArray(old)) old.forEach((m) => m.dispose()); else old.dispose();
      });
    }
    // Camera: watch where they land, from the thrower's side.
    const last = result.frames.map((f) => f[f.length - 1].pos);
    const c = new THREE.Vector3((last[0][0] + last[1][0]) / 2, BOARD_Y + 0.3, (last[0][2] + last[1][2]) / 2);
    this.diceFocusPose = { pos: new THREE.Vector3(c.x + dir.x * 3.4, BOARD_Y + 2.9, c.z + dir.y * 3.4), look: c };
    const timeScale = Math.max(1, result.duration / 1.9);
    const playMs = dur((result.duration / timeScale) * 1000);
    if (this.camMode === 'follow') this.diceFocusUntil = performance.now() + playMs + 350;
    sfx.dice();
    let nextImpact = 0;
    const pos = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
    await new Promise<void>((resolve) => this.tweens.push(timed(playMs, (t) => {
      const simT = t * result.duration;
      const f = simT / result.dt;
      const i0 = Math.min(result.frames[0].length - 1, Math.floor(f));
      const i1 = Math.min(result.frames[0].length - 1, i0 + 1);
      const k = f - i0;
      this.dice.forEach((d, i) => {
        const a = result.frames[i][i0], b = result.frames[i][i1];
        pos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k, a.pos[2] + (b.pos[2] - a.pos[2]) * k);
        d.position.copy(pos);
        qa.set(a.quat[0], a.quat[1], a.quat[2], a.quat[3]); qb.set(b.quat[0], b.quat[1], b.quat[2], b.quat[3]);
        d.quaternion.copy(qa.slerp(qb, k));
      });
      while (nextImpact < result.impacts.length && result.impacts[nextImpact].t <= simT) { sfx.knock(result.impacts[nextImpact].strength); nextImpact++; }
    }, resolve)));
    // Settle exactly flat.
    const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
    const snaps = this.dice.map((d, i) => {
      const up = AX[result.topAxis[i]].clone().applyQuaternion(d.quaternion);
      const fix = new THREE.Quaternion().setFromUnitVectors(up.normalize(), new THREE.Vector3(0, 1, 0));
      return { from: d.quaternion.clone(), to: fix.multiply(d.quaternion), y0: d.position.y };
    });
    await new Promise<void>((resolve) => this.tweens.push(timed(140, (t) => {
      this.dice.forEach((d, i) => { d.quaternion.slerpQuaternions(snaps[i].from, snaps[i].to, t); d.position.y = snaps[i].y0 + (BOARD_Y + half - snaps[i].y0) * t; });
    }, resolve)));
  }

  drawCard(deck: 'chance' | 'chest', text?: string): void {
    const x = (deck === 'chance' ? -2.7 : 2.7) * K;
    const color = this.deckColor(deck);
    // Card face: header + wrapped text
    const c = document.createElement('canvas'); c.width = 512; c.height = 336;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, 512, 336);
    ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 78);
    ctx.lineWidth = 12; ctx.strokeStyle = INK; roundRect(ctx, 6, 6, 500, 324, 26); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(0, 74, 512, 6);
    ctx.font = themed() ? `26px ${pixelFont()}` : `700 34px ${fontStack()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(deckName(deck).toUpperCase(), 256, 40);
    if (text) {
      ctx.font = `500 30px ${fontStack()}`;
      const lines = wrapText(ctx, text, 440);
      lines.slice(0, 5).forEach((l, i) => ctx.fillText(l, 256, 130 + i * 40 - (Math.min(lines.length, 5) - 1) * 20 + 60));
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mats = [new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ color }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK })];
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.985), mats);
    card.castShadow = true;
    // World phase: lift off the deck and flip
    card.position.set(x, BOARD_Y + 0.12, 0.2);
    this.scene.add(card);
    const lift = dur(700);
    const hold = text ? dur(2600) : dur(500);
    const camCard = new THREE.Group();
    this.tweens.push(timed(lift, (t) => {
      card.position.y = BOARD_Y + 0.12 + easeOut(t) * 1.6;
      card.rotation.z = t * Math.PI * (deck === 'chance' ? 1 : -1);
      card.rotation.y = t * 0.5;
    }, () => {
      // Camera phase: the card comes up in front of the viewer and stays readable
      this.scene.remove(card);
      card.position.set(0, -0.12, -2.4);
      card.rotation.set(Math.PI / 2 + 0.08, 0, 0);
      card.scale.setScalar(0.62);
      camCard.add(card);
      this.camera.add(camCard);
      this.tweens.push(timed(hold, (t) => {
        const inK = Math.min(1, t * 6);
        camCard.position.y = (1 - easeOut(inK)) * -0.9;
        card.rotation.z = Math.sin(t * 6) * 0.03 * (1 - t);
        if (t > 0.85) { const k = (t - 0.85) / 0.15; camCard.position.y = -easeInOut(k) * 1.4; }
      }, () => { this.camera.remove(camCard); tex.dispose(); mats.forEach((m) => m.dispose()); }));
    }));
  }

  /** Winner's moment: the camera circles their token under a spotlight while paper confetti falls. */
  celebrate(winnerId: string): void {
    const tok = this.tokens.get(winnerId);
    if (!tok) return;
    this.victoryId = winnerId;
    this.victoryStart = performance.now();
    this.setMode('victory');
    const p = tok.group.position;
    const spot = new THREE.SpotLight(0xfff0c0, 60, 14 * K, Math.PI / 8, 0.45, 1.3);
    spot.position.set(p.x + 1.5, BOARD_Y + 6, p.z + 1.5);
    spot.target.position.set(p.x, BOARD_Y, p.z);
    spot.castShadow = false;
    this.scene.add(spot, spot.target);
    this.spot = spot;
    // Confetti
    const colors = ['#d9413a', '#2f7fd6', '#f2c94c', '#3aa655', '#e56aa3', '#8e5bd1', '#fffaf0'];
    const group = new THREE.Group();
    const bits: { m: THREE.Mesh; vx: number; vz: number; vr: number; y0: number; phase: number }[] = [];
    for (let i = 0; i < 140; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.2), new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }));
      const ang = Math.random() * Math.PI * 2, r = Math.random() * 2.6;
      m.position.set(p.x + Math.cos(ang) * r, BOARD_Y + 3.5 + Math.random() * 3.5, p.z + Math.sin(ang) * r);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      group.add(m);
      bits.push({ m, vx: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.4, vr: 2 + Math.random() * 4, y0: m.position.y, phase: Math.random() * 6 });
    }
    this.scene.add(group);
    const fallMs = 6500;
    this.tweens.push(timed(fallMs, (t, dt) => {
      const sec = dt / 1000;
      for (const b of bits) {
        b.m.position.y -= 1.1 * sec;
        b.m.position.x += (b.vx + Math.sin(t * 20 + b.phase) * 0.3) * sec;
        b.m.position.z += (b.vz + Math.cos(t * 17 + b.phase) * 0.3) * sec;
        b.m.rotation.x += b.vr * sec; b.m.rotation.z += b.vr * 0.6 * sec;
        if (b.m.position.y < BOARD_Y + 0.02) b.m.position.y = BOARD_Y + 0.02;
      }
    }, () => { this.scene.remove(group); bits.forEach((b) => { b.m.geometry.dispose(); (b.m.material as THREE.Material).dispose(); }); }));
  }

  // ---------- interaction ----------

  private pick(e: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.pickPlane, hit)) return null;
    return indexAt(hit.x, hit.z);
  }

  private onPointerMove(e: PointerEvent): void {
    const idx = this.pick(e);
    const ownable = idx !== null && this.state ? ['property', 'railroad', 'utility'].includes(this.state.board[idx].type) : false;
    this.canvas.style.cursor = ownable ? 'pointer' : '';
    if (idx === null || !ownable) { this.hover.visible = false; return; }
    const r = spaceRect(idx);
    this.hover.scale.set(r.w - 0.06, r.d - 0.06, 1);
    this.hover.position.set(r.x + r.w / 2, BOARD_Y + 0.004, r.z + r.d / 2);
    this.hover.visible = true;
  }

  private onPointerUp(e: PointerEvent): void {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const idx = this.pick(e);
    if (idx !== null) this.onSpaceClick(idx);
  }

  // ---------- loop ----------

  private loop = (): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(400, now - this.last);
    this.last = now;
    this.updateCamera(now, dt);
    for (let i = this.tweens.length - 1; i >= 0; i--) if (!this.tweens[i].update(now, dt)) this.tweens.splice(i, 1);
    // Paper cutouts face the camera (billboards on a vertical axis), flipping over when they have to turn far
    for (const tok of this.tokens.values()) {
      tok.turnToward(this.headingFor(tok), now, dt);
      if (tok.squash > 0) tok.squash = Math.max(0, tok.squash - dt / 260);
      // idle pose only when no tween is driving this token (tweens call applyPose themselves)
      if (!this.busyTokens.has(tok)) tok.applyPose(0, 0, now);
    }
    for (const p of this.props) { p.turnToward(Math.atan2(this.camPos.x - p.group.position.x, this.camPos.z - p.group.position.z), now, dt); p.bob(now); p.animate(now); }
    const pulse = 1 + Math.sin(now / 350) * 0.08;
    this.ring.scale.set(pulse, pulse, 1);
    this.renderer.render(this.scene, this.camera);
  };

  destroy(): void {
    this.destroyed = true;
    this.stopAmbient();
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.wrap.remove();
  }
}

function clear3(group: THREE.Group): void {
  while (group.children.length) {
    const c = group.children[group.children.length - 1];
    group.remove(c);
    c.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mat = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); });
  }
}

/** True when WebGL is available in this browser. */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

void GROUP_COLORS; void LIGHT_GROUPS; void clear; void sleep;
