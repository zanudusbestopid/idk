import { randomBytes, randomInt } from 'node:crypto';
import type { WebSocket } from 'ws';
import { DEFAULT_CONFIG, applyAction, createGame } from '../engine/engine.js';
import type { Action, GameConfig, GameEvent, GameState } from '../shared/types.js';
import {
  MAX_CHAT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type ChatMessage,
  type LobbyPlayer,
  type RoomView,
  type ServerMessage,
} from '../shared/protocol.js';
import { TOKEN_BY_ID, TOKEN_LIST, isTokenId } from '../shared/tokens.js';
import { chooseAutoAction, playersToAct } from './autoplay.js';

const DISCONNECT_GRACE_MS = Number(process.env.PT_GRACE_MS) || 45_000; // auto-play for a disconnected player after this long
const LOBBY_FORGET_MS = 120_000; // drop a disconnected lobby member after this long
const CHAT_HISTORY = 100;

export interface Member {
  id: string;
  name: string;
  token: string;
  session: string;
  socket: WebSocket | null;
  connected: boolean;
  disconnectedAt: number | null;
  forgetTimer: NodeJS.Timeout | null;
}

export class RoomError extends Error {}

function newId(bytes = 6): string {
  return randomBytes(bytes).toString('hex');
}

export function sanitizeName(raw: unknown): string {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return s || 'Player';
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeConfig(partial: Partial<GameConfig>, base: GameConfig): GameConfig {
  const c = { ...base };
  if ('startingCash' in partial) c.startingCash = clampInt(partial.startingCash, 100, 10_000, base.startingCash);
  if ('goSalary' in partial) c.goSalary = clampInt(partial.goSalary, 0, 2_000, base.goSalary);
  if ('jailFine' in partial) c.jailFine = clampInt(partial.jailFine, 0, 1_000, base.jailFine);
  if ('maxJailTurns' in partial) c.maxJailTurns = clampInt(partial.maxJailTurns, 1, 6, base.maxJailTurns);
  if ('auctions' in partial) c.auctions = Boolean(partial.auctions);
  if ('freeParkingJackpot' in partial) c.freeParkingJackpot = Boolean(partial.freeParkingJackpot);
  if ('doubleGoSalary' in partial) c.doubleGoSalary = Boolean(partial.doubleGoSalary);
  if ('turnTimerSeconds' in partial) {
    const t = partial.turnTimerSeconds;
    c.turnTimerSeconds = t === null || t === undefined || t === 0 ? null : clampInt(t, 15, 900, 90);
  }
  return c;
}

export class Room {
  readonly code: string;
  hostId: string;
  status: RoomView['status'] = 'lobby';
  readonly members = new Map<string, Member>();
  readonly order: string[] = []; // join order = turn order
  config: GameConfig = { ...DEFAULT_CONFIG };
  state: GameState | null = null;
  chat: ChatMessage[] = [];
  private chatSeq = 0;
  private timer: NodeJS.Timeout | null = null;
  private timerEndsAt: number | null = null;
  private timerReason: 'turn' | 'grace' | null = null;
  lastActivity = Date.now();

  constructor(code: string, host: Member) {
    this.code = code;
    this.hostId = host.id;
  }

  // ---------- views & messaging ----------

  view(): RoomView {
    return {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      players: this.order.map((id) => this.lobbyPlayer(this.members.get(id)!)),
      config: this.config,
      maxPlayers: MAX_PLAYERS,
    };
  }

  private lobbyPlayer(m: Member): LobbyPlayer {
    return { id: m.id, name: m.name, token: m.token, color: TOKEN_BY_ID[m.token]?.color ?? '#888', connected: m.connected, isHost: m.id === this.hostId };
  }

  send(m: Member, msg: ServerMessage): void {
    if (m.socket && m.socket.readyState === m.socket.OPEN) m.socket.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const m of this.members.values()) {
      if (m.socket && m.socket.readyState === m.socket.OPEN) m.socket.send(data);
    }
  }

  broadcastRoom(): void {
    this.broadcast({ t: 'room', room: this.view() });
  }

  private broadcastState(events: GameEvent[]): void {
    if (!this.state) return;
    this.broadcast({ t: 'state', state: this.state, events });
  }

  private system(text: string): void {
    this.pushChat(null, 'Game', text);
  }

  private pushChat(from: string | null, name: string, text: string): void {
    const message: ChatMessage = { id: ++this.chatSeq, from, name, text, at: Date.now() };
    this.chat.push(message);
    if (this.chat.length > CHAT_HISTORY) this.chat.splice(0, this.chat.length - CHAT_HISTORY);
    this.broadcast({ t: 'chat', message });
  }

  get connectedCount(): number {
    let n = 0;
    for (const m of this.members.values()) if (m.connected) n++;
    return n;
  }

  // ---------- membership ----------

  private freeToken(preferred: string): string {
    const taken = new Set([...this.members.values()].map((m) => m.token));
    if (isTokenId(preferred) && !taken.has(preferred)) return preferred;
    const free = TOKEN_LIST.find((t) => !taken.has(t.id));
    if (!free) throw new RoomError('No tokens left');
    return free.id;
  }

  static createMember(name: string, token: string, socket: WebSocket): Member {
    return { id: newId(), name: sanitizeName(name), token, session: newId(16), socket, connected: true, disconnectedAt: null, forgetTimer: null };
  }

  /** Adds a brand-new member to the lobby. */
  join(name: string, token: string, socket: WebSocket): Member {
    if (this.status !== 'lobby') throw new RoomError('That game has already started');
    if (this.members.size >= MAX_PLAYERS) throw new RoomError('That room is full');
    const m = Room.createMember(name, this.freeToken(token), socket);
    this.members.set(m.id, m);
    this.order.push(m.id);
    this.touch();
    this.system(`${m.name} joined the room`);
    this.welcome(m);
    this.broadcastRoom();
    return m;
  }

  /** Called by the server for the host right after construction. */
  addHost(m: Member): void {
    this.members.set(m.id, m);
    this.order.push(m.id);
    this.welcome(m);
    this.broadcastRoom();
  }

  private welcome(m: Member): void {
    this.send(m, { t: 'welcome', session: m.session, playerId: m.id, room: this.view() });
    this.send(m, { t: 'chatHistory', messages: this.chat });
    if (this.state) {
      this.send(m, { t: 'state', state: this.state, events: [] });
      this.send(m, { t: 'timer', endsAt: this.timerEndsAt });
    }
  }

  reconnect(m: Member, socket: WebSocket): void {
    if (m.socket && m.socket !== socket && m.socket.readyState === m.socket.OPEN) {
      // Newer connection wins; tell the old one to go away.
      const old = m.socket;
      m.socket = null;
      try { old.send(JSON.stringify({ t: 'error', message: 'You connected from another tab', fatal: true } satisfies ServerMessage)); old.close(); } catch { /* ignore */ }
    }
    m.socket = socket;
    m.connected = true;
    m.disconnectedAt = null;
    if (m.forgetTimer) { clearTimeout(m.forgetTimer); m.forgetTimer = null; }
    this.touch();
    this.syncConnected();
    this.welcome(m);
    this.broadcastRoom();
    if (this.state) this.rescheduleTimer();
  }

  disconnect(m: Member, socket: WebSocket): void {
    if (m.socket !== socket) return; // stale socket
    if (!this.members.has(m.id)) return; // room already torn down
    m.socket = null;
    m.connected = false;
    m.disconnectedAt = Date.now();
    this.touch();
    if (this.status === 'lobby') {
      m.forgetTimer = setTimeout(() => this.forget(m), LOBBY_FORGET_MS);
      if (m.id === this.hostId) this.pickNewHost();
    } else {
      this.syncConnected();
      if (m.id === this.hostId) this.pickNewHost();
      this.rescheduleTimer();
    }
    this.broadcastRoom();
  }

  private forget(m: Member): void {
    if (m.connected || this.status !== 'lobby') return;
    this.removeMember(m, `${m.name} left the room`);
  }

  private removeMember(m: Member, note: string): void {
    if (m.forgetTimer) clearTimeout(m.forgetTimer);
    this.members.delete(m.id);
    const i = this.order.indexOf(m.id);
    if (i >= 0) this.order.splice(i, 1);
    if (m.id === this.hostId) this.pickNewHost();
    this.system(note);
    this.broadcastRoom();
  }

  private pickNewHost(): void {
    const next = this.order.map((id) => this.members.get(id)).find((m) => m && m.connected && m.id !== this.hostId);
    if (next) {
      this.hostId = next.id;
      this.system(`${next.name} is now the host`);
    }
  }

  private syncConnected(): void {
    if (!this.state) return;
    let changed = false;
    for (const p of this.state.players) {
      const m = this.members.get(p.id);
      const c = m ? m.connected : false;
      if (p.connected !== c) { p.connected = c; changed = true; }
    }
    if (changed) this.broadcastState([]);
  }

  leave(m: Member): void {
    if (this.status === 'playing' && this.state) {
      const p = this.state.players.find((x) => x.id === m.id);
      if (p && !p.bankrupt) {
        const r = applyAction(this.state, m.id, { type: 'resign' } as Action);
        if (r.ok) { this.state = r.state; this.afterStateChange(r.events); }
      }
    }
    this.send(m, { t: 'left' });
    if (m.socket) { try { m.socket.close(); } catch { /* ignore */ } }
    m.socket = null;
    m.connected = false;
    if (this.status === 'lobby') this.removeMember(m, `${m.name} left the room`);
    else {
      this.system(`${m.name} left the game`);
      if (m.id === this.hostId) this.pickNewHost();
      this.syncConnected();
      this.rescheduleTimer();
      this.broadcastRoom();
    }
  }

  kick(byId: string, targetId: string): void {
    if (byId !== this.hostId) throw new RoomError('Only the host can remove players');
    if (targetId === byId) throw new RoomError('You cannot remove yourself');
    const target = this.members.get(targetId);
    if (!target) throw new RoomError('No such player');
    if (this.status === 'playing' && this.state) {
      const p = this.state.players.find((x) => x.id === targetId);
      if (p && !p.bankrupt) {
        const r = applyAction(this.state, targetId, { type: 'resign' } as Action);
        if (!r.ok) throw new RoomError(r.error);
        this.state = r.state;
        this.system(`${target.name} was removed by the host`);
        this.afterStateChange(r.events);
      }
      this.send(target, { t: 'error', message: 'You were removed from the game by the host', fatal: true });
      this.send(target, { t: 'left' });
      target.session = newId(16); // invalidate rejoin
      if (target.socket) { try { target.socket.close(); } catch { /* ignore */ } }
      target.socket = null;
      target.connected = false;
      this.syncConnected();
      this.broadcastRoom();
    } else {
      this.send(target, { t: 'error', message: 'You were removed from the room by the host', fatal: true });
      this.send(target, { t: 'left' });
      if (target.socket) { try { target.socket.close(); } catch { /* ignore */ } }
      target.socket = null;
      this.removeMember(target, `${target.name} was removed by the host`);
    }
  }

  // ---------- lobby settings ----------

  setToken(m: Member, token: string): void {
    if (this.status !== 'lobby') throw new RoomError('Tokens are locked once the game starts');
    if (!isTokenId(token)) throw new RoomError('Unknown token');
    for (const other of this.members.values()) if (other !== m && other.token === token) throw new RoomError('Someone already has that token');
    m.token = token;
    this.broadcastRoom();
  }

  setName(m: Member, name: string): void {
    if (this.status !== 'lobby') throw new RoomError('Names are locked once the game starts');
    m.name = sanitizeName(name);
    this.broadcastRoom();
  }

  setConfig(m: Member, partial: Partial<GameConfig>): void {
    if (m.id !== this.hostId) throw new RoomError('Only the host can change the rules');
    if (this.status !== 'lobby') throw new RoomError('Rules are locked once the game starts');
    this.config = sanitizeConfig(partial ?? {}, this.config);
    this.broadcastRoom();
  }

  start(m: Member): void {
    if (m.id !== this.hostId) throw new RoomError('Only the host can start the game');
    if (this.status !== 'lobby') throw new RoomError('The game already started');
    const present = this.order.map((id) => this.members.get(id)!).filter((x) => x.connected);
    if (present.length < MIN_PLAYERS) throw new RoomError(`Need at least ${MIN_PLAYERS} connected players`);
    // Drop members who never came back before the start.
    for (const id of [...this.order]) {
      const x = this.members.get(id)!;
      if (!x.connected) this.removeMember(x, `${x.name} was dropped before the start`);
    }
    const players = this.order.map((id) => this.members.get(id)!).map((x) => ({ id: x.id, name: x.name, token: x.token, color: TOKEN_BY_ID[x.token]?.color ?? '#888' }));
    const seed = randomInt(1, 2 ** 31 - 1);
    this.state = createGame(this.config, players, seed);
    for (const p of this.state.players) p.connected = this.members.get(p.id)?.connected ?? false;
    this.status = 'playing';
    this.touch();
    this.system('The game has started. Good luck!');
    this.broadcastRoom();
    this.broadcastState(this.state.log.slice());
    this.rescheduleTimer();
  }

  /** After a game ends the host can bring everyone back to the lobby. */
  restart(m: Member): void {
    if (m.id !== this.hostId) throw new RoomError('Only the host can do that');
    if (this.status === 'playing' && this.state && this.state.phase !== 'ended') throw new RoomError('The game is still running');
    this.clearTimer();
    this.state = null;
    this.status = 'lobby';
    // Members who left during the game are gone; disconnected ones get the usual lobby grace.
    for (const id of [...this.order]) {
      const x = this.members.get(id)!;
      if (!x.connected) this.removeMember(x, `${x.name} was dropped`);
    }
    this.touch();
    this.system('Back in the lobby. The host can start a new game.');
    this.broadcastRoom();
  }

  // ---------- gameplay ----------

  action(m: Member, action: Action): void {
    if (this.status !== 'playing' || !this.state) throw new RoomError('The game is not running');
    const r = applyAction(this.state, m.id, action);
    if (!r.ok) throw new RoomError(r.error);
    this.state = r.state;
    this.touch();
    this.afterStateChange(r.events);
  }

  private afterStateChange(events: GameEvent[]): void {
    if (!this.state) return;
    this.broadcastState(events);
    if (this.state.phase === 'ended' || this.state.winner) {
      this.status = 'ended';
      const w = this.state.players.find((p) => p.id === this.state!.winner);
      if (w) this.system(`${w.name} wins the game!`);
      this.clearTimer();
      this.broadcast({ t: 'timer', endsAt: null });
      this.broadcastRoom();
      return;
    }
    this.rescheduleTimer();
  }

  chatMessage(m: Member, text: string): void {
    const t = String(text ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_CHAT_LENGTH);
    if (!t) return;
    this.touch();
    this.pushChat(m.id, m.name, t);
  }

  // ---------- timers ----------

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.timerEndsAt = null;
    this.timerReason = null;
  }

  /**
   * One timer per room. Deadline is the sooner of the turn timer (if the host
   * enabled one) and the disconnect grace period (if someone who must act is
   * away). Every state change resets it.
   */
  private rescheduleTimer(): void {
    this.clearTimer();
    if (this.status !== 'playing' || !this.state) { this.broadcast({ t: 'timer', endsAt: null }); return; }
    const actors = playersToAct(this.state);
    if (actors.length === 0) { this.broadcast({ t: 'timer', endsAt: null }); return; }
    const now = Date.now();
    let endsAt: number | null = null;
    let reason: 'turn' | 'grace' | null = null;
    if (this.config.turnTimerSeconds) {
      endsAt = now + this.config.turnTimerSeconds * 1000;
      reason = 'turn';
    }
    const away = actors.filter((id) => !(this.members.get(id)?.connected));
    if (away.length > 0) {
      const graceEnd = now + DISCONNECT_GRACE_MS;
      if (endsAt === null || graceEnd < endsAt) { endsAt = graceEnd; reason = 'grace'; }
    }
    if (endsAt !== null) {
      this.timerEndsAt = endsAt;
      this.timerReason = reason;
      this.timer = setTimeout(() => this.onTimer(), endsAt - now);
    }
    this.broadcast({ t: 'timer', endsAt: reason === 'turn' ? endsAt : null });
  }

  private onTimer(): void {
    const reason = this.timerReason;
    this.timer = null;
    this.timerEndsAt = null;
    this.timerReason = null;
    if (this.status !== 'playing' || !this.state) return;
    const actors = playersToAct(this.state);
    const targets = reason === 'grace' ? actors.filter((id) => !(this.members.get(id)?.connected)) : actors;
    let acted = false;
    for (const id of targets) {
      const away = !(this.members.get(id)?.connected);
      // A present-but-slow player loses one decision per timeout. An absent player is
      // played through until they no longer block the game (bounded to avoid loops).
      const maxSteps = away ? 30 : 12;
      for (let i = 0; i < maxSteps; i++) {
        const a = chooseAutoAction(this.state, id);
        if (!a) break;
        const r = applyAction(this.state, id, a);
        if (!r.ok) break;
        this.state = r.state;
        acted = true;
        this.broadcastState(r.events);
        if (this.state.phase === 'ended') break;
        const stillBlocking = playersToAct(this.state).includes(id);
        if (!stillBlocking) break;
        if (!away && a.type !== 'sellHouse' && a.type !== 'mortgage') break; // one decisive action per timeout
      }
      if (this.state.phase === 'ended') break;
    }
    if (acted) {
      const name = targets.map((id) => this.members.get(id)?.name ?? '?').join(', ');
      this.system(reason === 'grace' ? `${name} is away, the game moved on automatically` : `${name} ran out of time`);
    }
    this.afterStateChange([]);
  }

  private touch(): void {
    this.lastActivity = Date.now();
  }

  destroy(): void {
    this.clearTimer();
    const members = [...this.members.values()];
    this.members.clear();
    this.order.length = 0;
    for (const m of members) {
      if (m.forgetTimer) clearTimeout(m.forgetTimer);
      const sock = m.socket;
      m.socket = null;
      if (sock) { try { sock.close(); } catch { /* ignore */ } }
    }
  }
}
