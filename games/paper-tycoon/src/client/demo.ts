// A lived-in board for title screens: the given players scattered around,
// some streets owned and built up, dice on the table. Purely decorative.
import { DEFAULT_CONFIG, createGame } from '../engine/engine.js';
import { themedBoard } from '../shared/theme.js';
import type { GameConfig, GameState } from '../shared/types.js';
import { THEME } from './theme.js';

export interface DemoPlayer { id: string; name: string; token: string; color: string }

export function demoState(players: DemoPlayer[], config: Partial<GameConfig> = {}): GameState {
  const list = players.length >= 2 ? players : [...players, { id: 'demo-b', name: 'Otto', token: 'hat', color: '#8e5bc4' }, { id: 'demo-c', name: 'Penny', token: 'boat', color: '#2f6fd6' }].slice(0, Math.max(2, players.length));
  const st = createGame({ ...DEFAULT_CONFIG, ...config }, list, 12345, themedBoard(THEME));
  const spots = [0, 0, 6, 16, 24, 0, 34, 37];
  st.players.forEach((p, i) => { p.position = spots[i % spots.length]; p.connected = true; });
  const ids = st.players.map((p) => p.id);
  const own = (idxs: number[], owner: string, houses: number) => { for (const i of idxs) st.properties[i] = { owner, houses, mortgaged: false }; };
  own([1, 3], ids[1 % ids.length], 3);
  own([6, 8, 9], ids[0], 2);
  own([11, 13, 14], ids[2 % ids.length], 5);
  own([21, 23, 24], ids[3 % ids.length], 1);
  own([5, 15, 25], ids[0], 0);
  own([37, 39], ids[1 % ids.length], 4);
  own([31, 32], ids[2 % ids.length], 0);
  st.dice = [3, 5];
  return st;
}
