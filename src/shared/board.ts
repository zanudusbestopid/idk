/**
 * The classic 40-space US-edition board with standard modern prices, rents,
 * house costs and tax amounts. Index 0 is Go; indexes increase clockwise.
 */
import type { ColorGroup, Space } from './types';

function property(
  index: number,
  name: string,
  group: ColorGroup,
  price: number,
  rent: number[],
  houseCost: number,
): Space {
  return { index, type: 'property', name, group, price, rent, houseCost };
}

function railroad(index: number, name: string): Space {
  return { index, type: 'railroad', name, price: 200 };
}

function utility(index: number, name: string): Space {
  return { index, type: 'utility', name, price: 150 };
}

export const BOARD: Space[] = [
  { index: 0, type: 'go', name: 'Go' },
  property(1, 'Mediterranean Avenue', 'brown', 60, [2, 10, 30, 90, 160, 250], 50),
  { index: 2, type: 'chest', name: 'Community Chest' },
  property(3, 'Baltic Avenue', 'brown', 60, [4, 20, 60, 180, 320, 450], 50),
  { index: 4, type: 'tax', name: 'Income Tax', amount: 200 },
  railroad(5, 'Reading Railroad'),
  property(6, 'Oriental Avenue', 'lightblue', 100, [6, 30, 90, 270, 400, 550], 50),
  { index: 7, type: 'chance', name: 'Chance' },
  property(8, 'Vermont Avenue', 'lightblue', 100, [6, 30, 90, 270, 400, 550], 50),
  property(9, 'Connecticut Avenue', 'lightblue', 120, [8, 40, 100, 300, 450, 600], 50),
  { index: 10, type: 'jail', name: 'Jail / Just Visiting' },
  property(11, 'St. Charles Place', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  utility(12, 'Electric Company'),
  property(13, 'States Avenue', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  property(14, 'Virginia Avenue', 'pink', 160, [12, 60, 180, 500, 700, 900], 100),
  railroad(15, 'Pennsylvania Railroad'),
  property(16, 'St. James Place', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  { index: 17, type: 'chest', name: 'Community Chest' },
  property(18, 'Tennessee Avenue', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  property(19, 'New York Avenue', 'orange', 200, [16, 80, 220, 600, 800, 1000], 100),
  { index: 20, type: 'freeparking', name: 'Free Parking' },
  property(21, 'Kentucky Avenue', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  { index: 22, type: 'chance', name: 'Chance' },
  property(23, 'Indiana Avenue', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  property(24, 'Illinois Avenue', 'red', 240, [20, 100, 300, 750, 925, 1100], 150),
  railroad(25, 'B&O Railroad'),
  property(26, 'Atlantic Avenue', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  property(27, 'Ventnor Avenue', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  utility(28, 'Water Works'),
  property(29, 'Marvin Gardens', 'yellow', 280, [24, 120, 360, 850, 1025, 1200], 150),
  { index: 30, type: 'gotojail', name: 'Go To Jail' },
  property(31, 'Pacific Avenue', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  property(32, 'North Carolina Avenue', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  { index: 33, type: 'chest', name: 'Community Chest' },
  property(34, 'Pennsylvania Avenue', 'green', 320, [28, 150, 450, 1000, 1200, 1400], 200),
  railroad(35, 'Short Line'),
  { index: 36, type: 'chance', name: 'Chance' },
  property(37, 'Park Place', 'darkblue', 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { index: 38, type: 'tax', name: 'Luxury Tax', amount: 100 },
  property(39, 'Boardwalk', 'darkblue', 400, [50, 200, 600, 1400, 1700, 2000], 200),
];

/** Space indexes per color group, in board order. */
export const GROUPS: Record<ColorGroup, number[]> = {
  brown: [1, 3],
  lightblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  darkblue: [37, 39],
};

export const RAILROADS: number[] = [5, 15, 25, 35];
export const UTILITIES: number[] = [12, 28];

/** Index of the Go space. */
export const GO_INDEX = 0;
/** Index of the Jail / Just Visiting space (where jailed tokens sit). */
export const JAIL_INDEX = 10;

/** Rent for railroads by number of railroads owned (1..4). */
export const RAILROAD_RENTS = [25, 50, 100, 200];
/** Dice multipliers for utility rent by number of utilities owned (1..2). */
export const UTILITY_MULTIPLIERS = [4, 10];

/** Space types that can be owned by a player. */
export function isOwnable(space: Space): boolean {
  return space.type === 'property' || space.type === 'railroad' || space.type === 'utility';
}

/** Value received when mortgaging a space (half its price). */
export function mortgageValue(space: Space): number {
  return Math.floor((space.price ?? 0) / 2);
}
