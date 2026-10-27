import type { GameState, Space } from '../../shared/types.js';
import { dieFace } from '../art/dice.js';
import { ICONS } from '../art/icons.js';
import { h, clear, money, sleep } from '../dom.js';
import { sfx } from '../audio.js';
import { dur } from '../settings.js';
import { T, THEME, deckName } from '../theme.js';
import { tokenSvg } from './home.js';

export const GROUP_COLORS: Record<string, string> = {
  brown: '#8b4a2b', lightblue: '#7ec8e3', pink: '#d94f9a', orange: '#ef8a2b',
  red: '#d9413a', yellow: '#f2c94c', green: '#3aa655', darkblue: '#2f4fa8',
  railroad: '#2b2118', utility: '#9aa0a6',
};
export const LIGHT_GROUPS = new Set(['lightblue', 'yellow', 'utility']);

export function spaceColor(space: Space): string {
  if (space.type === 'property' && space.group) return GROUP_COLORS[space.group];
  if (space.type === 'railroad') return GROUP_COLORS.railroad;
  if (space.type === 'utility') return GROUP_COLORS.utility;
  return '#bbb';
}

export function sideOf(i: number): 'bottom' | 'left' | 'top' | 'right' {
  if (i <= 10) return 'bottom';
  if (i <= 20) return 'left';
  if (i <= 30) return 'top';
  return 'right';
}

function gridArea(i: number): string {
  let col: number, row: number;
  if (i <= 10) { col = 11 - i; row = 11; }
  else if (i < 20) { col = 1; row = 21 - i; }
  else if (i === 20) { col = 1; row = 1; }
  else if (i < 30) { col = i - 19; row = 1; }
  else if (i === 30) { col = 11; row = 1; }
  else { col = 11; row = i - 29; }
  return `${row} / ${col} / ${row + 1} / ${col + 1}`;
}

function spaceIcon(space: Space): string | null {
  switch (space.type) {
    case 'go': return ICONS.go;
    case 'chance': return ICONS.chance;
    case 'chest': return ICONS.chest;
    case 'railroad': return ICONS.railroad;
    case 'utility': return /water/i.test(space.name) ? ICONS.water : ICONS.electric;
    case 'tax': return /luxury/i.test(space.name) ? ICONS.luxurytax : ICONS.incometax;
    case 'jail': return ICONS.jail;
    case 'freeparking': return ICONS.freeparking;
    case 'gotojail': return ICONS.gotojail;
    default: return null;
  }
}

/** What the game screen needs from a board renderer (flat DOM board or 3D scene). */
export interface BoardView {
  readonly wrap: HTMLElement;
  build(state: GameState): void;
  resize(): void;
  updateStatic(state: GameState): void;
  placeTokens(state: GameState, animate: boolean): void;
  moveToken(playerId: string, from: number, to: number, opts: { direct?: boolean; backward?: boolean }, state: GameState): Promise<void>;
  flash(index: number): void;
  highlight(index: number | null): void;
  showDice(dice: [number, number], animate: boolean): Promise<void>;
  drawCard?(deck: 'chance' | 'chest', text?: string): void;
  setSpaceClick?(fn: (index: number) => void): void;
  setCameraMode?(mode: 'follow' | 'overview' | 'top'): void;
  setViewer?(playerId: string | null): void;
  celebrate?(winnerId: string): void;
  destroy?(): void;
}

const SLOT_OFFSETS: [number, number][] = [[0, 0.05], [-0.3, -0.18], [0.3, -0.18], [-0.3, 0.28], [0.3, 0.28], [0, -0.32], [-0.32, 0.05], [0.32, 0.05]];

export class Board implements BoardView {
  private viewer: string | null = null;
  setViewer(id: string | null): void { this.viewer = id; if (this.state) this.updateStatic(this.state); }
  readonly wrap: HTMLElement;
  readonly board: HTMLElement;
  readonly spaces: HTMLElement[] = [];
  private tokens = new Map<string, HTMLElement>();
  private tokenPos = new Map<string, number>();
  private facing = new Map<string, 'left' | 'right'>();
  private dice: HTMLElement[] = [];
  private banner: HTMLElement;
  private bannerWho: HTMLElement;
  private pot: HTMLElement;
  private onSpaceClick: (index: number) => void;
  private state: GameState | null = null;

  private ro: ResizeObserver;

  constructor(onSpaceClick: (index: number) => void) {
    this.onSpaceClick = onSpaceClick;
    this.board = h('div', { class: 'board' });
    this.wrap = h('div', { class: 'board-wrap' }, this.board);
    this.bannerWho = h('span', { class: 'who' });
    this.banner = h('div', { class: 'turn-banner paper paper--flat' }, this.bannerWho, h('span', null, "'s turn"));
    this.pot = h('div', { class: 'pot paper paper--flat hidden' });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.wrap);
  }

  destroy(): void {
    this.ro.disconnect();
    this.wrap.remove();
  }

  build(state: GameState): void {
    this.state = state;
    clear(this.board);
    this.spaces.length = 0;
    for (const space of state.board) {
      const side = sideOf(space.index);
      const corner = space.index % 10 === 0;
      const el = h('div', {
        class: `space space--${side} ${corner ? 'space--corner' : ''} ${space.type === 'property' ? 'space--property' : ''}`,
        style: { gridArea: gridArea(space.index) },
        dataset: { index: String(space.index) },
        title: space.name,
        onClick: () => this.onSpaceClick(space.index),
      });
      if (space.type === 'property') el.appendChild(h('div', { class: 'band', style: { '--band': spaceColor(space) } as unknown as Record<string, string> }));
      const content = h('div', { class: 'content' });
      const icon = spaceIcon(space);
      if (icon) content.appendChild(h('span', { class: 'sicon', html: icon }));
      const shortName = space.type === 'chest' ? T.chest : space.type === 'jail' ? T.jail : space.name;
      content.appendChild(h('div', { class: 'sname' }, shortName));
      if (space.price) content.appendChild(h('div', { class: 'sprice' }, money(space.price)));
      if (space.type === 'tax') content.appendChild(h('div', { class: 'sprice' }, `Pay ${money(space.amount ?? 0)}`));
      el.appendChild(content);
      el.appendChild(h('div', { class: 'houses' }));
      this.board.appendChild(el);
      this.spaces[space.index] = el;
    }
    // Center
    const chance = h('div', { class: 'deck deck--chance' }, h('span', { html: ICONS.chance }), deckName('chance').toUpperCase());
    const chestLabel = deckName('chest').toUpperCase();
    const chestSplit = chestLabel.indexOf(' ');
    const chestWords = chestSplit > 0 ? [chestLabel.slice(0, chestSplit), chestLabel.slice(chestSplit + 1)] : [chestLabel];
    const chest = h('div', { class: 'deck deck--chest' }, h('span', { html: ICONS.chest }), ...chestWords.map((w) => h('span', null, w)));
    this.dice = [h('div', { class: 'die', html: dieFace(1) }), h('div', { class: 'die', html: dieFace(1) })];
    const center = h('div', { class: 'center' },
      h('div', { class: 'logo title-art' }, THEME.title[0], h('span', { class: 'small' }, THEME.title[1])),
      h('div', { class: 'middle' }, chance, h('div', { class: 'dice-area' }, h('div', { class: 'dice' }, ...this.dice)), chest),
      h('div', { class: 'bottom' }, this.banner, this.pot),
    );
    this.board.appendChild(center);
    // Tokens
    for (const t of this.tokens.values()) t.remove();
    this.tokens.clear();
    this.tokenPos.clear();
    for (const p of state.players) {
      const el = h('div', { class: 'token', style: { '--tcolor': p.color } as unknown as Record<string, string> }, h('div', { class: 'flip', html: tokenSvg(p.token) }), h('span', { class: 'badge hidden', html: ICONS.jail }));
      this.board.appendChild(el);
      this.tokens.set(p.id, el);
      this.tokenPos.set(p.id, p.position);
      this.facing.set(p.id, 'left');
    }
    this.resize();
    this.updateStatic(state);
    this.placeTokens(state, false);
    if (state.dice) this.showDice(state.dice, false);
  }

  resize(): void {
    const w = this.wrap.clientWidth || 600;
    this.board.style.fontSize = `${(w / 100).toFixed(2)}px`;
    if (this.state) this.placeTokens(this.state, false);
  }

  /** Ownership markers, houses, mortgages, turn banner, pot. */
  updateStatic(state: GameState): void {
    this.state = state;
    const byId = new Map(state.players.map((p) => [p.id, p]));
    for (const space of state.board) {
      const el = this.spaces[space.index];
      if (!el) continue;
      const ps = state.properties[space.index];
      el.querySelector('.owner')?.remove();
      const houses = el.querySelector('.houses') as HTMLElement;
      clear(houses);
      el.classList.toggle('is-mortgaged', !!ps?.mortgaged);
      if (ps?.owner) {
        const owner = byId.get(ps.owner);
        el.appendChild(h('span', { class: 'owner', style: { '--owner': owner?.color ?? '#999' } as unknown as Record<string, string>, title: owner?.name ?? '' }));
        if (ps.houses === 5) houses.appendChild(h('span', { class: 'hotel', html: ICONS.hotel }));
        else for (let i = 0; i < ps.houses; i++) houses.appendChild(h('span', { html: ICONS.house }));
        // The svg inside the span needs the class for sizing
        houses.querySelectorAll('span').forEach((s) => { const svgEl = s.querySelector('svg'); if (svgEl && s.classList.contains('hotel')) svgEl.classList.add('hotel'); });
      }
    }
    const cur = state.players[state.currentPlayer];
    if (cur) {
      const mine = cur.id === this.viewer;
      this.bannerWho.textContent = mine ? 'Your' : cur.name;
      (this.banner.lastChild as HTMLElement).textContent = mine ? ' turn' : "'s turn";
      this.banner.style.setProperty('--who', cur.color);
    }
    if (state.phase === 'ended' && state.winner) {
      const w = byId.get(state.winner);
      const mine = state.winner === this.viewer;
      this.bannerWho.textContent = mine ? 'You' : (w?.name ?? '');
      (this.banner.lastChild as HTMLElement).textContent = mine ? ' win!' : ' wins!';
    }
    this.pot.classList.toggle('hidden', !state.config.freeParkingJackpot);
    this.pot.textContent = `${T.freeParking} pot: ${money(state.freeParkingPot)}`;
    for (const p of state.players) {
      const t = this.tokens.get(p.id);
      if (!t) continue;
      t.classList.toggle('is-current', state.players[state.currentPlayer]?.id === p.id && state.phase !== 'ended');
      t.classList.toggle('is-bankrupt', p.bankrupt);
      t.querySelector('.badge')?.classList.toggle('hidden', !p.inJail);
    }
  }

  private slotsAt(index: number, state: GameState): string[] {
    return state.players.filter((p) => !p.bankrupt && (this.tokenPos.get(p.id) ?? p.position) === index).map((p) => p.id);
  }

  private coordsFor(index: number, slot: number): { left: number; top: number } {
    const el = this.spaces[index];
    const em = parseFloat(this.board.style.fontSize) || 6;
    const [ox, oy] = SLOT_OFFSETS[slot % SLOT_OFFSETS.length];
    // offsetLeft/Top are layout coordinates relative to .board (its offsetParent), so the
    // board's decorative rotation does not skew them the way getBoundingClientRect would.
    const w = el.offsetWidth, hgt = el.offsetHeight;
    const cx = el.offsetLeft + w / 2 + ox * Math.min(w, 9 * em);
    const cy = el.offsetTop + hgt / 2 + oy * Math.min(hgt, 9 * em);
    // Nudge tokens toward the outer half of the space so the color band stays visible.
    const side = sideOf(index);
    const nudge = index % 10 === 0 ? 0 : 0.6 * em;
    return {
      left: cx + (side === 'left' ? -nudge : side === 'right' ? nudge : 0),
      top: cy + (side === 'bottom' ? nudge : side === 'top' ? -nudge : 0),
    };
  }

  placeTokens(state: GameState, animate: boolean): void {
    for (const p of state.players) {
      this.tokenPos.set(p.id, p.position);
    }
    for (const p of state.players) {
      const el = this.tokens.get(p.id);
      if (!el) continue;
      const slots = this.slotsAt(p.position, state);
      const slot = Math.max(0, slots.indexOf(p.id));
      const c = this.coordsFor(p.position, slot);
      if (!animate) el.style.transition = 'none';
      el.style.left = `${c.left}px`;
      el.style.top = `${c.top}px`;
      if (!animate) { void el.offsetWidth; el.style.transition = ''; }
    }
  }

  private setFacing(playerId: string, dir: 'left' | 'right'): void {
    const el = this.tokens.get(playerId);
    if (!el) return;
    this.facing.set(playerId, dir);
    el.classList.toggle('face-left', dir === 'left');
    el.style.setProperty('--sx', dir === 'left' ? '-1' : '1');
  }

  /** Walks a token space by space (or teleports when direct). Resolves when done. */
  async moveToken(playerId: string, from: number, to: number, opts: { direct?: boolean; backward?: boolean }, state: GameState): Promise<void> {
    const el = this.tokens.get(playerId);
    if (!el) return;
    if (opts.direct) {
      this.tokenPos.set(playerId, to);
      el.classList.add('is-hop');
      await sleep(120);
      const slot = Math.max(0, this.slotsAt(to, state).indexOf(playerId));
      const c = this.coordsFor(to, slot);
      el.style.transition = 'left 0.5s cubic-bezier(.3,1.4,.5,1), top 0.5s cubic-bezier(.3,1.4,.5,1)';
      el.style.left = `${c.left}px`; el.style.top = `${c.top}px`;
      await sleep(520);
      el.style.transition = '';
      el.classList.remove('is-hop');
      return;
    }
    const backward = opts.backward ?? ((from - to + 40) % 40 === 3);
    const steps = backward ? (from - to + 40) % 40 : (to - from + 40) % 40;
    const stepMs = dur(steps > 12 ? 95 : 170);
    let pos = from;
    for (let s = 0; s < steps; s++) {
      pos = backward ? (pos + 39) % 40 : (pos + 1) % 40;
      const side = sideOf(pos);
      const dir: 'left' | 'right' = backward
        ? (side === 'bottom' ? 'right' : side === 'left' ? 'left' : side === 'top' ? 'left' : 'right')
        : (side === 'bottom' ? 'left' : side === 'left' ? 'right' : side === 'top' ? 'right' : 'left');
      if (this.facing.get(playerId) !== dir) this.setFacing(playerId, dir);
      this.tokenPos.set(playerId, pos);
      const slot = pos === to ? Math.max(0, this.slotsAt(pos, state).indexOf(playerId)) : 0;
      const c = this.coordsFor(pos, slot);
      el.style.transitionDuration = `${stepMs}ms, ${stepMs}ms`;
      el.style.left = `${c.left}px`; el.style.top = `${c.top}px`;
      el.classList.remove('is-hop'); void el.offsetWidth; el.classList.add('is-hop');
      sfx.step();
      await sleep(stepMs);
    }
    el.style.transitionDuration = '';
    el.classList.remove('is-hop');
    // Re-slot everyone on the destination.
    this.placeTokens({ ...state, players: state.players.map((p) => (p.id === playerId ? { ...p, position: to } : { ...p, position: this.tokenPos.get(p.id) ?? p.position })) }, true);
    this.flash(to);
  }

  flash(index: number): void {
    const el = this.spaces[index];
    if (!el) return;
    el.classList.remove('is-landing'); void el.offsetWidth; el.classList.add('is-landing');
  }

  highlight(index: number | null): void {
    this.spaces.forEach((s, i) => s.classList.toggle('is-highlight', i === index));
  }

  async showDice(dice: [number, number], animate: boolean): Promise<void> {
    if (animate) {
      sfx.dice();
      for (const d of this.dice) { d.classList.remove('is-rolling'); void d.offsetWidth; d.classList.add('is-rolling'); }
      await sleep(dur(450));
    }
    this.dice[0].innerHTML = dieFace(dice[0]);
    this.dice[1].innerHTML = dieFace(dice[1]);
    if (animate) { await sleep(dur(600)); for (const d of this.dice) d.classList.remove('is-rolling'); }
  }
}
