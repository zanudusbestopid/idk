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
import { cutoutFor } from './cutout.js';
import { dur } from '../settings.js';

const CORNER = 1.55;
const HALF = (2 * CORNER + 9) / 2; // 6.05
const TEX = 2048;
const S = TEX / (2 * HALF); // canvas px per world unit
const BOARD_Y = 0.12; // top surface height
const INK = '#2b2118';
const PAPER = '#fffaf0';

interface Rect { x: number; z: number; w: number; d: number }

/** World-space footprint of a space: x/z of the far-left corner, width along x, depth along z. */
export function spaceRect(i: number): Rect {
  if (i === 0) return { x: HALF - CORNER, z: HALF - CORNER, w: CORNER, d: CORNER };
  if (i < 10) return { x: HALF - CORNER - i, z: HALF - CORNER, w: 1, d: CORNER };
  if (i === 10) return { x: -HALF, z: HALF - CORNER, w: CORNER, d: CORNER };
  if (i < 20) return { x: -HALF, z: HALF - CORNER - (i - 10), w: CORNER, d: 1 };
  if (i === 20) return { x: -HALF, z: -HALF, w: CORNER, d: CORNER };
  if (i < 30) return { x: -HALF + CORNER + (i - 21), z: -HALF, w: 1, d: CORNER };
  if (i === 30) return { x: HALF - CORNER, z: -HALF, w: CORNER, d: CORNER };
  return { x: HALF - CORNER, z: -HALF + CORNER + (i - 31), w: CORNER, d: 1 };
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

const SLOT_OFFSETS: [number, number][] = [[0, 0], [-0.3, 0.12], [0.3, 0.12], [-0.3, -0.22], [0.3, -0.22], [0, 0.34], [0, -0.4], [0.32, 0.38]];

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

/** Shortest-path angular approach, with a time constant in ms. */
function approachAngle(current: number, target: number, dt: number, tau: number): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + d * (1 - Math.exp(-dt / tau));
}

/** Simple cubic ease-in-out. */
function easeInOut(t: number): number { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

class TokenObj {
  group = new THREE.Group();
  /** The cutout mesh (a plane until the extruded geometry is ready). */
  sprite: THREE.Mesh;
  shadow: THREE.Mesh;
  facing = 1;
  yaw = 0;        // current world heading of the cutout's face (radians about Y)
  targetYaw = 0;  // where it is turning toward
  baseY = BOARD_Y + 0.47;
  phase = Math.random() * 10;
  walkStep = 0;
  squash = 0; // 0..1 landing squash amount, decays
  private faceMat: THREE.MeshBasicMaterial;
  constructor(material: THREE.MeshBasicMaterial) {
    this.faceMat = material;
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), material);
    this.sprite.position.y = 0.47;
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: 0x2b2118, transparent: true, opacity: 0.3, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.012;
    this.shadow.scale.set(1.25, 0.7, 1);
    this.group.add(this.sprite, this.shadow);
  }
  /** Swap the flat plane for the extruded paper cutout. */
  useCutout(geometry: THREE.ExtrudeGeometry, texture: THREE.CanvasTexture): void {
    const old = this.sprite;
    this.faceMat.map = texture;
    this.faceMat.transparent = true;
    this.faceMat.alphaTest = 0.05;
    this.faceMat.side = THREE.DoubleSide;
    this.faceMat.needsUpdate = true;
    const edge = new THREE.MeshLambertMaterial({ color: INK });
    const mesh = new THREE.Mesh(geometry, [this.faceMat, edge]);
    mesh.scale.set(0.92, 0.92, 1);
    mesh.position.y = 0; // geometry stands on y=0
    mesh.castShadow = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 });
    this.group.remove(old);
    old.geometry.dispose();
    this.sprite = mesh;
    this.baseY = 0;
    this.group.add(mesh);
    this.applyPose(0, 0);
  }
  /** Procedural paper animation: breathing, waddle while walking, squash on landing. */
  applyPose(hop: number, tilt: number, now = performance.now()): void {
    const m = this.sprite;
    const breathe = 1 + Math.sin(now / 520 + this.phase) * 0.018;
    const sq = this.squash;
    const sy = breathe * (1 - sq * 0.22);
    const sx = (1 + sq * 0.18) * this.facing;
    m.scale.set(0.92 * sx, 0.92 * sy, 1);
    m.position.y = (this.sprite.geometry instanceof THREE.PlaneGeometry ? 0.47 : 0) + hop;
    m.rotation.z = tilt + Math.sin(now / 900 + this.phase) * 0.015;
  }
  setBankrupt(b: boolean): void { this.faceMat.opacity = b ? 0.35 : 1; this.faceMat.transparent = true; this.faceMat.color.setScalar(b ? 0.55 : 1); }
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
    this.scene.background = new THREE.Color('#7d4d22');
    this.scene.fog = new THREE.Fog('#7d4d22', 30, 60);

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
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    // Table
    const table = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: woodTexture() }));
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    this.scene.add(table);

    // Board: white sticker edge, ink body, paper top
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF + 0.5, 0.05, 2 * HALF + 0.5), new THREE.MeshLambertMaterial({ color: PAPER }));
    edge.position.y = 0.025; edge.castShadow = true; edge.receiveShadow = true;
    edge.rotation.y = -0.006;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF + 0.16, BOARD_Y - 0.05, 2 * HALF + 0.16), new THREE.MeshLambertMaterial({ color: INK }));
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
    this.scene.add(this.deck('CHANCE', '#ffe1b3', ICONS.chance, -2.7, 0.2, -0.12), this.deck('COMMUNITY CHEST', '#dff1fa', ICONS.chest, 2.7, 0.2, 0.09));

    // Highlights
    const mk = (color: number, opacity: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = BOARD_Y + 0.004; m.visible = false; this.scene.add(m); return m; };
    this.hover = mk(0x2f7fd6, 0.22);
    this.select = mk(0x2f7fd6, 0.35);
    this.flashMesh = mk(0xfff3a6, 0.7);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 40), new THREE.MeshBasicMaterial({ color: 0xd9413a, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = BOARD_Y + 0.006; this.ring.visible = false;
    this.scene.add(this.ring, this.dynamic);

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

  private deck(label: string, color: string, icon: string, x: number, z: number, rot: number): THREE.Group {
    const g = new THREE.Group();
    const c = document.createElement('canvas'); c.width = 512; c.height = 340;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 340);
    ctx.lineWidth = 14; ctx.strokeStyle = INK; roundRect(ctx, 7, 7, 498, 326, 30); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `700 54px ${fontStack()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = label.split(' ');
    lines.forEach((l, i) => ctx.fillText(l, 256, 250 + i * 54 - (lines.length - 1) * 27));
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    void svgImage(icon).then((img) => { ctx.drawImage(img, 196, 30, 120, 120); tex.needsUpdate = true; });
    const mat = [new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK }), new THREE.MeshLambertMaterial({ color: INK })];
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 1.0), mat);
    box.castShadow = true; box.position.y = BOARD_Y + 0.045;
    g.add(box);
    g.position.set(x, 0, z); g.rotation.y = rot;
    this.scene.add(g);
    return g;
  }

  private async loadDiceFaces(): Promise<void> {
    const faces = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => svgTexture(dieFace(n), 256)));
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
    ctx.fillText('PAPER', 14, 14); ctx.strokeText('PAPER', 0, 0); ctx.fillStyle = '#fbf3e0'; ctx.fillText('PAPER', 0, 0);
    ctx.font = `700 92px ${fontStack()}`;
    ctx.lineWidth = 10; ctx.fillStyle = '#d9413a';
    ctx.fillText('T Y C O O N', 8, 150); ctx.strokeText('T Y C O O N', 0, 142); ctx.fillStyle = '#fbf3e0'; ctx.fillText('T Y C O O N', 0, 142);
    ctx.restore();

    for (const space of state.board) this.drawSpace(ctx, space);
    this.boardTex.needsUpdate = true;
  }

  private drawSpace(ctx: CanvasRenderingContext2D, space: Space): void {
    const i = space.index;
    const r = spaceRect(i);
    const corner = i % 10 === 0;
    const cx = (r.x + r.w / 2 + HALF) * S;
    const cy = (r.z + r.d / 2 + HALF) * S;
    const angle = corner ? 0 : sideAngle(i);
    // local frame: width along the edge, depth toward the outer edge; inner edge at top
    const w = (corner ? CORNER : 1) * S;
    const d = (corner ? CORNER : CORNER) * S;
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
      tok.yaw = tok.targetYaw = this.yawFor(p.position);
      tok.group.rotation.y = tok.yaw;
      void cutoutFor(tokenSvg(p.token)).then(({ geometry, texture }) => { if (this.tokens.get(p.id) === tok) { tok.useCutout(geometry, texture); mat.visible = true; } }).catch(() => { void svgTexture(tokenSvg(p.token), 512).then((tex) => { mat.map = tex; mat.visible = true; mat.needsUpdate = true; }); });
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
      const a = 0.6 + t * 0.085, r = 12.5;
      return { pos: new THREE.Vector3(Math.sin(a) * r, 4.6, Math.cos(a) * r + 0.4), look: center };
    }
    if (t < 26) { // glide along the near row, street level
      const u = easeInOut((t - 16) / 10);
      const x = 5.6 - 11.2 * u;
      return { pos: new THREE.Vector3(x, 1.9, 8.4), look: new THREE.Vector3(x - 1.2, 0.3, 4.6) };
    }
    if (t < 34) { // push in over the middle
      const u = easeInOut((t - 26) / 8);
      return { pos: new THREE.Vector3(-3.2 + 4.6 * u, 7.6 - 2.8 * u, 6.8 - 3.4 * u), look: new THREE.Vector3(0.3, 0.2, -0.2) };
    }
    // high sweep back around
    const a = 3.9 + (t - 34) * 0.14, r = 14.5;
    return { pos: new THREE.Vector3(Math.sin(a) * r, 8.5, Math.cos(a) * r + 0.4), look: center };
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
    const pos = new THREE.Vector3(
      p.x + this.smoothOut.x * 4.0 * z - this.smoothTravel.x * 2.2 * z,
      BOARD_Y + 3.9 * z,
      p.z + this.smoothOut.y * 4.0 * z - this.smoothTravel.y * 2.2 * z,
    );
    const look = new THREE.Vector3(p.x + this.smoothTravel.x * 1.4 - this.smoothOut.x * 0.6, BOARD_Y + 0.3, p.z + this.smoothTravel.y * 1.4 - this.smoothOut.y * 0.6);
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
    this.pot.textContent = `Free Parking pot: $${state.freeParkingPot}`;
    for (const p of state.players) this.tokens.get(p.id)?.setBankrupt(p.bankrupt);
    this.updateRing();
  }

  private building(x: number, y: number, z: number, hotel: boolean, f: { along: [number, number] }): THREE.Group {
    const g = new THREE.Group();
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

  private slotPosition(index: number, slot: number, jailed: boolean): THREE.Vector3 {
    const [cx, cz] = spaceCenter(index);
    const f = frame(index);
    const corner = index % 10 === 0;
    const [ox, oy] = SLOT_OFFSETS[slot % SLOT_OFFSETS.length];
    // push toward the outer edge so the band stays visible; jailed tokens sit in the inner cell
    const depthShift = corner ? (jailed && index === 10 ? -0.35 : 0.05) : 0.22;
    const alongShift = corner && jailed && index === 10 ? 0.35 : 0;
    const x = cx + f.along[0] * (ox * 0.9 + alongShift) - f.inward[0] * (depthShift + oy * 0.5);
    const z = cz + f.along[1] * (ox * 0.9 + alongShift) - f.inward[1] * (depthShift + oy * 0.5);
    return new THREE.Vector3(x, BOARD_Y, z);
  }

  /** Heading for a standee on a space: its face points outward, off the board, on that side. */
  private yawFor(index: number): number {
    const { out } = this.spaceDirs(index);
    return Math.atan2(out.x, out.y);
  }

  /** In-plane facing (art looks right by default) for a move in world direction (dx, dz) while standing on `index`. */
  private facingFor(dx: number, dz: number, index: number, tok: TokenObj): number {
    const { out } = this.spaceDirs(index);
    const rightX = out.y, rightZ = -out.x; // viewer outside the board, looking in
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
      tok.targetYaw = this.yawFor(p.position);
      if (animate) this.tweenTo(tok, target, 250, false);
      else { tok.group.position.copy(target); tok.yaw = tok.targetYaw; tok.group.rotation.y = tok.yaw; }
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
        tok.applyPose(lift, hop ? Math.sin(t * Math.PI) * 0.14 * side : 0);
        const sh = tok.shadow.scale; const shrink = hop ? 1 - Math.sin(t * Math.PI) * 0.35 : 1; sh.set(1.25 * shrink, 0.7 * shrink, 1);
      }, () => { if (hop) tok.squash = 1; resolve(); }));
    });
  }

  private setFacing(tok: TokenObj, facing: number): void {
    if (tok.facing === facing) return;
    tok.facing = facing;
    const from = -facing;
    this.tweens.push(timed(160, (t) => { const f = from + (facing - from) * t; tok.sprite.scale.x = 0.92 * f; }));
  }

  async moveToken(playerId: string, from: number, to: number, opts: { direct?: boolean; backward?: boolean }, state: GameState): Promise<void> {
    const tok = this.tokens.get(playerId);
    if (!tok) return;
    const player = state.players.find((p) => p.id === playerId);
    if (opts.direct) {
      this.tokenPos.set(playerId, to);
      const slot = Math.max(0, this.slotsAt(to, state).indexOf(playerId));
      const target = this.slotPosition(to, slot, to === 10 ? true : !!player?.inJail);
      const d = target.clone().sub(tok.group.position);
      tok.targetYaw = this.yawFor(to);
      this.setFacing(tok, this.facingFor(d.x, d.z, to, tok));
      // one big leap
      const startPos = tok.group.position.clone();
      this.busyTokens.add(tok);
      await new Promise<void>((resolve) => this.tweens.push(timed(dur(650), (t) => {
        const k = easeInOut(t);
        tok.group.position.lerpVectors(startPos, target, k);
        tok.applyPose(Math.sin(t * Math.PI) * 1.6, Math.sin(t * Math.PI * 2) * 0.2);
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
      tok.targetYaw = this.yawFor(pos);
      this.setFacing(tok, this.facingFor(d.x, d.z, pos, tok));
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
    const launch = dir.clone().multiplyScalar(3.7);
    const speed = rnd(3.2, 4.6);
    const start = [0, 1].map((i) => { const o = side.clone().multiplyScalar(i === 0 ? -0.36 : 0.36); return [launch.x + o.x, BOARD_Y + rnd(1.5, 2.1), launch.y + o.y] as [number, number, number]; });
    const velocity = [0, 1].map(() => { const lat = side.clone().multiplyScalar(rnd(-1.2, 1.2)); return [-dir.x * speed + lat.x, rnd(1.2, 2.4), -dir.y * speed + lat.y] as [number, number, number]; });
    const angular = [0, 1].map(() => [rnd(-16, 16), rnd(-16, 16), rnd(-16, 16)] as [number, number, number]);
    const half = 0.31;
    const result = simulateThrow({
      start, velocity, angular, groundY: BOARD_Y, halfSize: half,
      bounds: { minX: -4.1, maxX: 4.1, minZ: -4.1, maxZ: 4.1 },
      obstacles: [{ x: -2.7, y: BOARD_Y + 0.045, z: 0.2, w: 1.5, h: 0.09, d: 1.0, rotY: -0.12 }, { x: 2.7, y: BOARD_Y + 0.045, z: 0.2, w: 1.5, h: 0.09, d: 1.0, rotY: 0.09 }],
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
    const x = deck === 'chance' ? -2.7 : 2.7;
    const color = deck === 'chance' ? '#ffe1b3' : '#dff1fa';
    // Card face: header + wrapped text
    const c = document.createElement('canvas'); c.width = 512; c.height = 336;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, 512, 336);
    ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 78);
    ctx.lineWidth = 12; ctx.strokeStyle = INK; roundRect(ctx, 6, 6, 500, 324, 26); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(0, 74, 512, 6);
    ctx.font = `700 34px ${fontStack()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(deck === 'chance' ? 'CHANCE' : 'COMMUNITY CHEST', 256, 40);
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
    const spot = new THREE.SpotLight(0xfff0c0, 60, 14, Math.PI / 8, 0.45, 1.3);
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
    // Paper cutouts always face the camera (turning only around the vertical axis)
    for (const tok of this.tokens.values()) {
      tok.yaw = approachAngle(tok.yaw, tok.targetYaw, dt, 140);
      tok.group.rotation.y = tok.yaw;
      if (tok.squash > 0) tok.squash = Math.max(0, tok.squash - dt / 260);
      // idle pose only when no tween is driving this token (tweens call applyPose themselves)
      if (!this.busyTokens.has(tok)) tok.applyPose(0, 0, now);
    }
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
