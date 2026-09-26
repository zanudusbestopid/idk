// Picks a sensible action for a player who is out of time or disconnected.
// Used by the turn timer and by the host's "skip" for absent players.

import { applyAction, legalActions } from '../engine/engine.js';
import type { Action, GameState } from '../shared/types.js';

/** Returns the player ids that currently must act for the game to progress. */
export function playersToAct(state: GameState): string[] {
  if (state.phase === 'ended') return [];
  const blocking = new Set(['roll', 'buy', 'decline', 'bid', 'passAuction', 'payDebt', 'declareBankruptcy', 'endTurn', 'payJailFine', 'useJailCard']);
  const ids: string[] = [];
  for (const p of state.players) {
    if (p.bankrupt) continue;
    const legal = legalActions(state, p.id);
    if (legal.some((t) => blocking.has(t))) ids.push(p.id);
  }
  return ids;
}

/**
 * Choose the action a timed-out player takes. Prefers the least destructive
 * choice: roll, decline purchases, pass auctions, end the turn. In debt it
 * first sells houses and mortgages until the debt can be paid, then pays;
 * only when nothing can cover the debt does it declare bankruptcy.
 */
export function chooseAutoAction(state: GameState, playerId: string): Action | null {
  const legal = new Set(legalActions(state, playerId));
  if (legal.size === 0) return null;
  if (state.phase === 'debt' && state.debt?.debtor === playerId) {
    if (legal.has('payDebt')) return { type: 'payDebt' };
    const player = state.players.find((p) => p.id === playerId)!;
    // Sell houses first (highest value first), then mortgage (highest value first).
    const owned = Object.entries(state.properties)
      .filter(([, ps]) => ps.owner === playerId)
      .map(([idx, ps]) => ({ index: Number(idx), ps, space: state.board[Number(idx)] }));
    if (legal.has('sellHouse')) {
      const withHouses = owned.filter((o) => o.ps.houses > 0).sort((a, b) => (b.space.houseCost ?? 0) - (a.space.houseCost ?? 0));
      for (const o of withHouses) {
        const r = applyAction(state, playerId, { type: 'sellHouse', space: o.index });
        if (r.ok) return { type: 'sellHouse', space: o.index };
      }
    }
    if (legal.has('mortgage')) {
      const unmortgaged = owned.filter((o) => !o.ps.mortgaged && o.ps.houses === 0).sort((a, b) => (b.space.price ?? 0) - (a.space.price ?? 0));
      for (const o of unmortgaged) {
        const r = applyAction(state, playerId, { type: 'mortgage', space: o.index });
        if (r.ok) return { type: 'mortgage', space: o.index };
      }
    }
    void player;
    if (legal.has('declareBankruptcy')) return { type: 'declareBankruptcy' };
    return null;
  }
  if (legal.has('passAuction')) return { type: 'passAuction' };
  if (legal.has('decline')) return { type: 'decline' };
  if (legal.has('roll')) return { type: 'roll' };
  if (legal.has('endTurn')) return { type: 'endTurn' };
  return null;
}
