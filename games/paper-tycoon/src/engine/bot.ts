// A computer player. Pure: given a state and a player id it returns the next
// action that player would take (or null when it has nothing to do). Used by the
// single-player game and by the server when it needs to play for someone.
//
// Strategy in short:
// - streets are valued by how they advance a color set the bot can realistically
//   complete (or deny to an opponent), with a preference for the groups that
//   give the best rent per dollar of building cost;
// - the cash reserve comes from the rent the bot actually risks on its next
//   move (two-dice probabilities over the 12 spaces ahead) plus a buffer;
// - auctions are bid up to the valuation, or above what an opponent can pay
//   when the lot would complete that opponent's set;
// - buildings go to 3 houses per street first (best marginal rent), on the
//   groups opponents are about to reach;
// - trades are judged by the change in portfolio value plus a penalty for
//   every set the trade hands to the other side;
// - jail is a shelter late in the game.
// Three difficulty levels scale noise, reserve awareness and bargaining.

import { GROUPS, RAILROADS, UTILITIES, mortgageValue } from '../shared/board';
import type { Action, ColorGroup, GameState, Player, Trade, TradeSide } from '../shared/types';
import { legalActions } from './engine';
import {
  activePlayers,
  canAcceptTrade,
  canBuild,
  canMortgage,
  canRejectTrade,
  canSellHouse,
  canUnmortgage,
  countOwned,
  groupHasBuildings,
  ownedSpaces,
  ownsFullGroup,
  rentFor,
  sideInterest,
  unmortgageCost,
  validateTrade,
} from './queries';

export type Difficulty = 'easy' | 'normal' | 'hard';
export interface BotOptions { difficulty?: Difficulty }

const OWNABLE_COUNT = 28;
const BOARD_SIZE = 40;
const GROUP_KEYS = Object.keys(GROUPS) as ColorGroup[];

/** Probability that two dice total d (index 2..12; 0 elsewhere). */
const DICE_P: number[] = Array.from({ length: 13 }, (_, d) => (d < 2 ? 0 : (6 - Math.abs(d - 7)) / 36));

/** Rough rent-per-building-cost quality of each color group (1 = average). */
const GROUP_QUALITY: Record<ColorGroup, number> = {
  brown: 0.9,
  lightblue: 1.15,
  pink: 1.05,
  orange: 1.25,
  red: 1.18,
  yellow: 1.12,
  green: 0.95,
  darkblue: 1.08,
};

/** Tunable behaviour per difficulty level. */
interface Profile {
  /** relative noise applied to valuations (from `random`) */
  noise: number;
  /** multiplier on the expected rent exposure kept in reserve */
  reserveMult: number;
  /** flat cash buffer on top of the exposure */
  buffer: number;
  /** share of the biggest nearby built rent the bot insists on covering */
  nearRent: number;
  /** how much denying an opponent's set is worth (1 = full) */
  blockMult: number;
  /** penalty for handing the other side a set, per dollar of the group's prices */
  setPenalty: number;
  /** share of the valuation the bot will pay at auction */
  auctionCeil: number;
  /** bid increment as a share of the list price */
  auctionStep: number;
  /** share of the reserve that must survive an auction win */
  auctionKeep: number;
  /** cap, in list prices, on an "outbid the opponent's cash" block bid (0 = no block bids) */
  blockCap: number;
  /** chance to give up an auction once someone else has bid */
  quitEarly: number;
  /** chance to ignore the ceiling and overpay */
  overpay: number;
  /** required trade gain as a share of what the bot gives (negative = accepts mildly bad trades) */
  tradeMargin: number;
  /** chance to accept a trade that is somewhat bad */
  lenient: number;
  /** share of the reserve that must survive a trade the bot accepts */
  cashFloor: number;
  /** cash offered for the last street of a set, in list prices */
  lastStreetMult: number;
  /** chance to look for a trade in a given action phase */
  proposeProb: number;
  /** extra cash kept when building */
  buildSlack: number;
  /** chance to build at all in a given action phase */
  buildProb: number;
  /** creep up to the exact ceiling when the next step would overshoot it (finds the price) */
  creep: boolean;
  /** share of the reserve that must survive a building purchase */
  buildReserve: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  easy: {
    noise: 0.35, reserveMult: 0.5, buffer: 30, nearRent: 0.3, blockMult: 0.3, setPenalty: 0.2,
    auctionCeil: 0.75, auctionStep: 0.15, auctionKeep: 0.2, blockCap: 0, quitEarly: 0.3, overpay: 0.15,
    tradeMargin: -0.05, lenient: 0.25, cashFloor: 0, lastStreetMult: 1.2, proposeProb: 0.2,
    buildSlack: 150, buildProb: 0.55, creep: false, buildReserve: 1,
  },
  normal: {
    noise: 0.1, reserveMult: 1, buffer: 100, nearRent: 0.7, blockMult: 0.6, setPenalty: 0.55,
    auctionCeil: 0.95, auctionStep: 0.08, auctionKeep: 0.5, blockCap: 2, quitEarly: 0, overpay: 0,
    tradeMargin: 0.05, lenient: 0, cashFloor: 0.3, lastStreetMult: 1.4, proposeProb: 0.35,
    buildSlack: 0, buildProb: 1, creep: false, buildReserve: 0.9,
  },
  hard: {
    noise: 0.03, reserveMult: 1.3, buffer: 160, nearRent: 1, blockMult: 1, setPenalty: 0.7,
    auctionCeil: 1, auctionStep: 0.04, auctionKeep: 0.5, blockCap: 2.5, quitEarly: 0, overpay: 0,
    tradeMargin: 0.12, lenient: 0, cashFloor: 0.5, lastStreetMult: 1.6, proposeProb: 0.7,
    buildSlack: 0, buildProb: 1, creep: true, buildReserve: 0.6,
  },
};

function profileOf(opts: BotOptions): Profile {
  return PROFILES[opts.difficulty ?? 'normal'];
}

function getPlayer(state: GameState, id: string): Player | undefined {
  return state.players.find((p) => p.id === id);
}

/** Share of the board's ownable spaces that already have an owner (0..1). */
export function ownedFraction(state: GameState): number {
  let n = 0;
  for (const ps of Object.values(state.properties)) if (ps.owner) n++;
  return n / OWNABLE_COUNT;
}

// ---------------------------------------------------------------------------
// Valuation

/** Who owns the other streets of a color group, from one player's point of view. */
interface GroupView {
  mine: number;
  bank: number;
  /** most streets held by a single opponent, and who */
  top: number;
  topOwner: string | null;
  /** number of distinct opponents holding streets */
  owners: number;
}

function groupView(state: GameState, playerId: string, group: ColorGroup, exclude: number): GroupView {
  let mine = 0;
  let bank = 0;
  const counts = new Map<string, number>();
  for (const i of GROUPS[group]) {
    if (i === exclude) continue;
    const owner = state.properties[i]?.owner ?? null;
    if (owner === null) bank++;
    else if (owner === playerId) mine++;
    else counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  let top = 0;
  let topOwner: string | null = null;
  for (const [owner, c] of counts) if (c > top) { top = c; topOwner = owner; }
  return { mine, bank, top, topOwner, owners: counts.size };
}

/** 1 early in the game, falling to 0.65 once the board is heavily built (less time left to develop a new set). */
function buildTimeFactor(state: GameState): number {
  let built = 0;
  for (const ps of Object.values(state.properties)) built += ps.houses;
  return 1 - 0.35 * Math.min(1, built / 24);
}

function groupPrice(state: GameState, group: ColorGroup): number {
  let total = 0;
  for (const i of GROUPS[group]) total += state.board[i].price ?? 0;
  return total;
}

/** What a space is worth to this player, in dollars, given what they already own. */
export function propertyValueFor(state: GameState, playerId: string, idx: number, opts: BotOptions = {}): number {
  const pr = profileOf(opts);
  const s = state.board[idx];
  if (!s) return 0;
  const price = s.price ?? 0;
  let v = price;
  if (s.type === 'property' && s.group) {
    const n = GROUPS[s.group].length;
    const g = groupView(state, playerId, s.group, idx);
    const q = GROUP_QUALITY[s.group];
    if (g.mine === n - 1) {
      // completes my set: worth far more, less so when little time is left to build
      v = price * (1.5 + 1.0 * buildTimeFactor(state)) * q;
    } else if (g.mine > 0) {
      // I hold part of the group: strong if the rest is still in the bank, trade bait otherwise
      v = g.bank === n - 1 - g.mine ? price * 1.5 * q : price * 1.2;
    } else if (g.top === n - 1) {
      // completes an opponent's set: worth extra as a block
      v = price * (1 + 0.8 * pr.blockMult);
    } else if (g.owners >= 2) {
      // already split among opponents: close to face value
      v = price * 0.95;
    } else if (g.bank === n - 1) {
      v = price * 1.1 * q;
    } else {
      v = price;
    }
  } else if (s.type === 'railroad') {
    v = price * (1 + 0.3 * countOwned(state, playerId, RAILROADS.filter((i) => i !== idx)));
  } else if (s.type === 'utility') {
    v = price * (0.8 + 0.35 * countOwned(state, playerId, UTILITIES.filter((i) => i !== idx)));
  }
  if (state.properties[idx]?.mortgaged) v -= unmortgageCost(s) * 0.8;
  return v;
}

/** Value of everything a player owns, in that player's own valuation. */
function portfolioValue(state: GameState, playerId: string, opts: BotOptions): number {
  let v = 0;
  for (const [i, ps] of Object.entries(state.properties)) {
    if (ps.owner === playerId) v += propertyValueFor(state, playerId, Number(i), opts);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Cash reserve

/**
 * Cash a bot likes to keep on hand: the rent it risks over its next move
 * (two-dice probabilities over the spaces 2..12 ahead, taxes and a small flat
 * card risk) plus a buffer, and at least a share of the largest rent on an
 * opponent's built street within 12 spaces.
 */
export function cashReserve(state: GameState, playerId: string, opts: BotOptions = {}): number {
  const pr = profileOf(opts);
  const me = getPlayer(state, playerId);
  if (!me) return 0;
  let expected = 0;
  let maxNear = 0;
  for (let d = 1; d <= 12; d++) {
    const idx = (me.position + d) % BOARD_SIZE;
    const sp = state.board[idx];
    const ps = state.properties[idx];
    let cost = 0;
    if (ps && ps.owner && ps.owner !== playerId && !ps.mortgaged) {
      cost = rentFor(state, idx, Math.max(d, 7));
      if (sp.type === 'property' && ps.houses > 0 && cost > maxNear) maxNear = cost;
    } else if (sp.type === 'tax') {
      cost = sp.amount ?? 0;
    } else if (sp.type === 'chance' || sp.type === 'chest') {
      cost = 30;
    }
    expected += DICE_P[d] * cost;
  }
  const reserve = expected * pr.reserveMult + pr.buffer + 60 * ownedFraction(state);
  return Math.round(Math.max(reserve, maxNear * pr.nearRent));
}

// ---------------------------------------------------------------------------
// Trades

/** The state's ownership map after a trade goes through (nothing else changes). */
function afterTrade(state: GameState, trade: { from: string; to: string; offer: TradeSide; request: TradeSide }): GameState {
  const properties = { ...state.properties };
  for (const i of trade.offer.properties) properties[i] = { ...properties[i], owner: trade.to };
  for (const i of trade.request.properties) properties[i] = { ...properties[i], owner: trade.from };
  return { ...state, properties };
}

/**
 * Net gain for a party of a trade, in that party's own valuation: cash and
 * jail cards, the change in the value of their portfolio (which includes sets
 * completed or broken up), minus a penalty for every set the other side
 * completes through the trade.
 */
export function tradeGainFor(state: GameState, playerId: string, trade: Trade, opts: BotOptions = {}): number {
  const pr = profileOf(opts);
  const iAmRecipient = trade.to === playerId;
  const received = iAmRecipient ? trade.offer : trade.request;
  const given = iAmRecipient ? trade.request : trade.offer;
  const other = iAmRecipient ? trade.from : trade.to;
  let gain = received.cash - given.cash + 50 * (received.jailCards - given.jailCards) - sideInterest(state, received.properties);
  const after = afterTrade(state, trade);
  gain += portfolioValue(after, playerId, opts) - portfolioValue(state, playerId, opts);
  for (const group of GROUP_KEYS) {
    if (!ownsFullGroup(state, other, group) && ownsFullGroup(after, other, group)) {
      gain -= groupPrice(state, group) * pr.setPenalty * GROUP_QUALITY[group];
    }
  }
  return gain;
}

/** Value (to me) of what I hand over in a trade. */
function givenValue(state: GameState, playerId: string, trade: Trade, opts: BotOptions): number {
  const given = trade.to === playerId ? trade.request : trade.offer;
  let v = given.cash + 50 * given.jailCards;
  for (const i of given.properties) v += propertyValueFor(state, playerId, i, opts);
  return v;
}

function shouldAccept(state: GameState, me: Player, trade: Trade, pr: Profile, random: () => number, opts: BotOptions): boolean {
  const received = trade.to === me.id ? trade.offer : trade.request;
  const given = trade.to === me.id ? trade.request : trade.offer;
  const cashNet = received.cash - given.cash;
  const gain = tradeGainFor(state, me.id, trade, opts);
  const noisy = cashNet + (gain - cashNet) * (1 + pr.noise * (2 * random() - 1));
  const gv = givenValue(state, me.id, trade, opts);
  let threshold = pr.tradeMargin * gv;
  if (pr.lenient > 0 && random() < pr.lenient) threshold = -0.25 * gv - 20;
  if (noisy <= threshold) return false;
  const cashAfter = me.cash + cashNet - sideInterest(state, received.properties);
  if (pr.cashFloor > 0 && cashAfter < cashReserve(state, me.id, opts) * pr.cashFloor && cashNet < 0) return false;
  return true;
}

function tradeShape(to: string, offer: TradeSide, request: TradeSide): string {
  return `${to}|${offer.properties.slice().sort((a, b) => a - b).join(',')}|${request.properties.slice().sort((a, b) => a - b).join(',')}`;
}

/** Shapes of the trades this player proposed during their last few turns (from the log). */
function recentProposals(state: GameState, playerId: string, turns = 3): Set<string> {
  const out = new Set<string>();
  let ended = 0;
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e.type === 'turnEnded' && e.player === playerId && ++ended >= turns) break;
    if (e.type === 'tradeProposed' && e.trade.from === playerId) out.add(tradeShape(e.trade.to, e.trade.offer, e.trade.request));
  }
  return out;
}

/** Streets the player holds that neither complete nor advance any of their sets: sweeteners for trades. */
function spareProperties(state: GameState, playerId: string): number[] {
  const out: number[] = [];
  for (const idx of ownedSpaces(state, playerId)) {
    const s = state.board[idx];
    const ps = state.properties[idx];
    if (ps.houses > 0 || ps.mortgaged) continue;
    if (s.type === 'railroad') { if (countOwned(state, playerId, RAILROADS) <= 1) out.push(idx); continue; }
    if (s.type === 'utility') { if (countOwned(state, playerId, UTILITIES) <= 1) out.push(idx); continue; }
    if (!s.group || groupHasBuildings(state, s.group)) continue;
    const g = groupView(state, playerId, s.group, idx);
    const n = GROUPS[s.group].length;
    if (g.mine === 0 && g.top < n - 1 && g.bank === 0) out.push(idx);
  }
  return out;
}

function proposeTrade(state: GameState, me: Player, pr: Profile, random: () => number, reserve: number, opts: BotOptions): Action | null {
  const spareCash = Math.max(0, me.cash - reserve);
  const recent = recentProposals(state, me.id);
  const spares = spareProperties(state, me.id);
  const variation = 0.92 + 0.16 * random();
  type Candidate = { action: Extract<Action, { type: 'proposeTrade' }>; gain: number; plausible: boolean };
  const candidates: Candidate[] = [];
  const side = (cash: number, properties: number[]): TradeSide => ({ cash: Math.max(0, Math.round(cash)), properties, jailCards: 0 });
  const consider = (to: string, offer: TradeSide, request: TradeSide) => {
    if (recent.has(tradeShape(to, offer, request))) return;
    const trade = { from: me.id, to, offer, request };
    if (validateTrade(state, trade, true) !== null) return;
    const t: Trade = { id: '', ...trade };
    const gain = tradeGainFor(state, me.id, t, opts);
    if (gain <= Math.max(0, pr.tradeMargin) * givenValue(state, me.id, t, opts)) return;
    // a sensible counterpart must gain too, or the offer is just noise
    const plausible = tradeGainFor(state, to, t, { difficulty: 'normal' }) > 0;
    candidates.push({ action: { type: 'proposeTrade', to, offer, request }, gain, plausible });
  };

  for (const o of activePlayers(state)) {
    if (o.id === me.id) continue;
    const wants: number[] = []; // their streets that complete my sets
    const gives: number[] = []; // my streets that complete their sets
    for (const group of GROUP_KEYS) {
      if (groupHasBuildings(state, group)) continue;
      const spaces = GROUPS[group];
      const n = spaces.length;
      const mine = countOwned(state, me.id, spaces);
      const theirs = countOwned(state, o.id, spaces);
      if (mine === n - 1 && theirs === 1) wants.push(spaces.find((i) => state.properties[i].owner === o.id)!);
      if (theirs === n - 1 && mine === 1) gives.push(spaces.find((i) => state.properties[i].owner === me.id)!);
    }
    wants.sort((a, b) => propertyValueFor(state, me.id, b, opts) - propertyValueFor(state, me.id, a, opts));
    gives.sort((a, b) => propertyValueFor(state, me.id, a, opts) - propertyValueFor(state, me.id, b, opts));
    for (const w of wants) {
      const pw = state.board[w].price ?? 0;
      for (const g of gives) {
        const diff = pw - (state.board[g].price ?? 0);
        consider(o.id, side(diff > 0 ? Math.min(diff, spareCash) : 0, [g]), side(diff < 0 ? Math.min(-diff, o.cash) : 0, [w]));
        const g2 = gives.find((x) => x !== g);
        if (g2 !== undefined) consider(o.id, side(0, [g, g2]), side(0, [w]));
      }
      const cash = pw * pr.lastStreetMult * variation;
      if (cash <= spareCash) consider(o.id, side(cash, []), side(0, [w]));
      for (const sp of spares.slice(0, 2)) consider(o.id, side(Math.min(spareCash, pw * 0.8 * variation), [sp]), side(0, [w]));
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Number(b.plausible) - Number(a.plausible) || b.gain - a.gain);
  return candidates[0].action;
}

// ---------------------------------------------------------------------------
// Debt

/**
 * How much a property matters to the player's plans: 0 = a lone railroad /
 * utility or a street in a group an opponent has already broken up, 1 = a block
 * or a small collection, 2 = part of a set still open to complete, 3 = a
 * street of a full set.
 */
function strategicTier(state: GameState, playerId: string, idx: number): number {
  const s = state.board[idx];
  if (s.type === 'railroad') { const n = countOwned(state, playerId, RAILROADS); return n <= 1 ? 0 : n === 2 ? 1 : 2; }
  if (s.type === 'utility') return countOwned(state, playerId, UTILITIES) <= 1 ? 0 : 1;
  if (!s.group) return 0;
  const n = GROUPS[s.group].length;
  const g = groupView(state, playerId, s.group, idx);
  if (g.mine === n - 1) return 3;
  if (g.top === n - 1) return 1;
  if (g.owners > 0) return 0;
  return 2;
}

/** Total rent currently charged by the streets of a group (how much the buildings are earning). */
function groupRent(state: GameState, group: ColorGroup): number {
  let total = 0;
  for (const i of GROUPS[group]) total += rentFor(state, i, 7);
  return total;
}

/** The street to sell a building from, taking the least valuable group first. */
function bestHouseSale(state: GameState, playerId: string): number | null {
  let best: number | null = null;
  let bestScore = Infinity;
  for (const idx of ownedSpaces(state, playerId)) {
    const s = state.board[idx];
    if (!s.group || !canSellHouse(state, playerId, idx).ok) continue;
    const score = groupRent(state, s.group) * 1000 + (s.rent?.[state.properties[idx].houses] ?? 0);
    if (score < bestScore) { bestScore = score; best = idx; }
  }
  return best;
}

/** The property to mortgage: least strategic tier first; within a tier the smallest one that covers the shortfall, else the largest. */
function bestMortgage(state: GameState, playerId: string, shortfall: number, maxTier: number): number | null {
  let best: number | null = null;
  let bestKey = Infinity;
  for (const idx of ownedSpaces(state, playerId)) {
    if (!canMortgage(state, playerId, idx).ok) continue;
    const tier = strategicTier(state, playerId, idx);
    if (tier > maxTier) continue;
    const mv = mortgageValue(state.board[idx]);
    const key = tier * 1e6 + (mv >= shortfall ? mv : 1e5 - mv);
    if (key < bestKey) { bestKey = key; best = idx; }
  }
  return best;
}

/**
 * Raise cash while in debt: pay when possible; otherwise mortgage the least
 * strategic properties, then sell buildings from the least valuable group,
 * then mortgage what is left; bankruptcy is the last resort.
 */
export function debtAction(state: GameState, playerId: string, legal: Set<string>): Action | null {
  if (legal.has('payDebt')) return { type: 'payDebt' };
  const me = getPlayer(state, playerId);
  const shortfall = Math.max(1, (state.debt?.amount ?? 0) - (me?.cash ?? 0));
  if (legal.has('mortgage')) {
    const m = bestMortgage(state, playerId, shortfall, 1);
    if (m !== null) return { type: 'mortgage', space: m };
  }
  if (legal.has('sellHouse')) {
    const h = bestHouseSale(state, playerId);
    if (h !== null) return { type: 'sellHouse', space: h };
  }
  if (legal.has('mortgage')) {
    const m = bestMortgage(state, playerId, shortfall, 3);
    if (m !== null) return { type: 'mortgage', space: m };
  }
  if (legal.has('declareBankruptcy')) return { type: 'declareBankruptcy' };
  return null;
}

// ---------------------------------------------------------------------------
// Building and mortgages

/** 1 + how likely opponents are to land on the group's streets on their next move. */
function landingFactor(state: GameState, playerId: string, group: ColorGroup): number {
  let p = 0;
  for (const o of activePlayers(state)) {
    if (o.id === playerId) continue;
    for (const i of GROUPS[group]) {
      const d = (i - o.position + BOARD_SIZE) % BOARD_SIZE;
      if (d >= 2 && d <= 12) p += DICE_P[d];
    }
  }
  return 1 + 3 * p;
}

function bestBuild(state: GameState, playerId: string, reserve: number): number | null {
  const me = getPlayer(state, playerId)!;
  const candidates: { idx: number; houses: number; group: ColorGroup }[] = [];
  for (const idx of ownedSpaces(state, playerId)) {
    const s = state.board[idx];
    if (s.type !== 'property' || !s.group || !s.rent || !s.houseCost) continue;
    if (me.cash - s.houseCost < reserve) continue;
    if (!canBuild(state, playerId, idx).ok) continue;
    candidates.push({ idx, houses: state.properties[idx].houses, group: s.group });
  }
  if (candidates.length === 0) return null;
  const someGroupBelowThree = candidates.some((c) => c.houses < 3);
  let best: number | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = state.board[c.idx];
    const gain = s.rent![c.houses + 1] - s.rent![c.houses];
    let score = (gain / s.houseCost!) * landingFactor(state, playerId, c.group);
    if (c.houses >= 3 && someGroupBelowThree) score *= 0.5;
    if (score > bestScore) { bestScore = score; best = c.idx; }
  }
  return best;
}

function inFullSet(state: GameState, playerId: string, idx: number): boolean {
  const s = state.board[idx];
  return s.type === 'property' && !!s.group && ownsFullGroup(state, playerId, s.group);
}

function bestUnmortgage(state: GameState, playerId: string, reserve: number): number | null {
  const me = getPlayer(state, playerId)!;
  let best: number | null = null;
  let bestValue = 0;
  for (const idx of ownedSpaces(state, playerId)) {
    const ps = state.properties[idx];
    if (!ps.mortgaged || !canUnmortgage(state, playerId, idx).ok) continue;
    const s = state.board[idx];
    if (me.cash - unmortgageCost(s) < reserve + 50) continue;
    const value = (s.price ?? 0) * (inFullSet(state, playerId, idx) ? 3 : 1) + strategicTier(state, playerId, idx) * 50;
    if (value > bestValue) { bestValue = value; best = idx; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Auctions

/** The most the bot is willing to pay for the lot under the hammer. */
function auctionCeiling(state: GameState, me: Player, space: number, pr: Profile, random: () => number, opts: BotOptions): number {
  const reserve = cashReserve(state, me.id, opts);
  const price = state.board[space].price ?? 0;
  const value = propertyValueFor(state, me.id, space, opts) * (1 + pr.noise * (2 * random() - 1));
  let ceiling = Math.min(value * pr.auctionCeil, me.cash - reserve * pr.auctionKeep);
  if (pr.overpay > 0 && random() < pr.overpay) ceiling = Math.min(value * 1.3, me.cash);
  const s = state.board[space];
  if (pr.blockCap > 0 && s.type === 'property' && s.group) {
    const g = groupView(state, me.id, s.group, space);
    const n = GROUPS[s.group].length;
    if (g.mine === 0 && g.top === n - 1 && g.topOwner && state.auction?.active.includes(g.topOwner)) {
      const rival = getPlayer(state, g.topOwner);
      if (rival) {
        const block = Math.min(rival.cash + 1, price * pr.blockCap, me.cash - reserve * 0.3);
        ceiling = Math.max(ceiling, block);
      }
    }
  }
  return Math.min(ceiling, me.cash);
}

// ---------------------------------------------------------------------------
// The player

/**
 * The next action a computer player takes, or null when it is not their move.
 * `random` in [0,1) adds a little variety to bids and trade offers; given the
 * same state and random sequence the result is always the same.
 */
export function chooseBotAction(state: GameState, playerId: string, random: () => number = Math.random, opts: BotOptions = {}): Action | null {
  const pr = profileOf(opts);
  const legal = new Set(legalActions(state, playerId));
  if (legal.size === 0) return null;
  const me = getPlayer(state, playerId);
  if (!me || me.bankrupt) return null;
  const isTurn = state.players[state.currentPlayer]?.id === playerId;

  // Answer trade offers first, in any phase where that is allowed.
  for (const t of state.trades) {
    if (t.to !== playerId) continue;
    if (legal.has('acceptTrade') && canAcceptTrade(state, playerId, t).ok && shouldAccept(state, me, t, pr, random, opts)) {
      return { type: 'acceptTrade', tradeId: t.id };
    }
    if (legal.has('rejectTrade') && canRejectTrade(state, playerId, t).ok) return { type: 'rejectTrade', tradeId: t.id };
  }
  // Withdraw my own offers that were ignored for a whole round.
  if (isTurn && state.phase === 'roll' && state.dice === null && legal.has('rejectTrade')) {
    const stale = state.trades.find((t) => t.from === playerId && canRejectTrade(state, playerId, t).ok);
    if (stale) return { type: 'rejectTrade', tradeId: stale.id };
  }

  switch (state.phase) {
    case 'roll': {
      if (!isTurn) return null;
      if (me.inJail && state.dice === null) {
        const early = ownedFraction(state) < 0.6;
        const opponentsBuilt = Object.values(state.properties).some((ps) => ps.owner && ps.owner !== playerId && ps.houses > 0);
        const wantOut = early || !opponentsBuilt;
        if (wantOut) {
          if (legal.has('useJailCard')) return { type: 'useJailCard' };
          const reserve = cashReserve(state, playerId, opts);
          if (legal.has('payJailFine') && me.cash >= state.config.jailFine + reserve * 0.5) return { type: 'payJailFine' };
        }
      }
      return legal.has('roll') ? { type: 'roll' } : null;
    }
    case 'buy': {
      if (!isTurn || state.pendingSpace === null) return null;
      const idx = state.pendingSpace;
      const price = state.board[idx].price ?? 0;
      const value = propertyValueFor(state, playerId, idx, opts) * (1 + pr.noise * (2 * random() - 1));
      const spare = me.cash - price;
      const reserve = cashReserve(state, playerId, opts);
      const want = (value >= price * 0.8 && spare >= reserve)
        || (value >= price * 1.5 && spare >= reserve * 0.4)
        || (value >= price * 2 && spare >= 0);
      if (legal.has('buy') && want) return { type: 'buy' };
      return legal.has('decline') ? { type: 'decline' } : null;
    }
    case 'auction': {
      const a = state.auction;
      if (!a || a.current !== playerId) return null;
      if (a.highBidder === playerId) return legal.has('passAuction') ? { type: 'passAuction' } : null; // never bid against myself
      if (!legal.has('bid')) return legal.has('passAuction') ? { type: 'passAuction' } : null;
      const price = state.board[a.space].price ?? 0;
      if (a.highBid > 0 && pr.quitEarly > 0 && random() < pr.quitEarly) return { type: 'passAuction' };
      const ceiling = Math.floor(auctionCeiling(state, me, a.space, pr, random, opts));
      const step = Math.max(1, Math.round(price * pr.auctionStep));
      let amount = a.highBid + step;
      if (amount > ceiling) amount = pr.creep ? ceiling : 0; // hard bots creep up to the exact price; others stop below it
      amount = Math.min(amount, me.cash);
      if (amount > a.highBid && Number.isInteger(amount)) return { type: 'bid', amount };
      return legal.has('passAuction') ? { type: 'passAuction' } : null;
    }
    case 'debt': {
      if (state.debt?.debtor !== playerId) return null;
      return debtAction(state, playerId, legal);
    }
    case 'action': {
      if (!isTurn) return null;
      const reserve = cashReserve(state, playerId, opts);
      const u = legal.has('unmortgage') ? bestUnmortgage(state, playerId, reserve) : null;
      if (u !== null && inFullSet(state, playerId, u)) return { type: 'unmortgage', space: u }; // unlocks building there
      if (legal.has('build') && (pr.buildProb >= 1 || random() < pr.buildProb)) {
        const b = bestBuild(state, playerId, reserve * pr.buildReserve + pr.buildSlack);
        if (b !== null) return { type: 'build', space: b };
      }
      if (u !== null) return { type: 'unmortgage', space: u };
      if (legal.has('proposeTrade') && !state.trades.some((t) => t.from === playerId) && random() < pr.proposeProb) {
        const t = proposeTrade(state, me, pr, random, reserve, opts);
        if (t) return t;
      }
      return legal.has('endTurn') ? { type: 'endTurn' } : null;
    }
    default:
      return null;
  }
}
