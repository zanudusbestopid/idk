/**
 * Randomized play-through: many seeds, random legal actions, invariants
 * checked after every step. Catches state corruption the scenario tests miss.
 */
import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../shared/types';
import { applyAction, canAcceptTrade, canBuild, canMortgage, canRejectTrade, canSellHouse, canUnmortgage, legalActions, ownedSpaces } from './engine';
import { newGame } from './test-helpers';

const BLOCKING = new Set<Action['type']>(['roll', 'buy', 'decline', 'bid', 'passAuction', 'payDebt', 'declareBankruptcy', 'endTurn']);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function checkInvariants(s: GameState, step: number): void {
  const ctx = `step ${step}`;
  let houses = 0;
  let hotels = 0;
  for (const [idx, ps] of Object.entries(s.properties)) {
    if (ps.houses === 5) hotels++;
    else houses += ps.houses;
    if (ps.owner !== null) {
      const owner = s.players.find((p) => p.id === ps.owner);
      assert(owner && !owner.bankrupt, `${ctx}: bad owner of ${idx}`);
    } else {
      assert(ps.houses === 0 && !ps.mortgaged, `${ctx}: bank property ${idx} has buildings or mortgage`);
    }
  }
  assert(houses + s.housesLeft === 32, `${ctx}: house supply ${houses} + ${s.housesLeft}`);
  assert(hotels + s.hotelsLeft === 12, `${ctx}: hotel supply ${hotels} + ${s.hotelsLeft}`);
  let heldChance = 0;
  let heldChest = 0;
  for (const p of s.players) {
    assert(p.cash >= 0, `${ctx}: negative cash for ${p.id}`);
    assert(p.position >= 0 && p.position < 40, `${ctx}: position of ${p.id}`);
    assert(!p.inJail || p.position === 10, `${ctx}: jailed ${p.id} not on jail space`);
    const origins = s.jailCardOrigins[p.id] ?? [];
    assert(origins.length === p.jailCards, `${ctx}: jail card origins of ${p.id}`);
    heldChance += origins.filter((o) => o === 'chance').length;
    heldChest += origins.filter((o) => o === 'chest').length;
    if (p.bankrupt) {
      assert(p.jailCards === 0 && ownedSpaces(s, p.id).length === 0, `${ctx}: bankrupt ${p.id} still owns things`);
    }
  }
  assert(new Set(s.chanceDeck).size === s.chanceDeck.length, `${ctx}: duplicate chance cards`);
  assert(new Set(s.chestDeck).size === s.chestDeck.length, `${ctx}: duplicate chest cards`);
  assert(s.chanceDeck.length + heldChance === 16, `${ctx}: chance deck count`);
  assert(s.chestDeck.length + heldChest === 16, `${ctx}: chest deck count`);
  assert(s.log.length <= 200, `${ctx}: log overflow`);
  const alive = s.players.filter((p) => !p.bankrupt);
  if (s.phase === 'ended') {
    assert(alive.length === 1 && alive[0].id === s.winner, `${ctx}: bad winner`);
  } else {
    assert(alive.length > 1, `${ctx}: game should have ended`);
    const actors = s.players.filter((p) => legalActions(s, p.id).some((t) => BLOCKING.has(t)));
    assert(actors.length > 0, `${ctx}: nobody can act in phase ${s.phase}`);
    if (s.phase === 'auction') assert(s.auction!.active.includes(s.auction!.current), `${ctx}: auction current not active`);
    if (s.phase === 'debt') assert(s.debt !== null, `${ctx}: debt phase without debt`);
    if (s.phase === 'buy') assert(s.pendingSpace !== null, `${ctx}: buy phase without pending space`);
  }
}

/** Build a concrete action for a legal action type, or null if it needs parameters we cannot satisfy. */
function concrete(s: GameState, playerId: string, type: Action['type'], rnd: () => number): Action | null {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const owned = ownedSpaces(s, playerId);
  switch (type) {
    case 'bid': {
      const p = s.players.find((x) => x.id === playerId)!;
      const min = s.auction!.highBid + 1;
      const max = Math.min(p.cash, min + 50);
      return { type, amount: min + Math.floor(rnd() * (max - min + 1)) };
    }
    case 'build': {
      const c = owned.filter((i) => canBuild(s, playerId, i).ok);
      return c.length ? { type, space: pick(c) } : null;
    }
    case 'sellHouse': {
      const c = owned.filter((i) => canSellHouse(s, playerId, i).ok);
      return c.length ? { type, space: pick(c) } : null;
    }
    case 'mortgage': {
      const c = owned.filter((i) => canMortgage(s, playerId, i).ok);
      return c.length ? { type, space: pick(c) } : null;
    }
    case 'unmortgage': {
      const c = owned.filter((i) => canUnmortgage(s, playerId, i).ok);
      return c.length ? { type, space: pick(c) } : null;
    }
    case 'proposeTrade': {
      if (s.trades.filter((t) => t.from === playerId).length >= 2) return null;
      const debtor = s.phase === 'debt' ? s.debt!.debtor : null;
      const others = s.players.filter((p) => !p.bankrupt && p.id !== playerId && (debtor === null || debtor === playerId || p.id === debtor));
      if (!others.length) return null;
      const to = pick(others);
      const mine = owned.filter((i) => s.properties[i].houses === 0 && !(s.board[i].group && s.board.some((sp) => sp.group === s.board[i].group && s.properties[sp.index]?.houses > 0)));
      const theirs = ownedSpaces(s, to.id).filter((i) => s.properties[i].houses === 0 && !(s.board[i].group && s.board.some((sp) => sp.group === s.board[i].group && s.properties[sp.index]?.houses > 0)));
      const offer = { cash: rnd() < 0.5 ? Math.floor(rnd() * 200) : 0, properties: mine.length && rnd() < 0.7 ? [pick(mine)] : [], jailCards: 0 };
      const request = { cash: rnd() < 0.5 ? Math.floor(rnd() * 200) : 0, properties: theirs.length && rnd() < 0.7 ? [pick(theirs)] : [], jailCards: 0 };
      if (offer.cash === 0 && request.cash === 0 && !offer.properties.length && !request.properties.length) return null;
      return { type, to: to.id, offer, request };
    }
    case 'acceptTrade':
    case 'rejectTrade': {
      const mine = s.trades.filter((t) => (type === 'acceptTrade' ? canAcceptTrade(s, playerId, t).ok : canRejectTrade(s, playerId, t).ok));
      if (!mine.length) return null;
      return { type, tradeId: pick(mine).id };
    }
    case 'resign':
      return rnd() < 0.002 ? { type } : null;
    default:
      return { type } as Action;
  }
}

describe('random simulation', () => {
  it('keeps every invariant over thousands of random legal actions', { timeout: 60_000 }, () => {
    let endedGames = 0;
    let totalSteps = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const rnd = lcg(seed * 7919);
      const config = {
        auctions: seed % 3 !== 0,
        freeParkingJackpot: seed % 2 === 0,
        doubleGoSalary: seed % 4 === 0,
        startingCash: seed % 5 === 0 ? 400 : 1500,
      };
      let s = newGame(config, 2 + (seed % 4), seed);
      checkInvariants(s, 0);
      for (let step = 1; step <= 1200 && s.phase !== 'ended'; step++) {
        const candidates = s.players.filter((p) => legalActions(s, p.id).length > 0);
        // prefer the player who must act so the game moves along
        const must = candidates.filter((p) => legalActions(s, p.id).some((t) => BLOCKING.has(t)));
        const player = rnd() < 0.8 && must.length ? must[Math.floor(rnd() * must.length)] : candidates[Math.floor(rnd() * candidates.length)];
        const legal = legalActions(s, player.id);
        let action: Action | null = null;
        for (let tries = 0; tries < 5 && !action; tries++) {
          const t = legal[Math.floor(rnd() * legal.length)];
          // avoid instant bankruptcy spam: only declare when cash cannot be raised
          if (t === 'declareBankruptcy' && legal.some((x) => x === 'sellHouse' || x === 'mortgage' || x === 'payDebt')) continue;
          action = concrete(s, player.id, t, rnd);
        }
        if (!action) continue;
        const r = applyAction(s, player.id, action);
        assert(r.ok, `seed ${seed} step ${step}: ${action.type} by ${player.id} -> ${r.ok ? '' : r.error}`);
        s = r.state;
        totalSteps++;
        try {
          checkInvariants(s, step);
        } catch (e) {
          throw new Error(`seed ${seed}: ${(e as Error).message}`);
        }
      }
      if (s.phase === 'ended') endedGames++;
    }
    expect(totalSteps).toBeGreaterThan(15000);
    expect(endedGames).toBeGreaterThan(0);
  });
});
