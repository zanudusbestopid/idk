/**
 * mulberry32: a tiny deterministic 32-bit PRNG. The whole generator state is a
 * single int32, stored in `GameState.rng`, so games are fully reproducible from
 * their seed and the engine never touches Math.random.
 */

/** Advance the generator once. `value` is in [0, 1). */
export function next(state: number): { value: number; state: number } {
  const a = (state + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

/** Roll one six-sided die (1..6). */
export function rollDie(state: number): { die: number; state: number } {
  const r = next(state);
  return { die: Math.floor(r.value * 6) + 1, state: r.state };
}

/** Roll two dice, first die first. */
export function rollDice(state: number): { dice: [number, number]; state: number } {
  const a = rollDie(state);
  const b = rollDie(a.state);
  return { dice: [a.die, b.die], state: b.state };
}

/** Fisher-Yates shuffle. Returns a new array; the input is not modified. */
export function shuffle<T>(arr: readonly T[], state: number): { result: T[]; state: number } {
  const result = arr.slice();
  let s = state;
  for (let i = result.length - 1; i > 0; i--) {
    const r = next(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return { result, state: s };
}
