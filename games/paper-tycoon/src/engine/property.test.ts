import { describe, expect, it } from 'vitest';
import { canBuild, canMortgage, canSellHouse, canUnmortgage, legalActions, rentFor } from './engine';
import { P, act, ev, fails, give, newGame, roll } from './test-helpers';

describe('rent', () => {
  function landOnBaltic(setup: (s: ReturnType<typeof newGame>) => void) {
    const s = newGame();
    setup(s);
    return roll(s, 1, 2); // a: 0 -> 3 Baltic Avenue
  }

  it('charges base rent for a lone street', () => {
    const r = landOnBaltic((s) => give(s, 'b', 3));
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: 'b', amount: 4, reason: 'Rent for Baltic Avenue' }]);
    expect(P(r.state, 'a').cash).toBe(1496);
    expect(P(r.state, 'b').cash).toBe(1504);
    expect(r.state.phase).toBe('action');
  });

  it('doubles base rent on an unimproved monopoly', () => {
    const r = landOnBaltic((s) => give(s, 'b', [1, 3]));
    expect(ev(r.events, 'paid')[0].amount).toBe(8);
  });

  it('charges the house and hotel rents', () => {
    expect(ev(landOnBaltic((s) => give(s, 'b', [1, 3], { houses: 2 })).events, 'paid')[0].amount).toBe(60);
    expect(ev(landOnBaltic((s) => give(s, 'b', [1, 3], { houses: 4 })).events, 'paid')[0].amount).toBe(320);
    expect(ev(landOnBaltic((s) => give(s, 'b', [1, 3], { houses: 5 })).events, 'paid')[0].amount).toBe(450);
  });

  it('charges nothing on your own or a mortgaged property', () => {
    let r = landOnBaltic((s) => give(s, 'a', 3));
    expect(ev(r.events, 'paid')).toHaveLength(0);
    expect(r.state.phase).toBe('action');
    r = landOnBaltic((s) => give(s, 'b', [1, 3], { mortgaged: true }));
    expect(ev(r.events, 'paid')).toHaveLength(0);
    expect(P(r.state, 'a').cash).toBe(1500);
  });

  it('charges railroads by the number owned (mortgaged ones count, but pay nothing themselves)', () => {
    const rrs = [5, 15, 25, 35];
    const expected = [25, 50, 100, 200];
    for (let n = 1; n <= 4; n++) {
      const s = newGame();
      give(s, 'b', rrs.slice(0, n));
      const r = roll(s, 2, 3); // a -> 5 Reading Railroad
      expect(ev(r.events, 'paid')[0].amount).toBe(expected[n - 1]);
    }
    const s = newGame();
    give(s, 'b', [5, 15]);
    give(s, 'b', 25, { mortgaged: true });
    expect(rentFor(s, 5, 0)).toBe(100);
    expect(rentFor(s, 25, 0)).toBe(0);
  });

  it('charges utilities 4x or 10x the dice total', () => {
    let s = newGame();
    give(s, 'b', 12);
    P(s, 'a').position = 5;
    let r = roll(s, 3, 4); // -> 12 Electric Company, total 7
    expect(ev(r.events, 'paid')[0].amount).toBe(28);
    s = newGame();
    give(s, 'b', [12, 28]);
    P(s, 'a').position = 5;
    r = roll(s, 3, 4);
    expect(ev(r.events, 'paid')[0].amount).toBe(70);
    expect(rentFor(s, 12, 12)).toBe(120);
    expect(rentFor(s, 28, 5)).toBe(50);
  });

  it('rentFor returns 0 for unowned or non-rentable spaces', () => {
    const s = newGame();
    expect(rentFor(s, 3, 7)).toBe(0);
    expect(rentFor(s, 0, 7)).toBe(0);
    expect(rentFor(s, 4, 7)).toBe(0);
    give(s, 'b', [37, 39]);
    expect(rentFor(s, 39, 7)).toBe(100);
    give(s, 'b', 39, { houses: 5 });
    expect(rentFor(s, 39, 7)).toBe(2000);
  });
});

describe('building', () => {
  function brown() {
    const s = newGame();
    give(s, 'a', [1, 3]);
    return s;
  }

  it('builds one house at a time, paying the house cost from the bank supply', () => {
    let s = brown();
    expect(canBuild(s, 'a', 1)).toEqual({ ok: true });
    let r = act(s, 'a', { type: 'build', space: 1 });
    expect(r.events).toEqual([{ type: 'built', player: 'a', space: 1, houses: 1 }]);
    expect(r.state.properties[1].houses).toBe(1);
    expect(P(r.state, 'a').cash).toBe(1450);
    expect(r.state.housesLeft).toBe(31);
    s = r.state;
    // even build: Baltic must catch up first
    expect(canBuild(s, 'a', 1).reason).toMatch(/evenly/);
    expect(fails(s, 'a', { type: 'build', space: 1 })).toMatch(/evenly/);
    r = act(s, 'a', { type: 'build', space: 3 });
    expect(r.state.properties[3].houses).toBe(1);
    expect(canBuild(r.state, 'a', 1).ok).toBe(true);
  });

  it('upgrades four houses to a hotel, returning the houses to the bank', () => {
    const s = brown();
    give(s, 'a', [1, 3], { houses: 4 });
    s.housesLeft = 24;
    const r = act(s, 'a', { type: 'build', space: 1 });
    expect(r.state.properties[1].houses).toBe(5);
    expect(r.state.hotelsLeft).toBe(11);
    expect(r.state.housesLeft).toBe(28);
    expect(canBuild(r.state, 'a', 1).reason).toMatch(/hotel/);
  });

  it('requires the whole unmortgaged group, the right phase and enough cash', () => {
    let s = newGame();
    give(s, 'a', 1);
    expect(canBuild(s, 'a', 1).reason).toMatch(/whole color group/);
    give(s, 'a', 3, { mortgaged: true });
    expect(canBuild(s, 'a', 1).reason).toMatch(/mortgaged/);
    s = brown();
    P(s, 'a').cash = 49;
    expect(canBuild(s, 'a', 1).reason).toMatch(/cash/);
    expect(legalActions(s, 'a')).not.toContain('build');
    s = brown();
    expect(canBuild(s, 'b', 1).reason).toMatch(/turn/);
    expect(canBuild(s, 'a', 5).reason).toMatch(/streets/);
    expect(canBuild(s, 'a', 0).reason).toBeDefined();
    const buying = roll(s, 2, 3).state; // buy phase
    expect(canBuild(buying, 'a', 1).ok).toBe(false);
    expect(fails(buying, 'a', { type: 'build', space: 1 })).toMatch(/not allowed/);
  });

  it('respects the bank supply of houses and hotels', () => {
    let s = brown();
    s.housesLeft = 0;
    expect(canBuild(s, 'a', 1).reason).toMatch(/no houses/);
    s = brown();
    give(s, 'a', [1, 3], { houses: 4 });
    s.hotelsLeft = 0;
    expect(canBuild(s, 'a', 1).reason).toMatch(/no hotels/);
  });

  it('sells houses from the most-built street for half price', () => {
    let s = brown();
    give(s, 'a', 1, { houses: 2 });
    give(s, 'a', 3, { houses: 1 });
    s.housesLeft = 29;
    expect(canSellHouse(s, 'a', 3).reason).toMatch(/evenly/);
    expect(fails(s, 'a', { type: 'sellHouse', space: 3 })).toMatch(/evenly/);
    const r = act(s, 'a', { type: 'sellHouse', space: 1 });
    expect(r.events).toEqual([{ type: 'soldHouse', player: 'a', space: 1, houses: 1 }]);
    expect(P(r.state, 'a').cash).toBe(1525);
    expect(r.state.housesLeft).toBe(30);
    s = r.state;
    expect(canSellHouse(s, 'a', 3).ok).toBe(true);
    expect(canSellHouse(s, 'b', 3).ok).toBe(false);
    give(s, 'a', [1, 3], { houses: 0 });
    expect(canSellHouse(s, 'a', 1).reason).toMatch(/Nothing/);
  });

  it('selling a hotel needs four houses in the bank and returns the hotel', () => {
    const s = brown();
    give(s, 'a', [1, 3], { houses: 5 });
    s.hotelsLeft = 10;
    s.housesLeft = 3;
    expect(canSellHouse(s, 'a', 1).reason).toMatch(/4 houses/);
    expect(legalActions(s, 'a')).not.toContain('sellHouse');
    s.housesLeft = 4;
    const r = act(s, 'a', { type: 'sellHouse', space: 1 });
    expect(r.state.properties[1].houses).toBe(4);
    expect(r.state.hotelsLeft).toBe(11);
    expect(r.state.housesLeft).toBe(0);
    expect(P(r.state, 'a').cash).toBe(1525);
  });
});

describe('mortgages', () => {
  it('mortgage pays half the price; unmortgage costs that plus 10% rounded up', () => {
    let s = newGame();
    give(s, 'a', [3, 5, 39]);
    expect(canMortgage(s, 'a', 3)).toEqual({ ok: true });
    let r = act(s, 'a', { type: 'mortgage', space: 3 });
    expect(r.events).toEqual([{ type: 'mortgaged', player: 'a', space: 3 }]);
    expect(P(r.state, 'a').cash).toBe(1530);
    expect(r.state.properties[3].mortgaged).toBe(true);
    s = r.state;
    expect(canMortgage(s, 'a', 3).reason).toMatch(/Already/);
    expect(canUnmortgage(s, 'a', 5).reason).toMatch(/Not mortgaged/);
    r = act(s, 'a', { type: 'unmortgage', space: 3 });
    expect(r.events).toEqual([{ type: 'unmortgaged', player: 'a', space: 3 }]);
    expect(P(r.state, 'a').cash).toBe(1497); // 1530 - 33
    expect(r.state.properties[3].mortgaged).toBe(false);
    // Boardwalk: 200 / 220, Reading: 100 / 110
    s = act(r.state, 'a', { type: 'mortgage', space: 39 }).state;
    expect(P(s, 'a').cash).toBe(1697);
    s = act(s, 'a', { type: 'unmortgage', space: 39 }).state;
    expect(P(s, 'a').cash).toBe(1477);
    s = act(s, 'a', { type: 'mortgage', space: 5 }).state;
    expect(P(s, 'a').cash).toBe(1577);
    s = act(s, 'a', { type: 'unmortgage', space: 5 }).state;
    expect(P(s, 'a').cash).toBe(1467);
  });

  it('cannot mortgage while the color group has buildings, or unmortgage without cash', () => {
    const s = newGame();
    give(s, 'a', 1, { houses: 1 });
    give(s, 'a', 3);
    expect(canMortgage(s, 'a', 3).reason).toMatch(/buildings in the color group/);
    expect(canMortgage(s, 'a', 1).reason).toMatch(/buildings/);
    expect(canMortgage(s, 'b', 3).reason).toMatch(/turn/);
    give(s, 'a', 39, { mortgaged: true });
    P(s, 'a').cash = 219;
    expect(canUnmortgage(s, 'a', 39).reason).toMatch(/cash/);
    expect(legalActions(s, 'a')).not.toContain('unmortgage');
    P(s, 'a').cash = 220;
    expect(canUnmortgage(s, 'a', 39).ok).toBe(true);
    expect(legalActions(s, 'a')).toContain('unmortgage');
  });

  it('mortgaged properties still count towards monopolies and railroad totals', () => {
    const s = newGame();
    give(s, 'b', 1, { mortgaged: true });
    give(s, 'b', 3);
    const r = roll(s, 1, 2);
    expect(ev(r.events, 'paid')[0].amount).toBe(8);
  });
});
