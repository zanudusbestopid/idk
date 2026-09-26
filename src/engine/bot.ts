// A computer player. Pure: given a state and a player id it returns the next
// action that player would take (or null when it has nothing to do). Used by the
// single-player game and by the server when it needs to play for someone.

import { GROUPS, RAILROADS, UTILITIES } from '../shared/board';
import type { Action, GameState, Trade } from '../shared/types';
import { legalActions } from './engine';
import {
  activePlayers, canAcceptTrade, canBuild, countOwned, mortgageInterest, ownedSpaces, ownsFullGroup, unmortgageCost,
} from './queries';

const OWNABLE_COUNT = 28;

/** Share of the board's ownable spaces that already have an owner (0..1). */
export function ownedFraction(state: GameState): number {
  let n = 0;
  for (const ps of Object.values(state.properties)) if (ps.owner) n++;
  return n / OWNABLE_COUNT;
}

/** What a space is worth to this player, in dollars, given what they already own. */
export function propertyValueFor(state: GameState, playerId: string, idx: number): number {
  const s = state.board[idx];
  const price = s.price ?? 0;
  if (s.type === 'property' && s.group) {
    const g = GROUPS[s.group];
    const n = g.length;
    const mine = g.filter((i) => i !== idx && state.properties[i]?.owner === playerId).length;
    let v = price;
    if (mine === n - 1) v = price * 2.2;
    else if (mine > 0) v = price * 1.35;
    for (const p of activePlayers(state)) {
      if (p.id === playerId) continue;
      const theirs = g.filter((i) => i !== idx && state.properties[i]?.owner === p.id).length;
      if (theirs === n - 1) v += price * 0.5; // denying a monopoly is worth something
    }
    if (s.group === 'orange' || s.group === 'red' || s.group === 'lightblue') v *= 1.1;
    if (state.properties[idx]?.mortgaged) v -= mortgageInterest(s);
    return v;
  }
  if (s.type === 'railroad') return price * (1 + 0.25 * countOwned(state, playerId, RAILROADS.filter((i) => i !== idx)));
  if (s.type === 'utility') return price * (0.8 + 0.3 * countOwned(state, playerId, UTILITIES.filter((i) => i !== idx)));
  return price;
}

/** Cash a bot likes to keep on hand; grows as the board fills up and houses appear. */
export function cashReserve(state: GameState, playerId: string): number {
  let maxRent = 0;
  for (const [i, ps] of Object.entries(state.properties)) {
    if (ps.owner && ps.owner !== playerId && ps.houses > 0) {
      const rent = state.board[Number(i)].rent?.[ps.houses] ?? 0;
      if (rent > maxRent) maxRent = rent;
    }
  }
  return Math.round(100 + 150 * ownedFraction(state) + Math.min(400, maxRent * 0.5));
}

/** Net gain for the recipient of a trade, in the recipient's own valuation. */
export function tradeGainFor(state: GameState, playerId: string, trade: Trade): number {
  const iAmRecipient = trade.to === playerId;
  const received = iAmRecipient ? trade.offer : trade.request;
  const given = iAmRecipient ? trade.request : trade.offer;
  const other = iAmRecipient ? trade.from : trade.to;
  let gain = received.cash - given.cash + 50 * (received.jailCards - given.jailCards);
  for (const i of received.properties) gain += propertyValueFor(state, playerId, i);
  for (const i of given.properties) {
    gain -= propertyValueFor(state, playerId, i);
    const s = state.board[i];
    if (s.type === 'property' && s.group) {
      const rest = GROUPS[s.group].filter((x) => x !== i);
      if (rest.every((x) => state.properties[x]?.owner === other)) gain -= (s.price ?? 0) * 0.6; // hands them a monopoly
    }
  }
  return gain;
}

/** Raise cash while in debt: sell buildings first, then mortgage, then pay; bankruptcy is the last resort. */
export function debtAction(state: GameState, playerId: string, legal: Set<string>): Action | null {
  if (legal.has('payDebt')) return { type: 'payDebt' };
  const owned = ownedSpaces(state, playerId).map((index) => ({ index, ps: state.properties[index], space: state.board[index] }));
  if (legal.has('sellHouse')) {
    const withHouses = owned.filter((o) => o.ps.houses > 0).sort((a, b) => (b.space.houseCost ?? 0) - (a.space.houseCost ?? 0));
    for (const o of withHouses) if (canSellHouseSafe(state, playerId, o.index)) return { type: 'sellHouse', space: o.index };
  }
  if (legal.has('mortgage')) {
    const candidates = owned.filter((o) => !o.ps.mortgaged && o.ps.houses === 0).sort((a, b) => (b.space.price ?? 0) - (a.space.price ?? 0));
    for (const o of candidates) if (canMortgageSafe(state, playerId, o.index)) return { type: 'mortgage', space: o.index };
  }
  if (legal.has('declareBankruptcy')) return { type: 'declareBankruptcy' };
  return null;
}

import { canMortgage, canSellHouse } from './queries';
function canSellHouseSafe(state: GameState, id: string, idx: number): boolean { return canSellHouse(state, id, idx).ok; }
function canMortgageSafe(state: GameState, id: string, idx: number): boolean { return canMortgage(state, id, idx).ok; }

function bestBuild(state: GameState, playerId: string, reserve: number): number | null {
  const me = state.players.find((p) => p.id === playerId)!;
  let best: number | null = null;
  let bestScore = 0;
  for (const idx of ownedSpaces(state, playerId)) {
    const s = state.board[idx];
    if (s.type !== 'property' || !s.rent || !s.houseCost) continue;
    if (me.cash - s.houseCost < reserve) continue;
    if (!canBuild(state, playerId, idx).ok) continue;
    const houses = state.properties[idx].houses;
    const gain = s.rent[houses + 1] - s.rent[houses];
    const score = gain / s.houseCost;
    if (score > bestScore) { bestScore = score; best = idx; }
  }
  return best;
}

function bestUnmortgage(state: GameState, playerId: string, reserve: number): number | null {
  const me = state.players.find((p) => p.id === playerId)!;
  let best: number | null = null;
  let bestValue = 0;
  for (const idx of ownedSpaces(state, playerId)) {
    const ps = state.properties[idx];
    if (!ps.mortgaged) continue;
    const s = state.board[idx];
    const cost = unmortgageCost(s);
    if (me.cash - cost < reserve + 100) continue;
    const inSet = s.type === 'property' && s.group ? ownsFullGroup(state, playerId, s.group) : false;
    const value = (s.price ?? 0) * (inSet ? 3 : 1);
    if (value > bestValue) { bestValue = value; best = idx; }
  }
  return best;
}

function proposeTrade(state: GameState, playerId: string, reserve: number): Action | null {
  const me = state.players.find((p) => p.id === playerId)!;
  for (const [group, spaces] of Object.entries(GROUPS)) {
    void group;
    const mine = spaces.filter((i) => state.properties[i]?.owner === playerId);
    if (mine.length !== spaces.length - 1) continue;
    const missing = spaces.find((i) => state.properties[i]?.owner !== playerId)!;
    const owner = state.properties[missing]?.owner;
    if (!owner) continue;
    const ownerPlayer = state.players.find((p) => p.id === owner);
    if (!ownerPlayer || ownerPlayer.bankrupt) continue;
    const s = state.board[missing];
    if ((state.properties[missing].houses ?? 0) > 0) continue;
    if (s.group && GROUPS[s.group].some((i) => (state.properties[i]?.houses ?? 0) > 0)) continue;
    const cash = Math.round((s.price ?? 0) * 1.5);
    if (me.cash - cash < reserve) continue;
    return { type: 'proposeTrade', to: owner, offer: { cash, properties: [], jailCards: 0 }, request: { cash: 0, properties: [missing], jailCards: 0 } };
  }
  return null;
}

/**
 * The next action a computer player takes, or null when it is not their move.
 * `random` in [0,1) adds a little variety to bids and trade offers.
 */
export function chooseBotAction(state: GameState, playerId: string, random: () => number = Math.random): Action | null {
  const legal = new Set(legalActions(state, playerId));
  if (legal.size === 0) return null;
  const me = state.players.find((p) => p.id === playerId);
  if (!me || me.bankrupt) return null;
  const isTurn = state.players[state.currentPlayer]?.id === playerId;

  // Answer trade offers first, in any phase where that is allowed.
  for (const t of state.trades) {
    if (t.to !== playerId) continue;
    if (legal.has('acceptTrade') && canAcceptTrade(state, playerId, t).ok && tradeGainFor(state, playerId, t) > 0) return { type: 'acceptTrade', tradeId: t.id };
    if (legal.has('rejectTrade')) return { type: 'rejectTrade', tradeId: t.id };
  }
  // Withdraw my own offers that were ignored for a whole round.
  if (isTurn && state.phase === 'roll' && state.dice === null && legal.has('rejectTrade')) {
    const stale = state.trades.find((t) => t.from === playerId);
    if (stale) return { type: 'rejectTrade', tradeId: stale.id };
  }

  switch (state.phase) {
    case 'roll': {
      if (!isTurn) return null;
      if (me.inJail && state.dice === null) {
        if (legal.has('useJailCard')) return { type: 'useJailCard' };
        const early = ownedFraction(state) < 0.6;
        if (early && legal.has('payJailFine') && me.cash >= state.config.jailFine + cashReserve(state, playerId)) return { type: 'payJailFine' };
      }
      return legal.has('roll') ? { type: 'roll' } : null;
    }
    case 'buy': {
      if (!isTurn || state.pendingSpace === null) return null;
      const idx = state.pendingSpace;
      const price = state.board[idx].price ?? 0;
      const value = propertyValueFor(state, playerId, idx);
      const spare = me.cash - price;
      if (legal.has('buy') && (spare >= cashReserve(state, playerId) || (value >= price * 1.8 && spare >= 0))) return { type: 'buy' };
      return legal.has('decline') ? { type: 'decline' } : null;
    }
    case 'auction': {
      const a = state.auction;
      if (!a || a.current !== playerId) return null;
      const price = state.board[a.space].price ?? 0;
      const ceiling = Math.min(propertyValueFor(state, playerId, a.space) * (0.85 + random() * 0.25), me.cash - Math.floor(cashReserve(state, playerId) / 2));
      const next = a.highBid + Math.max(5, Math.round(price * 0.08));
      if (legal.has('bid') && next <= ceiling) return { type: 'bid', amount: Math.min(next, me.cash) };
      if (legal.has('passAuction')) return { type: 'passAuction' };
      if (legal.has('bid') && a.highBid + 1 <= me.cash) return { type: 'bid', amount: a.highBid + 1 };
      return null;
    }
    case 'debt': {
      if (state.debt?.debtor !== playerId) return null;
      return debtAction(state, playerId, legal);
    }
    case 'action': {
      if (!isTurn) return null;
      const reserve = cashReserve(state, playerId);
      if (legal.has('build')) { const b = bestBuild(state, playerId, reserve); if (b !== null) return { type: 'build', space: b }; }
      if (legal.has('unmortgage')) { const u = bestUnmortgage(state, playerId, reserve); if (u !== null) return { type: 'unmortgage', space: u }; }
      if (legal.has('proposeTrade') && !state.trades.some((t) => t.from === playerId) && random() < 0.35) {
        const t = proposeTrade(state, playerId, reserve);
        if (t) return t;
      }
      return legal.has('endTurn') ? { type: 'endTurn' } : null;
    }
    default:
      return null;
  }
}
