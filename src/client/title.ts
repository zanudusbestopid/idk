// The cinematic scene behind the online home screen and lobby: the real 3D board,
// dressed up with the players we know about, with a looping camera. The menus float
// over it in a `.title-layer`; when a game starts the board is handed over to the
// game screen so the camera flies from the title shot into the game.
import type { LobbyPlayer } from '../shared/protocol.js';
import { TOKEN_BY_ID, TOKEN_LIST } from '../shared/tokens.js';
import type { GameConfig } from '../shared/types.js';
import { demoState, type DemoPlayer } from './demo.js';
import { h } from './dom.js';
import { Board3D, webglAvailable } from './ui/board3d.js';
import { loadBoardPref } from './ui/game.js';

export class TitleScene {
  private board: Board3D | null = null;
  private el: HTMLElement | null = null;
  private key = '';

  /** Creates the scene inside `app` when WebGL works and the player has not asked for the flat board. */
  constructor(app: HTMLElement) {
    if (!webglAvailable() || loadBoardPref() === '2d') return;
    try {
      this.board = new Board3D(() => {});
      this.el = h('div', { class: 'title-scene' }, this.board.wrap);
      app.appendChild(this.el);
      this.board.setMode('cinematic');
    } catch (e) {
      console.warn('title scene unavailable', e);
      this.board = null; this.el = null;
    }
  }

  get active(): boolean { return this.board !== null; }

  /** Put these players on the board. Rebuilds only when the set of (id, token) pairs changed. */
  show(players: DemoPlayer[], config?: Partial<GameConfig>): void {
    if (!this.board) return;
    const key = players.map((p) => `${p.id}:${p.token}`).join('|');
    if (key === this.key) return;
    this.key = key;
    this.board.build(demoState(padded(players), config));
  }

  /** Hand the board to the game screen. The board stays alive (and keeps its camera); the scene wrapper goes. */
  adopt(): Board3D | undefined {
    const board = this.board ?? undefined;
    this.board = null;
    this.el?.remove(); this.el = null;
    return board;
  }

  destroy(): void {
    this.board?.destroy(); this.board = null;
    this.el?.remove(); this.el = null;
  }
}

const PLACEHOLDER_TOKENS = ['hat', 'boat', 'dog', 'car', 'cat'];
const PLACEHOLDER_NAMES = ['Otto', 'Penny', 'Milo', 'Ada'];

function colorOf(token: string): string { return TOKEN_BY_ID[token]?.color ?? '#888'; }

/** Home screen: the visitor's pick plus four placeholder tokens that differ from it. */
export function homePlayers(name: string, token: string): DemoPlayer[] {
  const others = PLACEHOLDER_TOKENS.filter((t) => t !== token).slice(0, 4);
  return [
    { id: 'you', name: name || 'You', token, color: colorOf(token) },
    ...others.map((t, i) => ({ id: `demo-${t}`, name: PLACEHOLDER_NAMES[i], token: t, color: colorOf(t) })),
  ];
}

/** Lobby: exactly the people in the room with their chosen tokens. */
export function roomPlayers(players: LobbyPlayer[]): DemoPlayer[] {
  return players.map((p) => ({ id: p.id, name: p.name, token: p.token, color: colorOf(p.token) || p.color }));
}

/** The engine needs at least two players: while someone waits alone, seat one stand-in with an unused token. */
function padded(players: DemoPlayer[]): DemoPlayer[] {
  if (players.length >= 2) return players;
  const used = new Set(players.map((p) => p.token));
  const token = TOKEN_LIST.find((t) => !used.has(t.id))?.id ?? 'boat';
  return [...players, { id: 'demo-friend', name: 'A friend', token, color: colorOf(token) }];
}
