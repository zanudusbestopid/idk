// Single-player entry point: you against computer players, everything in the browser.
import './styles.css';
import { PAPER_DEFS } from './art/paper.js';
import { unlockAudio } from './audio.js';
import { h, toast } from './dom.js';
import { HUMAN_ID, LocalGame, clearSaved, loadSaved, type SavedGame, type SoloSetup } from './local.js';
import { GameScreen } from './ui/game.js';
import { renderSetup } from './ui/setup.js';
import type { RoomView } from '../shared/protocol.js';
import { DEFAULT_CONFIG } from '../engine/engine.js';
import { TOKEN_BY_ID } from '../shared/tokens.js';

const app = document.getElementById('app')!;
document.body.insertAdjacentHTML('afterbegin', PAPER_DEFS);
document.addEventListener('pointerdown', unlockAudio, { once: true });

let local: LocalGame | null = null;
let screen: GameScreen | null = null;
let lastSetup: SoloSetup | undefined;

function roomView(game: LocalGame): RoomView {
  return {
    code: 'SOLO',
    hostId: HUMAN_ID,
    status: game.state.phase === 'ended' ? 'ended' : 'playing',
    players: game.state.players.map((p) => ({ id: p.id, name: p.name, token: p.token, color: TOKEN_BY_ID[p.token]?.color ?? p.color, connected: true, isHost: p.id === HUMAN_ID })),
    config: { ...DEFAULT_CONFIG, ...game.setup.config },
    maxPlayers: 8,
  };
}

function showSetup(): void {
  screen?.destroy(); screen = null;
  local?.destroy(); local = null;
  renderSetup(app, {
    onStart: (setup) => { lastSetup = setup; clearSaved(); startGame(new LocalGame(setup)); },
    onResume: (saved: SavedGame) => { lastSetup = saved.setup; startGame(new LocalGame(saved.setup, saved.state)); },
  }, loadSaved(), lastSetup);
}

function startGame(game: LocalGame): void {
  local = game;
  screen = new GameScreen(app, HUMAN_ID, {
    send: (action) => {
      const r = game.send(action);
      if (!r.ok) { toast(r.error, 'error'); screen?.onError(); }
    },
    chat: () => {},
    leave: () => { clearSaved(); showSetup(); },
    restart: () => { clearSaved(); showSetup(); },
  }, {
    chat: false,
    onIdle: () => game.idle(),
    restartLabel: 'Play again',
    leaveText: 'Quit this game? Your progress will be lost.',
  });
  screen.setRoom(roomView(game));
  game.onState = (state, events) => { screen?.setRoom(roomView(game)); screen?.onState(state, events); };
  screen.onState(game.state, []);
}

app.appendChild(h('div', { class: 'screen-center' }, h('div', { class: 'paper', style: { padding: '20px 28px', fontWeight: '600' } }, 'Loading…')));
showSetup();
