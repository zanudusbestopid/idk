// Wire protocol between the browser client and the game server.
// All messages are JSON objects with a `t` discriminator.

import type { Action, GameConfig, GameEvent, GameState } from './types.js';

export const PROTOCOL_VERSION = 1;

/** A player as seen in the lobby (before a game starts) and in room-level views. */
export interface LobbyPlayer {
  id: string;
  name: string;
  token: string;
  color: string;
  connected: boolean;
  isHost: boolean;
}

/** Room summary sent to every member whenever it changes. */
export interface RoomView {
  code: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'ended';
  players: LobbyPlayer[];
  config: GameConfig;
  maxPlayers: number;
}

export interface ChatMessage {
  id: number;
  from: string | null; // player id, null = system
  name: string;
  text: string;
  at: number; // ms since epoch
}

export type ClientMessage =
  | { t: 'create'; name: string; token: string }
  | { t: 'join'; code: string; name: string; token: string }
  | { t: 'rejoin'; session: string }
  | { t: 'setToken'; token: string }
  | { t: 'setName'; name: string }
  | { t: 'setConfig'; config: Partial<GameConfig> } // host only
  | { t: 'kick'; playerId: string } // host only
  | { t: 'start' } // host only
  | { t: 'restart' } // host only, after a game ends: back to the lobby
  | { t: 'action'; action: Action }
  | { t: 'chat'; text: string }
  | { t: 'leave' }
  | { t: 'ping' };

export type ServerMessage =
  | { t: 'welcome'; session: string; playerId: string; room: RoomView }
  | { t: 'room'; room: RoomView }
  | { t: 'state'; state: GameState; events: GameEvent[] }
  | { t: 'timer'; endsAt: number | null } // turn timer deadline (ms since epoch)
  | { t: 'chat'; message: ChatMessage }
  | { t: 'chatHistory'; messages: ChatMessage[] }
  | { t: 'error'; message: string; fatal?: boolean }
  | { t: 'left' }
  | { t: 'pong' };

export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;
export const MAX_NAME_LENGTH = 16;
export const MAX_CHAT_LENGTH = 200;
