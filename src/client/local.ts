// In-browser game: the rules engine runs locally, the human is one seat and the
// computer players take the others. No server involved.

import { chooseBotAction, type Difficulty } from '../engine/bot.js';
import { applyAction, createGame, type ActionResult } from '../engine/engine.js';
import type { Action, GameConfig, GameEvent, GameState } from '../shared/types.js';
import { themedBoard } from '../shared/theme.js';
import { TOKEN_BY_ID, TOKEN_LIST } from '../shared/tokens.js';
import { THEME } from './theme.js';

export const HUMAN_ID = 'you';
export const SAVE_KEY = 'pt.solo';

export interface SoloSetup {
  name: string;
  token: string;
  bots: { name: string; token: string }[];
  config: Partial<GameConfig>;
  difficulty?: Difficulty;
}

export const BOT_NAMES = ['Otto', 'Penny', 'Marge', 'Rex', 'Ivy', 'Bruno', 'Dot'];

/** Picks bot names and tokens that do not clash with the human's choice. */
export function defaultBots(count: number, humanToken: string, shuffleSeed = 0): { name: string; token: string }[] {
  const tokens = TOKEN_LIST.map((t) => t.id).filter((t) => t !== humanToken);
  const names = [...BOT_NAMES];
  for (let i = 0; i < shuffleSeed % 7; i++) { tokens.push(tokens.shift()!); names.push(names.shift()!); }
  return Array.from({ length: count }, (_, i) => ({ name: names[i % names.length], token: tokens[i % tokens.length] }));
}

export interface SavedGame { setup: SoloSetup; state: GameState; savedAt: number }

export function loadSaved(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as SavedGame;
    if (!v || !v.state || !Array.isArray(v.state.players)) return null;
    return v;
  } catch { return null; }
}

export function clearSaved(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

export class LocalGame {
  state: GameState;
  readonly setup: SoloSetup;
  onState: (state: GameState, events: GameEvent[]) => void = () => {};
  private timer: number | null = null;
  private pending: { id: string; action: Action } | null = null;
  private destroyed = false;
  private paused = false;

  constructor(setup: SoloSetup, state?: GameState) {
    this.setup = setup;
    if (state) {
      this.state = state;
    } else {
      const players = [
        { id: HUMAN_ID, name: setup.name || 'You', token: setup.token, color: TOKEN_BY_ID[setup.token]?.color ?? '#888' },
        ...setup.bots.map((b, i) => ({ id: `bot${i + 1}`, name: b.name, token: b.token, color: TOKEN_BY_ID[b.token]?.color ?? '#888' })),
      ];
      const seed = Math.floor(Math.random() * 2 ** 31) || 1;
      this.state = createGame(setup.config, players, seed, themedBoard(THEME));
      for (const p of this.state.players) p.connected = true;
      this.save();
    }
  }

  get botIds(): string[] { return this.state.players.filter((p) => p.id !== HUMAN_ID).map((p) => p.id); }

  /** The human acts. Returns the engine's verdict; on success the new state is emitted. */
  send(action: Action): ActionResult {
    if (this.destroyed) return { ok: false, error: 'Game over' };
    const r = applyAction(this.state, HUMAN_ID, action);
    if (r.ok) {
      this.cancelPending();
      this.state = r.state;
      this.save();
      this.onState(this.state, r.events);
    }
    return r;
  }

  /** The screen has caught up with the latest state: let a computer player move if one must. */
  /** While paused no computer player moves; resuming picks up where it left off. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.cancelPending(); else this.idle();
  }

  idle(): void {
    if (this.destroyed || this.paused || this.timer !== null) return;
    if (this.state.phase === 'ended') { clearSaved(); return; }
    const next = this.nextBotMove();
    if (!next) return;
    this.pending = next;
    const delay = next.action.type === 'roll' ? 900 : next.action.type === 'endTurn' ? 500 : next.action.type === 'bid' ? 800 : 650;
    this.timer = window.setTimeout(() => { this.timer = null; this.step(); }, delay);
  }

  private nextBotMove(): { id: string; action: Action } | null {
    // Start with the player on turn so the natural order is respected, then the rest.
    const n = this.state.players.length;
    for (let k = 0; k < n; k++) {
      const p = this.state.players[(this.state.currentPlayer + k) % n];
      if (p.id === HUMAN_ID || p.bankrupt) continue;
      const action = chooseBotAction(this.state, p.id, Math.random, { difficulty: this.setup.difficulty ?? 'normal' });
      if (action) return { id: p.id, action };
    }
    return null;
  }

  private step(): void {
    const move = this.pending;
    this.pending = null;
    if (!move || this.destroyed) return;
    const r = applyAction(this.state, move.id, move.action);
    if (!r.ok) { console.warn('bot move refused', move, r.error); this.idle(); return; }
    this.state = r.state;
    this.save();
    this.onState(this.state, r.events);
  }

  /** Test hook: apply an action as any player (used by the screenshot scripts to force situations). */
  debugApply(playerId: string, action: Action): ActionResult {
    const r = applyAction(this.state, playerId, action);
    if (r.ok) { this.cancelPending(); this.state = r.state; this.save(); this.onState(this.state, r.events); }
    return r;
  }

  private cancelPending(): void {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
    this.pending = null;
  }

  save(): void {
    try {
      if (this.state.phase === 'ended') { localStorage.removeItem(SAVE_KEY); return; }
      const saved: SavedGame = { setup: this.setup, state: this.state, savedAt: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    } catch { /* storage unavailable */ }
  }

  destroy(): void {
    this.destroyed = true;
    this.cancelPending();
  }
}
