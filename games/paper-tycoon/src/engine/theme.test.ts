import { describe, expect, it } from 'vitest';
import { BOARD } from '../shared/board';
import { CHANCE_CARDS, CHEST_CARDS } from '../shared/cards';
import { CLASSIC, MARIO, THEMES, themedBoard } from '../shared/theme';
import { createGame } from './engine';

describe('themes', () => {
  for (const [id, theme] of Object.entries(THEMES)) {
    it(`${id} names all 40 spaces and 16 + 16 cards`, () => {
      expect(theme.id).toBe(id);
      expect(theme.spaceNames).toHaveLength(40);
      for (const name of theme.spaceNames) expect(name.trim().length).toBeGreaterThan(0);
      expect(theme.cardText.chance).toHaveLength(16);
      expect(theme.cardText.chest).toHaveLength(16);
      for (const text of [...theme.cardText.chance, ...theme.cardText.chest]) expect(text.trim().length).toBeGreaterThan(0);
      expect(theme.title).toHaveLength(2);
      expect(Object.keys(theme.groupNames).sort()).toEqual(['brown', 'darkblue', 'green', 'lightblue', 'orange', 'pink', 'red', 'yellow']);
    });
  }

  it('classic mirrors the board names and the card texts', () => {
    expect(CLASSIC.spaceNames).toEqual(BOARD.map((s) => s.name));
    expect(CLASSIC.cardText.chance).toEqual(CHANCE_CARDS.map((c) => c.text));
    expect(CLASSIC.cardText.chest).toEqual(CHEST_CARDS.map((c) => c.text));
    expect(CLASSIC.currency).toBe('dollar');
  });

  it('mario renames every space that differs from the classic board', () => {
    expect(MARIO.currency).toBe('coin');
    expect(MARIO.spaceNames[0]).toBe('Start');
    expect(MARIO.spaceNames[39]).toBe("Bowser's Castle");
    // the two "nearest railroad" cards read the same, as in the classic deck
    expect(MARIO.cardText.chance[4]).toBe(MARIO.cardText.chance[5]);
  });

  it('themedBoard keeps prices, rents and types identical to BOARD', () => {
    for (const theme of Object.values(THEMES)) {
      const board = themedBoard(theme);
      expect(board).toHaveLength(BOARD.length);
      board.forEach((s, i) => {
        const { name, ...rest } = s;
        const { name: original, ...expected } = BOARD[i];
        expect(rest).toEqual(expected);
        expect(name).toBe(theme.spaceNames[i]);
        if (theme === CLASSIC) expect(name).toBe(original);
      });
    }
    // the classic board itself is untouched
    expect(BOARD[39].name).toBe('Boardwalk');
  });

  it('createGame accepts a themed board and keeps the default otherwise', () => {
    const players = [
      { id: 'a', name: 'A', token: 'hat', color: '#000' },
      { id: 'b', name: 'B', token: 'boat', color: '#fff' },
    ];
    const themed = createGame({}, players, 1, themedBoard(MARIO));
    expect(themed.board.map((s) => s.name)).toEqual(MARIO.spaceNames);
    expect(themed.board[39].price).toBe(BOARD[39].price);
    expect(Object.keys(themed.properties)).toHaveLength(28);
    const plain = createGame({}, players, 1);
    expect(plain.board.map((s) => s.name)).toEqual(BOARD.map((s) => s.name));
  });
});
