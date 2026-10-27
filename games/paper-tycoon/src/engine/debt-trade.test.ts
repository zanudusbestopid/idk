import { describe, expect, it } from 'vitest';
import type { GameState, TradeSide } from '../shared/types';
import { canAcceptTrade, legalActions } from './engine';
import { P, act, cur, ev, fails, give, newGame, roll, topCard } from './test-helpers';

const side = (o: Partial<TradeSide> = {}): TradeSide => ({ cash: 0, properties: [], jailCards: 0, ...o });

/** a (cash 300, owns Boardwalk) lands on b's Baltic hotel (rent 450). */
function rentDebt(config = {}) {
  const s = newGame(config);
  P(s, 'a').cash = 300;
  give(s, 'a', 39);
  give(s, 'b', [1, 3], { houses: 5 });
  return roll(s, 1, 2);
}

describe('debt', () => {
  it('an unaffordable rent creates a debt and pauses the turn', () => {
    const r = rentDebt();
    expect(r.state.phase).toBe('debt');
    expect(r.state.debt).toEqual({ debtor: 'a', creditor: 'b', amount: 450, reason: 'Rent for Baltic Avenue' });
    expect(ev(r.events, 'debt')).toEqual([{ type: 'debt', player: 'a', creditor: 'b', amount: 450 }]);
    expect(ev(r.events, 'paid')).toHaveLength(0);
    expect(P(r.state, 'a').cash).toBe(300);
    expect(legalActions(r.state, 'a')).toEqual(['declareBankruptcy', 'mortgage', 'proposeTrade', 'resign']);
    expect(legalActions(r.state, 'b')).toEqual(['proposeTrade', 'resign']);
    expect(fails(r.state, 'a', { type: 'payDebt' })).toMatch(/not allowed/);
    expect(fails(r.state, 'a', { type: 'endTurn' })).toMatch(/not allowed/);
    expect(fails(r.state, 'b', { type: 'roll' })).toMatch(/not allowed/);
  });

  it('is settled by mortgaging and paying', () => {
    let s = rentDebt().state;
    s = act(s, 'a', { type: 'mortgage', space: 39 }).state;
    expect(P(s, 'a').cash).toBe(500);
    expect(legalActions(s, 'a')).toContain('payDebt');
    const r = act(s, 'a', { type: 'payDebt' });
    expect(r.events).toEqual([{ type: 'paid', from: 'a', to: 'b', amount: 450, reason: 'Rent for Baltic Avenue' }]);
    expect(P(r.state, 'a').cash).toBe(50);
    expect(P(r.state, 'b').cash).toBe(1950);
    expect(r.state.debt).toBeNull();
    expect(r.state.phase).toBe('action');
    expect(legalActions(r.state, 'a')).toContain('endTurn');
  });

  it('resumes the extra roll when the debt came from doubles', () => {
    const s = newGame();
    P(s, 'a').cash = 300;
    P(s, 'a').position = 1;
    give(s, 'a', 39);
    give(s, 'b', [1, 3], { houses: 5 });
    let r = roll(s, 1, 1); // -> 3
    expect(r.state.phase).toBe('debt');
    expect(r.state.canRollAgain).toBe(true);
    r = act(r.state, 'a', { type: 'mortgage', space: 39 });
    r = act(r.state, 'a', { type: 'payDebt' });
    expect(r.state.phase).toBe('roll');
    expect(r.state.canRollAgain).toBe(true);
  });

  it('can be raised by selling houses and lets the debtor accept trades', () => {
    const s = newGame();
    P(s, 'a').cash = 0;
    give(s, 'a', [37, 39], { houses: 2 });
    s.housesLeft = 28;
    give(s, 'b', 3);
    let r = roll(s, 1, 2); // rent 4, a has nothing
    expect(r.state.debt?.amount).toBe(4);
    expect(legalActions(r.state, 'a')).toEqual(['declareBankruptcy', 'sellHouse', 'proposeTrade', 'resign']);
    r = act(r.state, 'a', { type: 'sellHouse', space: 37 });
    expect(P(r.state, 'a').cash).toBe(100);
    // c offers cash for nothing while a is in debt: allowed because it involves the debtor
    r = act(r.state, 'c', { type: 'proposeTrade', to: 'a', offer: side({ cash: 50 }), request: side() });
    expect(legalActions(r.state, 'a')).toContain('acceptTrade');
    r = act(r.state, 'a', { type: 'acceptTrade', tradeId: r.state.trades[0].id });
    expect(P(r.state, 'a').cash).toBe(150);
    // a trade between two bystanders is refused during the debt
    expect(fails(r.state, 'c', { type: 'proposeTrade', to: 'b', offer: side({ cash: 1 }), request: side() })).toMatch(/in debt/);
    r = act(r.state, 'a', { type: 'payDebt' });
    expect(r.state.phase).toBe('action');
  });

  it('tax debts go to the bank (and the pot when enabled)', () => {
    const s = newGame({ freeParkingJackpot: true });
    P(s, 'a').cash = 100;
    give(s, 'a', 39);
    let r = roll(s, 1, 3); // -> 4 Income Tax
    expect(r.state.debt).toEqual({ debtor: 'a', creditor: null, amount: 200, reason: 'Income Tax', toPot: true });
    r = act(r.state, 'a', { type: 'mortgage', space: 39 });
    r = act(r.state, 'a', { type: 'payDebt' });
    expect(r.state.freeParkingPot).toBe(200);
    expect(P(r.state, 'a').cash).toBe(100);
  });

  it('pay-each cards are settled one payment at a time', () => {
    const s = newGame({}, 4);
    P(s, 'a').cash = 60;
    P(s, 'a').position = 3;
    give(s, 'a', 39);
    topCard(s, 'chance', 14);
    let r = roll(s, 1, 3);
    expect(P(r.state, 'b').cash).toBe(1550);
    expect(r.state.debt).toMatchObject({ debtor: 'a', creditor: 'c', amount: 50 });
    expect(r.state.pendingPayments).toEqual([{ from: 'a', to: 'd', amount: 50, reason: expect.any(String) }]);
    expect(r.state.phase).toBe('debt');
    r = act(r.state, 'a', { type: 'mortgage', space: 39 });
    r = act(r.state, 'a', { type: 'payDebt' });
    expect(ev(r.events, 'paid').map((e) => [e.to, e.amount])).toEqual([
      ['c', 50],
      ['d', 50],
    ]);
    expect(P(r.state, 'a').cash).toBe(110);
    expect(r.state.pendingPayments).toEqual([]);
    expect(r.state.phase).toBe('action');
  });

  it('a birthday debt belongs to the other player while the turn owner waits', () => {
    const s = newGame();
    P(s, 'b').cash = 5;
    P(s, 'a').position = 14;
    give(s, 'b', 5);
    topCard(s, 'chest', 8);
    let r = roll(s, 1, 2);
    expect(r.state.phase).toBe('debt');
    expect(r.state.debt).toMatchObject({ debtor: 'b', creditor: 'a', amount: 10 });
    expect(r.state.pendingPayments).toHaveLength(1);
    expect(cur(r.state)).toBe('a');
    expect(legalActions(r.state, 'b')).toEqual(['declareBankruptcy', 'mortgage', 'proposeTrade', 'resign']);
    expect(legalActions(r.state, 'a')).toEqual(['proposeTrade', 'resign']);
    r = act(r.state, 'b', { type: 'mortgage', space: 5 });
    r = act(r.state, 'b', { type: 'payDebt' });
    expect(P(r.state, 'a').cash).toBe(1520);
    expect(P(r.state, 'c').cash).toBe(1490);
    expect(r.state.phase).toBe('action');
    expect(cur(r.state)).toBe('a');
  });
});

describe('bankruptcy', () => {
  it('to a player hands over cash, properties (buildings sold first), cards and interest', () => {
    const s = newGame();
    P(s, 'a').cash = 100;
    P(s, 'a').jailCards = 1;
    s.jailCardOrigins.a = ['chance'];
    s.chanceDeck = s.chanceDeck.filter((id) => id !== 7);
    give(s, 'a', [37, 39], { houses: 2 });
    s.housesLeft = 28;
    give(s, 'a', 5, { mortgaged: true });
    give(s, 'b', [1, 3], { houses: 5 });
    give(s, 'a', 12);
    s.trades.push({ id: 't9', from: 'c', to: 'a', offer: side({ cash: 1 }), request: side() });
    let r = roll(s, 1, 2); // rent 450
    expect(r.state.phase).toBe('debt');
    r = act(r.state, 'a', { type: 'declareBankruptcy' });
    const paid = ev(r.events, 'paid');
    expect(paid).toEqual([
      { type: 'paid', from: null, to: 'a', amount: 400, reason: 'Buildings sold to the bank' }, // 4 houses at $100
      { type: 'paid', from: 'a', to: 'b', amount: 500, reason: 'Bankruptcy' },
      { type: 'paid', from: 'b', to: null, amount: 10, reason: 'Interest on mortgaged Reading Railroad' },
    ]);
    expect(ev(r.events, 'bankrupt')).toEqual([{ type: 'bankrupt', player: 'a', creditor: 'b' }]);
    expect(ev(r.events, 'tradeRejected')).toHaveLength(1);
    expect(ev(r.events, 'turnEnded')).toEqual([{ type: 'turnEnded', player: 'a' }]);
    expect(ev(r.events, 'turnStarted')).toEqual([{ type: 'turnStarted', player: 'b', turnNumber: 2 }]);
    const a = P(r.state, 'a');
    const b = P(r.state, 'b');
    expect(a).toMatchObject({ bankrupt: true, cash: 0, jailCards: 0 });
    expect(b).toMatchObject({ cash: 1990, jailCards: 1 });
    expect(r.state.jailCardOrigins).toEqual({ b: ['chance'] });
    expect(r.state.properties[37]).toEqual({ owner: 'b', houses: 0, mortgaged: false });
    expect(r.state.properties[39]).toEqual({ owner: 'b', houses: 0, mortgaged: false });
    expect(r.state.properties[5]).toEqual({ owner: 'b', houses: 0, mortgaged: true });
    expect(r.state.properties[12].owner).toBe('b');
    expect(r.state.housesLeft).toBe(32);
    expect(r.state.trades).toEqual([]);
    expect(r.state.debt).toBeNull();
    expect(r.state.phase).toBe('roll');
    expect(cur(r.state)).toBe('b');
    expect(legalActions(r.state, 'a')).toEqual([]);
  });

  it('skips the interest when the creditor cannot afford it', () => {
    const s = newGame();
    P(s, 'a').cash = 0;
    P(s, 'b').cash = 5;
    give(s, 'a', 39, { mortgaged: true });
    give(s, 'b', 3);
    let r = roll(s, 1, 2);
    r = act(r.state, 'a', { type: 'declareBankruptcy' });
    expect(ev(r.events, 'paid')).toHaveLength(0);
    expect(P(r.state, 'b').cash).toBe(5);
    expect(r.state.properties[39]).toEqual({ owner: 'b', houses: 0, mortgaged: true });
  });

  it('to the bank frees the properties and returns cards and buildings', () => {
    const s = newGame();
    P(s, 'a').cash = 10;
    P(s, 'a').jailCards = 1;
    s.jailCardOrigins.a = ['chest'];
    s.chestDeck = s.chestDeck.filter((id) => id !== 4);
    give(s, 'a', 37, { houses: 4 });
    give(s, 'a', 39, { houses: 5 });
    s.housesLeft = 28;
    s.hotelsLeft = 11;
    give(s, 'a', 5, { mortgaged: true });
    let r = roll(s, 1, 3); // Income Tax 200
    expect(r.state.debt).toMatchObject({ creditor: null, amount: 200 });
    expect(legalActions(r.state, 'a')).toEqual(['declareBankruptcy', 'sellHouse', 'proposeTrade', 'resign']);
    r = act(r.state, 'a', { type: 'declareBankruptcy' });
    expect(ev(r.events, 'bankrupt')).toEqual([{ type: 'bankrupt', player: 'a', creditor: null }]);
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: null, amount: 10, reason: 'Bankruptcy' }]);
    for (const i of [5, 37, 39]) expect(r.state.properties[i]).toEqual({ owner: null, houses: 0, mortgaged: false });
    expect(r.state.housesLeft).toBe(32);
    expect(r.state.hotelsLeft).toBe(12);
    expect(r.state.chestDeck).toHaveLength(16);
    expect(r.state.chestDeck.at(-1)).toBe(4);
    expect(P(r.state, 'a')).toMatchObject({ bankrupt: true, cash: 0, jailCards: 0 });
    expect(cur(r.state)).toBe('b');
  });

  it('a non-current debtor going bankrupt lets the turn continue', () => {
    const s = newGame();
    P(s, 'b').cash = 5;
    P(s, 'a').position = 14;
    give(s, 'b', 3);
    topCard(s, 'chest', 8);
    let r = roll(s, 1, 2); // birthday: b cannot pay
    r = act(r.state, 'b', { type: 'declareBankruptcy' });
    expect(P(r.state, 'b').bankrupt).toBe(true);
    expect(P(r.state, 'a').cash).toBe(1515); // b's 5 + c's 10
    expect(r.state.properties[3].owner).toBe('a');
    expect(P(r.state, 'c').cash).toBe(1490);
    expect(r.state.phase).toBe('action');
    expect(cur(r.state)).toBe('a');
    const next = act(r.state, 'a', { type: 'endTurn' }).state;
    expect(cur(next)).toBe('c');
  });

  it('ends the game when a single player remains', () => {
    const s = newGame({}, 2);
    P(s, 'a').cash = 0;
    give(s, 'b', 3);
    let r = roll(s, 1, 2);
    r = act(r.state, 'a', { type: 'declareBankruptcy' });
    expect(r.state.phase).toBe('ended');
    expect(r.state.winner).toBe('b');
    expect(r.events.at(-1)).toEqual({ type: 'gameOver', winner: 'b' });
    expect(legalActions(r.state, 'b')).toEqual([]);
    expect(fails(r.state, 'b', { type: 'roll' })).toMatch(/over/);
  });

  it('resigning during your own debt is a bankruptcy to the bank, and a resigning creditor clears the debt', () => {
    let r = rentDebt();
    r = act(r.state, 'a', { type: 'resign' });
    expect(ev(r.events, 'bankrupt')).toEqual([{ type: 'bankrupt', player: 'a', creditor: null }]);
    expect(r.state.properties[39].owner).toBeNull();
    expect(P(r.state, 'b').cash).toBe(1500);
    expect(r.state.debt).toBeNull();
    expect(cur(r.state)).toBe('b');
    expect(r.state.phase).toBe('roll');

    r = rentDebt();
    r = act(r.state, 'b', { type: 'resign' });
    expect(r.state.debt).toBeNull();
    expect(P(r.state, 'a').cash).toBe(300);
    expect(r.state.properties[3]).toEqual({ owner: null, houses: 0, mortgaged: false });
    expect(r.state.phase).toBe('action');
    expect(cur(r.state)).toBe('a');
  });
});

describe('trades', () => {
  function ready(): GameState {
    const s = newGame();
    give(s, 'a', [3, 39]);
    give(s, 'b', [5, 12]);
    return s;
  }

  it('propose, accept and swap everything', () => {
    let s = ready();
    let r = act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ cash: 50, properties: [3] }), request: side({ properties: [12, 5] }) });
    const trade = { id: 't1', from: 'a', to: 'b', offer: side({ cash: 50, properties: [3] }), request: side({ properties: [5, 12] }) };
    expect(r.events).toEqual([{ type: 'tradeProposed', trade }]);
    expect(r.state.trades).toEqual([trade]);
    s = r.state;
    expect(legalActions(s, 'b')).toEqual(['proposeTrade', 'acceptTrade', 'rejectTrade', 'resign']);
    expect(legalActions(s, 'a')).toEqual(['roll', 'mortgage', 'proposeTrade', 'rejectTrade', 'resign']);
    expect(fails(s, 'a', { type: 'acceptTrade', tradeId: 't1' })).toMatch(/not allowed/);
    expect(fails(s, 'c', { type: 'rejectTrade', tradeId: 't1' })).toMatch(/not allowed/);
    r = act(s, 'b', { type: 'acceptTrade', tradeId: 't1' });
    expect(r.events).toEqual([{ type: 'tradeAccepted', trade }]);
    expect(r.state.trades).toEqual([]);
    expect(P(r.state, 'a').cash).toBe(1450);
    expect(P(r.state, 'b').cash).toBe(1550);
    expect(r.state.properties[3].owner).toBe('b');
    expect(r.state.properties[5].owner).toBe('a');
    expect(r.state.properties[12].owner).toBe('a');
    expect(r.state.properties[39].owner).toBe('a');
  });

  it('can be rejected by the recipient or cancelled by the proposer', () => {
    let s = ready();
    s = act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ cash: 10 }), request: side() }).state;
    s = act(s, 'b', { type: 'proposeTrade', to: 'a', offer: side({ cash: 10 }), request: side() }).state;
    expect(s.trades.map((t) => t.id)).toEqual(['t1', 't2']);
    let r = act(s, 'b', { type: 'rejectTrade', tradeId: 't1' });
    expect(r.events[0]).toMatchObject({ type: 'tradeRejected', trade: { id: 't1' } });
    r = act(r.state, 'b', { type: 'rejectTrade', tradeId: 't2' });
    expect(r.state.trades).toEqual([]);
    expect(fails(r.state, 'b', { type: 'rejectTrade', tradeId: 't2' })).toMatch(/not allowed/);
  });

  it('charges 10% interest to whoever receives a mortgaged property', () => {
    const s = ready();
    give(s, 'b', 5, { mortgaged: true });
    s.config.freeParkingJackpot = true;
    let r = act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [3] }), request: side({ properties: [5] }) });
    r = act(r.state, 'b', { type: 'acceptTrade', tradeId: 't1' });
    expect(ev(r.events, 'paid')).toEqual([{ type: 'paid', from: 'a', to: null, amount: 10, reason: 'Interest on mortgaged Reading Railroad' }]);
    expect(P(r.state, 'a').cash).toBe(1490);
    expect(r.state.freeParkingPot).toBe(10);
    expect(r.state.properties[5]).toEqual({ owner: 'a', houses: 0, mortgaged: true });
  });

  it('refuses properties with buildings or in a group with buildings anywhere', () => {
    const s = ready();
    give(s, 'a', 1, { houses: 1 });
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [1] }), request: side() })).toMatch(/buildings/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [3] }), request: side() })).toMatch(/brown group has buildings/);
    expect(act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [39] }), request: side() }).state.trades).toHaveLength(1);
  });

  it('validates ownership, cash and shape', () => {
    const s = ready();
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [5] }), request: side() })).toMatch(/does not own/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side(), request: side({ properties: [39] }) })).toMatch(/does not own/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'a', offer: side({ cash: 1 }), request: side() })).toMatch(/yourself/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'zzz', offer: side({ cash: 1 }), request: side() })).toMatch(/not in the game/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side(), request: side() })).toMatch(/empty/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ cash: -5 }), request: side() })).toMatch(/cash/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ jailCards: 1 }), request: side() })).toMatch(/Jail Free/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [0] }), request: side() })).toMatch(/Invalid property/);
    expect(fails(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [3, 3] }), request: side() })).toMatch(/Duplicate/);
    // cash is only checked at acceptance
    let r = act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [3] }), request: side({ cash: 2000 }) });
    expect(canAcceptTrade(r.state, 'b', r.state.trades[0]).reason).toMatch(/cannot afford/);
    expect(legalActions(r.state, 'b')).not.toContain('acceptTrade');
    expect(fails(r.state, 'b', { type: 'acceptTrade', tradeId: 't1' })).toMatch(/not allowed/);
    P(r.state, 'b').cash = 2000;
    expect(legalActions(r.state, 'b')).toContain('acceptTrade');
    r = act(r.state, 'b', { type: 'acceptTrade', tradeId: 't1' });
    expect(P(r.state, 'b').cash).toBe(0);
  });

  it('moves Get Out of Jail Free cards with their deck of origin', () => {
    const s = ready();
    P(s, 'a').jailCards = 2;
    s.jailCardOrigins.a = ['chest', 'chance'];
    let r = act(s, 'a', { type: 'proposeTrade', to: 'b', offer: side({ jailCards: 1 }), request: side({ cash: 25 }) });
    r = act(r.state, 'b', { type: 'acceptTrade', tradeId: 't1' });
    expect(P(r.state, 'a')).toMatchObject({ jailCards: 1, cash: 1525 });
    expect(P(r.state, 'b')).toMatchObject({ jailCards: 1, cash: 1475 });
    expect(r.state.jailCardOrigins).toEqual({ a: ['chance'], b: ['chest'] });
  });

  it('is not possible during an auction, and dead offers are pruned when things change', () => {
    let t = ready();
    t = act(t, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [39] }), request: side({ cash: 100 }) }).state;
    P(t, 'a').position = 4;
    t = roll(t, 1, 1).state; // -> 6 Oriental Avenue, unowned
    expect(t.phase).toBe('buy');
    expect(legalActions(t, 'b')).toContain('acceptTrade');
    t = act(t, 'a', { type: 'decline' }).state;
    expect(t.phase).toBe('auction');
    expect(legalActions(t, 'b')).toEqual(['bid', 'passAuction', 'resign']);
    expect(fails(t, 'b', { type: 'acceptTrade', tradeId: 't1' })).toMatch(/not allowed/);
    expect(fails(t, 'c', { type: 'proposeTrade', to: 'a', offer: side({ cash: 1 }), request: side() })).toMatch(/not allowed/);
    // pruning: a builds on the offered group -> the offer dies
    let u = ready();
    give(u, 'a', [37, 39]);
    u = act(u, 'a', { type: 'proposeTrade', to: 'b', offer: side({ properties: [39] }), request: side({ cash: 100 }) }).state;
    const built = act(u, 'a', { type: 'build', space: 37 });
    expect(ev(built.events, 'tradeRejected')).toHaveLength(1);
    expect(built.state.trades).toEqual([]);
  });
});
