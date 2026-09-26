import './styles.css';
import type { ServerMessage } from '../shared/protocol.js';
import { PAPER_DEFS } from './art/paper.js';
import { unlockAudio } from './audio.js';
import { h, toast } from './dom.js';
import { Net } from './net.js';
import { Store, loadSession, saveSession } from './store.js';
import { GameScreen } from './ui/game.js';
import { renderHome } from './ui/home.js';
import { LobbyScreen } from './ui/lobby.js';

const app = document.getElementById('app')!;
document.body.insertAdjacentHTML('afterbegin', PAPER_DEFS);
document.addEventListener('pointerdown', unlockAudio, { once: true });

const store = new Store();
const net = new Net();
let lobby: LobbyScreen | null = null;
let game: GameScreen | null = null;
let currentCode: string | null = null;

const pathCode = location.pathname.replace(/^\//, '').toUpperCase();
const prefill = /^[A-Z0-9]{4}$/.test(pathCode) ? pathCode : '';

function showHome(): void {
  game?.destroy(); game = null; lobby = null;
  store.set({ screen: 'home', room: null, game: null, playerId: null });
  renderHome(app, {
    onCreate: (name, token) => net.send({ t: 'create', name, token }),
    onJoin: (code, name, token) => net.send({ t: 'join', code, name, token }),
  }, prefill);
}

function showLobby(): void {
  game?.destroy(); game = null;
  store.set({ screen: 'lobby', game: null });
  lobby = new LobbyScreen(app, {
    onSetToken: (token) => net.send({ t: 'setToken', token }),
    onSetName: (name) => net.send({ t: 'setName', name }),
    onSetConfig: (config) => net.send({ t: 'setConfig', config }),
    onKick: (playerId) => { if (confirm('Remove this player?')) net.send({ t: 'kick', playerId }); },
    onStart: () => net.send({ t: 'start' }),
    onLeave: () => leave(),
  });
  if (store.state.room && store.state.playerId) lobby.update(store.state.room, store.state.playerId);
}

function showGame(): void {
  lobby = null;
  store.set({ screen: 'game' });
  game = new GameScreen(app, store.state.playerId!, {
    send: (action) => net.send({ t: 'action', action }),
    chat: (text) => net.send({ t: 'chat', text }),
    leave: () => leave(),
    restart: () => net.send({ t: 'restart' }),
  });
  if (store.state.room) game.setRoom(store.state.room);
  for (const m of store.state.chat) game.addChat(m);
}

function leave(): void {
  net.send({ t: 'leave' });
  net.session = null;
  saveSession(null, null);
  history.replaceState(null, '', '/');
  showHome();
}

net.on((msg: ServerMessage) => {
  // Once we have left (or never joined), ignore room traffic that may still be in flight.
  const inRoom = store.state.playerId !== null;
  if (!inRoom && (msg.t === 'room' || msg.t === 'state' || msg.t === 'timer' || msg.t === 'chat' || msg.t === 'chatHistory')) return;
  switch (msg.t) {
    case 'welcome': {
      store.set({ playerId: msg.playerId, room: msg.room, chat: [] });
      currentCode = msg.room.code;
      saveSession(msg.session, msg.room.code);
      history.replaceState(null, '', `/${msg.room.code}`);
      if (msg.room.status === 'lobby') showLobby();
      else if (store.state.screen !== 'game') showGame();
      else game?.setRoom(msg.room);
      return;
    }
    case 'room': {
      const prev = store.state.room;
      store.set({ room: msg.room });
      if (msg.room.status === 'lobby' && store.state.screen !== 'lobby') { showLobby(); return; }
      if (msg.room.status !== 'lobby' && store.state.screen === 'lobby') { showGame(); }
      lobby?.update(msg.room, store.state.playerId!);
      game?.setRoom(msg.room);
      void prev;
      return;
    }
    case 'state': {
      store.set({ game: msg.state });
      if (store.state.screen !== 'game') showGame();
      game?.onState(msg.state, msg.events);
      if (msg.events.some((e) => e.type === 'tradeProposed' && e.trade.from === store.state.playerId)) game?.onTradeProposed();
      return;
    }
    case 'timer': store.set({ timerEndsAt: msg.endsAt }); game?.setTimer(msg.endsAt); return;
    case 'chat': store.state.chat.push(msg.message); if (store.state.chat.length > 100) store.state.chat.shift(); game?.addChat(msg.message); return;
    case 'chatHistory': store.set({ chat: msg.messages }); return;
    case 'error':
      toast(msg.message, 'error');
      game?.onError();
      if (msg.fatal) { saveSession(null, null); net.session = null; history.replaceState(null, '', '/'); showHome(); }
      return;
    case 'left': return;
    case 'pong': return;
  }
});

net.onStatus((s) => {
  store.set({ connection: s });
  if (s === 'closed' && store.state.screen !== 'home') toast('Connection lost, reconnecting…', 'error', 1500);
});

// Boot: resume a saved session if we have one (same room code as the URL, or any).
const saved = loadSession();
if (saved && (!prefill || saved.code === prefill)) {
  net.session = saved.session;
  app.appendChild(h('div', { class: 'screen-center' }, h('div', { class: 'paper', style: { padding: '20px 28px', fontWeight: '600' } }, 'Reconnecting…')));
  net.connect();
  // If the rejoin fails we get a fatal error → home.
} else {
  saveSession(null, null);
  showHome();
  net.connect();
}
