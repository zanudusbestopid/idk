/**
 * Read-only helpers over a GameState. They never mutate and are safe for the
 * client to call for enabling buttons; the engine uses the same functions to
 * validate actions so the two can never disagree.
 */
import {
  GROUPS,
  RAILROADS,
  RAILROAD_RENTS,
  UTILITIES,
  UTILITY_MULTIPLIERS,
  mortgageValue,
} from '../shared/board';
import type { ColorGroup, GameState, Player, Space, Trade, TradeSide } from '../shared/types';

/** Result of a "can I do X?" query. `reason` explains a refusal. */
export interface Check {
  ok: boolean;
  reason?: string;
}

const OK: Check = { ok: true };
function no(reason: string): Check {
  return { ok: false, reason };
}

export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((p) => p.id === playerId);
}

/** Id of the player whose turn it is. */
export function currentPlayerId(state: GameState): string {
  return state.players[state.currentPlayer].id;
}

export function isCurrentPlayer(state: GameState, playerId: string): boolean {
  return currentPlayerId(state) === playerId;
}

/** Players still in the game, in turn order. */
export function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.bankrupt);
}

/** Space indexes owned by a player, ascending. */
export function ownedSpaces(state: GameState, playerId: string): number[] {
  return Object.keys(state.properties)
    .map(Number)
    .filter((i) => state.properties[i].owner === playerId)
    .sort((a, b) => a - b);
}

/** How many of the given spaces a player owns (mortgaged ones count). */
export function countOwned(state: GameState, playerId: string, spaces: readonly number[]): number {
  return spaces.filter((i) => state.properties[i]?.owner === playerId).length;
}

/** True when the player owns every street of the color group (mortgaged streets count). */
export function ownsFullGroup(state: GameState, playerId: string, group: ColorGroup): boolean {
  return GROUPS[group].every((i) => state.properties[i]?.owner === playerId);
}

/** True when any street of the color group has a house or hotel. */
export function groupHasBuildings(state: GameState, group: ColorGroup): boolean {
  return GROUPS[group].some((i) => (state.properties[i]?.houses ?? 0) > 0);
}

/** 10% interest charged when a mortgaged property is unmortgaged or changes hands. */
export function mortgageInterest(space: Space): number {
  return Math.ceil(mortgageValue(space) / 10);
}

/** Cost to lift a mortgage: the mortgage value plus 10% interest, rounded up. */
export function unmortgageCost(space: Space): number {
  return mortgageValue(space) + mortgageInterest(space);
}

/** Cash received when selling one building (or breaking a hotel into 4 houses): half the house cost. */
export function houseSaleValue(space: Space): number {
  return Math.floor((space.houseCost ?? 0) / 2);
}

/**
 * Rent due for landing on a space with the given dice total (used only for
 * utilities). 0 when the space is unowned, mortgaged or not rentable. Does not
 * apply card multipliers (nearest railroad 2x, nearest utility 10x).
 */
export function rentFor(state: GameState, spaceIndex: number, diceTotal: number): number {
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps || ps.owner === null || ps.mortgaged) return 0;
  switch (space.type) {
    case 'property': {
      const rent = space.rent ?? [];
      if (ps.houses > 0) return rent[ps.houses] ?? 0;
      const base = rent[0] ?? 0;
      return space.group && ownsFullGroup(state, ps.owner, space.group) ? base * 2 : base;
    }
    case 'railroad': {
      const n = countOwned(state, ps.owner, RAILROADS);
      return RAILROAD_RENTS[Math.min(Math.max(n, 1), 4) - 1];
    }
    case 'utility': {
      const n = countOwned(state, ps.owner, UTILITIES);
      return UTILITY_MULTIPLIERS[Math.min(Math.max(n, 1), 2) - 1] * diceTotal;
    }
    default:
      return 0;
  }
}

/**
 * Whether a player may build / sell / mortgage / unmortgage right now:
 * on their own turn in phases 'roll' and 'action', or as the debtor in 'debt'.
 */
export function canManageProperty(state: GameState, playerId: string): Check {
  const p = getPlayer(state, playerId);
  if (!p) return no('Unknown player');
  if (p.bankrupt) return no('You are out of the game');
  switch (state.phase) {
    case 'roll':
    case 'action':
      return isCurrentPlayer(state, playerId) ? OK : no('Not your turn');
    case 'debt':
      return state.debt?.debtor === playerId ? OK : no('Only the player in debt may manage property now');
    case 'buy':
      return no('Decide on the purchase first');
    case 'auction':
      return no('Not during an auction');
    default:
      return no('The game is over');
  }
}

export function canBuild(state: GameState, playerId: string, spaceIndex: number): Check {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const p = getPlayer(state, playerId)!;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no('Not a property');
  if (space.type !== 'property' || !space.group) return no('Only streets can be built on');
  if (ps.owner !== playerId) return no('You do not own this property');
  if (!ownsFullGroup(state, playerId, space.group)) return no('You must own the whole color group');
  const group = GROUPS[space.group];
  if (group.some((i) => state.properties[i].mortgaged)) return no('A property in this group is mortgaged');
  if (ps.houses >= 5) return no('There is already a hotel here');
  const min = Math.min(...group.map((i) => state.properties[i].houses));
  if (ps.houses > min) return no('Build evenly: add houses to the least-built streets first');
  if (ps.houses === 4) {
    if (state.hotelsLeft < 1) return no('The bank has no hotels left');
  } else if (state.housesLeft < 1) {
    return no('The bank has no houses left');
  }
  if (p.cash < (space.houseCost ?? 0)) return no('Not enough cash');
  return OK;
}

export function canSellHouse(state: GameState, playerId: string, spaceIndex: number): Check {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no('Not a property');
  if (space.type !== 'property' || !space.group) return no('Not a street');
  if (ps.owner !== playerId) return no('You do not own this property');
  if (ps.houses === 0) return no('Nothing to sell');
  const max = Math.max(...GROUPS[space.group].map((i) => state.properties[i].houses));
  if (ps.houses < max) return no('Sell evenly: sell from the most-built streets first');
  if (ps.houses === 5 && state.housesLeft < 4) return no('The bank lacks the 4 houses needed to break up the hotel');
  return OK;
}

export function canMortgage(state: GameState, playerId: string, spaceIndex: number): Check {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no('Not a property');
  if (ps.owner !== playerId) return no('You do not own this property');
  if (ps.mortgaged) return no('Already mortgaged');
  if (ps.houses > 0) return no('Sell the buildings first');
  if (space.group && groupHasBuildings(state, space.group)) return no('Sell all buildings in the color group first');
  return OK;
}

export function canUnmortgage(state: GameState, playerId: string, spaceIndex: number): Check {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const p = getPlayer(state, playerId)!;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no('Not a property');
  if (ps.owner !== playerId) return no('You do not own this property');
  if (!ps.mortgaged) return no('Not mortgaged');
  if (p.cash < unmortgageCost(space)) return no('Not enough cash');
  return OK;
}

/** cash + property prices (mortgaged at mortgage value) + building costs. */
export function netWorth(state: GameState, playerId: string): number {
  const p = getPlayer(state, playerId);
  if (!p) return 0;
  let total = p.cash;
  for (const i of ownedSpaces(state, playerId)) {
    const space = state.board[i];
    const ps = state.properties[i];
    total += ps.mortgaged ? mortgageValue(space) : (space.price ?? 0);
    total += ps.houses * (space.houseCost ?? 0);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Trades

/** Interest the receiver of these properties owes for the mortgaged ones. */
export function sideInterest(state: GameState, properties: readonly number[]): number {
  let total = 0;
  for (const i of properties) {
    if (state.properties[i]?.mortgaged) total += mortgageInterest(state.board[i]);
  }
  return total;
}

function sideIsEmpty(side: TradeSide): boolean {
  return side.cash === 0 && side.jailCards === 0 && side.properties.length === 0;
}

function validateSide(state: GameState, side: TradeSide, owner: Player): string | null {
  if (!side || typeof side !== 'object') return 'Malformed trade';
  if (!Number.isInteger(side.cash) || side.cash < 0) return 'Invalid cash amount';
  if (!Number.isInteger(side.jailCards) || side.jailCards < 0) return 'Invalid jail card count';
  if (side.jailCards > owner.jailCards) return `${owner.name} does not have ${side.jailCards} Get Out of Jail Free card(s)`;
  if (!Array.isArray(side.properties)) return 'Invalid property list';
  const seen = new Set<number>();
  for (const idx of side.properties) {
    if (!Number.isInteger(idx) || !(idx in state.properties)) return 'Invalid property';
    if (seen.has(idx)) return 'Duplicate property in trade';
    seen.add(idx);
    const space = state.board[idx];
    const ps = state.properties[idx];
    if (ps.owner !== owner.id) return `${owner.name} does not own ${space.name}`;
    if (ps.houses > 0) return `${space.name} has buildings`;
    if (space.group && groupHasBuildings(state, space.group)) return `The ${space.group} group has buildings`;
  }
  return null;
}

/**
 * Whether trading between two players is allowed in the current phase:
 * freely in 'roll', 'action' and 'buy'; in 'debt' only trades that involve the
 * debtor (so they can raise cash); never during an auction or after the game.
 */
export function canTradeNow(state: GameState, a: string, b: string): Check {
  switch (state.phase) {
    case 'roll':
    case 'action':
    case 'buy':
      return OK;
    case 'debt':
      return state.debt && (state.debt.debtor === a || state.debt.debtor === b)
        ? OK
        : no('Only trades involving the player in debt are allowed right now');
    case 'auction':
      return no('Not during an auction');
    default:
      return no('The game is over');
  }
}

/**
 * Validate a trade's contents. With `checkCash` both sides must also end up
 * with non-negative cash after the swap and the interest on mortgaged
 * properties they receive.
 */
export function validateTrade(
  state: GameState,
  t: { from: string; to: string; offer: TradeSide; request: TradeSide },
  checkCash: boolean,
): string | null {
  const from = getPlayer(state, t.from);
  const to = getPlayer(state, t.to);
  if (!from || from.bankrupt) return 'The proposer is not in the game';
  if (!to || to.bankrupt) return 'The other player is not in the game';
  if (from.id === to.id) return 'You cannot trade with yourself';
  const e1 = validateSide(state, t.offer, from);
  if (e1) return e1;
  const e2 = validateSide(state, t.request, to);
  if (e2) return e2;
  if (sideIsEmpty(t.offer) && sideIsEmpty(t.request)) return 'The trade is empty';
  if (checkCash) {
    const fromNet = from.cash - t.offer.cash + t.request.cash - sideInterest(state, t.request.properties);
    if (fromNet < 0) return `${from.name} cannot afford this trade`;
    const toNet = to.cash - t.request.cash + t.offer.cash - sideInterest(state, t.offer.properties);
    if (toNet < 0) return `${to.name} cannot afford this trade`;
  }
  return null;
}

/** May this player propose a trade to someone right now? */
export function canProposeTrade(state: GameState, playerId: string): Check {
  const p = getPlayer(state, playerId);
  if (!p) return no('Unknown player');
  if (p.bankrupt) return no('You are out of the game');
  if (state.phase === 'auction' || state.phase === 'ended') return canTradeNow(state, playerId, playerId);
  if (state.phase === 'debt') {
    // the debtor may propose to anyone; anyone may propose to the debtor
    if (!state.debt) return no('No debt');
    return getPlayer(state, state.debt.debtor)?.bankrupt ? no('No one to trade with') : OK;
  }
  return activePlayers(state).length > 1 ? OK : no('No one to trade with');
}

/** May this player accept the given open trade right now? */
export function canAcceptTrade(state: GameState, playerId: string, trade: Trade): Check {
  if (trade.to !== playerId) return no('Only the recipient can accept');
  const phase = canTradeNow(state, trade.from, trade.to);
  if (!phase.ok) return phase;
  const err = validateTrade(state, trade, true);
  return err ? no(err) : OK;
}

/** May this player reject (recipient) or cancel (proposer) the given open trade right now? */
export function canRejectTrade(state: GameState, playerId: string, trade: Trade): Check {
  if (trade.to !== playerId && trade.from !== playerId) return no('Not your trade');
  if (state.phase === 'ended') return no('The game is over');
  return OK;
}

/** Index of the next space in `candidates` clockwise from `position` (wrapping). */
export function nextSpaceOf(position: number, candidates: readonly number[]): number {
  const ahead = candidates.filter((i) => i > position);
  return ahead.length ? Math.min(...ahead) : Math.min(...candidates);
}
