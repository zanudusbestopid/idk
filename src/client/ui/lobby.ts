import type { RoomView } from '../../shared/protocol.js';
import type { GameConfig } from '../../shared/types.js';
import { TOKEN_LIST } from '../../shared/tokens.js';
import { ICONS } from '../art/icons.js';
import { h, clear, toast } from '../dom.js';
import { tokenSvg } from './home.js';

export interface LobbyHandlers {
  onSetToken(token: string): void;
  onSetName(name: string): void;
  onSetConfig(c: Partial<GameConfig>): void;
  onKick(playerId: string): void;
  onStart(): void;
  onLeave(): void;
}

export class LobbyScreen {
  private root: HTMLElement;
  private handlers: LobbyHandlers;
  private playersEl = h('div', { class: 'players' });
  private tokenGrid = h('div', { class: 'token-grid' });
  private rulesEl = h('div');
  private startBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button' }, 'Start game') as HTMLButtonElement;
  private codeEl = h('span', { class: 'code paper paper--flat' });
  private linkEl = h('input', { class: 'input', readOnly: true, style: { maxWidth: '300px' } }) as HTMLInputElement;
  private hint = h('div', { class: 'muted small', style: { marginTop: '8px' } });
  private me: string | null = null;
  private room: RoomView | null = null;

  constructor(root: HTMLElement, handlers: LobbyHandlers) {
    this.root = root;
    this.handlers = handlers;
    clear(root);
    this.startBtn.addEventListener('click', () => handlers.onStart());
    const copyBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => this.copyLink() }, 'Copy invite link');
    const leaveBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => handlers.onLeave() }, 'Leave');
    const left = h('div', null,
      h('h1', null, 'Waiting room'),
      h('div', { class: 'muted small' }, 'Share the code or the link. Friends can join from any browser.'),
      h('div', { class: 'code-box' }, this.codeEl, copyBtn),
      this.linkEl,
      h('h2', { style: { fontSize: '1.1em', margin: '16px 0 6px' } }, 'Players'),
      this.playersEl,
      h('div', { class: 'my-token' }, h('span', { style: { fontWeight: '600' } }, 'Your token:'), this.tokenGrid),
      h('div', { class: 'actions' }, this.startBtn, leaveBtn),
      this.hint,
    );
    const right = h('div', { class: 'rules paper paper--flat paper--tilt-r' }, h('h2', null, 'House rules'), this.rulesEl);
    root.appendChild(h('div', { class: 'screen-center' }, h('div', { class: 'lobby paper' }, left, right)));
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
  }

  private renderRules(c: GameConfig, editable: boolean): void {
    clear(this.rulesEl);
    const rows: HTMLElement[] = [];
    const num = (key: keyof GameConfig, label: string, hint: string, min: number, max: number, step = 1) => {
      const input = h('input', { class: 'input', type: 'number', min, max, step, value: String(c[key] ?? 0), disabled: !editable }) as HTMLInputElement;
      input.addEventListener('change', () => this.handlers.onSetConfig({ [key]: Number(input.value) } as Partial<GameConfig>));
      rows.push(h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, label), h('div', { class: 'rhint' }, hint)), input));
    };
    const bool = (key: keyof GameConfig, label: string, hint: string) => {
      const sw = h('button', { class: `switch ${c[key] ? 'is-on' : ''}`, type: 'button', role: 'switch', 'aria-checked': String(!!c[key]), disabled: !editable,
        onClick: () => this.handlers.onSetConfig({ [key]: !c[key] } as Partial<GameConfig>) });
      rows.push(h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, label), h('div', { class: 'rhint' }, hint)), sw));
    };
    num('startingCash', 'Starting cash', 'Everyone begins with this much.', 100, 10000, 50);
    num('goSalary', 'Salary for passing Go', 'Collected each lap.', 0, 2000, 10);
    bool('auctions', 'Auctions', 'A property nobody buys goes to auction (official rule).');
    bool('freeParkingJackpot', 'Free Parking jackpot', 'Taxes and fees pile up; land there to collect.');
    bool('doubleGoSalary', 'Double salary on Go', 'Landing exactly on Go pays twice.');
    num('jailFine', 'Jail fine', 'Cost to leave jail early.', 0, 1000, 10);
    num('maxJailTurns', 'Max turns in jail', 'Then you must pay and move.', 1, 6);
    const timerSel = h('select', { class: 'input', disabled: !editable }) as HTMLSelectElement;
    for (const [v, label] of [[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s'], [120, '2 min'], [180, '3 min'], [300, '5 min']] as [number, string][]) {
      timerSel.appendChild(h('option', { value: String(v), selected: (c.turnTimerSeconds ?? 0) === v }, label));
    }
    timerSel.addEventListener('change', () => this.handlers.onSetConfig({ turnTimerSeconds: Number(timerSel.value) || null }));
    rows.push(h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, 'Turn timer'), h('div', { class: 'rhint' }, 'Slow players get auto-played.')), timerSel));
    this.rulesEl.append(...rows);
    if (!editable) this.rulesEl.appendChild(h('div', { class: 'muted small', style: { marginTop: '8px' } }, h('span', { class: 'ico', html: ICONS.timer, style: { width: '1em', display: 'inline-block', verticalAlign: 'middle' } }), ' Only the host can change the rules.'));
  }
}
