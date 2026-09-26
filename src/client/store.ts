import type { ChatMessage, RoomView } from '../shared/protocol.js';
import type { GameState } from '../shared/types.js';

export type Screen = 'home' | 'lobby' | 'game';

export interface AppState {
  screen: Screen;
  connection: 'connecting' | 'open' | 'closed';
  playerId: string | null;
  room: RoomView | null;
  game: GameState | null;
  timerEndsAt: number | null;
  chat: ChatMessage[];
}

type Listener = (s: AppState) => void;

export class Store {
  state: AppState = { screen: 'home', connection: 'closed', playerId: null, room: null, game: null, timerEndsAt: null, chat: [] };
  private listeners = new Set<Listener>();

  set(patch: Partial<AppState>): void {
    Object.assign(this.state, patch);
    for (const l of this.listeners) l(this.state);
  }

  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }

  get me() { return this.state.game?.players.find((p) => p.id === this.state.playerId) ?? null; }
  get isHost() { return !!this.state.room && this.state.room.hostId === this.state.playerId; }
}

export const SESSION_KEY = 'pt.session';
export const PROFILE_KEY = 'pt.profile';

export function saveSession(session: string | null, code: string | null): void {
  if (session && code) localStorage.setItem(SESSION_KEY, JSON.stringify({ session, code }));
  else localStorage.removeItem(SESSION_KEY);
}
export function loadSession(): { session: string; code: string } | null {
  try { const v = localStorage.getItem(SESSION_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function saveProfile(name: string, token: string): void { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, token })); }
export function loadProfile(): { name: string; token: string } { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '') || { name: '', token: 'hat' }; } catch { return { name: '', token: 'hat' }; } }
