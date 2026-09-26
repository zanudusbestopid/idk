import { describe, expect, it } from 'vitest';
import type { Action, GameState, Trade, TradeSide } from '../shared/types';
import { type Difficulty, cashReserve, chooseBotAction, debtAction, propertyValueFor, tradeGainFor } from './bot';
import { applyAction, legalActions, netWorth } from './engine';
import { P, give, newGame } from './test-helpers';

const side = (o: Partial<TradeSide> = {}): TradeSide => ({ cash: 0, properties: [], jailCards: 0, ...o });
const trade = (from: string, to: string, offer: Partial<TradeSide>, request: Partial<TradeSide>): Trade => ({ id: 't1', from, to, offer: side(offer), request: side(request) });

function lcg(seed: number) {
  let s = (Math.imul(seed, 2654435761) ^ 0x9e3779b9) >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  next();
  next();
  return next;
}

/** Put a player into a debt phase by hand. */
function inDebt(s: GameState, debtor: string, amount: number, creditor: string | null = null): GameState {
  s.phase = 'debt';
  s.debt = { debtor, creditor, amount, reason: 'test' };
  return s;
}

interface GameResult { state: GameState; steps: number; botTime: number; calls: number }

/**
 * Play a game of all-bot players: at every step the first player (starting
 * from the one on turn) who has something to do acts. Every returned action
 * is checked against the engine's legal list.
 */
function playGame(seed: number, difficulties: Difficulty[], maxTurns = 400): GameResult {
  let s = newGame({}, difficulties.length, seed);
  const rnd = lcg(seed);
  let steps = 0;
  let calls = 0;
  let botTime = 0;
  while (s.phase !== 'ended' && s.turnNumber <= maxTurns) {
    let moved = false;
    const n = s.players.length;
    for (let k = 0; k < n; k++) {
      const i = (s.currentPlayer + k) % n;
      const p = s.players[i];
      if (p.bankrupt) continue;
      const t0 = performance.now();
      const action = chooseBotAction(s, p.id, rnd, { difficulty: difficulties[i] });
      botTime += performance.now() - t0;
      calls++;
      if (!action) continue;
      const legal = legalActions(s, p.id);
      if (!legal.includes(action.type)) throw new Error(`seed ${seed} step ${steps}: illegal ${action.type} by ${p.id} (legal: ${legal.join(',')})`);
      if (action.type === 'resign') throw new Error(`seed ${seed}: bot resigned`);
      const r = applyAction(s, p.id, action);
      if (!r.ok) throw new Error(`seed ${seed} step ${steps}: ${action.type} by ${p.id} refused: ${r.error}`);
      s = r.state;
      moved = true;
      break;
    }
    if (!moved) throw new Error(`seed ${seed} step ${steps}: nobody acted in phase ${s.phase}`);
    if (++steps > 30_000) throw new Error(`seed ${seed}: runaway game`);
  }
  return { state: s, steps, botTime, calls };
}

/** Winner of a finished game, or the richest player at the cap. */
function winnerOf(s: GameState): string {
  if (s.winner) return s.winner;
  return s.players.filter((p) => !p.bankrupt).sort((a, b) => netWorth(s, b.id) - netWorth(s, a.id))[0].id;
}

describe('valuation', () => {
  it('a street completing my set is worth far more than a lone street', () => {
    const s = newGame();
    give(s, 'a', [16, 18]);
    const completing = propertyValueFor(s, 'a', 19);
    const lone = propertyValueFor(s, 'a', 21);
    expect(completing).toBeGreaterThan(2 * (s.board[19].price ?? 0));
    expect(completing).toBeGreaterThan(2 * lone);
  });

  it('a street in a group split among two opponents is worth about face value', () => {
    const s = newGame();
    give(s, 'b', 21);
    give(s, 'c', 23);
    const v = propertyValueFor(s, 'a', 24);
    expect(v).toBeGreaterThan(200);
    expect(v).toBeLessThanOrEqual(240);
  });

  it('a street that would complete an opponent set carries a block premium, largest on hard', () => {
    const s = newGame();
    give(s, 'b', [21, 23]);
    const price = s.board[24].price ?? 0;
    const easy = propertyValueFor(s, 'a', 24, { difficulty: 'easy' });
    const normal = propertyValueFor(s, 'a', 24, { difficulty: 'normal' });
    const hard = propertyValueFor(s, 'a', 24, { difficulty: 'hard' });
    expect(easy).toBeGreaterThan(price);
    expect(normal).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(normal);
    expect(hard).toBeGreaterThanOrEqual(price * 1.7);
  });

  it('prefers the high rent-per-cost groups', () => {
    const s = newGame();
    give(s, 'a', [16, 18]); // orange, missing 19 (price 200)
    give(s, 'a', [31, 32]); // green, missing 34 (price 320)
    expect(propertyValueFor(s, 'a', 19) / 200).toBeGreaterThan(propertyValueFor(s, 'a', 34) / 320);
  });

  it('railroads gain value with each one already held', () => {
    const s = newGame();
    const one = propertyValueFor(s, 'a', 5);
    give(s, 'a', [15, 25]);
    expect(propertyValueFor(s, 'a', 5)).toBeGreaterThan(one);
  });

  it('discounts a mortgaged property', () => {
    const s = newGame();
    const clean = propertyValueFor(s, 'a', 24);
    give(s, 'b', 24, { mortgaged: true });
    expect(propertyValueFor(s, 'a', 24)).toBeLessThan(clean);
  });
});

describe('cash reserve', () => {
  it('grows when an opponent has a hotel just ahead', () => {
    const s = newGame();
    P(s, 'a').position = 16;
    const before = cashReserve(s, 'a');
    give(s, 'b', [21, 23, 24], { houses: 5 }); // Illinois hotel: 1100, 8 spaces ahead
    const after = cashReserve(s, 'a');
    expect(after).toBeGreaterThan(before + 200);
    expect(cashReserve(s, 'a', { difficulty: 'hard' })).toBeGreaterThanOrEqual(1100);
    expect(cashReserve(s, 'a', { difficulty: 'easy' })).toBeLessThan(cashReserve(s, 'a', { difficulty: 'hard' }));
  });

  it('ignores built streets that are behind or out of dice range', () => {
    const s = newGame();
    P(s, 'a').position = 30;
    give(s, 'b', [21, 23, 24]);
    give(s, 'b', [1, 3]);
    const before = cashReserve(s, 'a');
    give(s, 'b', [21, 23, 24], { houses: 5 }); // behind the bot
    expect(cashReserve(s, 'a')).toBe(before);
    give(s, 'b', [1, 3], { houses: 5 }); // 11 and 13 spaces ahead: only Mediterranean counts
    expect(cashReserve(s, 'a')).toBeGreaterThan(before);
  });

  it('is larger on hard than on easy in the same spot', () => {
    const s = newGame();
    give(s, 'b', [11, 13, 14], { houses: 3 });
    P(s, 'a').position = 5;
    expect(cashReserve(s, 'a', { difficulty: 'hard' })).toBeGreaterThan(cashReserve(s, 'a', { difficulty: 'normal' }));
    expect(cashReserve(s, 'a', { difficulty: 'normal' })).toBeGreaterThan(cashReserve(s, 'a', { difficulty: 'easy' }));
  });
});

describe('auctions', () => {
  function auction(s: GameState, space: number, current: string, highBid = 0, highBidder: string | null = null): GameState {
    s.phase = 'auction';
    s.auction = { space, highBid, highBidder, active: s.players.map((p) => p.id), passed: [], current };
    return s;
  }

  it('bids up to its valuation and passes above it', () => {
    const s = auction(newGame(), 24, 'a');
    const value = propertyValueFor(s, 'a', 24, { difficulty: 'hard' });
    const r = lcg(1);
    const first = chooseBotAction(s, 'a', r, { difficulty: 'hard' });
    expect(first).toMatchObject({ type: 'bid' });
    expect((first as { amount: number }).amount).toBeLessThanOrEqual(value);
    const high = auction(newGame(), 24, 'a', Math.ceil(value * 1.04) + 1, 'b'); // above the valuation even with hard's 3% noise
    expect(chooseBotAction(high, 'a', r, { difficulty: 'hard' })).toEqual({ type: 'passAuction' });
  });

  it('goes above the rival cash to block a set, within reason', () => {
    const s = auction(newGame(), 24, 'a', 300, 'c');
    give(s, 'b', [21, 23]);
    P(s, 'b').cash = 320;
    P(s, 'a').cash = 1500;
    // 300 is already above a lone street's value, but b would complete red with it
    const a = chooseBotAction(s, 'a', lcg(2), { difficulty: 'hard' });
    expect(a).toMatchObject({ type: 'bid' });
    expect((a as { amount: number }).amount).toBeGreaterThan(300);
    expect((a as { amount: number }).amount).toBeLessThanOrEqual(321);
    // but not beyond reason
    P(s, 'b').cash = 1400;
    s.auction!.highBid = 700;
    expect(chooseBotAction(s, 'a', lcg(2), { difficulty: 'hard' })).toEqual({ type: 'passAuction' });
  });

  it('hard bids in smaller steps than easy', () => {
    const hard = chooseBotAction(auction(newGame(), 24, 'a'), 'a', lcg(3), { difficulty: 'hard' }) as { amount: number };
    const easy = chooseBotAction(auction(newGame(), 24, 'a'), 'a', lcg(3), { difficulty: 'easy' }) as { amount: number };
    expect(hard.amount).toBeLessThan(easy.amount);
  });

  it('never bids more than its cash', () => {
    const s = auction(newGame(), 24, 'a', 100, 'b');
    give(s, 'a', [21, 23]);
    P(s, 'a').cash = 105;
    const a = chooseBotAction(s, 'a', lcg(4), { difficulty: 'hard' });
    if (a?.type === 'bid') expect(a.amount).toBeLessThanOrEqual(105);
    else expect(a).toEqual({ type: 'passAuction' });
  });
});

describe('trades', () => {
  it('rejects handing an opponent their last street for a little cash', () => {
    const s = newGame();
    give(s, 'a', 19);
    give(s, 'b', [16, 18]);
    const t = trade('b', 'a', { cash: 250 }, { properties: [19] });
    s.trades = [t];
    expect(tradeGainFor(s, 'a', t, { difficulty: 'hard' })).toBeLessThan(0);
    expect(chooseBotAction(s, 'a', lcg(5), { difficulty: 'hard' })).toEqual({ type: 'rejectTrade', tradeId: 't1' });
  });

  it('accepts a swap where both sides complete a set', () => {
    const s = newGame();
    give(s, 'a', [19, 21, 23]);
    give(s, 'b', [16, 18, 24]);
    const t = trade('b', 'a', { properties: [24] }, { properties: [19] });
    s.trades = [t];
    expect(tradeGainFor(s, 'a', t, { difficulty: 'hard' })).toBeGreaterThan(0);
    expect(chooseBotAction(s, 'a', lcg(6), { difficulty: 'hard' })).toEqual({ type: 'acceptTrade', tradeId: 't1' });
  });

  it('accepts a generous cash offer for a street it has no use for', () => {
    const s = newGame();
    give(s, 'a', 5);
    give(s, 'b', 21);
    give(s, 'c', 23);
    const t = trade('b', 'a', { cash: 400 }, { properties: [5] });
    s.trades = [t];
    expect(chooseBotAction(s, 'a', lcg(7), { difficulty: 'hard' })).toEqual({ type: 'acceptTrade', tradeId: 't1' });
  });

  it('hard needs a clear margin where easy sometimes takes a mildly bad deal', () => {
    const s = newGame();
    give(s, 'a', 24);
    give(s, 'b', 21);
    give(s, 'c', 23);
    // clearly less than face value for a street that is only trade bait
    const t = trade('b', 'a', { cash: 190 }, { properties: [24] });
    s.trades = [t];
    expect(chooseBotAction(s, 'a', lcg(8), { difficulty: 'hard' })).toEqual({ type: 'rejectTrade', tradeId: 't1' });
    let accepted = 0;
    for (let seed = 1; seed <= 40; seed++) {
      if (chooseBotAction(s, 'a', lcg(seed), { difficulty: 'easy' })?.type === 'acceptTrade') accepted++;
    }
    expect(accepted).toBeGreaterThan(0);
    expect(accepted).toBeLessThan(40);
  });

  it('proposes cash for the last street of its set and never the same trade twice in a row', () => {
    let s = newGame();
    give(s, 'a', [16, 18]);
    give(s, 'b', 19);
    s.phase = 'action';
    s.dice = [3, 4];
    const rnd = () => 0; // always looks for a trade
    const first = chooseBotAction(s, 'a', rnd, { difficulty: 'hard' });
    expect(first).toMatchObject({ type: 'proposeTrade', to: 'b', request: { properties: [19] } });
    const offer = (first as Extract<Action, { type: 'proposeTrade' }>).offer;
    expect(offer.cash).toBeGreaterThanOrEqual(200 * 1.4);
    expect(offer.cash).toBeLessThanOrEqual(200 * 1.7);
    const r1 = applyAction(s, 'a', first!);
    if (!r1.ok) throw new Error(r1.error);
    s = r1.state;
    // b turns it down; a's next turn must not repeat the identical offer
    const r2 = applyAction(s, 'b', { type: 'rejectTrade', tradeId: s.trades[0].id });
    if (!r2.ok) throw new Error(r2.error);
    s = r2.state;
    const again = chooseBotAction(s, 'a', rnd, { difficulty: 'hard' });
    expect(again).toEqual({ type: 'endTurn' });
  });

  it('proposes a swap that completes a set on each side', () => {
    const s = newGame();
    give(s, 'a', [19, 21, 23]);
    give(s, 'b', [16, 18, 24]);
    s.phase = 'action';
    s.dice = [3, 4];
    const a = chooseBotAction(s, 'a', () => 0, { difficulty: 'hard' });
    expect(a).toMatchObject({ type: 'proposeTrade', to: 'b' });
    const t = a as Extract<Action, { type: 'proposeTrade' }>;
    expect(t.request.properties).toEqual([24]);
    expect(t.offer.properties).toEqual([19]);
  });
});

describe('debt liquidation', () => {
  it('mortgages a lone railroad before touching the buildings of a set', () => {
    const s = inDebt(newGame(), 'a', 250, 'b');
    P(s, 'a').cash = 100;
    give(s, 'a', 5);
    give(s, 'a', [16, 18, 19], { houses: 3 });
    give(s, 'a', 39); // Park Place's partner belongs to b: an uncompletable street
    give(s, 'b', 37);
    const legal = new Set(legalActions(s, 'a'));
    expect(debtAction(s, 'a', legal)).toEqual({ type: 'mortgage', space: 5 });
  });

  it('sells houses from the least valuable group first', () => {
    const s = inDebt(newGame(), 'a', 500, 'b');
    P(s, 'a').cash = 50;
    give(s, 'a', [1, 3], { houses: 3 });
    give(s, 'a', [16, 18, 19], { houses: 3 });
    const legal = new Set(legalActions(s, 'a'));
    const a = debtAction(s, 'a', legal);
    expect(a?.type).toBe('sellHouse');
    expect([1, 3]).toContain((a as { space: number }).space);
  });

  it('mortgages set streets last and pays as soon as it can', () => {
    let s = inDebt(newGame(), 'a', 120, 'b');
    P(s, 'a').cash = 20;
    give(s, 'a', [16, 18, 19]);
    give(s, 'a', 12);
    let a = debtAction(s, 'a', new Set(legalActions(s, 'a')));
    expect(a).toEqual({ type: 'mortgage', space: 12 }); // utility (75) first even though it does not cover the debt alone
    s = (applyAction(s, 'a', a!) as { state: GameState }).state;
    a = debtAction(s, 'a', new Set(legalActions(s, 'a')));
    expect(a?.type).toBe('mortgage');
    expect([16, 18, 19]).toContain((a as { space: number }).space);
    s = (applyAction(s, 'a', a!) as { state: GameState }).state;
    expect(debtAction(s, 'a', new Set(legalActions(s, 'a')))).toEqual({ type: 'payDebt' });
  });

  it('declares bankruptcy only when nothing is left to raise', () => {
    const s = inDebt(newGame(), 'a', 5000, 'b');
    P(s, 'a').cash = 10;
    expect(debtAction(s, 'a', new Set(legalActions(s, 'a')))).toEqual({ type: 'declareBankruptcy' });
  });
});

describe('building', () => {
  it('brings a set to three houses each before adding a fourth', () => {
    const s = newGame();
    s.phase = 'action';
    s.dice = [3, 4];
    P(s, 'a').cash = 3000;
    give(s, 'a', [16, 18, 19], { houses: 3 });
    give(s, 'a', [1, 3], { houses: 1 });
    const a = chooseBotAction(s, 'a', lcg(9), { difficulty: 'hard' });
    expect(a?.type).toBe('build');
    expect([1, 3]).toContain((a as { space: number }).space);
  });

  it('keeps its reserve when an opponent hotel is ahead', () => {
    const s = newGame();
    s.phase = 'action';
    s.dice = [3, 4];
    P(s, 'a').position = 30;
    P(s, 'a').cash = 1200;
    give(s, 'a', [16, 18, 19]);
    give(s, 'b', [37, 39]);
    expect(chooseBotAction(s, 'a', lcg(10), { difficulty: 'hard' })?.type).toBe('build');
    give(s, 'b', [37, 39], { houses: 5 }); // Boardwalk hotel 9 ahead: 2000
    expect(chooseBotAction(s, 'a', lcg(10), { difficulty: 'hard' })?.type).not.toBe('build');
  });
});

describe('jail', () => {
  it('pays to get out early in the game and sits tight late when opponents have built', () => {
    const s = newGame();
    P(s, 'a').inJail = true;
    P(s, 'a').position = 10;
    expect(chooseBotAction(s, 'a', lcg(11), { difficulty: 'hard' })).toEqual({ type: 'payJailFine' });
    for (const i of Object.keys(s.properties).map(Number)) give(s, 'b', i);
    give(s, 'b', [11, 13, 14], { houses: 3 });
    expect(chooseBotAction(s, 'a', lcg(11), { difficulty: 'hard' })).toEqual({ type: 'roll' });
  });

  it('uses a jail card rather than paying', () => {
    const s = newGame();
    P(s, 'a').inJail = true;
    P(s, 'a').position = 10;
    P(s, 'a').jailCards = 1;
    s.jailCardOrigins.a = ['chance'];
    expect(chooseBotAction(s, 'a', lcg(12), { difficulty: 'normal' })).toEqual({ type: 'useJailCard' });
  });
});

describe('full games', () => {
  it('only ever returns legal actions across 20 all-bot games', { timeout: 60_000 }, () => {
    const levels: Difficulty[] = ['easy', 'normal', 'hard'];
    let finished = 0;
    let calls = 0;
    let botTime = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const n = 2 + (seed % 3);
      const diffs = Array.from({ length: n }, (_, i) => levels[(seed + i) % 3]);
      const r = playGame(seed, diffs);
      if (r.state.phase === 'ended') finished++;
      calls += r.calls;
      botTime += r.botTime;
    }
    expect(finished).toBeGreaterThan(0);
    expect(botTime / calls).toBeLessThan(2);
  });

  it('is deterministic given the same random sequence', () => {
    const a = playGame(3, ['hard', 'normal'], 60).state;
    const b = playGame(3, ['hard', 'normal'], 60).state;
    expect(a).toEqual(b);
  });

  it('hard beats easy in at least 55% of 60 two-player games', { timeout: 120_000 }, () => {
    let hardWins = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const hardFirst = seed % 2 === 1;
      const diffs: Difficulty[] = hardFirst ? ['hard', 'easy'] : ['easy', 'hard'];
      const r = playGame(1000 + seed, diffs);
      const hardId = hardFirst ? 'a' : 'b';
      if (winnerOf(r.state) === hardId) hardWins++;
    }
    expect(hardWins / 60).toBeGreaterThanOrEqual(0.55);
  });
});
