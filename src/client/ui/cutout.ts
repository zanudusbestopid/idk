// Turns a token's SVG art into a thin extruded paper cutout: the silhouette is
// traced from the rasterized alpha, simplified, and extruded a hair's breadth so
// the sprite has a visible paper edge from the side.
import * as THREE from 'three';

const SIZE = 128;
const cache = new Map<string, Promise<{ geometry: THREE.ExtrudeGeometry; texture: THREE.CanvasTexture }>>();

function loadImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('svg failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/** Moore-neighbour boundary trace of the first opaque blob found (tokens are one connected sticker). */
function traceContour(mask: Uint8Array, w: number, h: number): [number, number][] {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y)) { sx = x; sy = y; break outer; }
  if (sx < 0) return [];
  const dirs: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts: [number, number][] = [];
  let x = sx, y = sy, dir = 6; // came from above
  const maxSteps = w * h * 4;
  for (let i = 0; i < maxSteps; i++) {
    pts.push([x, y]);
    let found = false;
    for (let k = 0; k < 8; k++) {
      const d = (dir + 6 + k) % 8; // start looking to the left of the direction we came from
      const nx = x + dirs[d][0], ny = y + dirs[d][1];
      if (at(nx, ny)) { x = nx; y = ny; dir = d; found = true; break; }
    }
    if (!found) break;
    if (x === sx && y === sy && pts.length > 2) break;
  }
  return pts;
}

function simplify(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 4) return pts;
  const dist = (p: [number, number], a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  const rdp = (list: [number, number][]): [number, number][] => {
    if (list.length < 3) return list;
    let maxD = 0, idx = 0;
    for (let i = 1; i < list.length - 1; i++) { const d = dist(list[i], list[0], list[list.length - 1]); if (d > maxD) { maxD = d; idx = i; } }
    if (maxD > eps) { const a = rdp(list.slice(0, idx + 1)); const b = rdp(list.slice(idx)); return a.slice(0, -1).concat(b); }
    return [list[0], list[list.length - 1]];
  };
  return rdp(pts);
}

/** Geometry (unit square footprint, extruded along +z) and texture for a token's art. */
export function cutoutFor(svg: string, depth = 0.045): Promise<{ geometry: THREE.ExtrudeGeometry; texture: THREE.CanvasTexture }> {
  const key = svg + depth;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const img = await loadImage(svg);
      const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const mask = new Uint8Array(SIZE * SIZE);
      for (let i = 0; i < SIZE * SIZE; i++) mask[i] = data[i * 4 + 3] > 40 ? 1 : 0;
      // dilate one pixel so the outline is not clipped
      const dil = new Uint8Array(mask);
      for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) if (mask[y * SIZE + x]) { dil[y * SIZE + x - 1] = 1; dil[y * SIZE + x + 1] = 1; dil[(y - 1) * SIZE + x] = 1; dil[(y + 1) * SIZE + x] = 1; }
      const contour = simplify(traceContour(dil, SIZE, SIZE), 1.1);
      let shape: THREE.Shape;
      if (contour.length >= 3) {
        shape = new THREE.Shape(contour.map(([x, y]) => new THREE.Vector2((x + 0.5) / SIZE, 1 - (y + 0.5) / SIZE)));
      } else {
        shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)]);
      }
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
      geometry.translate(-0.5, 0, -depth / 2); // centered horizontally, standing on y=0, centered in depth
      // high-res texture for the faces
      const tc = document.createElement('canvas'); tc.width = 512; tc.height = 512;
      tc.getContext('2d')!.drawImage(img, 0, 0, 512, 512);
      const texture = new THREE.CanvasTexture(tc);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return { geometry, texture };
    })();
    cache.set(key, p);
  }
  return p;
}

// ---------- pixel-art cutouts ----------

const pixelCache = new Map<HTMLCanvasElement, { geometry: THREE.ExtrudeGeometry; texture: THREE.CanvasTexture }>();

/** Boundary loops of a binary mask along pixel edges (blocky, no smoothing). Loops are counterclockwise for solids. */
function pixelLoops(mask: Uint8Array, w: number, h: number): [number, number][][] {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  // Directed edges around opaque cells, oriented so the solid is on the left (counterclockwise in y-up terms).
  const edges = new Map<string, [number, number, number, number]>();
  const key = (x: number, y: number) => `${x},${y}`;
  const starts = new Map<string, [number, number, number, number][]>();
  const add = (x0: number, y0: number, x1: number, y1: number) => {
    const e: [number, number, number, number] = [x0, y0, x1, y1];
    edges.set(`${x0},${y0}>${x1},${y1}`, e);
    const k = key(x0, y0);
    if (!starts.has(k)) starts.set(k, []);
    starts.get(k)!.push(e);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y)) continue;
    // canvas coordinates: y grows downward. Solid on the left when walking these directions:
    if (!at(x, y - 1)) add(x, y, x + 1, y);         // top edge, walk right
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1); // right edge, walk down
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1); // bottom edge, walk left
    if (!at(x - 1, y)) add(x, y + 1, x, y);         // left edge, walk up
  }
  const loops: [number, number][][] = [];
  const used = new Set<string>();
  for (const [k, e] of edges) {
    if (used.has(k)) continue;
    const loop: [number, number][] = [];
    let cur = e;
    let guard = 0;
    while (cur && guard++ < 100000) {
      const ck = `${cur[0]},${cur[1]}>${cur[2]},${cur[3]}`;
      if (used.has(ck)) break;
      used.add(ck);
      loop.push([cur[0], cur[1]]);
      const nexts = (starts.get(key(cur[2], cur[3])) ?? []).filter((n) => !used.has(`${n[0]},${n[1]}>${n[2]},${n[3]}`));
      if (nexts.length === 0) break;
      // At a pixel corner where two solids touch diagonally, prefer turning right (keeps loops separate).
      let pick = nexts[0];
      if (nexts.length > 1) {
        const dx = cur[2] - cur[0], dy = cur[3] - cur[1];
        pick = nexts.find((n) => (n[2] - n[0]) === dy && (n[3] - n[1]) === -dx) ?? nexts[0];
      }
      cur = pick;
    }
    if (loop.length >= 4) loops.push(simplifyCollinear(loop));
  }
  return loops;
}

function simplifyCollinear(pts: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross !== 0) out.push(b);
  }
  return out.length >= 3 ? out : pts;
}

/** Even-odd point-in-polygon test on a pixel-edge loop (the point is a loop vertex, so nudge it inward first). */
function pointInLoop(pt: [number, number], loop: [number, number][]): boolean {
  const x = pt[0] + 0.5, y = pt[1] + 0.5;
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i], [xj, yj] = loop[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function signedArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}

/**
 * Extruded slab for a small pixel-art canvas: the outline follows the pixel edges exactly.
 * Geometry spans x in [-0.5, 0.5] × (w/h) ... no: x in [-w/(2h), w/(2h)], y in [0, 1] (height 1), depth centered.
 */
export function pixelCutout(canvas: HTMLCanvasElement, depth = 0.045): { geometry: THREE.ExtrudeGeometry; texture: THREE.CanvasTexture } {
  const hit = pixelCache.get(canvas);
  if (hit) return hit;
  const w = canvas.width, h = canvas.height;
  const data = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 40 ? 1 : 0;
  // Bridge diagonal-only touches so the polygon stays simple.
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const a = mask[y * w + x], b = mask[y * w + x + 1], c = mask[(y + 1) * w + x], d = mask[(y + 1) * w + x + 1];
    if (a && d && !b && !c) mask[y * w + x + 1] = 1;
    if (b && c && !a && !d) mask[y * w + x] = 1;
  }
  const loops = pixelLoops(mask, w, h);
  // canvas px → shape coords: x in [0, w/h], y flipped to [0, 1]
  const toV = (p: [number, number]) => new THREE.Vector2(p[0] / h, 1 - p[1] / h);
  // Solid loops and hole loops wind in opposite directions; every island becomes its own shape,
  // and each hole goes to the smallest island that contains it.
  const areas = loops.map((l) => signedArea(l.map((p) => [p[0], -p[1]] as [number, number])));
  let biggest = 0;
  for (let i = 1; i < loops.length; i++) if (Math.abs(areas[i]) > Math.abs(areas[biggest])) biggest = i;
  const solidSign = loops.length ? Math.sign(areas[biggest]) : 1;
  const shapes: THREE.Shape[] = [];
  const solids: { loop: [number, number][]; area: number; shape: THREE.Shape }[] = [];
  loops.forEach((l, i) => {
    if (Math.sign(areas[i]) !== solidSign) return;
    const shape = new THREE.Shape(l.map(toV));
    solids.push({ loop: l, area: Math.abs(areas[i]), shape });
    shapes.push(shape);
  });
  loops.forEach((l, i) => {
    if (Math.sign(areas[i]) === solidSign) return;
    const p = l[0];
    let host: (typeof solids)[number] | null = null;
    for (const s of solids) if (pointInLoop(p, s.loop) && (!host || s.area < host.area)) host = s;
    if (host) host.shape.holes.push(new THREE.Path(l.map(toV)));
  });
  const shape: THREE.Shape | THREE.Shape[] = shapes.length
    ? shapes
    : new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(w / h, 0), new THREE.Vector2(w / h, 1), new THREE.Vector2(0, 1)]);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  // UVs: ExtrudeGeometry maps front/back UVs to shape x,y; our x runs 0..w/h so rescale u to 0..1
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) / (w / h));
  uv.needsUpdate = true;
  geometry.translate(-w / (2 * h), 0, -depth / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  const out = { geometry, texture };
  pixelCache.set(canvas, out);
  return out;
}
