/**
 * Shared type contract for Paper Tycoon (a Monopoly-style board game).
 *
 * These types are used by the engine (pure rules), the server (transport,
 * timers, connection state) and the client (rendering). The engine never
 * imports anything outside src/shared and src/engine.
 */

export type SpaceType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'chest'
  | 'jail'
  | 'freeparking'
  | 'gotojail';

export type ColorGroup =
  | 'brown'
  | 'lightblue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'darkblue';

export interface Space {
  /** 0..39, 0 = Go, clockwise */
  index: number;
  type: SpaceType;
  name: string;
  /** property / railroad / utility */
  price?: number;
  /** property only */
  group?: ColorGroup;
  /** property only: [base, 1 house, 2, 3, 4, hotel] */
  rent?: number[];
  /** property only */
  houseCost?: number;
  /** tax only */
  amount?: number;
}

export interface GameConfig {
  /** default 1500 */
  startingCash: number;
  /** default 200 */
  goSalary: number;
  /** default true: a declined property is auctioned */
  auctions: boolean;
  /**
   * default false: taxes/fees paid to the bank go to the pot;
   * landing on Free Parking collects it
   */
  freeParkingJackpot: boolean;
  /** default false: landing exactly on Go pays 2x salary */
  doubleGoSalary: boolean;
  /** default 50 */
  jailFine: number;
  /** default 3 */
  maxJailTurns: number;
  /** default null; enforced by the server, ignored by the engine */
  turnTimerSeconds: number | null;
}

export interface Player {
  id: string;
  name: string;
  /** token id chosen in the lobby */
  token: string;
  /** css color */
  color: string;
  cash: number;
  /** 0..39 */
  position: number;
  inJail: boolean;
  /** failed roll attempts while in jail this stay */
  jailTurns: number;
  /** Get Out of Jail Free cards held */
  jailCards: number;
  bankrupt: boolean;
  /** server-managed; the engine never changes it */
  connected: boolean;
}

export interface PropertyState {
  owner: string | null;
  /** 0..4, 5 = hotel */
  houses: number;
  mortgaged: boolean;
}

export type TurnPhase =
  /** current player must roll (may pay fine / use card first if in jail) */
  | 'roll'
  /** landed on unowned property: buy or decline (state.pendingSpace set) */
  | 'buy'
  /** auction in progress (state.auction set) */
  | 'auction'
  /** a player owes more than they have (state.debt set): they raise cash or go bankrupt */
  | 'debt'
  /** landing resolved; current player may build/mortgage/trade, then end turn (or roll again if canRollAgain) */
  | 'action'
  | 'ended';

export interface Auction {
  space: number;
  highBid: number;
  highBidder: string | null;
  /**
   * player ids still in the auction, in turn order (cyclic, starting with the
   * player after the one who declined the property)
   */
  active: string[];
  passed: string[];
  /** id of the player whose bid it is right now (always a member of `active`) */
  current: string;
}

export interface Debt {
  debtor: string;
  /** null = bank */
  creditor: string | null;
  amount: number;
  reason: string;
  /**
   * Set when the payment is a tax/fee that feeds the Free Parking pot while
   * `config.freeParkingJackpot` is on (bank creditor only).
   */
  toPot?: boolean;
}

export interface TradeSide {
  cash: number;
  properties: number[];
  jailCards: number;
}

export interface Trade {
  id: string;
  from: string;
  to: string;
  offer: TradeSide;
  request: TradeSide;
}

/**
 * A payment still owed as part of a multi-payment card effect (e.g. "pay each
 * player $50"). Stored in `GameState.pendingPayments` so that a debt raised by
 * one payment can be resolved before the remaining payments are processed.
 */
export interface PendingPayment {
  from: string;
  /** null = bank */
  to: string | null;
  amount: number;
  reason: string;
  /** see Debt.toPot */
  toPot?: boolean;
}

/**
 * Turn context saved while `phase === 'debt'` so the interrupted roll can
 * resume once the debt is settled. A debt can only arise while a roll is being
 * resolved, so the phase to return to is always derived from `canRollAgain`
 * ('roll' if an extra roll is owed, else 'action'); what needs remembering is
 * the movement still owed after a forced jail fine.
 */
export interface DebtResume {
  /**
   * Forced jail fine (third failed roll): once the fine debt is settled the
   * freed player still moves this many spaces and resolves that landing.
   */
  moveBy: number | null;
}

export interface GameState {
  config: GameConfig;
  /** the 40 spaces (copy of BOARD so clients need no import) */
  board: Space[];
  /** in turn order */
  players: Player[];
  /** index into players */
  currentPlayer: number;
  phase: TurnPhase;
  /** last roll this turn */
  dice: [number, number] | null;
  /** consecutive doubles this turn */
  doublesCount: number;
  /** true after doubles until the extra roll is taken */
  canRollAgain: boolean;
  /** space awaiting a buy/decline decision */
  pendingSpace: number | null;
  /** keyed by space index, only ownable spaces */
  properties: Record<number, PropertyState>;
  auction: Auction | null;
  debt: Debt | null;
  /** open trade offers */
  trades: Trade[];
  /** card ids, index 0 = top; a held jail card is absent from the deck */
  chanceDeck: number[];
  chestDeck: number[];
  /** bank supply, starts 32 */
  housesLeft: number;
  /** starts 12 */
  hotelsLeft: number;
  freeParkingPot: number;
  turnNumber: number;
  /** mulberry32 state */
  rng: number;
  winner: string | null;
  /** most recent events, capped at 200 */
  log: GameEvent[];

  // ---- Added by the engine (beyond the base contract) ----

  /**
   * Payments still to be made after the current debt is resolved (multi-payment
   * cards). Processed in order; empty when nothing is outstanding.
   */
  pendingPayments: PendingPayment[];
  /** Turn context to restore after the current debt is resolved; null when not in debt. */
  debtResume: DebtResume | null;
  /**
   * Which deck each held Get Out of Jail Free card came from, per player id,
   * in the order they were acquired. When a card is used or returned it goes to
   * the bottom of its original deck.
   */
  jailCardOrigins: Record<string, ('chance' | 'chest')[]>;
  /** Monotonic counter used to generate trade ids deterministically. */
  nextTradeId: number;
}

export type Action =
  | { type: 'roll' }
  | { type: 'buy' }
  | { type: 'decline' }
  | { type: 'bid'; amount: number }
  | { type: 'passAuction' }
  | { type: 'build'; space: number }
  | { type: 'sellHouse'; space: number }
  | { type: 'mortgage'; space: number }
  | { type: 'unmortgage'; space: number }
  | { type: 'payJailFine' }
  | { type: 'useJailCard' }
  | { type: 'proposeTrade'; to: string; offer: TradeSide; request: TradeSide }
  | { type: 'acceptTrade'; tradeId: string }
  /** proposer uses this to cancel */
  | { type: 'rejectTrade'; tradeId: string }
  | { type: 'payDebt' }
  | { type: 'declareBankruptcy' }
  | { type: 'endTurn' }
  /**
   * Leave the game: bankruptcy to the bank (properties become unowned, jail
   * cards return to their decks, any debt involving the player is cleared).
   * Legal for any non-bankrupt player whenever the game is not over.
   */
  | { type: 'resign' };

export type GameEvent =
  | { type: 'rolled'; player: string; dice: [number, number]; doubles: boolean }
  /**
   * direct = teleport (jail), no walking animation;
   * backwards = walked counter-clockwise ("Go Back 3 Spaces")
   */
  | { type: 'moved'; player: string; from: number; to: number; passedGo: boolean; direct?: boolean; backwards?: boolean }
  /** null = bank */
  | { type: 'paid'; from: string | null; to: string | null; amount: number; reason: string }
  | { type: 'bought'; player: string; space: number; price: number }
  | { type: 'declined'; player: string; space: number }
  | { type: 'auctionStarted'; space: number }
  | { type: 'bid'; player: string; space: number; amount: number }
  | { type: 'auctionEnded'; space: number; winner: string | null; amount: number }
  | { type: 'card'; player: string; deck: 'chance' | 'chest'; cardId: number; text: string }
  | { type: 'built'; player: string; space: number; houses: number }
  | { type: 'soldHouse'; player: string; space: number; houses: number }
  | { type: 'mortgaged'; player: string; space: number }
  | { type: 'unmortgaged'; player: string; space: number }
  | { type: 'jailed'; player: string; reason: string }
  | { type: 'freed'; player: string; how: 'doubles' | 'fine' | 'card' | 'forced' }
  | { type: 'tradeProposed'; trade: Trade }
  | { type: 'tradeAccepted'; trade: Trade }
  | { type: 'tradeRejected'; trade: Trade }
  | { type: 'debt'; player: string; creditor: string | null; amount: number }
  | { type: 'bankrupt'; player: string; creditor: string | null }
  | { type: 'freeParking'; player: string; amount: number }
  | { type: 'turnStarted'; player: string; turnNumber: number }
  | { type: 'turnEnded'; player: string }
  | { type: 'gameOver'; winner: string };
