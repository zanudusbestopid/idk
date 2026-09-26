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
