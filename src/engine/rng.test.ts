import { describe, expect, it } from 'vitest';
import { next, rollDice, rollDie, shuffle } from './rng';
import { _forceNextRoll } from './engine';
import { newGame } from './test-helpers';

describe('rng', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const seqA = [] as number[];
    const seqB = [] as number[];
    const seqC = [] as number[];
    let a = 123;
    let b = 123;
    let c = 124;
    for (let i = 0; i < 20; i++) {
      const ra = next(a);
      const rb = next(b);
      const rc = next(c);
      a = ra.state;
      b = rb.state;
      c = rc.state;
      seqA.push(ra.value);
      seqB.push(rb.value);
      seqC.push(rc.value);
    }
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('keeps the state a 32-bit integer', () => {
    let s = 7;
    for (let i = 0; i < 1000; i++) {
      s = next(s).state;
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBe(s | 0);
    }
  });

  it('rolls dice in 1..6 covering every face', () => {
    const seen = new Set<number>();
    let s = 99;
    for (let i = 0; i < 500; i++) {
      const r = rollDie(s);
      s = r.state;
      expect(r.die).toBeGreaterThanOrEqual(1);
      expect(r.die).toBeLessThanOrEqual(6);
      seen.add(r.die);
    }
    expect(seen.size).toBe(6);
    const two = rollDice(5);
    expect(two.dice).toEqual([rollDie(5).die, rollDie(rollDie(5).state).die]);
  });

  it('shuffles into a permutation without mutating the input', () => {
    const input = Array.from({ length: 16 }, (_, i) => i);
    const copy = input.slice();
    const r1 = shuffle(input, 1);
    const r2 = shuffle(input, 1);
    expect(input).toEqual(copy);
    expect(r1.result).toEqual(r2.result);
    expect(r1.result.slice().sort((a, b) => a - b)).toEqual(input);
    expect(r1.result).not.toEqual(input);
    expect(r1.state).toBe(r2.state);
  });

  it('_forceNextRoll positions the rng so the next roll is the requested one', () => {
    const state = newGame();
    for (const [d1, d2] of [
      [1, 1],
      [6, 6],
      [3, 4],
      [2, 5],
    ] as [number, number][]) {
      const forced = _forceNextRoll(state, d1, d2);
      expect(rollDice(forced.rng).dice).toEqual([d1, d2]);
      expect(state.rng).toBe(newGame().rng); // input untouched
    }
  });
});
