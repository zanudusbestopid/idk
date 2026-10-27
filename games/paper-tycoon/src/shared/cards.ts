/**
 * The 16 classic Chance and 16 classic Community Chest cards. Card ids are
 * 0..15 within each deck; `GameState.chanceDeck` / `chestDeck` hold ids.
 */

export type CardEffect =
  /** Move forward to the given space, collecting salary if Go is passed. */
  | { kind: 'advance'; to: number }
  /** Move forward to the next railroad; if owned, pay twice the normal rent. */
  | { kind: 'nearestRailroad' }
  /** Move forward to the next utility; if owned, pay 10x the dice total. */
  | { kind: 'nearestUtility' }
  /** The bank pays the player. */
  | { kind: 'collect'; amount: number }
  /** The player pays the bank. */
  | { kind: 'pay'; amount: number }
  /** Every other player pays the player. */
  | { kind: 'collectFromEach'; amount: number }
  /** The player pays every other player. */
  | { kind: 'payEach'; amount: number }
  /** Move backwards without collecting salary. */
  | { kind: 'goBack'; spaces: number }
  /** Straight to jail. */
  | { kind: 'goToJail' }
  /** Keep the card; it leaves the deck until used. */
  | { kind: 'jailCard' }
  /** Pay the bank per house and per hotel owned. */
  | { kind: 'repairs'; perHouse: number; perHotel: number };

export interface Card {
  id: number;
  text: string;
  effect: CardEffect;
}

export const CHANCE_CARDS: Card[] = [
  { id: 0, text: 'Advance to Go. (Collect $200)', effect: { kind: 'advance', to: 0 } },
  { id: 1, text: 'Advance to Illinois Avenue. If you pass Go, collect $200.', effect: { kind: 'advance', to: 24 } },
  { id: 2, text: 'Advance to St. Charles Place. If you pass Go, collect $200.', effect: { kind: 'advance', to: 11 } },
  {
    id: 3,
    text: 'Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, pay the owner ten times the amount shown on the dice.',
    effect: { kind: 'nearestUtility' },
  },
  {
    id: 4,
    text: 'Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.',
    effect: { kind: 'nearestRailroad' },
  },
  {
    id: 5,
    text: 'Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.',
    effect: { kind: 'nearestRailroad' },
  },
  { id: 6, text: 'Bank pays you dividend of $50.', effect: { kind: 'collect', amount: 50 } },
  { id: 7, text: 'Get Out of Jail Free. This card may be kept until needed or traded.', effect: { kind: 'jailCard' } },
  { id: 8, text: 'Go Back 3 Spaces.', effect: { kind: 'goBack', spaces: 3 } },
  { id: 9, text: 'Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.', effect: { kind: 'goToJail' } },
  {
    id: 10,
    text: 'Make general repairs on all your property: for each house pay $25, for each hotel pay $100.',
    effect: { kind: 'repairs', perHouse: 25, perHotel: 100 },
  },
  { id: 11, text: 'Pay poor tax of $15.', effect: { kind: 'pay', amount: 15 } },
  { id: 12, text: 'Take a trip to Reading Railroad. If you pass Go, collect $200.', effect: { kind: 'advance', to: 5 } },
  { id: 13, text: 'Take a walk on the Boardwalk. Advance token to Boardwalk.', effect: { kind: 'advance', to: 39 } },
  { id: 14, text: 'You have been elected Chairman of the Board. Pay each player $50.', effect: { kind: 'payEach', amount: 50 } },
  { id: 15, text: 'Your building loan matures. Collect $150.', effect: { kind: 'collect', amount: 150 } },
];

export const CHEST_CARDS: Card[] = [
  { id: 0, text: 'Advance to Go. (Collect $200)', effect: { kind: 'advance', to: 0 } },
  { id: 1, text: 'Bank error in your favor. Collect $200.', effect: { kind: 'collect', amount: 200 } },
  { id: 2, text: "Doctor's fee. Pay $50.", effect: { kind: 'pay', amount: 50 } },
  { id: 3, text: 'From sale of stock you get $50.', effect: { kind: 'collect', amount: 50 } },
  { id: 4, text: 'Get Out of Jail Free. This card may be kept until needed or traded.', effect: { kind: 'jailCard' } },
  { id: 5, text: 'Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.', effect: { kind: 'goToJail' } },
  { id: 6, text: 'Holiday fund matures. Receive $100.', effect: { kind: 'collect', amount: 100 } },
  { id: 7, text: 'Income tax refund. Collect $20.', effect: { kind: 'collect', amount: 20 } },
  { id: 8, text: 'It is your birthday. Collect $10 from every player.', effect: { kind: 'collectFromEach', amount: 10 } },
  { id: 9, text: 'Life insurance matures. Collect $100.', effect: { kind: 'collect', amount: 100 } },
  { id: 10, text: 'Pay hospital fees of $100.', effect: { kind: 'pay', amount: 100 } },
  { id: 11, text: 'Pay school fees of $50.', effect: { kind: 'pay', amount: 50 } },
  { id: 12, text: 'Receive $25 consultancy fee.', effect: { kind: 'collect', amount: 25 } },
  {
    id: 13,
    text: 'You are assessed for street repairs: $40 per house, $115 per hotel.',
    effect: { kind: 'repairs', perHouse: 40, perHotel: 115 },
  },
  { id: 14, text: 'You have won second prize in a beauty contest. Collect $10.', effect: { kind: 'collect', amount: 10 } },
  { id: 15, text: 'You inherit $100.', effect: { kind: 'collect', amount: 100 } },
];

export const DECKS: Record<'chance' | 'chest', Card[]> = {
  chance: CHANCE_CARDS,
  chest: CHEST_CARDS,
};

/** Id of the Get Out of Jail Free card in each deck. */
export const JAIL_CARD_ID: Record<'chance' | 'chest', number> = {
  chance: CHANCE_CARDS.find((c) => c.effect.kind === 'jailCard')!.id,
  chest: CHEST_CARDS.find((c) => c.effect.kind === 'jailCard')!.id,
};
