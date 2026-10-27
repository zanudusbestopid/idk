// Rigid-body dice throw. The whole throw is simulated up front (a few milliseconds
// of work), so the animation can be played back smoothly and the pips assigned so
// the faces that end up on top match the roll the rules engine already decided.

import * as CANNON from 'cannon-es';

export interface ThrowParams {
  start: [number, number, number][];
  velocity: [number, number, number][];
  angular: [number, number, number][];
  groundY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  obstacles: { x: number; y: number; z: number; w: number; h: number; d: number; rotY: number }[];
  halfSize: number;
}

export interface ThrowFrame { pos: [number, number, number]; quat: [number, number, number, number] }

export interface ThrowResult {
  dt: number;
  frames: ThrowFrame[][]; // per die
  impacts: { t: number; strength: number }[];
  topAxis: number[]; // per die: 0..5 = +x,-x,+y,-y,+z,-z (local axis pointing up at rest)
  duration: number;
}

const AXES = [
  new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(-1, 0, 0), new CANNON.Vec3(0, 1, 0),
  new CANNON.Vec3(0, -1, 0), new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, -1),
];

export function simulateThrow(p: ThrowParams): ThrowResult {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -24, 0) });
  world.allowSleep = true;
  const diceMat = new CANNON.Material('dice');
  const tableMat = new CANNON.Material('table');
  world.addContactMaterial(new CANNON.ContactMaterial(tableMat, diceMat, { friction: 0.55, restitution: 0.33 }));
  world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.25, restitution: 0.45 }));

  const ground = new CANNON.Body({ type: CANNON.Body.STATIC, material: tableMat });
  ground.addShape(new CANNON.Plane());
  ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  ground.position.set(0, p.groundY, 0);
  world.addBody(ground);

  const wall = (x: number, z: number, hx: number, hz: number) => {
    const b = new CANNON.Body({ type: CANNON.Body.STATIC, material: tableMat });
    b.addShape(new CANNON.Box(new CANNON.Vec3(hx, 3, hz)));
    b.position.set(x, p.groundY + 3, z);
    world.addBody(b);
  };
  const { minX, maxX, minZ, maxZ } = p.bounds;
  wall(minX - 0.5, (minZ + maxZ) / 2, 0.5, (maxZ - minZ) / 2 + 1);
  wall(maxX + 0.5, (minZ + maxZ) / 2, 0.5, (maxZ - minZ) / 2 + 1);
  wall((minX + maxX) / 2, minZ - 0.5, (maxX - minX) / 2 + 1, 0.5);
  wall((minX + maxX) / 2, maxZ + 0.5, (maxX - minX) / 2 + 1, 0.5);
  for (const o of p.obstacles) {
    const b = new CANNON.Body({ type: CANNON.Body.STATIC, material: tableMat });
    b.addShape(new CANNON.Box(new CANNON.Vec3(o.w / 2, o.h / 2, o.d / 2)));
    b.position.set(o.x, o.y, o.z);
    b.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), o.rotY);
    world.addBody(b);
  }

  const impacts: { t: number; strength: number }[] = [];
  let time = 0;
  const bodies = p.start.map((s, i) => {
    const b = new CANNON.Body({ mass: 1, material: diceMat, angularDamping: 0.45, linearDamping: 0.08, sleepSpeedLimit: 0.35, sleepTimeLimit: 0.25 });
    b.addShape(new CANNON.Box(new CANNON.Vec3(p.halfSize, p.halfSize, p.halfSize)));
    b.position.set(s[0], s[1], s[2]);
    b.velocity.set(p.velocity[i][0], p.velocity[i][1], p.velocity[i][2]);
    b.angularVelocity.set(p.angular[i][0], p.angular[i][1], p.angular[i][2]);
    b.addEventListener('collide', (e: { contact: CANNON.ContactEquation }) => {
      const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
      if (v > 1.0) impacts.push({ t: time, strength: Math.min(1, v / 9) });
    });
    world.addBody(b);
    return b;
  });

  const dt = 1 / 120;
  const frames: ThrowFrame[][] = bodies.map(() => []);
  const maxSteps = 120 * 4;
  for (let step = 0; step < maxSteps; step++) {
    world.step(dt);
    time += dt;
    bodies.forEach((b, i) => frames[i].push({ pos: [b.position.x, b.position.y, b.position.z], quat: [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w] }));
    if (step > 30 && bodies.every((b) => b.sleepState === CANNON.Body.SLEEPING)) break;
  }
  const topAxis = bodies.map((b) => {
    let best = 2, bestY = -Infinity;
    AXES.forEach((a, i) => { const w = b.quaternion.vmult(a); if (w.y > bestY) { bestY = w.y; best = i; } });
    return best;
  });
  return { dt, frames, impacts, topAxis, duration: frames[0].length * dt };
}

/**
 * Pip numbers for the six faces (+x,-x,+y,-y,+z,-z) so that `value` is on the
 * face whose local axis ended up pointing up; opposite faces always sum to 7.
 */
export function faceNumbers(topAxis: number, value: number): number[] {
  const faces = new Array<number>(6).fill(0);
  faces[topAxis] = value;
  faces[topAxis ^ 1] = 7 - value;
  const rest = [1, 2, 3, 4, 5, 6].filter((n) => n !== value && n !== 7 - value);
  const pairs = [[rest[0], 7 - rest[0]], [rest.find((n) => n !== rest[0] && n !== 7 - rest[0])!, 0]];
  pairs[1][1] = 7 - pairs[1][0];
  const otherPairs = [0, 2, 4].filter((a) => a !== (topAxis & ~1));
  faces[otherPairs[0]] = pairs[0][0]; faces[otherPairs[0] + 1] = pairs[0][1];
  faces[otherPairs[1]] = pairs[1][0]; faces[otherPairs[1] + 1] = pairs[1][1];
  return faces;
}
