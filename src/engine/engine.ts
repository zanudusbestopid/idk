/**
 * Paper Tycoon rules engine: pure, deterministic state transitions.
 *
 * - `applyAction` never mutates its input; it deep-copies, mutates the copy and
 *   returns it together with the events produced.
 * - No Date.now / Math.random: all randomness comes from `state.rng`.
 * - Errors are returned as `{ ok: false, error }`, never thrown (except by
 *   `createGame` on invalid input, which is a programming error).
 */
import { BOARD, GO_INDEX, JAIL_INDEX, RAILROADS, UTILITIES, isOwnable, mortgageValue } from '../shared/board';
import { DECKS, JAIL_CARD_ID, type Card, type CardEffect } from '../shared/cards';
import type {
  Action,
  GameConfig,
  GameEvent,
  GameState,
  Player,
  PropertyState,
  Trade,
  TradeSide,
} from '../shared/types';
import { rollDie, shuffle } from './rng';
import {
  canAcceptTrade,
  canBuild,
  canManageProperty,
  canMortgage,
  canProposeTrade,
  canRejectTrade,
  canSellHouse,
  canTradeNow,
  canUnmortgage,
  currentPlayerId,
  getPlayer,
  houseSaleValue,
  mortgageInterest,
  nextSpaceOf,
  ownedSpaces,
  rentFor,
  unmortgageCost,
  validateTrade,
} from './queries';

export * from './queries';
export * from './rng';
export { BOARD, GROUPS, RAILROADS, UTILITIES, GO_INDEX, JAIL_INDEX, isOwnable, mortgageValue } from '../shared/board';
export { CHANCE_CARDS, CHEST_CARDS, DECKS, JAIL_CARD_ID } from '../shared/cards';
export type { Card, CardEffect } from '../shared/cards';
export type * from '../shared/types';

export const DEFAULT_CONFIG: GameConfig = {
  startingCash: 1500,
  goSalary: 200,
  auctions: true,
  freeParkingJackpot: false,
  doubleGoSalary: false,
  jailFine: 50,
  maxJailTurns: 3,
  turnTimerSeconds: null,
};

/** Maximum number of events kept in `state.log`. */
export const LOG_CAP = 200;
export const HOUSE_SUPPLY = 32;
export const HOTEL_SUPPLY = 12;
export const BOARD_SIZE = 40;

export type ActionResult = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; error: string };

export interface NewPlayer {
  id: string;
  name: string;
  token: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Game creation

export function createGame(config: Partial<GameConfig>, players: NewPlayer[], seed: number): GameState {
  if (!Array.isArray(players) || players.length < 2) throw new Error('At least two players are required');
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) throw new Error('Player ids must be unique');

  const cfg: GameConfig = { ...DEFAULT_CONFIG };
  const overrides = config as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    const v = overrides[key];
    if (v !== undefined) (cfg as unknown as Record<string, unknown>)[key] = v;
  }

  let rng = seed | 0;
  const cardIds = Array.from({ length: 16 }, (_, i) => i);
  const chance = shuffle(cardIds, rng);
  rng = chance.state;
  const chest = shuffle(cardIds, rng);
  rng = chest.state;

  const properties: Record<number, PropertyState> = {};
  for (const space of BOARD) {
    if (isOwnable(space)) properties[space.index] = { owner: null, houses: 0, mortgaged: false };
  }

  const state: GameState = {
    config: cfg,
    board: BOARD.map((s) => ({ ...s, ...(s.rent ? { rent: s.rent.slice() } : {}) })),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      token: p.token,
      color: p.color,
      cash: cfg.startingCash,
      position: GO_INDEX,
      inJail: false,
      jailTurns: 0,
      jailCards: 0,
      bankrupt: false,
      connected: true,
    })),
    currentPlayer: 0,
    phase: 'roll',
    dice: null,
    doublesCount: 0,
    canRollAgain: false,
    pendingSpace: null,
    properties,
    auction: null,
    debt: null,
    trades: [],
    chanceDeck: chance.result,
    chestDeck: chest.result,
    housesLeft: HOUSE_SUPPLY,
    hotelsLeft: HOTEL_SUPPLY,
    freeParkingPot: 0,
    turnNumber: 1,
    rng,
    winner: null,
    log: [],
    pendingPayments: [],
    debtResume: null,
    jailCardOrigins: {},
    nextTradeId: 1,
  };
  const ctx: Ctx = { state, events: [] };
  emit(ctx, { type: 'turnStarted', player: state.players[0].id, turnNumber: 1 });
  return state;
}

// ---------------------------------------------------------------------------
// Legal actions

/** Which action types this player may take right now. */
export function legalActions(state: GameState, playerId: string): Action['type'][] {
  const player = getPlayer(state, playerId);
  if (!player || player.bankrupt || state.phase === 'ended') return [];
  const out: Action['type'][] = [];
  const isCurrent = currentPlayerId(state) === playerId;

  switch (state.phase) {
    case 'roll':
      if (isCurrent) {
        out.push('roll');
        if (player.inJail && state.dice === null) {
          if (player.cash >= state.config.jailFine) out.push('payJailFine');
          if (player.jailCards > 0) out.push('useJailCard');
        }
      }
      break;
    case 'buy':
      if (isCurrent && state.pendingSpace !== null) {
        const price = state.board[state.pendingSpace]?.price ?? 0;
        if (player.cash >= price) out.push('buy');
        out.push('decline');
      }
      break;
    case 'auction':
      if (state.auction && state.auction.current === playerId) {
        if (player.cash > state.auction.highBid) out.push('bid');
        if (state.auction.highBidder !== playerId) out.push('passAuction');
      }
      break;
    case 'debt':
      if (state.debt && state.debt.debtor === playerId) {
        if (player.cash >= state.debt.amount) out.push('payDebt');
        out.push('declareBankruptcy');
      }
      break;
    case 'action':
      if (isCurrent) out.push('endTurn');
      break;
  }

  if (canManageProperty(state, playerId).ok) {
    const owned = ownedSpaces(state, playerId);
    if (owned.some((i) => canBuild(state, playerId, i).ok)) out.push('build');
    if (owned.some((i) => canSellHouse(state, playerId, i).ok)) out.push('sellHouse');
    if (owned.some((i) => canMortgage(state, playerId, i).ok)) out.push('mortgage');
    if (owned.some((i) => canUnmortgage(state, playerId, i).ok)) out.push('unmortgage');
  }

  if (canProposeTrade(state, playerId).ok) out.push('proposeTrade');
  if (state.trades.some((t) => canAcceptTrade(state, playerId, t).ok)) out.push('acceptTrade');
  if (state.trades.some((t) => canRejectTrade(state, playerId, t).ok)) out.push('rejectTrade');

  out.push('resign');
  return out;
}

// ---------------------------------------------------------------------------
// Action dispatch

interface Ctx {
  state: GameState;
  events: GameEvent[];
}

function emit(ctx: Ctx, event: GameEvent): void {
  ctx.events.push(event);
  ctx.state.log.push(event);
  if (ctx.state.log.length > LOG_CAP) ctx.state.log.splice(0, ctx.state.log.length - LOG_CAP);
}

function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function applyAction(state: GameState, playerId: string, action: Action): ActionResult {
  const player = getPlayer(state, playerId);
  if (!player) return fail('Unknown player');
  if (!action || typeof action !== 'object' || typeof action.type !== 'string') return fail('Malformed action');
  if (state.phase === 'ended') return fail('The game is over');
  if (player.bankrupt) return fail('You are out of the game');
  if (!legalActions(state, playerId).includes(action.type)) {
    return fail(`'${action.type}' is not allowed for ${player.name} right now`);
  }

  const s = structuredClone(state);
  const ctx: Ctx = { state: s, events: [] };
  const p = getPlayer(s, playerId)!;
  const error = dispatch(ctx, p, action);
  if (error) return fail(error);
  return { ok: true, state: s, events: ctx.events };
}

function dispatch(ctx: Ctx, p: Player, action: Action): string | null {
  switch (action.type) {
    case 'roll':
      return doRoll(ctx, p);
    case 'buy':
      return doBuy(ctx, p);
    case 'decline':
      return doDecline(ctx, p);
    case 'bid':
      return doBid(ctx, p, action.amount);
    case 'passAuction':
      return doPassAuction(ctx, p);
    case 'build':
      return doBuild(ctx, p, action.space);
    case 'sellHouse':
      return doSellHouse(ctx, p, action.space);
    case 'mortgage':
      return doMortgage(ctx, p, action.space);
    case 'unmortgage':
      return doUnmortgage(ctx, p, action.space);
    case 'payJailFine':
      return doPayJailFine(ctx, p);
    case 'useJailCard':
      return doUseJailCard(ctx, p);
    case 'proposeTrade':
      return doProposeTrade(ctx, p, action.to, action.offer, action.request);
    case 'acceptTrade':
      return doAcceptTrade(ctx, p, action.tradeId);
    case 'rejectTrade':
      return doRejectTrade(ctx, p, action.tradeId);
    case 'payDebt':
      return doPayDebt(ctx, p);
    case 'declareBankruptcy':
      return doDeclareBankruptcy(ctx, p);
    case 'resign':
      return doResign(ctx, p);
    case 'endTurn':
      advanceTurn(ctx);
      return null;
    default:
      return 'Unknown action';
  }
}

// ---------------------------------------------------------------------------
// Money

/**
 * Move `amount` from `from` to `to` (null = bank). When the payer cannot cover
 * it the payment becomes a Debt, the phase switches to 'debt' and false is
 * returned; the caller must stop resolving and let `continueTurn` resume later.
 * `toPot` marks bank payments that feed the Free Parking pot when enabled.
 */
function pay(ctx: Ctx, from: string | null, to: string | null, amount: number, reason: string, toPot = false): boolean {
  const s = ctx.state;
  if (amount <= 0) return true;
  if (from === null) {
    const t = to === null ? undefined : getPlayer(s, to);
    if (!t) return true;
    t.cash += amount;
    emit(ctx, { type: 'paid', from: null, to, amount, reason });
    return true;
  }
  const f = getPlayer(s, from);
  if (!f) return true;
  if (f.cash < amount) {
    s.debt = { debtor: from, creditor: to, amount, reason, ...(toPot ? { toPot: true } : {}) };
    s.phase = 'debt';
    emit(ctx, { type: 'debt', player: from, creditor: to, amount });
    return false;
  }
  transfer(ctx, f, to, amount, reason, toPot);
  return true;
}

/** Unconditional cash movement from a player who can afford it. */
function transfer(ctx: Ctx, f: Player, to: string | null, amount: number, reason: string, toPot = false): void {
  const s = ctx.state;
  f.cash -= amount;
  if (to === null) {
    if (toPot && s.config.freeParkingJackpot) s.freeParkingPot += amount;
  } else {
    const t = getPlayer(s, to);
    if (t) t.cash += amount;
  }
  emit(ctx, { type: 'paid', from: f.id, to, amount, reason });
}

// ---------------------------------------------------------------------------
// Movement and landing

interface MoveOptions {
  /** collect salary when passing / landing on Go */
  salary: boolean;
  /** teleport (jail) */
  direct?: boolean;
  /** walked counter-clockwise */
  backwards?: boolean;
}

function moveTo(ctx: Ctx, p: Player, to: number, opts: MoveOptions): void {
  const s = ctx.state;
  const from = p.position;
  let passedGo = false;
  let salary = 0;
  let salaryReason = '';
  if (opts.salary && !opts.direct && !opts.backwards) {
    const landed = to === GO_INDEX;
    if (landed || to < from) {
      passedGo = true;
      salary = s.config.goSalary * (landed && s.config.doubleGoSalary ? 2 : 1);
      salaryReason = landed ? 'Landed on Go' : 'Passed Go';
    }
  }
  p.position = to;
  emit(ctx, {
    type: 'moved',
    player: p.id,
    from,
    to,
    passedGo,
    ...(opts.direct ? { direct: true } : {}),
    ...(opts.backwards ? { backwards: true } : {}),
  });
  if (salary > 0) pay(ctx, null, p.id, salary, salaryReason);
}

function moveBy(ctx: Ctx, p: Player, steps: number): void {
  moveTo(ctx, p, (p.position + steps) % BOARD_SIZE, { salary: true });
}

function sendToJail(ctx: Ctx, p: Player, reason: string): void {
  const s = ctx.state;
  moveTo(ctx, p, JAIL_INDEX, { salary: false, direct: true });
  p.inJail = true;
  p.jailTurns = 0;
  emit(ctx, { type: 'jailed', player: p.id, reason });
  if (currentPlayerId(s) === p.id) {
    // going to jail ends the player's rolling for this turn
    s.canRollAgain = false;
    s.doublesCount = 0;
  }
}

function freeFromJail(ctx: Ctx, p: Player, how: 'doubles' | 'fine' | 'card' | 'forced'): void {
  p.inJail = false;
  p.jailTurns = 0;
  emit(ctx, { type: 'freed', player: p.id, how });
}

interface LandingOptions {
  /** "nearest railroad" card: pay twice the normal railroad rent */
  railroadMultiplier?: number;
  /** "nearest utility" card: pay this many times the dice total regardless of utilities owned */
  utilityMultiplier?: number;
}

/**
 * Resolve the space the player now stands on. May leave the phase at 'buy'
 * (unowned property) or 'debt' (unaffordable payment); otherwise the phase is
 * untouched and `continueTurn` finishes the turn step.
 */
function resolveLanding(ctx: Ctx, p: Player, opts: LandingOptions = {}): void {
  const s = ctx.state;
  const space = s.board[p.position];
  switch (space.type) {
    case 'property':
    case 'railroad':
    case 'utility': {
      const ps = s.properties[space.index];
      if (ps.owner === null) {
        s.phase = 'buy';
        s.pendingSpace = space.index;
        return;
      }
      if (ps.owner === p.id || ps.mortgaged) return;
      const owner = getPlayer(s, ps.owner);
      if (!owner || owner.bankrupt) return;
      const diceTotal = s.dice ? s.dice[0] + s.dice[1] : 0;
      let rent: number;
      if (space.type === 'utility' && opts.utilityMultiplier) rent = diceTotal * opts.utilityMultiplier;
      else if (space.type === 'railroad' && opts.railroadMultiplier) rent = rentFor(s, space.index, diceTotal) * opts.railroadMultiplier;
      else rent = rentFor(s, space.index, diceTotal);
      pay(ctx, p.id, ps.owner, rent, `Rent for ${space.name}`);
      return;
    }
    case 'tax':
      pay(ctx, p.id, null, space.amount ?? 0, space.name, true);
      return;
    case 'chance':
      drawCard(ctx, p, 'chance');
      return;
    case 'chest':
      drawCard(ctx, p, 'chest');
      return;
    case 'gotojail':
      sendToJail(ctx, p, 'Landed on Go To Jail');
      return;
    case 'freeparking':
      if (s.config.freeParkingJackpot && s.freeParkingPot > 0) {
        const amount = s.freeParkingPot;
        s.freeParkingPot = 0;
        p.cash += amount;
        emit(ctx, { type: 'freeParking', player: p.id, amount });
      }
      return;
    default:
      // 'go' (salary handled while moving) and 'jail' (just visiting)
      return;
  }
}

// ---------------------------------------------------------------------------
// Cards

function drawCard(ctx: Ctx, p: Player, deck: 'chance' | 'chest'): void {
  const s = ctx.state;
  const pile = deck === 'chance' ? s.chanceDeck : s.chestDeck;
  if (pile.length === 0) return;
  const id = pile.shift()!;
  const card: Card = DECKS[deck][id];
  emit(ctx, { type: 'card', player: p.id, deck, cardId: id, text: card.text });
  if (card.effect.kind === 'jailCard') {
    p.jailCards += 1;
    (s.jailCardOrigins[p.id] ??= []).push(deck);
    return;
  }
  pile.push(id);
  applyCardEffect(ctx, p, card.effect, card.text);
}

function applyCardEffect(ctx: Ctx, p: Player, effect: CardEffect, text: string): void {
  const s = ctx.state;
  switch (effect.kind) {
    case 'advance':
      moveTo(ctx, p, effect.to, { salary: true });
      resolveLanding(ctx, p);
      return;
    case 'nearestRailroad':
      moveTo(ctx, p, nextSpaceOf(p.position, RAILROADS), { salary: true });
      resolveLanding(ctx, p, { railroadMultiplier: 2 });
      return;
    case 'nearestUtility':
      moveTo(ctx, p, nextSpaceOf(p.position, UTILITIES), { salary: true });
      resolveLanding(ctx, p, { utilityMultiplier: 10 });
      return;
    case 'collect':
      pay(ctx, null, p.id, effect.amount, text);
      return;
    case 'pay':
      pay(ctx, p.id, null, effect.amount, text, true);
      return;
    case 'collectFromEach':
      for (const other of s.players) {
        if (other.id === p.id || other.bankrupt) continue;
        s.pendingPayments.push({ from: other.id, to: p.id, amount: effect.amount, reason: text });
      }
      return;
    case 'payEach':
      for (const other of s.players) {
        if (other.id === p.id || other.bankrupt) continue;
        s.pendingPayments.push({ from: p.id, to: other.id, amount: effect.amount, reason: text });
      }
      return;
    case 'goBack':
      moveTo(ctx, p, (p.position - effect.spaces + BOARD_SIZE) % BOARD_SIZE, { salary: false, backwards: true });
      resolveLanding(ctx, p);
      return;
    case 'goToJail':
      sendToJail(ctx, p, text);
      return;
    case 'repairs': {
      let total = 0;
      for (const i of ownedSpaces(s, p.id)) {
        const h = s.properties[i].houses;
        total += h === 5 ? effect.perHotel : h * effect.perHouse;
      }
      if (total > 0) pay(ctx, p.id, null, total, text, true);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Turn flow

/**
 * Finish the current turn step after a landing, a settled debt, an auction or
 * a purchase decision: process queued card payments, perform a movement still
 * owed after a forced jail fine, then settle the phase ('roll' when an extra
 * roll is owed, else 'action'). Stops early when a decision is pending.
 */
function continueTurn(ctx: Ctx): void {
  const s = ctx.state;
  for (;;) {
    if (s.phase === 'ended' || s.phase === 'debt' || s.phase === 'buy' || s.phase === 'auction') return;
    if (s.pendingPayments.length > 0) {
      const pp = s.pendingPayments.shift()!;
      const f = getPlayer(s, pp.from);
      const t = pp.to === null ? null : getPlayer(s, pp.to);
      if (!f || f.bankrupt || (pp.to !== null && (!t || t.bankrupt))) continue;
      pay(ctx, pp.from, pp.to, pp.amount, pp.reason, pp.toPot);
      continue;
    }
    const cur = s.players[s.currentPlayer];
    if (cur.bankrupt) {
      advanceTurn(ctx);
      return;
    }
    if (s.debtResume && s.debtResume.moveBy !== null) {
      const by = s.debtResume.moveBy;
      s.debtResume = null;
      moveBy(ctx, cur, by);
      resolveLanding(ctx, cur);
      continue;
    }
    s.debtResume = null;
    s.pendingSpace = null;
    s.phase = s.canRollAgain ? 'roll' : 'action';
    return;
  }
}

function advanceTurn(ctx: Ctx): void {
  const s = ctx.state;
  const cur = s.players[s.currentPlayer];
  emit(ctx, { type: 'turnEnded', player: cur.id });
  const n = s.players.length;
  let i = s.currentPlayer;
  for (let step = 0; step < n; step++) {
    i = (i + 1) % n;
    if (!s.players[i].bankrupt) break;
  }
  s.currentPlayer = i;
  s.dice = null;
  s.doublesCount = 0;
  s.canRollAgain = false;
  s.pendingSpace = null;
  s.auction = null;
  s.debt = null;
  s.debtResume = null;
  s.pendingPayments = [];
  s.phase = 'roll';
  s.turnNumber += 1;
  emit(ctx, { type: 'turnStarted', player: s.players[i].id, turnNumber: s.turnNumber });
}

// ---------------------------------------------------------------------------
// Rolling

function doRoll(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const r1 = rollDie(s.rng);
  const r2 = rollDie(r1.state);
  s.rng = r2.state;
  const dice: [number, number] = [r1.die, r2.die];
  const doubles = dice[0] === dice[1];
  const total = dice[0] + dice[1];
  s.dice = dice;
  s.canRollAgain = false;
  emit(ctx, { type: 'rolled', player: p.id, dice, doubles });

  if (p.inJail) {
    if (doubles) {
      freeFromJail(ctx, p, 'doubles');
      s.doublesCount = 0; // no extra roll after leaving jail on doubles
      moveBy(ctx, p, total);
      resolveLanding(ctx, p);
    } else {
      p.jailTurns += 1;
      if (p.jailTurns >= s.config.maxJailTurns) {
        freeFromJail(ctx, p, 'forced');
        if (!pay(ctx, p.id, null, s.config.jailFine, 'Jail fine', true)) {
          s.debtResume = { moveBy: total };
          return null;
        }
        moveBy(ctx, p, total);
        resolveLanding(ctx, p);
      }
      // otherwise the player stays in jail this turn
    }
    continueTurn(ctx);
    return null;
  }

  if (doubles) {
    s.doublesCount += 1;
    if (s.doublesCount >= 3) {
      sendToJail(ctx, p, 'Rolled doubles three times');
      continueTurn(ctx);
      return null;
    }
    s.canRollAgain = true;
  } else {
    s.doublesCount = 0;
  }
  moveBy(ctx, p, total);
  resolveLanding(ctx, p);
  continueTurn(ctx);
  return null;
}

/**
 * Test helper: returns a copy of the state whose rng is positioned so that the
 * next `roll` action produces exactly [d1, d2]. It only searches forward from
 * the current rng value, so games stay deterministic. Not for production use.
 */
export function _forceNextRoll(state: GameState, d1: number, d2: number): GameState {
  let r = state.rng;
  for (let i = 0; i < 1_000_000; i++) {
    const a = rollDie(r);
    const b = rollDie(a.state);
    if (a.die === d1 && b.die === d2) return { ...state, rng: r };
    r = (r + 1) | 0;
  }
  throw new Error(`could not find an rng state producing [${d1}, ${d2}]`);
}

// ---------------------------------------------------------------------------
// Buying and auctions

function doBuy(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const idx = s.pendingSpace;
  if (idx === null) return 'Nothing to buy';
  const space = s.board[idx];
  const ps = s.properties[idx];
  if (!space || !ps || ps.owner !== null) return 'This property is not for sale';
  const price = space.price ?? 0;
  if (p.cash < price) return 'Not enough cash';
  p.cash -= price;
  ps.owner = p.id;
  emit(ctx, { type: 'bought', player: p.id, space: idx, price });
  s.pendingSpace = null;
  continueTurn(ctx);
  return null;
}

function doDecline(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const idx = s.pendingSpace;
  if (idx === null) return 'Nothing to decline';
  emit(ctx, { type: 'declined', player: p.id, space: idx });
  s.pendingSpace = null;
  if (s.config.auctions) startAuction(ctx, idx, p);
  else continueTurn(ctx);
  return null;
}

function startAuction(ctx: Ctx, space: number, decliner: Player): void {
  const s = ctx.state;
  const n = s.players.length;
  const start = s.players.findIndex((x) => x.id === decliner.id);
  const active: string[] = [];
  for (let step = 1; step <= n; step++) {
    const pl = s.players[(start + step) % n];
    if (!pl.bankrupt) active.push(pl.id);
  }
  s.auction = { space, highBid: 0, highBidder: null, active, passed: [], current: active[0] };
  s.phase = 'auction';
  emit(ctx, { type: 'auctionStarted', space });
}

function doBid(ctx: Ctx, p: Player, amount: number): string | null {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return 'No auction in progress';
  if (a.current !== p.id) return 'It is not your turn to bid';
  if (!Number.isInteger(amount) || amount <= a.highBid) return `Bid must be more than $${a.highBid}`;
  if (amount > p.cash) return 'Not enough cash';
  a.highBid = amount;
  a.highBidder = p.id;
  emit(ctx, { type: 'bid', player: p.id, space: a.space, amount });
  const i = a.active.indexOf(p.id);
  a.current = a.active[(i + 1) % a.active.length];
  checkAuctionEnd(ctx);
  return null;
}

function doPassAuction(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return 'No auction in progress';
  if (a.current !== p.id) return 'It is not your turn to bid';
  if (a.highBidder === p.id) return 'The high bidder cannot pass';
  removeFromAuction(ctx, p.id);
  checkAuctionEnd(ctx);
  return null;
}

function removeFromAuction(ctx: Ctx, playerId: string): void {
  const a = ctx.state.auction;
  if (!a) return;
  const i = a.active.indexOf(playerId);
  if (i === -1) return;
  a.active.splice(i, 1);
  if (!a.passed.includes(playerId)) a.passed.push(playerId);
  if (a.highBidder === playerId) {
    // the bid dies with the bidder (only possible on resignation)
    a.highBidder = null;
    a.highBid = 0;
  }
  if (a.current === playerId) a.current = a.active.length ? a.active[i % a.active.length] : '';
}

function checkAuctionEnd(ctx: Ctx): void {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return;
  if (a.active.length === 0) endAuction(ctx, null);
  else if (a.active.length === 1 && a.highBidder === a.active[0]) endAuction(ctx, a.active[0]);
}

function endAuction(ctx: Ctx, winnerId: string | null): void {
  const s = ctx.state;
  const a = s.auction!;
  const amount = winnerId ? a.highBid : 0;
  if (winnerId) {
    const w = getPlayer(s, winnerId)!;
    w.cash -= amount;
    s.properties[a.space].owner = winnerId;
  }
  emit(ctx, { type: 'auctionEnded', space: a.space, winner: winnerId, amount });
  s.auction = null;
  s.phase = 'roll';
  continueTurn(ctx);
}

// ---------------------------------------------------------------------------
// Building and mortgages

function doBuild(ctx: Ctx, p: Player, spaceIndex: number): string | null {
  const s = ctx.state;
  const c = canBuild(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? 'Cannot build';
  const space = s.board[spaceIndex];
  const ps = s.properties[spaceIndex];
  ps.houses += 1;
  if (ps.houses === 5) {
    s.hotelsLeft -= 1;
    s.housesLeft += 4;
  } else {
    s.housesLeft -= 1;
  }
  p.cash -= space.houseCost ?? 0;
  emit(ctx, { type: 'built', player: p.id, space: spaceIndex, houses: ps.houses });
  pruneTrades(ctx);
  return null;
}

function doSellHouse(ctx: Ctx, p: Player, spaceIndex: number): string | null {
  const s = ctx.state;
  const c = canSellHouse(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? 'Cannot sell';
  const space = s.board[spaceIndex];
  const ps = s.properties[spaceIndex];
  if (ps.houses === 5) {
    s.hotelsLeft += 1;
    s.housesLeft -= 4;
  } else {
    s.housesLeft += 1;
  }
  ps.houses -= 1;
  p.cash += houseSaleValue(space);
  emit(ctx, { type: 'soldHouse', player: p.id, space: spaceIndex, houses: ps.houses });
  return null;
}

function doMortgage(ctx: Ctx, p: Player, spaceIndex: number): string | null {
  const s = ctx.state;
  const c = canMortgage(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? 'Cannot mortgage';
  s.properties[spaceIndex].mortgaged = true;
  p.cash += mortgageValue(s.board[spaceIndex]);
  emit(ctx, { type: 'mortgaged', player: p.id, space: spaceIndex });
  return null;
}

function doUnmortgage(ctx: Ctx, p: Player, spaceIndex: number): string | null {
  const s = ctx.state;
  const c = canUnmortgage(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? 'Cannot unmortgage';
  const space = s.board[spaceIndex];
  const cost = unmortgageCost(space);
  p.cash -= cost;
  if (s.config.freeParkingJackpot) s.freeParkingPot += mortgageInterest(space);
  s.properties[spaceIndex].mortgaged = false;
  emit(ctx, { type: 'unmortgaged', player: p.id, space: spaceIndex });
  return null;
}

// ---------------------------------------------------------------------------
// Jail

function doPayJailFine(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  if (!p.inJail) return 'You are not in jail';
  if (p.cash < s.config.jailFine) return 'Not enough cash';
  transfer(ctx, p, null, s.config.jailFine, 'Jail fine', true);
  freeFromJail(ctx, p, 'fine');
  return null;
}

function doUseJailCard(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  if (!p.inJail) return 'You are not in jail';
  if (p.jailCards < 1) return 'You have no Get Out of Jail Free card';
  p.jailCards -= 1;
  returnJailCard(s, p.id);
  freeFromJail(ctx, p, 'card');
  return null;
}

/** Put one of the player's held jail cards back at the bottom of its original deck. */
function returnJailCard(s: GameState, playerId: string): void {
  const origins = s.jailCardOrigins[playerId] ?? [];
  const origin = origins.shift() ?? 'chance';
  if (origins.length === 0) delete s.jailCardOrigins[playerId];
  (origin === 'chance' ? s.chanceDeck : s.chestDeck).push(JAIL_CARD_ID[origin]);
}

/** Move `count` held jail cards (and their deck origins) from one player to another. */
function transferJailCards(s: GameState, from: Player, to: Player, count: number): void {
  if (count <= 0) return;
  const origins = s.jailCardOrigins[from.id] ?? [];
  const moved = origins.splice(0, count);
  while (moved.length < count) moved.push('chance');
  if (origins.length === 0) delete s.jailCardOrigins[from.id];
  else s.jailCardOrigins[from.id] = origins;
  (s.jailCardOrigins[to.id] ??= []).push(...moved);
  from.jailCards -= count;
  to.jailCards += count;
}

// ---------------------------------------------------------------------------
// Trades

function normalizeSide(side: TradeSide): TradeSide {
  return {
    cash: side.cash,
    properties: side.properties.slice().sort((a, b) => a - b),
    jailCards: side.jailCards,
  };
}

function doProposeTrade(ctx: Ctx, p: Player, to: string, offer: TradeSide, request: TradeSide): string | null {
  const s = ctx.state;
  const phase = canTradeNow(s, p.id, to);
  if (!phase.ok) return phase.reason ?? 'Cannot trade now';
  const err = validateTrade(s, { from: p.id, to, offer, request }, false);
  if (err) return err;
  const trade: Trade = {
    id: `t${s.nextTradeId++}`,
    from: p.id,
    to,
    offer: normalizeSide(offer),
    request: normalizeSide(request),
  };
  s.trades.push(trade);
  emit(ctx, { type: 'tradeProposed', trade: structuredClone(trade) });
  return null;
}

function doAcceptTrade(ctx: Ctx, p: Player, tradeId: string): string | null {
  const s = ctx.state;
  const trade = s.trades.find((t) => t.id === tradeId);
  if (!trade) return 'No such trade';
  const c = canAcceptTrade(s, p.id, trade);
  if (!c.ok) return c.reason ?? 'Cannot accept this trade';
  const from = getPlayer(s, trade.from)!;
  const to = getPlayer(s, trade.to)!;

  // cash
  from.cash -= trade.offer.cash;
  to.cash += trade.offer.cash;
  to.cash -= trade.request.cash;
  from.cash += trade.request.cash;
  // properties
  for (const i of trade.offer.properties) s.properties[i].owner = to.id;
  for (const i of trade.request.properties) s.properties[i].owner = from.id;
  // jail cards
  transferJailCards(s, from, to, trade.offer.jailCards);
  transferJailCards(s, to, from, trade.request.jailCards);

  s.trades = s.trades.filter((t) => t.id !== tradeId);
  emit(ctx, { type: 'tradeAccepted', trade: structuredClone(trade) });

  // interest on mortgaged properties received (cash was verified by canAcceptTrade)
  for (const i of trade.offer.properties) {
    if (s.properties[i].mortgaged) transfer(ctx, to, null, mortgageInterest(s.board[i]), `Interest on mortgaged ${s.board[i].name}`, true);
  }
  for (const i of trade.request.properties) {
    if (s.properties[i].mortgaged) transfer(ctx, from, null, mortgageInterest(s.board[i]), `Interest on mortgaged ${s.board[i].name}`, true);
  }
  pruneTrades(ctx);
  return null;
}

function doRejectTrade(ctx: Ctx, p: Player, tradeId: string): string | null {
  const s = ctx.state;
  const trade = s.trades.find((t) => t.id === tradeId);
  if (!trade) return 'No such trade';
  const c = canRejectTrade(s, p.id, trade);
  if (!c.ok) return c.reason ?? 'Cannot reject this trade';
  s.trades = s.trades.filter((t) => t.id !== tradeId);
  emit(ctx, { type: 'tradeRejected', trade: structuredClone(trade) });
  return null;
}

/** Drop open trades that can no longer be fulfilled (ownership or buildings changed). */
function pruneTrades(ctx: Ctx): void {
  const s = ctx.state;
  const keep: Trade[] = [];
  for (const t of s.trades) {
    if (validateTrade(s, t, false) === null) keep.push(t);
    else emit(ctx, { type: 'tradeRejected', trade: structuredClone(t) });
  }
  s.trades = keep;
}

// ---------------------------------------------------------------------------
// Debt, bankruptcy and resignation

function doPayDebt(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const d = s.debt;
  if (!d || d.debtor !== p.id) return 'You have no debt to pay';
  if (p.cash < d.amount) return 'Not enough cash';
  transfer(ctx, p, d.creditor, d.amount, d.reason, d.toPot);
  s.debt = null;
  s.phase = 'roll';
  continueTurn(ctx);
  return null;
}

function doDeclareBankruptcy(ctx: Ctx, p: Player): string | null {
  const s = ctx.state;
  const d = s.debt;
  if (!d || d.debtor !== p.id) return 'You are not in debt';
  eliminate(ctx, p, d.creditor);
  return null;
}

function doResign(ctx: Ctx, p: Player): string | null {
  eliminate(ctx, p, null);
  return null;
}

/**
 * Remove a player from the game. With a creditor their assets go to that
 * player (buildings sold to the bank first); otherwise everything returns to
 * the bank. Then repair whatever the player was involved in (debt, auction,
 * trades, queued payments) and move the game on.
 */
function eliminate(ctx: Ctx, p: Player, creditorId: string | null): void {
  const s = ctx.state;
  const creditorPlayer = creditorId ? getPlayer(s, creditorId) : undefined;
  const creditor = creditorPlayer && !creditorPlayer.bankrupt ? creditorPlayer : null;
  const debt = s.debt;
  const wasDebtor = debt?.debtor === p.id;
  const wasCreditor = debt?.creditor === p.id;
  const potBound = Boolean(wasDebtor && debt?.toPot && debt?.creditor === null);

  // 1. buildings: sold to the bank (cash goes on to the creditor) or simply returned
  let proceeds = 0;
  for (const i of ownedSpaces(s, p.id)) {
    const ps = s.properties[i];
    if (ps.houses === 0) continue;
    const space = s.board[i];
    if (ps.houses === 5) s.hotelsLeft += 1;
    else s.housesLeft += ps.houses;
    proceeds += ps.houses * houseSaleValue(space);
    ps.houses = 0;
  }
  if (creditor && proceeds > 0) pay(ctx, null, p.id, proceeds, 'Buildings sold to the bank');

  // 2. cash
  if (p.cash > 0) {
    const cash = p.cash;
    if (creditor) {
      transfer(ctx, p, creditor.id, cash, 'Bankruptcy');
    } else {
      p.cash = 0;
      if (potBound && s.config.freeParkingJackpot) s.freeParkingPot += cash;
      emit(ctx, { type: 'paid', from: p.id, to: null, amount: cash, reason: 'Bankruptcy' });
    }
  }

  // 3. properties
  for (const i of ownedSpaces(s, p.id)) {
    const ps = s.properties[i];
    if (creditor) {
      ps.owner = creditor.id;
      if (ps.mortgaged) {
        const interest = mortgageInterest(s.board[i]);
        if (creditor.cash >= interest) transfer(ctx, creditor, null, interest, `Interest on mortgaged ${s.board[i].name}`, true);
      }
    } else {
      ps.owner = null;
      ps.mortgaged = false;
    }
  }

  // 4. jail cards
  if (creditor) {
    transferJailCards(s, p, creditor, p.jailCards);
  } else {
    while (p.jailCards > 0) {
      returnJailCard(s, p.id);
      p.jailCards -= 1;
    }
  }
  delete s.jailCardOrigins[p.id];

  // 5. out
  p.bankrupt = true;
  p.inJail = false;
  p.jailTurns = 0;
  p.cash = 0;
  emit(ctx, { type: 'bankrupt', player: p.id, creditor: creditor ? creditor.id : null });

  // 6. trades and queued payments
  const involved = s.trades.filter((t) => t.from === p.id || t.to === p.id);
  s.trades = s.trades.filter((t) => t.from !== p.id && t.to !== p.id);
  for (const t of involved) emit(ctx, { type: 'tradeRejected', trade: structuredClone(t) });
  pruneTrades(ctx);
  s.pendingPayments = s.pendingPayments.filter((pp) => pp.from !== p.id && pp.to !== p.id);

  // 7. debt
  if (wasDebtor || wasCreditor) s.debt = null;

  // 8. game over?
  const alive = s.players.filter((x) => !x.bankrupt);
  if (alive.length <= 1) {
    s.winner = alive[0]?.id ?? null;
    s.phase = 'ended';
    s.auction = null;
    s.debt = null;
    s.trades = [];
    s.pendingPayments = [];
    s.debtResume = null;
    s.pendingSpace = null;
    if (s.winner) emit(ctx, { type: 'gameOver', winner: s.winner });
    return;
  }

  // 9. auction in progress: drop the player; the auction goes on (or ends now)
  if (s.phase === 'auction' && s.auction) {
    removeFromAuction(ctx, p.id);
    checkAuctionEnd(ctx); // endAuction -> continueTurn handles a bankrupt current player
    return;
  }

  // 10. turn flow
  if (currentPlayerId(s) === p.id) {
    advanceTurn(ctx);
  } else if (wasDebtor || wasCreditor) {
    s.phase = 'roll';
    continueTurn(ctx);
  }
}
