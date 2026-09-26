import { legalActions, netWorth } from '../../engine/engine.js';
import type { ChatMessage, RoomView } from '../../shared/protocol.js';
import type { Action, GameEvent, GameState } from '../../shared/types.js';
import { dieFace } from '../art/dice.js';
import { ICONS } from '../art/icons.js';
import { isMuted, setMuted, sfx } from '../audio.js';
import { append, h, clear, money, sleep, toast } from '../dom.js';
import { Board, spaceColor } from './board.js';
import {
  AuctionView, DebtView, ManageView, Modals, TradeComposer, buyContent, confetti, deedViewerContent, incomingTradeContent,
  nameTag, openTradesContent, playerName, showCard, standingsContent,
} from './dialogs.js';
import { tokenSvg } from './home.js';

export interface GameHandlers {
  send(action: Action): void;
  chat(text: string): void;
  leave(): void;
  restart(): void;
}

export class GameScreen {
  private root: HTMLElement;
  private handlers: GameHandlers;
  private board: Board;
  private playersEl = h('div', { class: 'game__players' });
  private actionsEl = h('div', { class: 'actions paper paper--flat' });
  private logEl = h('div', { class: 'log' });
  private chatInput = h('input', { class: 'input', placeholder: 'Say something…', maxLength: 200 }) as HTMLInputElement;
  private timerEl = h('span', { class: 'timer paper paper--flat hidden' });
  private modals = new Modals();
  private state: GameState | null = null;
  private meId: string;
  private room: RoomView | null = null;
  private queue: GameEvent[] = [];
  private processing = false;
  private timerEndsAt: number | null = null;
  private timerHandle: number | null = null;
  private manage: ManageView | null = null;
  private auction: AuctionView | null = null;
  private debt: DebtView | null = null;
  private trade: TradeComposer | null = null;
  private lastCash = new Map<string, number>();
  private seenTrades = new Set<string>();
  private incomingShown: string | null = null;
  private gameOverShown = false;
  private lastLogCount = 0;

  constructor(root: HTMLElement, meId: string, handlers: GameHandlers) {
    this.root = root;
    this.meId = meId;
    // Lock every action button after a click until the server answers, so a double
    // click cannot send the same action twice.
    this.handlers = { ...handlers, send: (a) => { this.lockButtons(); handlers.send(a); } };
    clear(root);
    this.board = new Board((i) => this.openDeed(i));
    const chatForm = h('form', { class: 'chatform', onSubmit: (e: Event) => { e.preventDefault(); const t = this.chatInput.value.trim(); if (t) { handlers.chat(t); this.chatInput.value = ''; } } },
      this.chatInput, h('button', { class: 'btn btn--sm', type: 'submit' }, 'Send'));
    const muteBtn = h('button', { class: 'btn btn--sm', type: 'button', title: 'Toggle sound' }, isMuted() ? '🔇' : '🔊');
    muteBtn.addEventListener('click', () => { setMuted(!isMuted()); muteBtn.textContent = isMuted() ? '🔇' : '🔊'; });
    const leaveBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => { if (confirm('Leave the game? If it is still running you will forfeit.')) handlers.leave(); } }, 'Leave');
    const logbox = h('div', { class: 'logbox paper paper--flat' },
      h('h3', null, 'Log & chat', h('span', { class: 'topbar' }, muteBtn, leaveBtn)),
      this.logEl, chatForm);
    root.appendChild(h('div', { class: 'game' },
      this.playersEl,
      h('div', { class: 'game__board' }, this.board.wrap),
      h('div', { class: 'game__actions' }, this.actionsEl),
      h('div', { class: 'game__log' }, logbox)));
    this.timerHandle = window.setInterval(() => this.tickTimer(), 500);
  }

  private lockButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('.dialog button, .actions button').forEach((b) => { b.disabled = true; });
  }

  /** The server rejected something: re-enable the UI from the current state. */
  onError(): void {
    if (!this.state || this.processing) return;
    this.renderActions();
    this.syncDialogs(true);
  }

  destroy(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.modals.closeAll();
  }

  setRoom(room: RoomView): void { this.room = room; }

  setTimer(endsAt: number | null): void { this.timerEndsAt = endsAt; this.tickTimer(); }

  private tickTimer(): void {
    if (!this.timerEndsAt) { this.timerEl.classList.add('hidden'); return; }
    const left = Math.max(0, Math.ceil((this.timerEndsAt - Date.now()) / 1000));
    this.timerEl.classList.remove('hidden');
    this.timerEl.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    this.timerEl.classList.toggle('is-low', left <= 10);
  }

  addChat(m: ChatMessage): void {
    const el = h('div', { class: `entry ${m.from ? 'chat' : 'system'}` });
    if (m.from) el.append(h('b', { style: { color: this.state ? this.playerColor(m.from) : 'inherit' } }, m.name), ': ', m.text);
    else el.append(m.text);
    this.logEl.appendChild(el);
    this.logEl.scrollTop = this.logEl.scrollHeight;
    if (m.from && m.from !== this.meId) sfx.notify();
  }

  private playerColor(id: string): string { return this.state?.players.find((p) => p.id === id)?.color ?? 'inherit'; }

  /** New authoritative state plus the events that produced it. */
  onState(state: GameState, events: GameEvent[]): void {
    const first = !this.state;
    this.state = state;
    if (first) {
      this.board.build(state);
      for (const p of state.players) this.lastCash.set(p.id, p.cash);
      // Show the existing log for late joiners / rejoins.
      for (const ev of state.log) this.appendLog(ev, state);
      this.lastLogCount = state.log.length;
      this.render();
      return;
    }
    this.queue.push(...events);
    if (!this.processing) void this.process();
  }

  private async process(): Promise<void> {
    this.processing = true;
    this.renderActions(); // disables buttons while animating
    while (this.queue.length) {
      const ev = this.queue.shift()!;
      const state = this.state!;
      try { await this.animate(ev, state); } catch (e) { console.error(e); }
      this.appendLog(ev, state);
    }
    this.processing = false;
    this.render();
  }

  private async animate(ev: GameEvent, state: GameState): Promise<void> {
    switch (ev.type) {
      case 'rolled':
        await this.board.showDice(ev.dice, true);
        return;
      case 'moved':
        await this.board.moveToken(ev.player, ev.from, ev.to, { direct: ev.direct, backward: (ev as { backwards?: boolean }).backwards }, state);
        await sleep(120);
        return;
      case 'paid':
        if (ev.to === this.meId) sfx.cash(); else if (ev.from === this.meId) sfx.pay();
        this.bumpCash(ev.from, -ev.amount); this.bumpCash(ev.to, ev.amount);
        await sleep(250);
        return;
      case 'card':
        await showCard(this.modals, ev.deck, ev.text);
        return;
      case 'bought':
        sfx.cash(); this.board.updateStatic(state); this.board.flash(ev.space); await sleep(250); return;
      case 'built': case 'soldHouse':
        sfx.build(); this.board.updateStatic(state); await sleep(150); return;
      case 'mortgaged': case 'unmortgaged': case 'auctionEnded': case 'tradeAccepted': case 'bankrupt':
        this.board.updateStatic(state); this.renderPlayers(); await sleep(150); return;
      case 'jailed':
        sfx.jail(); this.board.updateStatic(state); await sleep(300); return;
      case 'turnStarted':
        this.board.updateStatic(state);
        if (ev.player === this.meId) { sfx.turn(); toast('Your turn!'); }
        return;
      case 'freeParking':
        sfx.cash(); await sleep(200); return;
      case 'gameOver':
        return;
      default:
        return;
    }
  }

  private bumpCash(id: string | null, delta: number): void {
    if (!id) return;
    const el = this.playersEl.querySelector(`[data-player="${id}"] .pcash`) as HTMLElement | null;
    if (!el) return;
    const cur = (this.lastCash.get(id) ?? 0) + delta;
    this.lastCash.set(id, cur);
    el.textContent = money(cur);
    el.classList.remove('bump-up', 'bump-down'); void el.offsetWidth; el.classList.add(delta >= 0 ? 'bump-up' : 'bump-down');
  }

  // ---------- rendering ----------

  private render(): void {
    const state = this.state!;
    this.board.updateStatic(state);
    this.board.placeTokens(state, true);
    for (const p of state.players) this.lastCash.set(p.id, p.cash);
    this.renderPlayers();
    this.renderActions();
    this.syncDialogs();
  }

  private renderPlayers(): void {
    const state = this.state!;
    clear(this.playersEl);
    for (const p of state.players) {
      const isCur = state.players[state.currentPlayer]?.id === p.id && state.phase !== 'ended';
      const props = h('div', { class: 'pprops' });
      for (const [idx, ps] of Object.entries(state.properties)) {
        if (ps.owner !== p.id) continue;
        const s = state.board[Number(idx)];
        props.appendChild(h('span', { class: `chip ${ps.mortgaged ? 'is-mortgaged' : ''}`, title: `${s.name}${ps.mortgaged ? ' (mortgaged)' : ''}`, style: { '--chip': spaceColor(s) } as unknown as Record<string, string>, onClick: () => this.openDeed(Number(idx)) },
          ps.houses > 0 ? h('span', { class: 'h' }, ps.houses === 5 ? 'H' : String(ps.houses)) : null));
      }
      const card = h('div', { class: `pcard paper paper--flat ${isCur ? 'is-current' : ''} ${p.bankrupt ? 'is-bankrupt' : ''}`, dataset: { player: p.id }, style: { '--pcolor': p.color } as unknown as Record<string, string> },
        h('span', { class: 'ptoken', html: tokenSvg(p.token) }),
        h('div', null,
          h('div', { class: 'pname' }, p.name,
            p.id === this.meId ? h('span', { class: 'tag tag--you' }, 'you') : null,
            this.room?.hostId === p.id ? h('span', { class: 'tag tag--host' }, 'host') : null,
            p.inJail ? h('span', { class: 'tag tag--jail' }, 'in jail') : null,
            !p.connected ? h('span', { class: 'tag tag--off' }, 'away') : null,
            p.bankrupt ? h('span', { class: 'tag' }, 'bankrupt') : null),
          h('div', { class: 'pcash' }, p.bankrupt ? '—' : money(p.cash))),
        props,
        h('div', { class: 'pmeta muted' }, p.bankrupt ? null : `worth ${money(netWorth(state, p.id))}`, p.jailCards > 0 ? ` · ${p.jailCards} jail card${p.jailCards > 1 ? 's' : ''}` : null),
      );
      this.playersEl.appendChild(card);
    }
  }

  private renderActions(): void {
    const state = this.state!;
    clear(this.actionsEl);
    const add = (...c: (Node | string | null | undefined)[]) => append(this.actionsEl, c);
    const me = state.players.find((p) => p.id === this.meId);
    const busy = this.processing;
    const legal = me && !busy ? new Set(legalActions(state, this.meId)) : new Set<string>();
    const btn = (label: string, action: Action, cls = 'btn', enabled = true) => h('button', { class: cls, type: 'button', disabled: !enabled, onClick: () => { sfx.click(); this.handlers.send(action); } }, label);
    const cur = state.players[state.currentPlayer];
    const diceMini = state.dice ? h('span', { class: 'dice-mini', html: dieFace(state.dice[0]) + dieFace(state.dice[1]) }) : null;

    if (state.phase === 'ended') {
      add(h('span', { class: 'hint' }, 'Game over.'), h('span', { class: 'spacer' }), h('button', { class: 'btn', type: 'button', onClick: () => this.syncDialogs(true) }, 'Show standings'));
      return;
    }
    if (!me || me.bankrupt) {
      add(h('span', { class: 'hint' }, 'You are out of the game. Enjoy the show!'));
      return;
    }
    if (busy) {
      add(diceMini, h('span', { class: 'hint' }, '…'), h('span', { class: 'spacer' }), this.timerEl);
      return;
    }
    const isMyTurn = cur?.id === this.meId;
    let hint: HTMLElement;
    if (state.phase === 'roll' && isMyTurn) {
      if (me.inJail) {
        hint = h('span', { class: 'hint' }, `You are in jail (turn ${me.jailTurns + 1} of ${state.config.maxJailTurns}). Roll doubles to get out, or pay.`);
        add(hint,
          btn('Roll for doubles', { type: 'roll' }, 'btn btn--primary btn--lg', legal.has('roll')),
          btn(`Pay ${money(state.config.jailFine)}`, { type: 'payJailFine' }, 'btn btn--warn', legal.has('payJailFine')),
          me.jailCards > 0 ? btn('Use jail card', { type: 'useJailCard' }, 'btn btn--blue', legal.has('useJailCard')) : null);
      } else {
        hint = h('span', { class: 'hint' }, state.canRollAgain ? 'Doubles! Roll again.' : 'Your turn.');
        add(hint, btn('Roll dice', { type: 'roll' }, 'btn btn--primary btn--lg', legal.has('roll')));
      }
    } else if (state.phase === 'action' && isMyTurn) {
      hint = h('span', { class: 'hint' }, 'Build, trade, or end your turn.');
      add(diceMini, hint, btn('End turn', { type: 'endTurn' }, 'btn btn--primary btn--lg', legal.has('endTurn')));
    } else if (state.phase === 'buy' && isMyTurn) {
      hint = h('span', { class: 'hint' }, `Buy ${state.board[state.pendingSpace ?? 0]?.name}?`);
      add(diceMini, hint, h('button', { class: 'btn btn--good', type: 'button', onClick: () => this.syncDialogs(true) }, 'Show offer'));
    } else if (state.phase === 'auction') {
      hint = h('span', { class: 'hint' }, `Auction for ${state.board[state.auction?.space ?? 0]?.name}`);
      add(hint, h('button', { class: 'btn btn--good', type: 'button', onClick: () => this.syncDialogs(true) }, 'Show auction'));
    } else if (state.phase === 'debt') {
      const d = state.debt!;
      hint = h('span', { class: 'hint' }, d.debtor === this.meId ? `You owe ${money(d.amount)}.` : `${playerName(state, d.debtor)} is raising ${money(d.amount)}…`);
      add(hint, d.debtor === this.meId ? h('button', { class: 'btn btn--primary', type: 'button', onClick: () => this.syncDialogs(true) }, 'Raise money') : null);
    } else {
      hint = h('span', { class: 'hint' }, diceMini ? '' : '', `Waiting for `, nameTag(state, cur?.id ?? null), '…');
      add(diceMini, hint);
    }
    add(h('span', { class: 'spacer' }));
    const canManage = legal.has('build') || legal.has('sellHouse') || legal.has('mortgage') || legal.has('unmortgage');
    const openTrades = state.trades.filter((t) => t.to === this.meId || t.from === this.meId).length;
    add(
      h('button', { class: 'btn', type: 'button', disabled: state.phase === 'debt' && state.debt?.debtor !== this.meId, onClick: () => this.openManage() }, h('span', { class: 'ico', html: ICONS.hammer }), canManage ? 'Manage' : 'Properties'),
      h('button', { class: 'btn', type: 'button', disabled: !legal.has('proposeTrade') && openTrades === 0, onClick: () => this.openTrades() }, h('span', { class: 'ico', html: ICONS.trade }), openTrades ? `Trades (${openTrades})` : 'Trade'),
      this.timerEl,
    );
  }

  // ---------- dialogs driven by state ----------

  private syncDialogs(force = false): void {
    const state = this.state!;
    const me = state.players.find((p) => p.id === this.meId);
    const isMyTurn = state.players[state.currentPlayer]?.id === this.meId;
    const wantBuy = state.phase === 'buy' && isMyTurn && !!me && !me.bankrupt;
    const wantAuction = state.phase === 'auction' && !!state.auction;
    const wantDebt = state.phase === 'debt' && state.debt?.debtor === this.meId;
    const wantOver = state.phase === 'ended';

    // Buy
    if (wantBuy && (force || !this.modals.has('buy'))) {
      this.modals.show('buy', buyContent(state, state.pendingSpace!, me!, this.handlers.send, state.config.auctions));
    } else if (!wantBuy) this.modals.close('buy');

    // Auction
    if (wantAuction) {
      if (!this.auction || force || !this.modals.has('auction')) {
        this.auction = new AuctionView(this.handlers.send);
        this.modals.show('auction', this.auction.el, { passive: false });
      }
      this.auction.update(state, this.meId);
    } else if (this.modals.has('auction')) { this.modals.close('auction'); this.auction = null; }

    // Debt
    if (wantDebt) {
      if (!this.debt || force || !this.modals.has('debt')) { this.debt = new DebtView(this.handlers.send); this.modals.show('debt', this.debt.el, { wide: true }); }
      this.debt.update(state, this.meId);
    } else if (this.modals.has('debt')) { this.modals.close('debt'); this.debt = null; }

    // Manage (refresh if open)
    if (this.manage && this.modals.has('manage')) {
      const legal = new Set(legalActions(state, this.meId));
      if (state.phase === 'debt' && state.debt?.debtor !== this.meId) this.modals.close('manage');
      else this.manage.update(state, this.meId);
      void legal;
    }
    if (this.trade && this.modals.has('trade')) {
      if (!legalActions(state, this.meId).includes('proposeTrade')) this.modals.close('trade');
      else this.trade.update(state);
    }
    if (this.modals.has('trades')) this.openTrades(true);

    // Incoming trade offers for me
    const incoming = state.trades.filter((t) => t.to === this.meId);
    if (this.incomingShown && !incoming.some((t) => t.id === this.incomingShown)) { this.modals.close('incoming'); this.incomingShown = null; }
    const fresh = incoming.find((t) => !this.seenTrades.has(t.id));
    if (fresh && !this.incomingShown && !wantBuy && !wantDebt && !wantAuction) {
      this.seenTrades.add(fresh.id);
      this.incomingShown = fresh.id;
      sfx.notify();
      this.modals.show('incoming', incomingTradeContent(state, fresh, this.handlers.send, this.meId), { dismissible: true, onClose: () => { this.incomingShown = null; } });
    }
    for (const t of state.trades) this.seenTrades.add(t.id);

    // Game over
    if (wantOver && (force || !this.gameOverShown)) {
      this.gameOverShown = true;
      this.modals.closeAll();
      const winner = state.players.find((p) => p.id === state.winner);
      if (winner?.id === this.meId) { sfx.win(); confetti(state.players.map((p) => p.color)); } else sfx.lose();
      this.modals.show('over', standingsContent(state, this.meId, this.room?.hostId === this.meId, this.handlers.leave, this.handlers.restart), { dismissible: true });
    }
  }

  private openManage(): void {
    const state = this.state!;
    this.manage = new ManageView(this.handlers.send, () => this.modals.close('manage'));
    this.manage.update(state, this.meId);
    this.modals.show('manage', this.manage.el, { wide: true, dismissible: true, onClose: () => { this.manage = null; } });
  }

  private openTrades(refresh = false): void {
    const state = this.state!;
    const content = openTradesContent(state, this.meId, this.handlers.send, () => this.modals.close('trades'), () => { this.modals.close('trades'); this.openTradeComposer(); });
    if (refresh && this.modals.has('trades')) { const el = this.modals.get('trades')!.el; clear(el); el.appendChild(content); return; }
    if (state.trades.length === 0) { this.openTradeComposer(); return; }
    this.modals.show('trades', content, { dismissible: true });
  }

  private openTradeComposer(partnerId?: string): void {
    const state = this.state!;
    if (!legalActions(state, this.meId).includes('proposeTrade')) { toast('You cannot trade right now', 'error'); return; }
    this.trade = new TradeComposer(this.handlers.send, state, this.meId, () => this.modals.close('trade'), partnerId);
    this.modals.show('trade', this.trade.el, { wide: true, dismissible: true, onClose: () => { this.trade = null; } });
  }

  /** Called when the server confirms a trade proposal went out. */
  onTradeProposed(): void { this.modals.close('trade'); }

  private openDeed(index: number): void {
    const state = this.state;
    if (!state) return;
    const s = state.board[index];
    if (!(s.type === 'property' || s.type === 'railroad' || s.type === 'utility')) return;
    this.board.highlight(index);
    this.modals.show('deed', deedViewerContent(state, index, this.meId, (a) => { this.handlers.send(a); }, () => this.modals.close('deed'), (owner) => { this.modals.close('deed'); this.openTradeComposer(owner); }), { dismissible: true, onClose: () => this.board.highlight(null) });
  }

  /** Re-render an open deed dialog after a state change. */
  private refreshDeed(): void {
    // Deed dialog is simple; close it on changes to avoid stale buttons.
    if (this.modals.has('deed')) this.modals.close('deed');
  }

  // ---------- log ----------

  private appendLog(ev: GameEvent, state: GameState): void {
    const line = describeEvent(ev, state);
    if (!line) return;
    const el = h('div', { class: 'entry' }, ...line);
    this.logEl.appendChild(el);
    while (this.logEl.children.length > 300) this.logEl.firstElementChild?.remove();
    this.logEl.scrollTop = this.logEl.scrollHeight;
    if (ev.type === 'tradeAccepted' || ev.type === 'bought' || ev.type === 'mortgaged' || ev.type === 'unmortgaged' || ev.type === 'built' || ev.type === 'soldHouse') this.refreshDeed();
  }
}

function describeEvent(ev: GameEvent, state: GameState): (string | HTMLElement)[] | null {
  const n = (id: string | null) => nameTag(state, id);
  const sp = (i: number) => h('b', null, state.board[i]?.name ?? `#${i}`);
  switch (ev.type) {
    case 'rolled': return [n(ev.player), ` rolled ${ev.dice[0]} + ${ev.dice[1]}${ev.doubles ? ' (doubles!)' : ''}`];
    case 'moved': return ev.passedGo ? [n(ev.player), ' passed Go and landed on ', sp(ev.to)] : [n(ev.player), ev.direct ? ' went to ' : ' landed on ', sp(ev.to)];
    case 'paid': return [n(ev.from), ` paid ${money(ev.amount)} to `, n(ev.to), ev.reason ? ` (${ev.reason})` : ''];
    case 'bought': return [n(ev.player), ' bought ', sp(ev.space), ` for ${money(ev.price)}`];
    case 'declined': return [n(ev.player), ' declined to buy ', sp(ev.space)];
    case 'auctionStarted': return ['Auction started for ', sp(ev.space)];
    case 'bid': return [n(ev.player), ` bid ${money(ev.amount)}`];
    case 'auctionEnded': return ev.winner ? [n(ev.winner), ' won the auction for ', sp(ev.space), ` at ${money(ev.amount)}`] : ['Nobody bid on ', sp(ev.space)];
    case 'card': return [n(ev.player), ` drew ${ev.deck === 'chance' ? 'Chance' : 'Community Chest'}: “${ev.text}”`];
    case 'built': return [n(ev.player), ev.houses === 5 ? ' built a hotel on ' : ` built a house on `, sp(ev.space)];
    case 'soldHouse': return [n(ev.player), ' sold a building on ', sp(ev.space)];
    case 'mortgaged': return [n(ev.player), ' mortgaged ', sp(ev.space)];
    case 'unmortgaged': return [n(ev.player), ' lifted the mortgage on ', sp(ev.space)];
    case 'jailed': return [n(ev.player), ` went to jail (${ev.reason})`];
    case 'freed': return [n(ev.player), ev.how === 'doubles' ? ' rolled doubles and left jail' : ev.how === 'card' ? ' used a Get Out of Jail Free card' : ev.how === 'fine' ? ' paid the fine and left jail' : ' had to pay and leave jail'];
    case 'tradeProposed': return [n(ev.trade.from), ' proposed a trade to ', n(ev.trade.to)];
    case 'tradeAccepted': return [n(ev.trade.to), ' accepted a trade from ', n(ev.trade.from)];
    case 'tradeRejected': return ['Trade between ', n(ev.trade.from), ' and ', n(ev.trade.to), ' was declined'];
    case 'debt': return [n(ev.player), ` owes ${money(ev.amount)} to `, n(ev.creditor)];
    case 'bankrupt': return [n(ev.player), ' went bankrupt', ev.creditor ? [' to ', n(ev.creditor)] : ''].flat();
    case 'freeParking': return [n(ev.player), ` collected ${money(ev.amount)} from Free Parking`];
    case 'turnStarted': return [h('span', { class: 'muted' }, `— Turn ${ev.turnNumber}: `), n(ev.player)];
    case 'turnEnded': return null;
    case 'gameOver': return [h('b', null, '🏆 '), n(ev.winner), ' wins the game!'];
    default: return null;
  }
}
