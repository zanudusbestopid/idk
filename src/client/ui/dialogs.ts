import { canBuild, canMortgage, canSellHouse, canUnmortgage, legalActions, netWorth, rentFor } from '../../engine/engine.js';
import { GROUPS, RAILROADS, UTILITIES, mortgageValue } from '../../shared/board.js';
import type { Action, GameState, Player, Space, Trade, TradeSide } from '../../shared/types.js';
import { ICONS } from '../art/icons.js';
import { sfx } from '../audio.js';
import { h, clear, money, sleep } from '../dom.js';
import { GROUP_COLORS, LIGHT_GROUPS, spaceColor } from './board.js';
import { tokenSvg } from './home.js';
import { getSettings, updateSettings } from '../settings.js';

export type Send = (a: Action) => void;

// ---------- modal manager ----------

export interface DialogHandle { el: HTMLElement; close(): void; }

export class Modals {
  private open = new Map<string, DialogHandle>();

  show(key: string, content: HTMLElement, opts: { wide?: boolean; passive?: boolean; dismissible?: boolean; onClose?: () => void } = {}): DialogHandle {
    this.close(key);
    const dialog = h('div', { class: `dialog paper ${opts.wide ? 'dialog--wide' : ''}` }, content);
    const overlay = h('div', { class: `overlay ${opts.passive ? 'is-passive' : ''}` }, dialog);
    if (opts.dismissible) overlay.addEventListener('click', (e) => { if (e.target === overlay) handle.close(); });
    document.body.appendChild(overlay);
    const handle: DialogHandle = { el: dialog, close: () => { overlay.remove(); if (this.open.get(key) === handle) this.open.delete(key); opts.onClose?.(); } };
    this.open.set(key, handle);
    return handle;
  }
  has(key: string): boolean { return this.open.has(key); }
  get(key: string): DialogHandle | undefined { return this.open.get(key); }
  close(key: string): void { this.open.get(key)?.close(); }
  closeAll(except: string[] = []): void { for (const k of [...this.open.keys()]) if (!except.includes(k)) this.close(k); }
}

/** In-page yes/no question (window.confirm is unavailable in some hosts). */
export function confirmDialog(modals: Modals, text: string, onYes: () => void, yesLabel = 'Yes', noLabel = 'Cancel'): void {
  const content = h('div', null,
    h('p', { style: { fontSize: '1.1em', margin: '4px 0 0' } }, text),
    h('div', { class: 'buttons' },
      h('button', { class: 'btn', type: 'button', onClick: () => modals.close('confirm') }, noLabel),
      h('button', { class: 'btn btn--primary', type: 'button', onClick: () => { modals.close('confirm'); onYes(); } }, yesLabel)));
  modals.show('confirm', content, { dismissible: true });
}

// ---------- shared pieces ----------

export function playerName(state: GameState, id: string | null): string {
  if (id === null) return 'the Bank';
  return state.players.find((p) => p.id === id)?.name ?? '?';
}

export function playerColor(state: GameState, id: string | null): string {
  if (id === null) return '#666';
  return state.players.find((p) => p.id === id)?.color ?? '#666';
}

export function nameTag(state: GameState, id: string | null): HTMLElement {
  return h('b', { style: { color: playerColor(state, id) } }, playerName(state, id));
}

export function ownedBy(state: GameState, playerId: string): number[] {
  return Object.entries(state.properties).filter(([, ps]) => ps.owner === playerId).map(([i]) => Number(i)).sort((a, b) => a - b);
}

export function groupHasBuildings(state: GameState, space: Space): boolean {
  if (space.type !== 'property' || !space.group) return false;
  return GROUPS[space.group].some((i) => (state.properties[i]?.houses ?? 0) > 0);
}

/** A property deed card. */
export function deedCard(state: GameState, index: number, opts: { diceTotal?: number } = {}): HTMLElement {
  const space = state.board[index];
  const ps = state.properties[index];
  const color = spaceColor(space);
  const light = space.group ? LIGHT_GROUPS.has(space.group) : space.type === 'utility';
  const band = h('div', { class: `deed-band ${light ? 'is-light' : ''}`, style: { '--band': color } as unknown as Record<string, string> },
    h('div', { class: 'kind' }, space.type === 'property' ? 'TITLE DEED' : space.type === 'railroad' ? 'RAILROAD' : 'UTILITY'),
    h('div', { class: 'dname' }, space.name));
  const body = h('div', { class: 'deed-body' });
  const owner = ps?.owner ?? null;
  const ownerCount = (list: number[]) => list.filter((i) => owner && state.properties[i]?.owner === owner).length;
  const table = h('table');
  const row = (label: string, value: string, active = false) => table.appendChild(h('tr', { class: active ? 'is-active' : '' }, h('td', null, label), h('td', null, value)));
  if (space.type === 'property' && space.rent) {
    const houses = ps?.houses ?? 0;
    const hasSet = !!owner && GROUPS[space.group!].every((i) => state.properties[i]?.owner === owner);
    row('Rent', money(space.rent[0]), houses === 0 && !hasSet);
    row('Rent with full set', money(space.rent[0] * 2), houses === 0 && hasSet);
    for (let i = 1; i <= 4; i++) row(`With ${i} house${i > 1 ? 's' : ''}`, money(space.rent[i]), houses === i);
    row('With hotel', money(space.rent[5]), houses === 5);
    body.appendChild(table);
    body.appendChild(h('div', { class: 'foot' }, `Houses cost ${money(space.houseCost!)} each · Mortgage value ${money(mortgageValue(space))}`));
  } else if (space.type === 'railroad') {
    body.appendChild(h('span', { class: 'deed-icon', html: ICONS.railroad }));
    const n = ownerCount(RAILROADS);
    [25, 50, 100, 200].forEach((r, i) => row(`Rent with ${i + 1} railroad${i > 0 ? 's' : ''}`, money(r), n === i + 1));
    body.appendChild(table);
    body.appendChild(h('div', { class: 'foot' }, `Mortgage value ${money(mortgageValue(space))}`));
  } else if (space.type === 'utility') {
    body.appendChild(h('span', { class: 'deed-icon', html: /water/i.test(space.name) ? ICONS.water : ICONS.electric }));
    const n = ownerCount(UTILITIES);
    row('One utility owned', '4 × dice', n === 1);
    row('Both utilities owned', '10 × dice', n === 2);
    body.appendChild(table);
    body.appendChild(h('div', { class: 'foot' }, `Mortgage value ${money(mortgageValue(space))}`));
  }
  if (owner) {
    body.appendChild(h('div', { class: 'deed-owner' }, h('span', { class: 'dot', style: { '--owner': playerColor(state, owner) } as unknown as Record<string, string> }), 'Owned by ', nameTag(state, owner), ps?.mortgaged ? h('span', { class: 'tag' }, 'mortgaged') : null));
    if (opts.diceTotal !== undefined && !ps?.mortgaged) body.appendChild(h('div', { class: 'foot' }, `Current rent: ${money(rentFor(state, index, opts.diceTotal))}`));
  } else {
    body.appendChild(h('div', { class: 'deed-owner' }, h('span', { class: 'muted' }, `Unowned · Price ${money(space.price ?? 0)}`)));
  }
  return h('div', { class: 'deed paper paper--flat' }, band, body);
}

// ---------- buy ----------

export function buyContent(state: GameState, index: number, me: Player, send: Send, auctionsOn: boolean): HTMLElement {
  const space = state.board[index];
  const price = space.price ?? 0;
  const canAfford = me.cash >= price;
  return h('div', null,
    h('h2', null, h('span', { class: 'ico', html: ICONS.dollar }), `Buy ${space.name}?`),
    deedCard(state, index),
    h('p', { class: 'muted', style: { textAlign: 'center' } }, `You have ${money(me.cash)}. `, canAfford ? '' : 'You cannot afford this.'),
    h('div', { class: 'buttons' },
      h('button', { class: 'btn', type: 'button', onClick: () => send({ type: 'decline' }) }, auctionsOn ? 'Decline (auction)' : 'Decline'),
      h('button', { class: 'btn btn--good btn--lg', type: 'button', disabled: !canAfford, onClick: () => send({ type: 'buy' }) }, `Buy for ${money(price)}`)),
  );
}

// ---------- auction ----------

export class AuctionView {
  el = h('div', { class: 'auction' });
  private bidsEl = h('div', { class: 'bids' });
  private input = h('input', { class: 'input', type: 'number', min: 1, step: 1 }) as HTMLInputElement;
  private status = h('div', { class: 'hand', style: { fontSize: '1.15em', margin: '6px 0' } });
  private form = h('div', { class: 'bidform' });
  private deedHost = h('div');
  private send: Send;
  private lastSpace = -1;

  constructor(send: Send) {
    this.send = send;
    const bidBtn = h('button', { class: 'btn btn--good', type: 'button', onClick: () => this.bid() }, 'Bid');
    const passBtn = h('button', { class: 'btn', type: 'button', onClick: () => send({ type: 'passAuction' }) }, 'Pass');
    const quick = (n: number) => h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { this.input.value = String(this.minBid() + n - 1); this.bid(); } }, `+${n}`);
    this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.bid(); });
    this.form.append(this.input, bidBtn, quick(1), quick(10), quick(50), passBtn);
    this.el.append(h('h2', null, h('span', { class: 'ico', html: ICONS.hammer }), 'Auction'), this.deedHost, this.status, this.bidsEl, this.form);
  }

  private minBid(): number { return (this.high ?? 0) + 1; }
  private high: number | null = null;

  private bid(): void {
    const v = Math.floor(Number(this.input.value));
    if (!Number.isFinite(v) || v < this.minBid()) { this.input.value = String(this.minBid()); return; }
    this.send({ type: 'bid', amount: v });
  }

  update(state: GameState, meId: string): void {
    const a = state.auction;
    if (!a) return;
    if (a.space !== this.lastSpace) { clear(this.deedHost); this.deedHost.appendChild(deedCard(state, a.space)); this.lastSpace = a.space; }
    this.high = a.highBid;
    const current = (a as unknown as { current?: string }).current ?? a.active[0];
    clear(this.bidsEl);
    for (const p of state.players) {
      if (p.bankrupt) continue;
      const out = !a.active.includes(p.id);
      const isHigh = a.highBidder === p.id;
      this.bidsEl.appendChild(h('div', { class: `bidrow ${isHigh ? 'is-high' : ''} ${out ? 'is-out' : ''}` },
        h('span', null, nameTag(state, p.id), p.id === current && !out ? h('span', { class: 'tag', style: { marginLeft: '6px' } }, 'bidding') : null),
        h('span', null, isHigh ? `High bid ${money(a.highBid)}` : out ? 'passed' : `cash ${money(p.cash)}`)));
    }
    const myTurn = current === meId && a.active.includes(meId);
    const legal = legalActions(state, meId);
    const canBid = myTurn && legal.includes('bid');
    this.form.classList.toggle('hidden', !myTurn);
    this.form.querySelectorAll('button, input').forEach((b) => ((b as HTMLButtonElement).disabled = !canBid && !(b as HTMLElement).textContent?.includes('Pass')));
    const me = state.players.find((p) => p.id === meId);
    this.input.min = String(this.minBid());
    if (!this.input.value || Number(this.input.value) < this.minBid()) this.input.value = String(this.minBid());
    this.status.textContent = myTurn
      ? `Your bid. Minimum ${money(this.minBid())}, you have ${money(me?.cash ?? 0)}.`
      : `${playerName(state, current ?? null)} is deciding… ${a.highBidder ? `High bid ${money(a.highBid)} by ${playerName(state, a.highBidder)}.` : 'No bids yet.'}`;
  }
}

// ---------- chance / chest card ----------

export async function showCard(modals: Modals, deck: 'chance' | 'chest', text: string, low = false): Promise<void> {
  sfx.card();
  const content = h('div', { class: `card-pop ${deck}` },
    h('div', { class: 'card-head' }, h('span', { html: deck === 'chance' ? ICONS.chance : ICONS.chest }), deck === 'chance' ? 'CHANCE' : 'COMMUNITY CHEST'),
    h('div', { class: 'card-text hand' }, text),
    h('div', { class: 'muted small', style: { textAlign: 'center', paddingBottom: '10px' } }, 'click to continue'));
  const handle = modals.show('card', content, { dismissible: true });
  handle.el.style.padding = '0';
  handle.el.style.overflow = 'hidden';
  if (low) handle.el.parentElement?.classList.add('is-low');
  let done = false;
  const p = new Promise<void>((resolve) => {
    const finish = () => { if (done) return; done = true; handle.close(); resolve(); };
    handle.el.addEventListener('click', finish);
    handle.el.parentElement?.addEventListener('click', finish);
    setTimeout(finish, 4200);
  });
  await sleep(1500);
  // Let the caller continue after a moment, but keep the card until clicked or timed out.
  void p;
}

// ---------- manage assets (build / mortgage) ----------

export class ManageView {
  el = h('div', { class: 'manage' });
  private list = h('div');
  private cashEl = h('span', { class: 'money' });
  private supply = h('span', { class: 'muted small' });
  private send: Send;

  constructor(send: Send, onClose: () => void) {
    this.send = send;
    this.el.append(
      h('h2', null, h('span', { class: 'ico', html: ICONS.hammer }), 'Manage properties'),
      h('div', { class: 'row-between', style: { marginBottom: '8px' } }, h('span', null, 'Cash: ', this.cashEl), this.supply),
      this.list,
      h('div', { class: 'buttons' }, h('button', { class: 'btn', type: 'button', onClick: onClose }, 'Done')),
    );
  }

  update(state: GameState, meId: string): void {
    const me = state.players.find((p) => p.id === meId)!;
    this.cashEl.textContent = money(me.cash);
    this.supply.textContent = `Bank has ${state.housesLeft} houses, ${state.hotelsLeft} hotels`;
    clear(this.list);
    const mine = ownedBy(state, meId);
    if (mine.length === 0) { this.list.appendChild(h('p', { class: 'muted' }, 'You do not own anything yet.')); return; }
    const groups = new Map<string, number[]>();
    for (const i of mine) {
      const s = state.board[i];
      const key = s.type === 'property' ? s.group! : s.type;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    }
    for (const [key, idxs] of groups) {
      const g = h('div', { class: 'group' });
      for (const i of idxs) {
        const s = state.board[i];
        const ps = state.properties[i];
        const chip = h('span', { class: `chip ${ps.mortgaged ? 'is-mortgaged' : ''}`, style: { '--chip': GROUP_COLORS[key] ?? '#999' } as unknown as Record<string, string> });
        const desc = ps.mortgaged ? 'mortgaged' : ps.houses === 5 ? 'hotel' : ps.houses > 0 ? `${ps.houses} house${ps.houses > 1 ? 's' : ''}` : '';
        const buttons = h('div', { class: 'pb' });
        if (s.type === 'property') {
          const b = canBuild(state, meId, i);
          const sh = canSellHouse(state, meId, i);
          buttons.append(
            h('button', { class: 'btn btn--sm btn--good', type: 'button', disabled: !b.ok, title: b.ok ? `Build for ${money(s.houseCost!)}` : b.reason ?? '', onClick: () => this.send({ type: 'build', space: i }) }, ps.houses === 4 ? 'Hotel' : 'Build', ` ${money(s.houseCost!)}`),
            h('button', { class: 'btn btn--sm', type: 'button', disabled: !sh.ok, title: sh.ok ? `Sell for ${money(s.houseCost! / 2)}` : sh.reason ?? '', onClick: () => this.send({ type: 'sellHouse', space: i }) }, 'Sell'),
          );
        }
        const m = canMortgage(state, meId, i);
        const um = canUnmortgage(state, meId, i);
        if (ps.mortgaged) buttons.appendChild(h('button', { class: 'btn btn--sm btn--blue', type: 'button', disabled: !um.ok, title: um.ok ? '' : um.reason ?? '', onClick: () => this.send({ type: 'unmortgage', space: i }) }, `Unmortgage ${money(Math.ceil(mortgageValue(s) * 1.1))}`));
        else buttons.appendChild(h('button', { class: 'btn btn--sm', type: 'button', disabled: !m.ok, title: m.ok ? '' : m.reason ?? '', onClick: () => this.send({ type: 'mortgage', space: i }) }, `Mortgage +${money(mortgageValue(s))}`));
        g.appendChild(h('div', { class: 'prow' }, chip, h('div', { class: 'pn' }, s.name, ' ', h('small', null, desc)), buttons));
      }
      this.list.appendChild(g);
    }
  }
}

// ---------- debt ----------

export class DebtView {
  el = h('div');
  private text = h('p', { style: { fontSize: '1.1em' } });
  private manage: ManageView;
  private payBtn = h('button', { class: 'btn btn--good btn--lg', type: 'button' }) as HTMLButtonElement;
  private bankruptBtn = h('button', { class: 'btn btn--primary', type: 'button' }) as HTMLButtonElement;

  constructor(send: Send, modals: Modals) {
    this.manage = new ManageView(send, () => { /* no close in debt */ });
    this.manage.el.querySelector('.buttons')?.remove();
    this.manage.el.querySelector('h2')?.remove();
    this.payBtn.addEventListener('click', () => send({ type: 'payDebt' }));
    this.bankruptBtn.addEventListener('click', () => confirmDialog(modals, 'Declare bankruptcy? You will be out of the game.', () => send({ type: 'declareBankruptcy' }), 'Declare bankruptcy'));
    this.el.append(h('h2', null, h('span', { class: 'ico', html: ICONS.incometax }), 'You owe money'), this.text, this.manage.el, h('div', { class: 'buttons' }, this.bankruptBtn, this.payBtn));
  }

  update(state: GameState, meId: string): void {
    const d = state.debt!;
    const me = state.players.find((p) => p.id === meId)!;
    clear(this.text);
    this.text.append('You owe ', h('b', null, money(d.amount)), ' to ', nameTag(state, d.creditor), ` (${d.reason}). You have `, h('b', null, money(me.cash)), '. Sell houses or mortgage properties to raise cash.');
    this.manage.update(state, meId);
    const legal = legalActions(state, meId);
    this.payBtn.disabled = !legal.includes('payDebt');
    this.payBtn.textContent = `Pay ${money(d.amount)}`;
    this.bankruptBtn.textContent = 'Declare bankruptcy';
    this.bankruptBtn.disabled = !legal.includes('declareBankruptcy');
  }
}

// ---------- trade ----------

export class TradeComposer {
  el = h('div', { class: 'trade' });
  private partnerSel = h('select', { class: 'input' }) as HTMLSelectElement;
  private cols = h('div', { class: 'cols' });
  private send: Send;
  private state: GameState;
  private meId: string;
  private offer: TradeSide = { cash: 0, properties: [], jailCards: 0 };
  private request: TradeSide = { cash: 0, properties: [], jailCards: 0 };

  constructor(send: Send, state: GameState, meId: string, onClose: () => void, partnerId?: string) {
    this.send = send; this.state = state; this.meId = meId;
    const others = state.players.filter((p) => p.id !== meId && !p.bankrupt);
    for (const p of others) this.partnerSel.appendChild(h('option', { value: p.id, selected: p.id === partnerId }, p.name));
    this.partnerSel.addEventListener('change', () => { this.request = { cash: 0, properties: [], jailCards: 0 }; this.render(); });
    const propose = h('button', { class: 'btn btn--good', type: 'button', onClick: () => this.propose() }, 'Propose trade');
    this.el.append(
      h('h2', null, h('span', { class: 'ico', html: ICONS.trade }), 'Propose a trade'),
      h('div', { class: 'field' }, h('label', null, 'Trade with'), this.partnerSel),
      this.cols,
      h('div', { class: 'buttons' }, h('button', { class: 'btn', type: 'button', onClick: onClose }, 'Cancel'), propose),
    );
    this.render();
  }

  update(state: GameState): void { this.state = state; this.render(); }

  private side(owner: Player, side: TradeSide, title: string): HTMLElement {
    const st = this.state;
    const list = h('div', { class: 'plist' });
    for (const i of ownedBy(st, owner.id)) {
      const s = st.board[i];
      const ps = st.properties[i];
      const locked = groupHasBuildings(st, s);
      const cb = h('input', { type: 'checkbox', checked: side.properties.includes(i), disabled: locked }) as HTMLInputElement;
      cb.addEventListener('change', () => { side.properties = cb.checked ? [...side.properties, i] : side.properties.filter((x) => x !== i); });
      list.appendChild(h('label', { class: locked ? 'is-locked' : '', title: locked ? 'Sell the buildings in this color group first' : '' }, cb,
        h('span', { class: `chip ${ps.mortgaged ? 'is-mortgaged' : ''}`, style: { '--chip': spaceColor(s) } as unknown as Record<string, string> }), s.name, ps.mortgaged ? h('span', { class: 'tag' }, 'mortgaged') : null));
    }
    if (!list.hasChildNodes()) list.appendChild(h('span', { class: 'muted small' }, 'No properties'));
    const cash = h('input', { class: 'input', type: 'number', min: 0, max: owner.cash, step: 1, value: String(side.cash) }) as HTMLInputElement;
    cash.addEventListener('change', () => { side.cash = Math.max(0, Math.min(owner.cash, Math.floor(Number(cash.value) || 0))); cash.value = String(side.cash); });
    const cards = h('input', { class: 'input', type: 'number', min: 0, max: owner.jailCards, step: 1, value: String(side.jailCards), style: { width: '5em' } }) as HTMLInputElement;
    cards.addEventListener('change', () => { side.jailCards = Math.max(0, Math.min(owner.jailCards, Math.floor(Number(cards.value) || 0))); cards.value = String(side.jailCards); });
    return h('div', { class: 'col paper paper--flat' },
      h('h3', null, title, ' ', h('span', { class: 'muted small' }, `(${money(owner.cash)} cash)`)),
      h('div', { class: 'cash' }, 'Cash $', cash),
      owner.jailCards > 0 ? h('div', { class: 'cash' }, 'Jail cards', cards) : null,
      list);
  }

  private render(): void {
    const me = this.state.players.find((p) => p.id === this.meId)!;
    const partner = this.state.players.find((p) => p.id === this.partnerSel.value);
    clear(this.cols);
    if (!partner) { this.cols.appendChild(h('p', { class: 'muted' }, 'Nobody to trade with.')); return; }
    this.cols.append(this.side(me, this.offer, 'You give'), this.side(partner, this.request, `${partner.name} gives`));
  }

  private propose(): void {
    const to = this.partnerSel.value;
    if (!to) return;
    if (this.offer.cash === 0 && this.offer.properties.length === 0 && this.offer.jailCards === 0 && this.request.cash === 0 && this.request.properties.length === 0 && this.request.jailCards === 0) return;
    this.send({ type: 'proposeTrade', to, offer: this.offer, request: this.request });
  }
}

export function tradeSummary(state: GameState, trade: Trade): HTMLElement {
  const sideEl = (who: string, side: TradeSide) => {
    const parts: (HTMLElement | string)[] = [];
    if (side.cash) parts.push(h('span', { class: 'money' }, money(side.cash)));
    for (const i of side.properties) parts.push(h('span', { class: 'tag', style: { background: spaceColor(state.board[i]), color: LIGHT_GROUPS.has(state.board[i].group ?? state.board[i].type) ? '#2b2118' : '#fff' } }, state.board[i].name));
    if (side.jailCards) parts.push(h('span', { class: 'tag' }, `${side.jailCards} jail card${side.jailCards > 1 ? 's' : ''}`));
    if (parts.length === 0) parts.push(h('span', { class: 'muted' }, 'nothing'));
    return h('div', { class: 'line' }, nameTag(state, who), ' gives: ', ...parts);
  };
  return h('div', { class: 'summary' }, sideEl(trade.from, trade.offer), sideEl(trade.to, trade.request));
}

export function incomingTradeContent(state: GameState, trade: Trade, send: Send, meId: string): HTMLElement {
  const legal = legalActions(state, meId);
  const canAccept = legal.includes('acceptTrade');
  return h('div', { class: 'trade' },
    h('h2', null, h('span', { class: 'ico', html: ICONS.trade }), `${playerName(state, trade.from)} proposes a trade`),
    tradeSummary(state, trade),
    h('div', { class: 'buttons' },
      h('button', { class: 'btn', type: 'button', onClick: () => send({ type: 'rejectTrade', tradeId: trade.id }) }, 'Reject'),
      h('button', { class: 'btn btn--good', type: 'button', disabled: !canAccept, onClick: () => send({ type: 'acceptTrade', tradeId: trade.id }) }, 'Accept')),
  );
}

export function openTradesContent(state: GameState, meId: string, send: Send, onClose: () => void, onNew: () => void): HTMLElement {
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
  for (const t of state.trades) {
    const mine = t.from === meId;
    const forMe = t.to === meId;
    list.appendChild(h('div', { class: 'paper paper--flat', style: { padding: '8px 10px' } },
      tradeSummary(state, t),
      h('div', { class: 'buttons', style: { marginTop: '6px' } },
        mine ? h('button', { class: 'btn btn--sm', type: 'button', onClick: () => send({ type: 'rejectTrade', tradeId: t.id }) }, 'Cancel offer') : null,
        forMe ? h('button', { class: 'btn btn--sm', type: 'button', onClick: () => send({ type: 'rejectTrade', tradeId: t.id }) }, 'Reject') : null,
        forMe ? h('button', { class: 'btn btn--sm btn--good', type: 'button', onClick: () => send({ type: 'acceptTrade', tradeId: t.id }) }, 'Accept') : null,
        !mine && !forMe ? h('span', { class: 'muted small' }, 'between other players') : null)));
  }
  if (state.trades.length === 0) list.appendChild(h('p', { class: 'muted' }, 'No open trade offers.'));
  return h('div', null,
    h('h2', null, h('span', { class: 'ico', html: ICONS.trade }), 'Trades'),
    list,
    h('div', { class: 'buttons' }, h('button', { class: 'btn', type: 'button', onClick: onClose }, 'Close'), h('button', { class: 'btn btn--good', type: 'button', onClick: onNew }, 'New trade')));
}

// ---------- deed viewer ----------

export function deedViewerContent(state: GameState, index: number, meId: string, send: Send, onClose: () => void, onTrade: (ownerId: string) => void): HTMLElement {
  const s = state.board[index];
  const ps = state.properties[index];
  const buttons = h('div', { class: 'buttons' });
  if (ps?.owner === meId) {
    if (s.type === 'property') {
      const b = canBuild(state, meId, index); const sh = canSellHouse(state, meId, index);
      buttons.append(
        h('button', { class: 'btn btn--sm btn--good', type: 'button', disabled: !b.ok, title: b.reason ?? '', onClick: () => send({ type: 'build', space: index }) }, `Build ${money(s.houseCost!)}`),
        h('button', { class: 'btn btn--sm', type: 'button', disabled: !sh.ok, title: sh.reason ?? '', onClick: () => send({ type: 'sellHouse', space: index }) }, 'Sell house'));
    }
    const m = canMortgage(state, meId, index); const um = canUnmortgage(state, meId, index);
    if (ps.mortgaged) buttons.appendChild(h('button', { class: 'btn btn--sm btn--blue', type: 'button', disabled: !um.ok, title: um.reason ?? '', onClick: () => send({ type: 'unmortgage', space: index }) }, `Unmortgage ${money(Math.ceil(mortgageValue(s) * 1.1))}`));
    else buttons.appendChild(h('button', { class: 'btn btn--sm', type: 'button', disabled: !m.ok, title: m.reason ?? '', onClick: () => send({ type: 'mortgage', space: index }) }, `Mortgage +${money(mortgageValue(s))}`));
  } else if (ps?.owner && !state.players.find((p) => p.id === ps.owner)?.bankrupt && state.phase !== 'ended') {
    buttons.appendChild(h('button', { class: 'btn btn--sm btn--blue', type: 'button', onClick: () => onTrade(ps.owner!) }, `Offer a trade to ${playerName(state, ps.owner)}`));
  }
  buttons.appendChild(h('button', { class: 'btn btn--sm', type: 'button', onClick: onClose }, 'Close'));
  return h('div', null, deedCard(state, index, { diceTotal: state.dice ? state.dice[0] + state.dice[1] : 7 }), buttons);
}

// ---------- standings / game over ----------

export function standingsContent(state: GameState, meId: string, isHost: boolean, onLeave: () => void, onRestart: () => void, restartLabel = 'Back to lobby'): HTMLElement {
  const ranked = [...state.players].map((p) => ({ p, worth: p.bankrupt ? -1 : netWorth(state, p.id) })).sort((a, b) => b.worth - a.worth);
  const winner = state.players.find((p) => p.id === state.winner);
  const rows = ranked.map(({ p, worth }) => h('div', { class: `srow paper paper--flat ${p.id === state.winner ? 'is-winner' : ''}` },
    h('span', { html: tokenSvg(p.token) }),
    h('span', null, h('b', { style: { color: p.color } }, p.name), p.id === meId ? h('span', { class: 'tag tag--you', style: { marginLeft: '6px' } }, 'you') : null, p.bankrupt ? h('span', { class: 'tag', style: { marginLeft: '6px' } }, 'bankrupt') : null),
    h('span', { class: 'money' }, p.bankrupt ? '—' : money(worth)),
  ));
  return h('div', null,
    winner ? h('span', { class: 'winner-crown', html: ICONS.crown }) : null,
    h('h2', { style: { justifyContent: 'center' } }, winner ? (winner.id === meId ? 'You win!' : `${winner.name} wins!`) : 'Game over'),
    h('div', { class: 'standings' }, ...rows),
    h('div', { class: 'buttons' },
      h('button', { class: 'btn', type: 'button', onClick: onLeave }, 'Leave'),
      isHost ? h('button', { class: 'btn btn--good', type: 'button', onClick: onRestart }, restartLabel) : h('span', { class: 'muted small' }, 'Waiting for the host…')),
  );
}

export function confetti(colors: string[]): void {
  const host = h('div', { class: 'confetti' });
  for (let i = 0; i < 90; i++) {
    const piece = h('i', { style: { left: `${Math.random() * 100}%`, background: colors[i % colors.length], animationDuration: `${2 + Math.random() * 2.5}s`, animationDelay: `${Math.random() * 1.5}s`, transform: `rotate(${Math.random() * 360}deg)` } });
    host.appendChild(piece);
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 6000);
}

// ---------- pause menu ----------

export interface PauseHandlers {
  onResume(): void;
  onCamera?(mode: 'follow' | 'overview' | 'top'): void;
  onQuit(): void;
}

export function pauseContent(state: GameState, has3d: boolean, hp: PauseHandlers): HTMLElement {
  const st = getSettings();
  const soundSw = h('button', { class: `switch ${st.sound ? 'is-on' : ''}`, type: 'button', role: 'switch', 'aria-checked': String(st.sound), 'aria-label': 'Sound', onClick: () => { const s2 = updateSettings({ sound: !getSettings().sound }); soundSw.classList.toggle('is-on', s2.sound); soundSw.setAttribute('aria-checked', String(s2.sound)); } });
  const speed = h('input', { class: 'input', type: 'range', min: 0.5, max: 2, step: 0.25, value: String(st.animSpeed), id: 'pause-speed', style: { width: '9em', padding: '0' } }) as HTMLInputElement;
  const speedVal = h('span', { class: 'money' }, `${st.animSpeed}×`);
  speed.addEventListener('input', () => { const v = Number(speed.value); updateSettings({ animSpeed: v }); speedVal.textContent = `${v}×`; });
  const camRow = h('div', { class: 'cam-row' });
  const renderCam = () => {
    clear(camRow);
    for (const [m, label] of [['follow', 'Follow'], ['overview', 'Overview'], ['top', 'Top']] as const) {
      camRow.appendChild(h('button', { class: `btn btn--sm ${getSettings().camera === m ? 'btn--blue' : ''}`, type: 'button', onClick: () => { updateSettings({ camera: m }); hp.onCamera?.(m); renderCam(); } }, label));
    }
  };
  renderCam();
  const c = state.config;
  const rules = h('ul', { class: 'rules-recap' },
    h('li', null, `Starting cash ${money(c.startingCash)} · Go salary ${money(c.goSalary)}${c.doubleGoSalary ? ' (double on landing)' : ''}`),
    h('li', null, c.auctions ? 'Declined properties are auctioned' : 'No auctions'),
    h('li', null, c.freeParkingJackpot ? `Free Parking jackpot on (pot ${money(state.freeParkingPot)})` : 'Free Parking does nothing'),
    h('li', null, `Jail: fine ${money(c.jailFine)}, up to ${c.maxJailTurns} turns`),
    h('li', null, 'Houses need the full color set and build evenly. Mortgages pay half price, lifting costs 10% more.'),
  );
  return h('div', { class: 'pause' },
    h('h2', null, h('span', { class: 'ico', html: ICONS.timer }), 'Paused'),
    h('div', { class: 'rule' }, h('div', { class: 'rlabel' }, 'Sound'), soundSw),
    h('div', { class: 'rule' }, h('div', { class: 'rlabel' }, 'Animation speed'), h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, speed, speedVal)),
    has3d ? h('div', { class: 'rule' }, h('div', { class: 'rlabel' }, 'Camera'), camRow) : null,
    h('details', { class: 'rules-fold', style: { marginTop: '8px' } }, h('summary', null, 'House rules in this game'), rules),
    h('div', { class: 'buttons' },
      h('button', { class: 'btn', type: 'button', onClick: hp.onQuit }, 'Quit game'),
      h('button', { class: 'btn btn--good btn--lg', type: 'button', id: 'pause-resume', onClick: hp.onResume }, 'Resume')),
  );
}
