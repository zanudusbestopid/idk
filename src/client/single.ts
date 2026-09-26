// Single-player entry point: you against computer players, everything in the browser.
import './styles.css';
import { PAPER_DEFS } from './art/paper.js';
import { unlockAudio } from './audio.js';
import { h, clear, toast } from './dom.js';
import { HUMAN_ID, LocalGame, clearSaved, loadSaved, type SavedGame, type SoloSetup } from './local.js';
import { GameScreen, loadBoardPref } from './ui/game.js';
import { Board3D, webglAvailable } from './ui/board3d.js';
import { renderSetup } from './ui/setup.js';
import type { RoomView } from '../shared/protocol.js';
import { DEFAULT_CONFIG, createGame } from '../engine/engine.js';
import type { GameState } from '../shared/types.js';
import { TOKEN_BY_ID } from '../shared/tokens.js';

const app = document.getElementById('app')!;
document.body.insertAdjacentHTML('afterbegin', PAPER_DEFS);
document.addEventListener('pointerdown', unlockAudio, { once: true });

let local: LocalGame | null = null;
let screen: GameScreen | null = null;
let lastSetup: SoloSetup | undefined;
let titleBoard: Board3D | null = null;

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

/** A lived-in board for the title screen: the chosen tokens scattered around, some streets built up. */
function demoState(setup: SoloSetup): GameState {
  const players = [
    { id: HUMAN_ID, name: setup.name || 'You', token: setup.token, color: TOKEN_BY_ID[setup.token]?.color ?? '#888' },
    ...setup.bots.map((b, i) => ({ id: `bot${i + 1}`, name: b.name, token: b.token, color: TOKEN_BY_ID[b.token]?.color ?? '#888' })),
  ];
  const st = createGame({ ...DEFAULT_CONFIG, ...setup.config }, players, 12345);
  const spots = [0, 6, 11, 16, 24, 29, 34, 37];
  st.players.forEach((p, i) => { p.position = spots[(i * 3) % spots.length]; p.connected = true; });
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

function showSetup(): void {
  screen?.destroy(); screen = null;
  local?.destroy(); local = null;
  titleBoard?.destroy(); titleBoard = null;
  clear(app);
  if (webglAvailable() && loadBoardPref() !== '2d') {
    try {
      titleBoard = new Board3D(() => {});
      app.appendChild(h('div', { class: 'title-scene' }, titleBoard.wrap));
      titleBoard.setMode('cinematic');
    } catch (e) { console.warn('title scene unavailable', e); titleBoard = null; }
  }
  const layer = h('div', { class: 'title-layer' });
  app.appendChild(layer);
  renderSetup(layer, {
    onStart: (setup) => { lastSetup = setup; clearSaved(); leaveTitle(() => startGame(new LocalGame(setup))); },
    onResume: (saved: SavedGame) => { lastSetup = saved.setup; leaveTitle(() => startGame(new LocalGame(saved.setup, saved.state))); },
    onPreview: (setup) => { titleBoard?.build(demoState(setup)); },
  }, loadSaved(), lastSetup);
}

function leaveTitle(then: () => void): void {
  const layer = app.querySelector('.title-layer');
  if (!layer) { then(); return; }
  layer.classList.add('is-leaving');
  setTimeout(then, 480);
}

function startGame(game: LocalGame): void {
  local = game;
  const adopted = titleBoard;
  titleBoard = null;
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
    board: adopted ?? undefined,
  });
  screen.setRoom(roomView(game));
  game.onState = (state, events) => { screen?.setRoom(roomView(game)); screen?.onState(state, events); };
  screen.onState(game.state, []);
  adopted?.setMode('follow');
}

app.appendChild(h('div', { class: 'screen-center' }, h('div', { class: 'paper', style: { padding: '20px 28px', fontWeight: '600' } }, 'Loading…')));
showSetup();
