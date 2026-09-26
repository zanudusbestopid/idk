/**
 * Theme text layer: every user-visible word that names a piece of the game
 * (spaces, cards, buildings, the title) lives here so the game can be
 * rethemed without touching rules or art. Prices, rents and card effects are
 * never themed; only the words are.
 */
import type { ColorGroup, Space } from './types';
import { BOARD } from './board';
import { CHANCE_CARDS, CHEST_CARDS } from './cards';

export interface ThemeTerms {
  house: string;
  houses: string;
  hotel: string;
  hotels: string;
  /** 'Jail' / "Bowser's Dungeon" */
  jail: string;
  /** 'Just Visiting' */
  justVisiting: string;
  /** 'Go To Jail' / 'Captured by Bowser' */
  goToJail: string;
  /** 'Go' / 'Start' */
  go: string;
  /** 'Chance' / '? Block' */
  chance: string;
  /** 'Community Chest' / 'Toad House' */
  chest: string;
  /** 'Free Parking' / 'Coin Heaven' */
  freeParking: string;
  /** 'Railroad(s)' / 'Warp Pipe(s)' */
  railroad: string;
  railroads: string;
  /** 'Utility'/'Utilities' / 'Power-Up(s)' */
  utility: string;
  utilities: string;
  /** 'Title Deed' / 'Deed' */
  deed: string;
  /** 'Get Out of Jail Free card' / 'Warp Whistle' */
  jailCard: string;
  /** 'the Bank' */
  bank: string;
}

export interface Theme {
  id: string;
  /** document/window title: 'Paper Tycoon' / 'Super Mario Bros. Monopoly' */
  name: string;
  /** two-line logo: ['PAPER','TYCOON'] / ['SUPER MARIO','MONOPOLY'] */
  title: [string, string];
  /** single-player setup tagline */
  tagline: string;
  /** online home tagline */
  taglineOnline: string;
  currency: 'dollar' | 'coin';
  groupNames: Record<ColorGroup, string>;
  /** 40 names, index = space index */
  spaceNames: string[];
  /** 16 each, by card id */
  cardText: { chance: string[]; chest: string[] };
  terms: ThemeTerms;
}

export const CLASSIC: Theme = {
  id: 'classic',
  name: 'Paper Tycoon',
  title: ['PAPER', 'TYCOON'],
  tagline: 'Buy streets, build houses, bankrupt the computer. All out of paper.',
  taglineOnline: 'Buy streets, build houses, bankrupt your friends. All out of paper.',
  currency: 'dollar',
  groupNames: {
    brown: 'Brown',
    lightblue: 'Light Blue',
    pink: 'Pink',
    orange: 'Orange',
    red: 'Red',
    yellow: 'Yellow',
    green: 'Green',
    darkblue: 'Dark Blue',
  },
  spaceNames: BOARD.map((s) => s.name),
  cardText: {
    chance: CHANCE_CARDS.map((c) => c.text),
    chest: CHEST_CARDS.map((c) => c.text),
  },
  terms: {
    house: 'house',
    houses: 'houses',
    hotel: 'hotel',
    hotels: 'hotels',
    jail: 'Jail',
    justVisiting: 'Just Visiting',
    goToJail: 'Go To Jail',
    go: 'Go',
    chance: 'Chance',
    chest: 'Community Chest',
    freeParking: 'Free Parking',
    railroad: 'Railroad',
    railroads: 'Railroads',
    utility: 'Utility',
    utilities: 'Utilities',
    deed: 'Title Deed',
    jailCard: 'Get Out of Jail Free card',
    bank: 'the Bank',
  },
};

const MARIO_NEAREST_PIPE =
  'Advance to the nearest Warp Pipe. If unowned, you may buy it from the Bank. If owned, pay the owner twice the usual toll.';

export const MARIO: Theme = {
  id: 'mario',
  name: 'Super Mario Bros. Monopoly',
  title: ['SUPER MARIO', 'MONOPOLY'],
  tagline: "Buy the Mushroom Kingdom, build castles, bankrupt the computer. Let's-a go!",
  taglineOnline: "Buy the Mushroom Kingdom, build castles, bankrupt your friends. Let's-a go!",
  currency: 'coin',
  groupNames: {
    brown: 'Super Mario Bros.',
    lightblue: 'Super Mario Bros.',
    pink: 'The Lost Levels',
    orange: 'The Lost Levels',
    red: 'Super Mario Bros. 2',
    yellow: 'Super Mario Bros. 2',
    green: 'Super Mario Bros. 3',
    darkblue: 'Super Mario Bros. 3',
  },
  spaceNames: [
    'Start', // 0
    'Mushroom Plains', // 1
    'Toad House', // 2
    'Underground Caverns', // 3
    'Koopa Toll', // 4
    'Warp Pipe 1-2', // 5
    'Coral Sea', // 6
    '? Block', // 7
    'Treetop Bridges', // 8
    'Cloud Trail', // 9
    "Bowser's Dungeon / Just Visiting", // 10
    'Windy Meadows', // 11
    'Fire Flower', // 12
    'Poison Mushroom Grove', // 13
    'Springboard Ridge', // 14
    'Warp Pipe 4-2', // 15
    'Sunken Ruins', // 16
    'Toad House', // 17
    'Lost Isles', // 18
    'Fantasy World', // 19
    'Coin Heaven', // 20
    'Subcon Fields', // 21
    '? Block', // 22
    'Pyramid Sands', // 23
    'Waterfall Cliffs', // 24
    'Warp Vase', // 25
    'Frozen Whale Isle', // 26
    'Night Sky Vines', // 27
    'Starman', // 28
    "Wart's Palace", // 29
    'Captured by Bowser', // 30
    'Giant Land', // 31
    'Sky Land', // 32
    'Toad House', // 33
    'Pipe Land', // 34
    'Warp Whistle', // 35
    '? Block', // 36
    'Dark Land', // 37
    "Lakitu's Toll", // 38
    "Bowser's Castle", // 39
  ],
  cardText: {
    chance: [
      'Advance to Start. (Collect 200 coins)', // 0
      'Advance to Waterfall Cliffs. If you pass Start, collect 200 coins.', // 1
      'Advance to Windy Meadows. If you pass Start, collect 200 coins.', // 2
      'Advance to the nearest Power-Up. If unowned, you may buy it from the Bank. If owned, pay the owner ten times the amount shown on the dice.', // 3
      MARIO_NEAREST_PIPE, // 4
      MARIO_NEAREST_PIPE, // 5
      'You hit a coin block! Collect 50 coins.', // 6
      "Warp Whistle: escape Bowser's Dungeon for free. Keep this card until needed, or trade it.", // 7
      'A Lakitu blows you back 3 spaces.', // 8
      "Bowser captures you! Go directly to Bowser's Dungeon. Do not pass Start, do not collect 200 coins.", // 9
      'Repair your buildings after a Bob-omb raid: for each Mushroom House pay 25 coins, for each Castle pay 100 coins.', // 10
      'Pay the Goomba toll of 15 coins.', // 11
      'Take the Warp Pipe in World 1-2. If you pass Start, collect 200 coins.', // 12
      "Storm Bowser's Castle. Advance to Bowser's Castle.", // 13
      'You have been crowned ruler of the Mushroom Kingdom. Pay each player 50 coins for the celebration.', // 14
      'Your 1-Up bonus pays out. Collect 150 coins.', // 15
    ],
    chest: [
      'Advance to Start. (Collect 200 coins)', // 0
      'Toad miscounted your coins in your favor. Collect 200 coins.', // 1
      "Dr. Mario's fee. Pay 50 coins.", // 2
      'You sold a spare Fire Flower. Collect 50 coins.', // 3
      "Warp Whistle: escape Bowser's Dungeon for free. Keep this card until needed, or trade it.", // 4
      "Bowser captures you! Go directly to Bowser's Dungeon. Do not pass Start, do not collect 200 coins.", // 5
      'Thank you, Mario! Princess Toadstool rewards you with 100 coins.', // 6
      'Koopa toll refund. Collect 20 coins.', // 7
      'It is your birthday. Collect 10 coins from every player.', // 8
      'A Koopa shell knocks over a coin stash. Collect 100 coins.', // 9
      'Pay hospital fees of 100 coins after a Hammer Bro. ambush.', // 10
      "Pay 50 coins for Toad's plumbing lessons.", // 11
      "Receive 25 coins for fixing the kingdom's pipes.", // 12
      'You are assessed for kingdom repairs: 40 coins per Mushroom House, 115 coins per Castle.', // 13
      'You won second prize in the Mushroom Kingdom bake-off. Collect 10 coins.', // 14
      'You inherit 100 coins from a distant Toad.', // 15
    ],
  },
  terms: {
    house: 'Mushroom House',
    houses: 'Mushroom Houses',
    hotel: 'Castle',
    hotels: 'Castles',
    jail: "Bowser's Dungeon",
    justVisiting: 'Just Visiting',
    goToJail: 'Captured by Bowser',
    go: 'Start',
    chance: '? Block',
    chest: 'Toad House',
    freeParking: 'Coin Heaven',
    railroad: 'Warp Pipe',
    railroads: 'Warp Pipes',
    utility: 'Power-Up',
    utilities: 'Power-Ups',
    deed: 'Deed',
    jailCard: 'Warp Whistle',
    bank: 'the Bank',
  },
};

export const THEMES: Record<string, Theme> = { classic: CLASSIC, mario: MARIO };

/** BOARD with the theme's names (prices/rents unchanged). */
export function themedBoard(theme: Theme): Space[] {
  return BOARD.map((s, i) => ({ ...s, name: theme.spaceNames[i] ?? s.name }));
}
