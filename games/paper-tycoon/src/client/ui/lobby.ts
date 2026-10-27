import type { LobbyPlayer, RoomView } from '../../shared/protocol.js';
import type { GameConfig } from '../../shared/types.js';
import { TOKEN_LIST } from '../../shared/tokens.js';
import { h, clear, toast } from '../dom.js';
import { tokenSvg } from './home.js';
import { hostOnlyNote, rulesPanel, turnTimerRule } from './rules.js';
import { T, THEME } from '../theme.js';

export interface LobbyHandlers {
  onSetToken(token: string): void;
  onSetName(name: string): void;
  onSetConfig(c: Partial<GameConfig>): void;
  onKick(playerId: string): void;
  onStart(): void;
  onLeave(): void;
  /** Called on every room update with the people in the room, so the scene behind the card can show them. */
  onPreview?(players: LobbyPlayer[], config: GameConfig): void;
}

const idx = (i: number) => ({ '--i': String(i) } as unknown as Record<string, string>);

/** Waiting room: hero title on the left, the lobby card on the right, both floating over the title scene. */
export class LobbyScreen {
  private root: HTMLElement;
  private handlers: LobbyHandlers;
  private playersEl = h('div', { class: 'players' });
  private tokenGrid = h('div', { class: 'token-grid' });
  private rulesEl = h('div');
  private startBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', id: 'lobby-start' }, 'Start game') as HTMLButtonElement;
  private codeEl = h('span', { class: 'code paper paper--flat' });
  private linkEl = h('input', { class: 'input', readOnly: true }) as HTMLInputElement;
  private hint = h('div', { class: 'muted small hint' });
  private me: string | null = null;
  private room: RoomView | null = null;

  constructor(root: HTMLElement, handlers: LobbyHandlers) {
    this.root = root;
    this.handlers = handlers;
    clear(root);
    this.startBtn.addEventListener('click', () => handlers.onStart());
    const copyBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => this.copyLink() }, 'Copy invite link');
    const leaveBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => handlers.onLeave() }, 'Leave');
    const rules = h('details', { class: 'rules-fold' },
      h('summary', null, 'House rules ', h('span', { class: 'muted small' }, `(auctions, ${T.freeParking}, starting cash…)`)), this.rulesEl);

    const hero = h('div', { class: 'title-hero' },
      h('h1', { class: 'title-art' }, h('span', null, THEME.title[0]), h('span', null, THEME.title[1])),
      h('p', { class: 'tagline hand' }, 'Waiting room. Share the code or the link; friends can join from any browser.'));
    const card = h('div', { class: 'setup-card paper lobby' },
      h('div', { class: 'field', style: idx(0) }, h('label', null, 'Room code'), h('div', { class: 'code-box' }, this.codeEl, copyBtn), this.linkEl),
      h('div', { class: 'field', style: idx(1) }, h('label', null, 'Players'), this.playersEl),
      h('div', { class: 'field', style: idx(2) }, h('label', null, 'Your token'), this.tokenGrid),
      h('div', { class: 'field', style: idx(3) }, rules),
      h('div', { class: 'field', style: idx(4) }, h('div', { class: 'actions' }, this.startBtn, leaveBtn), this.hint),
    );
    root.append(hero, card);
  }

  private copyLink(): void {
    const link = this.linkEl.value;
    navigator.clipboard?.writeText(link).then(() => toast('Invite link copied'), () => { this.linkEl.select(); toast('Select and copy the link'); });
  }

  update(room: RoomView, me: string): void {
    this.room = room; this.me = me;
    const isHost = room.hostId === me;
    this.codeEl.textContent = room.code;
    this.linkEl.value = `${location.origin}/${room.code}`;

    clear(this.playersEl);
    for (const p of room.players) {
      const row = h('div', { class: 'player-row paper paper--flat', style: { '--pcolor': p.color } as unknown as Record<string, string> },
        h('span', { html: tokenSvg(p.token) }),
        h('div', null,
          h('div', { class: 'pname' }, p.name, p.id === me ? h('span', { class: 'tag tag--you', style: { marginLeft: '6px' } }, 'you') : null),
          h('div', { class: 'pmeta' },
            p.isHost ? h('span', { class: 'tag tag--host' }, 'host') : null,
            p.connected ? null : h('span', { class: 'tag tag--off' }, 'disconnected'),
            h('span', { class: 'tag', style: { background: p.color, color: '#fff' } }, TOKEN_LIST.find((t) => t.id === p.token)?.name ?? p.token)),
        ),
        isHost && p.id !== me ? h('button', { class: 'btn btn--sm', type: 'button', onClick: () => this.handlers.onKick(p.id) }, 'Remove') : h('span'),
      );
      if (p.id === me) {
        const nameBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => {
          const n = prompt('Your name', p.name);
          if (n !== null && n.trim()) this.handlers.onSetName(n.trim());
        } }, 'Rename');
        row.lastElementChild!.replaceWith(nameBtn);
      }
      this.playersEl.appendChild(row);
    }

    clear(this.tokenGrid);
    const mine = room.players.find((p) => p.id === me);
    const taken = new Set(room.players.filter((p) => p.id !== me).map((p) => p.token));
    for (const t of TOKEN_LIST) {
      const el = h('button', { class: `token-pick ${mine?.token === t.id ? 'is-selected' : ''} ${taken.has(t.id) ? 'is-taken' : ''}`, type: 'button', title: t.name, disabled: taken.has(t.id),
        onClick: () => this.handlers.onSetToken(t.id) }, h('span', { html: tokenSvg(t.id) }), h('span', { class: 'name' }, t.name));
      this.tokenGrid.appendChild(el);
    }

    this.renderRules(room.config, isHost);
    const connected = room.players.filter((p) => p.connected).length;
    this.startBtn.disabled = !isHost || connected < 2;
    this.startBtn.classList.toggle('hidden', !isHost);
    this.hint.textContent = isHost
      ? (connected < 2 ? 'You need at least 2 players to start.' : `${connected} players ready. Up to ${room.maxPlayers} can join.`)
      : 'Waiting for the host to start the game…';
    this.handlers.onPreview?.(room.players, room.config);
  }

  private renderRules(c: GameConfig, editable: boolean): void {
    clear(this.rulesEl);
    this.rulesEl.appendChild(rulesPanel(c, editable, (patch) => this.handlers.onSetConfig(patch)));
    this.rulesEl.appendChild(turnTimerRule(c, editable, (patch) => this.handlers.onSetConfig(patch)));
    if (!editable) this.rulesEl.appendChild(hostOnlyNote());
  }
}
