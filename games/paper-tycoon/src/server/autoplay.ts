// Picks a sensible action for a player who is out of time or disconnected.
// Used by the turn timer and by the host's "skip" for absent players.

import { legalActions } from '../engine/engine.js';
import { debtAction } from '../engine/bot.js';
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
  if (state.phase === 'debt' && state.debt?.debtor === playerId) return debtAction(state, playerId, legal);
  if (legal.has('passAuction')) return { type: 'passAuction' };
  if (legal.has('decline')) return { type: 'decline' };
  if (legal.has('roll')) return { type: 'roll' };
  if (legal.has('endTurn')) return { type: 'endTurn' };
  return null;
}
