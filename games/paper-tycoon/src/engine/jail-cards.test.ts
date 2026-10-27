import { describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types';
import { legalActions } from './engine';
import { P, act, cur, ev, fails, give, newGame, roll, topCard } from './test-helpers';

/** Put a player in jail at the start of their own turn (mutates). */
function jailAtTurnStart(s: GameState, id = 'a'): void {
  const p = P(s, id);
  p.inJail = true;
  p.position = 10;
  p.jailTurns = 0;
  s.currentPlayer = s.players.findIndex((x) => x.id === id);
  s.phase = 'roll';
  s.dice = null;
  s.doublesCount = 0;
  s.canRollAgain = false;
}

/** Make it `id`'s turn again without playing the other turns (mutates). */
function nextTurnFor(s: GameState, id: string): void {
  s.currentPlayer = s.players.findIndex((x) => x.id === id);
  s.phase = 'roll';
  s.dice = null;
  s.doublesCount = 0;
  s.canRollAgain = false;
  s.pendingSpace = null;
  s.turnNumber += 1;
}

describe('going to jail', () => {
  it('Go To Jail sends the player straight to jail without salary or extra roll', () => {
    const s = newGame();
    P(s, 'a').position = 26;
    const r = roll(s, 2, 2); // doubles, but jail cancels the extra roll
    const a = P(r.state, 'a');
    expect(a).toMatchObject({ position: 10, inJail: true, jailTurns: 0, cash: 1500 });
    expect(ev(r.events, 'moved')).toEqual([
      { type: 'moved', player: 'a', from: 26, to: 30, passedGo: false },
      { type: 'moved', player: 'a', from: 30, to: 10, passedGo: false, direct: true },
    ]);
    expect(ev(r.events, 'jailed')).toEqual([{ type: 'jailed', player: 'a', reason: 'Landed on Go To Jail' }]);
    expect(r.state.canRollAgain).toBe(false);
    expect(r.state.phase).toBe('action');
    expect(legalActions(r.state, 'a')).toEqual(['endTurn', 'proposeTrade', 'resign']);
  });

  it('the Chance and Community Chest cards send the player to jail and go to the bottom of the deck', () => {
    let s = newGame();
    P(s, 'a').position = 3;
    topCard(s, 'chance', 9);
    let r = roll(s, 1, 3); // -> 7 Chance
    expect(ev(r.events, 'card')[0]).toMatchObject({ deck: 'chance', cardId: 9 });
    expect(P(r.state, 'a')).toMatchObject({ position: 10, inJail: true });
    expect(r.state.chanceDeck).toHaveLength(16);
    expect(r.state.chanceDeck.at(-1)).toBe(9);

    s = newGame();
    P(s, 'a').position = 14;
    topCard(s, 'chest', 5);
    r = roll(s, 1, 2); // -> 17 Community Chest
    expect(P(r.state, 'a')).toMatchObject({ position: 10, inJail: true });
    expect(r.state.chestDeck.at(-1)).toBe(5);
  });

  it('just visiting is nothing', () => {
    const s = newGame();
    P(s, 'a').position = 7;
    const r = roll(s, 1, 2);
    expect(P(r.state, 'a')).toMatchObject({ position: 10, inJail: false });
    expect(r.state.phase).toBe('action');
  });
});

describe('getting out of jail', () => {
  it('offers fine, card and roll at the start of the turn', () => {
    const s = newGame();
    jailAtTurnStart(s);
    expect(legalActions(s, 'a')).toEqual(['roll', 'payJailFine', 'proposeTrade', 'resign']);
    P(s, 'a').jailCards = 1;
    expect(legalActions(s, 'a')).toEqual(['roll', 'payJailFine', 'useJailCard', 'proposeTrade', 'resign']);
    P(s, 'a').cash = 49;
    expect(legalActions(s, 'a')).toEqual(['roll', 'useJailCard', 'proposeTrade', 'resign']);
    expect(fails(s, 'a', { type: 'payJailFine' })).toMatch(/not allowed/);
  });

  it('paying the fine frees the player, who then rolls normally (doubles still earn a roll)', () => {
    let s = newGame({ freeParkingJackpot: true });
    jailAtTurnStart(s);
    let r = act(s, 'a', { type: 'payJailFine' });
    expect(r.events).toEqual([
      { type: 'paid', from: 'a', to: null, amount: 50, reason: 'Jail fine' },
      { type: 'freed', player: 'a', how: 'fine' },
    ]);
    expect(P(r.state, 'a')).toMatchObject({ inJail: false, cash: 1450, position: 10 });
    expect(r.state.freeParkingPot).toBe(50);
    expect(r.state.phase).toBe('roll');
    expect(legalActions(r.state, 'a')).not.toContain('payJailFine');
    s = r.state;
    r = roll(s, 2, 2); // -> 14 Virginia Avenue
    expect(P(r.state, 'a').position).toBe(14);
    expect(r.state.phase).toBe('buy');
    expect(r.state.canRollAgain).toBe(true);
    s = act(r.state, 'a', { type: 'buy' }).state;
    expect(s.phase).toBe('roll');
  });

  it('using a card returns it to the bottom of its original deck', () => {
    const s = newGame();
    jailAtTurnStart(s);
    P(s, 'a').jailCards = 1;
    s.jailCardOrigins.a = ['chest'];
    s.chestDeck = s.chestDeck.filter((id) => id !== 4);
    const r = act(s, 'a', { type: 'useJailCard' });
    expect(r.events).toEqual([{ type: 'freed', player: 'a', how: 'card' }]);
    expect(P(r.state, 'a')).toMatchObject({ inJail: false, jailCards: 0, cash: 1500 });
    expect(r.state.chestDeck).toHaveLength(16);
    expect(r.state.chestDeck.at(-1)).toBe(4);
    expect(r.state.jailCardOrigins.a).toBeUndefined();
    expect(r.state.phase).toBe('roll');
    expect(fails(r.state, 'a', { type: 'useJailCard' })).toMatch(/not allowed/);
  });

  it('rolling doubles frees and moves the player with no extra roll', () => {
    const s = newGame();
    jailAtTurnStart(s);
    const r = roll(s, 3, 3); // -> 16 St. James Place
    expect(ev(r.events, 'freed')).toEqual([{ type: 'freed', player: 'a', how: 'doubles' }]);
    expect(P(r.state, 'a')).toMatchObject({ inJail: false, position: 16, jailTurns: 0 });
    expect(r.state.phase).toBe('buy');
    expect(r.state.canRollAgain).toBe(false);
    const after = act(r.state, 'a', { type: 'buy' }).state;
    expect(after.phase).toBe('action');
    expect(after.doublesCount).toBe(0);
  });

  it('failing to roll doubles keeps the player in jail; the third failure forces the fine and moves', () => {
    let s = newGame();
    jailAtTurnStart(s);
    let r = roll(s, 1, 2);
    expect(P(r.state, 'a')).toMatchObject({ inJail: true, position: 10, jailTurns: 1, cash: 1500 });
    expect(ev(r.events, 'moved')).toHaveLength(0);
    expect(r.state.phase).toBe('action');
    expect(legalActions(r.state, 'a')).toEqual(['endTurn', 'proposeTrade', 'resign']);
    s = act(r.state, 'a', { type: 'endTurn' }).state;
    expect(cur(s)).toBe('b');

    nextTurnFor(s, 'a');
    r = roll(s, 4, 5);
    expect(P(r.state, 'a')).toMatchObject({ inJail: true, jailTurns: 2 });

    nextTurnFor(r.state, 'a');
    r = roll(r.state, 1, 2);
    expect(ev(r.events, 'freed')).toEqual([{ type: 'freed', player: 'a', how: 'forced' }]);
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: null, amount: 50, reason: 'Jail fine' }]);
    expect(ev(r.events, 'moved')).toEqual([{ type: 'moved', player: 'a', from: 10, to: 13, passedGo: false }]);
    expect(P(r.state, 'a')).toMatchObject({ inJail: false, jailTurns: 0, position: 13, cash: 1450 });
    expect(r.state.phase).toBe('buy');
  });

  it('maxJailTurns is configurable', () => {
    const s = newGame({ maxJailTurns: 1 });
    jailAtTurnStart(s);
    const r = roll(s, 1, 2);
    expect(ev(r.events, 'freed')[0].how).toBe('forced');
    expect(P(r.state, 'a').position).toBe(13);
  });

  it('an unaffordable forced fine becomes a bank debt; the move happens after it is paid', () => {
    let s = newGame();
    jailAtTurnStart(s);
    P(s, 'a').cash = 0;
    P(s, 'a').jailTurns = 2;
    give(s, 'a', 39);
    let r = roll(s, 1, 2);
    expect(r.state.phase).toBe('debt');
    expect(r.state.debt).toEqual({ debtor: 'a', creditor: null, amount: 50, reason: 'Jail fine', toPot: true });
    expect(r.state.debtResume).toEqual({ moveBy: 3 });
    expect(P(r.state, 'a')).toMatchObject({ inJail: false, position: 10 });
    expect(legalActions(r.state, 'a')).toEqual(['declareBankruptcy', 'mortgage', 'proposeTrade', 'resign']);
    s = act(r.state, 'a', { type: 'mortgage', space: 39 }).state;
    expect(legalActions(s, 'a')).toContain('payDebt');
    r = act(s, 'a', { type: 'payDebt' });
    expect(ev(r.events, 'paid')[0]).toEqual({ type: 'paid', from: 'a', to: null, amount: 50, reason: 'Jail fine' });
    expect(ev(r.events, 'moved')).toEqual([{ type: 'moved', player: 'a', from: 10, to: 13, passedGo: false }]);
    expect(r.state.debtResume).toBeNull();
    expect(r.state.debt).toBeNull();
    expect(r.state.phase).toBe('buy');
    expect(P(r.state, 'a').cash).toBe(150);
  });
});

describe('cards', () => {
  /** a draws chance card `id` from space 7 (position 3, roll 1+3). */
  function chance(id: number, setup: (s: GameState) => void = () => {}, config = {}) {
    const s = newGame(config);
    P(s, 'a').position = 3;
    topCard(s, 'chance', id);
    setup(s);
    return roll(s, 1, 3);
  }
  /** a draws chest card `id` from space 17 (position 14, roll 1+2). */
  function chest(id: number, setup: (s: GameState) => void = () => {}, config = {}) {
    const s = newGame(config);
    P(s, 'a').position = 14;
    topCard(s, 'chest', id);
    setup(s);
    return roll(s, 1, 2);
  }

  it('emits a card event and puts the card at the bottom of the deck', () => {
    const r = chance(6);
    expect(ev(r.events, 'card')).toEqual([{ type: 'card', player: 'a', deck: 'chance', cardId: 6, text: 'Bank pays you dividend of $50.' }]);
    expect(r.state.chanceDeck).toHaveLength(16);
    expect(r.state.chanceDeck.at(-1)).toBe(6);
    expect(r.state.chanceDeck.indexOf(6)).toBe(15);
  });

  it('simple collect / pay cards move cash to or from the bank', () => {
    const cases: [('chance' | 'chest'), number, number][] = [
      ['chance', 6, 50],
      ['chance', 11, -15],
      ['chance', 15, 150],
      ['chest', 1, 200],
      ['chest', 2, -50],
      ['chest', 3, 50],
      ['chest', 6, 100],
      ['chest', 7, 20],
      ['chest', 9, 100],
      ['chest', 10, -100],
      ['chest', 11, -50],
      ['chest', 12, 25],
      ['chest', 14, 10],
      ['chest', 15, 100],
    ];
    for (const [deck, id, delta] of cases) {
      const r = deck === 'chance' ? chance(id) : chest(id);
      expect(P(r.state, 'a').cash, `${deck} ${id}`).toBe(1500 + delta);
      const paid = ev(r.events, 'paid');
      expect(paid).toHaveLength(1);
      expect(paid[0]).toMatchObject(delta > 0 ? { from: null, to: 'a', amount: delta } : { from: 'a', to: null, amount: -delta });
      expect(r.state.phase).toBe('action');
    }
  });

  it('payments to the bank feed the jackpot pot when enabled', () => {
    expect(chance(11, () => {}, { freeParkingJackpot: true }).state.freeParkingPot).toBe(15);
    expect(chest(10, () => {}, { freeParkingJackpot: true }).state.freeParkingPot).toBe(100);
  });

  it('Advance to Go collects the salary (doubled when configured)', () => {
    let r = chance(0);
    expect(P(r.state, 'a')).toMatchObject({ position: 0, cash: 1700 });
    expect(ev(r.events, 'moved')[1]).toEqual({ type: 'moved', player: 'a', from: 7, to: 0, passedGo: true });
    r = chest(0, () => {}, { doubleGoSalary: true });
    expect(P(r.state, 'a')).toMatchObject({ position: 0, cash: 1900 });
  });

  it('Advance to Illinois / St. Charles / Reading / Boardwalk collect salary only when passing Go', () => {
    let r = chance(1);
    expect(P(r.state, 'a')).toMatchObject({ position: 24, cash: 1500 });
    expect(r.state.phase).toBe('buy');
    r = chance(1, (s) => give(s, 'b', 24));
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: 'b', amount: 20, reason: 'Rent for Illinois Avenue' }]);
    r = chance(2);
    expect(P(r.state, 'a')).toMatchObject({ position: 11, cash: 1500 });
    r = chance(12);
    expect(P(r.state, 'a')).toMatchObject({ position: 5, cash: 1700 });
    expect(r.state.phase).toBe('buy');
    r = chance(13);
    expect(P(r.state, 'a')).toMatchObject({ position: 39, cash: 1500 });
    // from the last Chance space (36) Illinois and St. Charles pass Go
    const s = newGame();
    P(s, 'a').position = 33;
    topCard(s, 'chance', 2);
    r = roll(s, 1, 2);
    expect(P(r.state, 'a')).toMatchObject({ position: 11, cash: 1700 });
    expect(ev(r.events, 'moved')[1].passedGo).toBe(true);
  });

  it('nearest utility: buy if unowned, otherwise pay 10x the dice', () => {
    let r = chance(3);
    expect(P(r.state, 'a').position).toBe(12);
    expect(r.state.phase).toBe('buy');
    r = chance(3, (s) => give(s, 'b', 12));
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: 'b', amount: 40, reason: 'Rent for Electric Company' }]);
    r = chance(3, (s) => give(s, 'b', 12, { mortgaged: true }));
    expect(ev(r.events, 'paid')).toHaveLength(0);
    // from 22 the nearest utility is Water Works; from 36 it is Electric Company past Go
    let s = newGame();
    P(s, 'a').position = 19;
    topCard(s, 'chance', 3);
    give(s, 'b', [12, 28]);
    r = roll(s, 1, 2);
    expect(P(r.state, 'a').position).toBe(28);
    expect(ev(r.events, 'paid')[0].amount).toBe(30);
    s = newGame();
    P(s, 'a').position = 33;
    topCard(s, 'chance', 3);
    r = roll(s, 1, 2);
    expect(P(r.state, 'a')).toMatchObject({ position: 12, cash: 1700 });
  });

  it('nearest railroad: buy if unowned, otherwise pay double rent', () => {
    let r = chance(4);
    expect(P(r.state, 'a').position).toBe(15);
    expect(r.state.phase).toBe('buy');
    r = act(r.state, 'a', { type: 'buy' });
    expect(P(r.state, 'a').cash).toBe(1300);
    r = chance(4, (s) => give(s, 'b', [5, 15]));
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: 'b', amount: 100, reason: 'Rent for Pennsylvania Railroad' }]);
    r = chance(5, (s) => give(s, 'b', [5, 15, 25, 35]));
    expect(ev(r.events, 'paid')[0].amount).toBe(400);
    const s = newGame();
    P(s, 'a').position = 33;
    topCard(s, 'chance', 5);
    give(s, 'b', 5);
    r = roll(s, 1, 2);
    expect(P(r.state, 'a')).toMatchObject({ position: 5, cash: 1650 }); // +200 salary, -50 double rent
  });

  it('Get Out of Jail Free is kept by the player and leaves the deck', () => {
    let r = chance(7);
    expect(P(r.state, 'a').jailCards).toBe(1);
    expect(r.state.chanceDeck).toHaveLength(15);
    expect(r.state.chanceDeck).not.toContain(7);
    expect(r.state.jailCardOrigins.a).toEqual(['chance']);
    r = chest(4, (s) => {
      P(s, 'a').jailCards = 1;
      s.jailCardOrigins.a = ['chance'];
    });
    expect(P(r.state, 'a').jailCards).toBe(2);
    expect(r.state.jailCardOrigins.a).toEqual(['chance', 'chest']);
    expect(r.state.chestDeck).toHaveLength(15);
  });

  it('Go Back 3 Spaces walks backwards without salary and resolves the new space', () => {
    let r = chance(8); // 7 -> 4 Income Tax
    expect(ev(r.events, 'moved')[1]).toEqual({ type: 'moved', player: 'a', from: 7, to: 4, passedGo: false, backwards: true });
    expect(P(r.state, 'a')).toMatchObject({ position: 4, cash: 1300 });
    let s = newGame();
    P(s, 'a').position = 19;
    topCard(s, 'chance', 8);
    r = roll(s, 1, 2); // 22 -> 19 New York Avenue
    expect(P(r.state, 'a').position).toBe(19);
    expect(r.state.phase).toBe('buy');
    s = newGame();
    P(s, 'a').position = 33;
    topCard(s, 'chance', 8);
    topCard(s, 'chest', 14);
    r = roll(s, 1, 2); // 36 -> 33 Community Chest -> beauty contest
    expect(ev(r.events, 'card').map((c) => c.deck)).toEqual(['chance', 'chest']);
    expect(P(r.state, 'a')).toMatchObject({ position: 33, cash: 1510 });
  });

  it('repairs charge per house and per hotel; nothing when unimproved', () => {
    const setup = (s: GameState) => {
      give(s, 'a', 1, { houses: 4 });
      give(s, 'a', 3, { houses: 5 });
      give(s, 'a', [6, 8, 9], { houses: 1 });
    };
    let r = chance(10, setup); // 7 houses * 25 + 1 hotel * 100
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: null, amount: 275, reason: 'Make general repairs on all your property: for each house pay $25, for each hotel pay $100.' }]);
    r = chest(13, setup); // 7 * 40 + 115
    expect(ev(r.events, 'paid')[0].amount).toBe(395);
    r = chance(10);
    expect(ev(r.events, 'paid')).toHaveLength(0);
    expect(P(r.state, 'a').cash).toBe(1500);
  });

  it('Chairman of the Board pays every other player', () => {
    const r = chance(14);
    expect(P(r.state, 'a').cash).toBe(1400);
    expect(P(r.state, 'b').cash).toBe(1550);
    expect(P(r.state, 'c').cash).toBe(1550);
    expect(ev(r.events, 'paid').map((e) => e.to)).toEqual(['b', 'c']);
    expect(r.state.pendingPayments).toEqual([]);
    expect(r.state.phase).toBe('action');
  });

  it('birthday collects from every other player', () => {
    const r = chest(8);
    expect(P(r.state, 'a').cash).toBe(1520);
    expect(P(r.state, 'b').cash).toBe(1490);
    expect(P(r.state, 'c').cash).toBe(1490);
    expect(ev(r.events, 'paid').map((e) => e.from)).toEqual(['b', 'c']);
    expect(r.state.phase).toBe('action');
  });

  it('multi-payment cards skip bankrupt players', () => {
    const r = chest(8, (s) => {
      P(s, 'c').bankrupt = true;
    });
    expect(P(r.state, 'a').cash).toBe(1510);
    expect(P(r.state, 'c').cash).toBe(1500);
  });
});
