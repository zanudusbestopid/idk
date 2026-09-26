import { describe, expect, it } from 'vitest';
import { BOARD, GROUPS, RAILROADS, UTILITIES, isOwnable, mortgageValue } from '../shared/board';
import { CHANCE_CARDS, CHEST_CARDS, JAIL_CARD_ID } from '../shared/cards';

describe('board data', () => {
  it('has 40 spaces indexed in order starting at Go', () => {
    expect(BOARD).toHaveLength(40);
    BOARD.forEach((s, i) => expect(s.index).toBe(i));
    expect(BOARD[0].type).toBe('go');
    expect(BOARD[10].type).toBe('jail');
    expect(BOARD[20].type).toBe('freeparking');
    expect(BOARD[30].type).toBe('gotojail');
  });

  it('has 22 streets, 4 railroads, 2 utilities (28 ownable)', () => {
    expect(BOARD.filter((s) => s.type === 'property')).toHaveLength(22);
    expect(BOARD.filter((s) => s.type === 'railroad').map((s) => s.index)).toEqual(RAILROADS);
    expect(BOARD.filter((s) => s.type === 'utility').map((s) => s.index)).toEqual(UTILITIES);
    expect(BOARD.filter(isOwnable)).toHaveLength(28);
    expect(BOARD.filter((s) => s.type === 'chance').map((s) => s.index)).toEqual([7, 22, 36]);
    expect(BOARD.filter((s) => s.type === 'chest').map((s) => s.index)).toEqual([2, 17, 33]);
  });

  it('groups have the right sizes and members', () => {
    const sizes = Object.fromEntries(Object.entries(GROUPS).map(([g, v]) => [g, v.length]));
    expect(sizes).toEqual({ brown: 2, lightblue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3, darkblue: 2 });
    const all = Object.values(GROUPS).flat();
    expect(new Set(all).size).toBe(22);
    for (const [g, members] of Object.entries(GROUPS)) {
      for (const i of members) {
        expect(BOARD[i].type).toBe('property');
        expect(BOARD[i].group).toBe(g);
      }
    }
    for (const s of BOARD) if (s.type === 'property') expect(GROUPS[s.group!]).toContain(s.index);
  });

  it('streets carry price, six rents and a house cost by side', () => {
    for (const s of BOARD) {
      if (s.type !== 'property') continue;
      expect(s.price).toBeGreaterThan(0);
      expect(s.rent).toHaveLength(6);
      for (let i = 1; i < 6; i++) expect(s.rent![i]).toBeGreaterThan(s.rent![i - 1]);
      const expectedHouseCost = s.index < 10 ? 50 : s.index < 20 ? 100 : s.index < 30 ? 150 : 200;
      expect(s.houseCost).toBe(expectedHouseCost);
    }
    expect(BOARD[39]).toMatchObject({ name: 'Boardwalk', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 });
    expect(BOARD[1]).toMatchObject({ name: 'Mediterranean Avenue', price: 60, rent: [2, 10, 30, 90, 160, 250] });
    for (const i of RAILROADS) expect(BOARD[i].price).toBe(200);
    for (const i of UTILITIES) expect(BOARD[i].price).toBe(150);
  });

  it('has the standard tax amounts', () => {
    expect(BOARD[4]).toMatchObject({ type: 'tax', name: 'Income Tax', amount: 200 });
    expect(BOARD[38]).toMatchObject({ type: 'tax', name: 'Luxury Tax', amount: 100 });
  });

  it('mortgage value is half the price', () => {
    expect(mortgageValue(BOARD[39])).toBe(200);
    expect(mortgageValue(BOARD[1])).toBe(30);
    expect(mortgageValue(BOARD[5])).toBe(100);
    expect(mortgageValue(BOARD[0])).toBe(0);
  });
});

describe('cards', () => {
  it('has 16 cards per deck with ids 0..15', () => {
    for (const deck of [CHANCE_CARDS, CHEST_CARDS]) {
      expect(deck).toHaveLength(16);
      deck.forEach((c, i) => {
        expect(c.id).toBe(i);
        expect(c.text.length).toBeGreaterThan(5);
      });
    }
  });

  it('has one Get Out of Jail Free card per deck and two nearest-railroad Chance cards', () => {
    expect(CHANCE_CARDS.filter((c) => c.effect.kind === 'jailCard').map((c) => c.id)).toEqual([JAIL_CARD_ID.chance]);
    expect(CHEST_CARDS.filter((c) => c.effect.kind === 'jailCard').map((c) => c.id)).toEqual([JAIL_CARD_ID.chest]);
    expect(CHANCE_CARDS.filter((c) => c.effect.kind === 'nearestRailroad')).toHaveLength(2);
    expect(CHANCE_CARDS.filter((c) => c.effect.kind === 'nearestUtility')).toHaveLength(1);
    expect(CHANCE_CARDS.filter((c) => c.effect.kind === 'goToJail')).toHaveLength(1);
    expect(CHEST_CARDS.filter((c) => c.effect.kind === 'goToJail')).toHaveLength(1);
  });
});
