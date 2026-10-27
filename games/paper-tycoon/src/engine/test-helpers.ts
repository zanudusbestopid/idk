/** Shared helpers for the engine test-suite (not a test file itself). */
import type { Action, GameConfig, GameEvent, GameState, Player } from '../shared/types';
import { _forceNextRoll, applyAction, createGame } from './engine';

export const IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

export function newGame(config: Partial<GameConfig> = {}, n = 3, seed = 42): GameState {
  const players = IDS.slice(0, n).map((id, i) => ({
    id,
    name: id.toUpperCase(),
    token: `token${i}`,
    color: `#${i}${i}${i}`,
  }));
  return createGame(config, players, seed);
}

export function P(state: GameState, id: string): Player {
  const p = state.players.find((x) => x.id === id);
  if (!p) throw new Error(`no player ${id}`);
  return p;
}

export function cur(state: GameState): string {
  return state.players[state.currentPlayer].id;
}

export type Ok = { state: GameState; events: GameEvent[] };

export function act(state: GameState, playerId: string, action: Action): Ok {
  const r = applyAction(state, playerId, action);
  if (!r.ok) throw new Error(`expected '${action.type}' by ${playerId} to succeed: ${r.error}`);
  return { state: r.state, events: r.events };
}

export function fails(state: GameState, playerId: string, action: Action): string {
  const r = applyAction(state, playerId, action);
  if (r.ok) throw new Error(`expected '${action.type}' by ${playerId} to fail`);
  return r.error;
}

/** Force the dice and roll for the current player (or `playerId`). */
export function roll(state: GameState, d1: number, d2: number, playerId = cur(state)): Ok {
  return act(_forceNextRoll(state, d1, d2), playerId, { type: 'roll' });
}

/** Directly hand properties to a player (mutates the state). */
export function give(
  state: GameState,
  playerId: string,
  spaces: number | number[],
  opts: { houses?: number; mortgaged?: boolean } = {},
): void {
  for (const i of Array.isArray(spaces) ? spaces : [spaces]) {
    state.properties[i] = { owner: playerId, houses: opts.houses ?? 0, mortgaged: opts.mortgaged ?? false };
  }
}

/** Move a card id to the top of a deck (mutates the state). */
export function topCard(state: GameState, deck: 'chance' | 'chest', id: number): void {
  const d = deck === 'chance' ? state.chanceDeck : state.chestDeck;
  const rest = d.filter((x) => x !== id);
  d.splice(0, d.length, id, ...rest);
}

export function ev<T extends GameEvent['type']>(events: GameEvent[], type: T): Extract<GameEvent, { type: T }>[] {
  return events.filter((e) => e.type === type) as Extract<GameEvent, { type: T }>[];
}

export function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const v of Object.values(obj as object)) deepFreeze(v);
  }
  return obj;
}
