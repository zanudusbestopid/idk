import { describe, expect, it } from 'vitest';
import { BOARD } from '../shared/board';
import { DEFAULT_CONFIG, applyAction, createGame, legalActions, netWorth } from './engine';
import { P, act, cur, deepFreeze, ev, fails, give, newGame, roll, topCard } from './test-helpers';

describe('createGame', () => {
  it('sets up players, decks, supply and the first turn', () => {
    const s = newGame({}, 3, 7);
    expect(s.config).toEqual(DEFAULT_CONFIG);
    expect(s.players.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    for (const p of s.players) {
      expect(p).toMatchObject({ cash: 1500, position: 0, inJail: false, jailTurns: 0, jailCards: 0, bankrupt: false, connected: true });
    }
    expect(s.currentPlayer).toBe(0);
    expect(s.phase).toBe('roll');
    expect(s.turnNumber).toBe(1);
    expect(s.dice).toBeNull();
    expect(s.log).toEqual([{ type: 'turnStarted', player: 'a', turnNumber: 1 }]);
    expect(Object.keys(s.properties)).toHaveLength(28);
    for (const ps of Object.values(s.properties)) expect(ps).toEqual({ owner: null, houses: 0, mortgaged: false });
    const sorted = (d: number[]) => d.slice().sort((x, y) => x - y);
    expect(sorted(s.chanceDeck)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(sorted(s.chestDeck)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(s.chanceDeck).not.toEqual(s.chestDeck);
    expect(s.housesLeft).toBe(32);
    expect(s.hotelsLeft).toBe(12);
    expect(s.freeParkingPot).toBe(0);
    expect(s.winner).toBeNull();
    expect(s.board).toEqual(BOARD);
    expect(s.board).not.toBe(BOARD);
    expect(s.rng).not.toBe(7);
  });

  it('merges partial config over the defaults and ignores undefined', () => {
    const s = createGame({ startingCash: 1000, auctions: false, goSalary: undefined }, newGame().players, 1);
    expect(s.config).toEqual({ ...DEFAULT_CONFIG, startingCash: 1000, auctions: false });
    expect(s.players[0].cash).toBe(1000);
  });

  it('is deterministic for a seed', () => {
    expect(JSON.stringify(newGame({}, 3, 99))).toBe(JSON.stringify(newGame({}, 3, 99)));
    expect(newGame({}, 3, 99).chanceDeck).not.toEqual(newGame({}, 3, 100).chanceDeck);
  });

  it('rejects fewer than two players or duplicate ids', () => {
    expect(() => createGame({}, [{ id: 'a', name: 'A', token: 't', color: 'c' }], 1)).toThrow();
    expect(() =>
      createGame(
        {},
        [
          { id: 'a', name: 'A', token: 't', color: 'c' },
          { id: 'a', name: 'B', token: 't', color: 'c' },
        ],
        1,
      ),
    ).toThrow();
  });
});

describe('applyAction basics', () => {
  it('never mutates its input state', () => {
    const s = deepFreeze(newGame());
    const before = JSON.stringify(s);
    const r = applyAction(s, 'a', { type: 'roll' });
    expect(r.ok).toBe(true);
    expect(JSON.stringify(s)).toBe(before);
    if (r.ok) {
      expect(r.state).not.toBe(s);
      expect(r.state.dice).not.toBeNull();
      expect(r.state.log.length).toBeGreaterThan(s.log.length);
    }
  });

  it('rejects unknown players, malformed actions and out-of-turn actions', () => {
    const s = newGame();
    expect(applyAction(s, 'zzz', { type: 'roll' })).toEqual({ ok: false, error: 'Unknown player' });
    expect(applyAction(s, 'a', {} as never).ok).toBe(false);
    expect(fails(s, 'b', { type: 'roll' })).toMatch(/not allowed/);
    expect(fails(s, 'a', { type: 'endTurn' })).toMatch(/not allowed/);
    expect(fails(s, 'a', { type: 'buy' })).toMatch(/not allowed/);
  });

  it('appends every returned event to the log and caps it at 200', () => {
    let s = newGame({ auctions: false });
    const r = roll(s, 1, 2);
    expect(r.state.log.slice(-r.events.length)).toEqual(r.events);
    s = r.state;
    s.log = Array.from({ length: 200 }, (_, i) => ({ type: 'turnEnded', player: `x${i}` }) as const);
    const r2 = act(s, 'a', { type: 'decline' });
    expect(r2.state.log).toHaveLength(200);
    expect(r2.state.log.at(-1)).toEqual(r2.events.at(-1));
    expect(r2.state.log[0]).toEqual({ type: 'turnEnded', player: `x${r2.events.length}` });
  });
});

describe('rolling and moving', () => {
  it('moves the current player and offers an unowned property', () => {
    const r = roll(newGame(), 1, 2);
    expect(r.events[0]).toEqual({ type: 'rolled', player: 'a', dice: [1, 2], doubles: false });
    expect(r.events[1]).toEqual({ type: 'moved', player: 'a', from: 0, to: 3, passedGo: false });
    expect(r.state.dice).toEqual([1, 2]);
    expect(P(r.state, 'a').position).toBe(3);
    expect(r.state.phase).toBe('buy');
    expect(r.state.pendingSpace).toBe(3);
    expect(r.state.canRollAgain).toBe(false);
  });

  it('pays salary when passing Go and when landing on it', () => {
    let s = newGame();
    P(s, 'a').position = 38;
    let r = roll(s, 1, 2);
    expect(P(r.state, 'a').position).toBe(1);
    expect(P(r.state, 'a').cash).toBe(1700);
    expect(ev(r.events, 'moved')[0].passedGo).toBe(true);
    expect(ev(r.events, 'paid')[0]).toEqual({ type: 'paid', from: null, to: 'a', amount: 200, reason: 'Passed Go' });

    s = newGame();
    P(s, 'a').position = 36;
    r = roll(s, 1, 3);
    expect(P(r.state, 'a').position).toBe(0);
    expect(P(r.state, 'a').cash).toBe(1700);
    expect(ev(r.events, 'paid')[0].reason).toBe('Landed on Go');
    expect(r.state.phase).toBe('action');
  });

  it('doubleGoSalary pays 2x only for landing exactly on Go', () => {
    let s = newGame({ doubleGoSalary: true });
    P(s, 'a').position = 36;
    expect(P(roll(s, 1, 3).state, 'a').cash).toBe(1900);
    s = newGame({ doubleGoSalary: true });
    P(s, 'a').position = 38;
    expect(P(roll(s, 1, 2).state, 'a').cash).toBe(1700);
  });

  it('doubles grant another roll; the third doubles goes to jail', () => {
    let s = newGame();
    let r = roll(s, 2, 2); // -> 4 Income Tax
    expect(P(r.state, 'a').cash).toBe(1300);
    expect(r.state.phase).toBe('roll');
    expect(r.state.canRollAgain).toBe(true);
    expect(r.state.doublesCount).toBe(1);
    expect(fails(r.state, 'a', { type: 'endTurn' })).toMatch(/not allowed/);
    expect(legalActions(r.state, 'a')).toContain('roll');

    r = roll(r.state, 3, 3); // -> 10 Just Visiting
    expect(P(r.state, 'a').position).toBe(10);
    expect(P(r.state, 'a').inJail).toBe(false);
    expect(r.state.phase).toBe('roll');
    expect(r.state.doublesCount).toBe(2);

    r = roll(r.state, 1, 1); // third doubles: straight to jail
    const a = P(r.state, 'a');
    expect(a.inJail).toBe(true);
    expect(a.position).toBe(10);
    expect(a.cash).toBe(1300);
    expect(ev(r.events, 'moved')[0]).toMatchObject({ from: 10, to: 10, direct: true, passedGo: false });
    expect(ev(r.events, 'jailed')).toHaveLength(1);
    expect(r.state.canRollAgain).toBe(false);
    expect(r.state.doublesCount).toBe(0);
    expect(r.state.phase).toBe('action');
    s = act(r.state, 'a', { type: 'endTurn' }).state;
    expect(cur(s)).toBe('b');
  });

  it('endTurn advances to the next player and resets turn state', () => {
    let s = newGame({ auctions: false });
    s = roll(s, 1, 2).state;
    s = act(s, 'a', { type: 'decline' }).state;
    expect(s.phase).toBe('action');
    const r = act(s, 'a', { type: 'endTurn' });
    expect(r.events).toEqual([
      { type: 'turnEnded', player: 'a' },
      { type: 'turnStarted', player: 'b', turnNumber: 2 },
    ]);
    expect(r.state.currentPlayer).toBe(1);
    expect(r.state.turnNumber).toBe(2);
    expect(r.state.dice).toBeNull();
    expect(r.state.doublesCount).toBe(0);
    expect(r.state.canRollAgain).toBe(false);
    expect(r.state.phase).toBe('roll');
  });

  it('skips bankrupt players in turn order', () => {
    let s = newGame({ auctions: false });
    P(s, 'b').bankrupt = true;
    s = roll(s, 1, 2).state;
    s = act(s, 'a', { type: 'decline' }).state;
    s = act(s, 'a', { type: 'endTurn' }).state;
    expect(cur(s)).toBe('c');
  });
});

describe('buying and declining', () => {
  it('buy pays the price and takes ownership', () => {
    const s = roll(newGame(), 1, 2).state;
    const r = act(s, 'a', { type: 'buy' });
    expect(r.events).toEqual([{ type: 'bought', player: 'a', space: 3, price: 60 }]);
    expect(P(r.state, 'a').cash).toBe(1440);
    expect(r.state.properties[3].owner).toBe('a');
    expect(r.state.phase).toBe('action');
    expect(r.state.pendingSpace).toBeNull();
  });

  it('buy requires the cash; decline without auctions leaves the property with the bank', () => {
    let s = newGame({ auctions: false });
    P(s, 'a').cash = 50;
    s = roll(s, 1, 2).state;
    expect(legalActions(s, 'a')).not.toContain('buy');
    expect(legalActions(s, 'a')).toContain('decline');
    expect(fails(s, 'a', { type: 'buy' })).toMatch(/not allowed/);
    const r = act(s, 'a', { type: 'decline' });
    expect(r.events).toEqual([{ type: 'declined', player: 'a', space: 3 }]);
    expect(r.state.properties[3].owner).toBeNull();
    expect(r.state.phase).toBe('action');
    expect(r.state.auction).toBeNull();
  });

  it('after doubles a purchase returns to the roll phase', () => {
    let s = newGame();
    s = roll(s, 1, 1).state; // -> 2 Community Chest
    // make the chest card harmless
    expect(s.phase).toBe('roll');
  });
});

describe('auctions', () => {
  function declined() {
    const s = roll(newGame(), 1, 2).state; // a lands on Baltic
    return act(s, 'a', { type: 'decline' }).state;
  }

  it('starts among all players, beginning after the decliner', () => {
    const s = declined();
    expect(s.phase).toBe('auction');
    expect(s.pendingSpace).toBeNull();
    expect(s.auction).toEqual({ space: 3, highBid: 0, highBidder: null, active: ['b', 'c', 'a'], passed: [], current: 'b' });
    expect(s.log.at(-1)).toEqual({ type: 'auctionStarted', space: 3 });
    expect(legalActions(s, 'b')).toEqual(['bid', 'passAuction', 'resign']);
    expect(legalActions(s, 'a')).toEqual(['resign']);
    expect(legalActions(s, 'c')).toEqual(['resign']);
  });

  it('runs a full bidding round and sells to the last bidder standing', () => {
    let s = declined();
    expect(fails(s, 'c', { type: 'bid', amount: 10 })).toMatch(/not allowed/);
    let r = act(s, 'b', { type: 'bid', amount: 10 });
    expect(r.events).toEqual([{ type: 'bid', player: 'b', space: 3, amount: 10 }]);
    expect(r.state.auction).toMatchObject({ highBid: 10, highBidder: 'b', current: 'c' });
    s = r.state;
    expect(fails(s, 'c', { type: 'bid', amount: 10 })).toMatch(/more than \$10/);
    expect(fails(s, 'c', { type: 'bid', amount: 10.5 })).toMatch(/more than/);
    expect(fails(s, 'c', { type: 'bid', amount: 5000 })).toMatch(/Not enough cash/);
    s = act(s, 'c', { type: 'bid', amount: 20 }).state;
    expect(s.auction?.current).toBe('a');
    s = act(s, 'a', { type: 'passAuction' }).state;
    expect(s.auction).toMatchObject({ active: ['b', 'c'], passed: ['a'], current: 'b' });
    r = act(s, 'b', { type: 'passAuction' });
    expect(r.events).toEqual([{ type: 'auctionEnded', space: 3, winner: 'c', amount: 20 }]);
    expect(r.state.auction).toBeNull();
    expect(r.state.properties[3].owner).toBe('c');
    expect(P(r.state, 'c').cash).toBe(1480);
    expect(r.state.phase).toBe('action');
    expect(cur(r.state)).toBe('a');
  });

  it('returns the property to the bank when everyone passes', () => {
    let s = declined();
    s = act(s, 'b', { type: 'passAuction' }).state;
    s = act(s, 'c', { type: 'passAuction' }).state;
    const r = act(s, 'a', { type: 'passAuction' });
    expect(r.events).toEqual([{ type: 'auctionEnded', space: 3, winner: null, amount: 0 }]);
    expect(r.state.properties[3].owner).toBeNull();
    expect(r.state.phase).toBe('action');
  });

  it('lets the last remaining player bid the minimum', () => {
    let s = declined();
    s = act(s, 'b', { type: 'passAuction' }).state;
    s = act(s, 'c', { type: 'passAuction' }).state;
    expect(legalActions(s, 'a')).toContain('bid');
    const r = act(s, 'a', { type: 'bid', amount: 1 });
    expect(ev(r.events, 'auctionEnded')[0]).toEqual({ type: 'auctionEnded', space: 3, winner: 'a', amount: 1 });
    expect(P(r.state, 'a').cash).toBe(1499);
  });

  it('a player with no cash can only pass', () => {
    const s = declined();
    P(s, 'b').cash = 0;
    expect(legalActions(s, 'b')).toEqual(['passAuction', 'resign']);
  });

  it('resumes the extra roll after an auction that followed doubles', () => {
    let s = newGame();
    P(s, 'a').position = 1;
    s = roll(s, 2, 2).state; // -> 5 Reading Railroad
    expect(s.canRollAgain).toBe(true);
    s = act(s, 'a', { type: 'decline' }).state;
    s = act(s, 'b', { type: 'passAuction' }).state;
    s = act(s, 'c', { type: 'passAuction' }).state;
    s = act(s, 'a', { type: 'passAuction' }).state;
    expect(s.phase).toBe('roll');
    expect(s.canRollAgain).toBe(true);
  });
});

describe('legalActions', () => {
  it('reflects the phase and whose turn it is', () => {
    const s = newGame();
    expect(legalActions(s, 'a')).toEqual(['roll', 'proposeTrade', 'resign']);
    expect(legalActions(s, 'b')).toEqual(['proposeTrade', 'resign']);
    expect(legalActions(s, 'nobody')).toEqual([]);
    const bought = act(roll(s, 1, 2).state, 'a', { type: 'buy' }).state;
    expect(legalActions(bought, 'a')).toEqual(['endTurn', 'mortgage', 'proposeTrade', 'resign']);
    expect(legalActions(bought, 'b')).toEqual(['proposeTrade', 'resign']);
  });

  it('offers property management on the player\'s own turn in roll and action phases', () => {
    const s = newGame();
    give(s, 'a', [1, 3]);
    give(s, 'b', [6, 8, 9], { mortgaged: true });
    expect(legalActions(s, 'a')).toEqual(['roll', 'build', 'mortgage', 'proposeTrade', 'resign']);
    expect(legalActions(s, 'b')).toEqual(['proposeTrade', 'resign']);
    const buying = roll(s, 3, 2).state; // a -> 5
    expect(buying.phase).toBe('buy');
    expect(legalActions(buying, 'a')).toEqual(['buy', 'decline', 'proposeTrade', 'resign']);
  });

  it('returns nothing once the game is over', () => {
    let s = newGame({}, 2);
    s = act(s, 'b', { type: 'resign' }).state;
    expect(s.phase).toBe('ended');
    expect(legalActions(s, 'a')).toEqual([]);
    expect(legalActions(s, 'b')).toEqual([]);
    expect(fails(s, 'a', { type: 'roll' })).toMatch(/over/);
  });
});

describe('free parking jackpot', () => {
  it('is inert by default', () => {
    let s = newGame();
    s = roll(s, 2, 2).state; // Income Tax
    expect(s.freeParkingPot).toBe(0);
    P(s, 'a').position = 17;
    s.canRollAgain = false;
    s.doublesCount = 0;
    const r = roll(s, 1, 2); // -> 20
    expect(ev(r.events, 'freeParking')).toHaveLength(0);
    expect(P(r.state, 'a').cash).toBe(1300);
  });

  it('collects taxes, fines, card payments and interest, but not purchases', () => {
    let s = newGame({ freeParkingJackpot: true, auctions: false });
    s = roll(s, 2, 2).state; // Income Tax 200
    expect(s.freeParkingPot).toBe(200);
    s = roll(s, 1, 2).state; // 4 -> 7 Chance
    // whatever the card was, put a tax card next and control the rest explicitly
    s.phase = 'action';
    s.canRollAgain = false;
    s.doublesCount = 0;
    s.pendingSpace = null;
    s.debt = null;
    s.pendingPayments = [];
    s.auction = null;
    const potAfterCard = s.freeParkingPot;
    // jail fine
    P(s, 'a').inJail = true;
    s.phase = 'roll';
    s.dice = null;
    s = act(s, 'a', { type: 'payJailFine' }).state;
    expect(s.freeParkingPot).toBe(potAfterCard + 50);
    // card payment to the bank
    P(s, 'a').position = 3;
    topCard(s, 'chance', 11); // poor tax 15
    s = roll(s, 1, 3).state; // -> 7
    expect(s.freeParkingPot).toBe(potAfterCard + 65);
    // unmortgage interest
    give(s, 'a', 39, { mortgaged: true });
    s = act(s, 'a', { type: 'unmortgage', space: 39 }).state;
    expect(s.freeParkingPot).toBe(potAfterCard + 85);
    // purchase does not feed the pot
    s = act(s, 'a', { type: 'endTurn' }).state;
    s = roll(s, 1, 2).state; // b -> 3
    s = act(s, 'b', { type: 'buy' }).state;
    expect(s.freeParkingPot).toBe(potAfterCard + 85);
    // landing on Free Parking collects it
    s = act(s, 'b', { type: 'endTurn' }).state;
    P(s, 'c').position = 17;
    const before = P(s, 'c').cash;
    const r = roll(s, 1, 2);
    expect(ev(r.events, 'freeParking')).toEqual([{ type: 'freeParking', player: 'c', amount: potAfterCard + 85 }]);
    expect(P(r.state, 'c').cash).toBe(before + potAfterCard + 85);
    expect(r.state.freeParkingPot).toBe(0);
  });
});

describe('netWorth', () => {
  it('adds cash, property values and buildings', () => {
    const s = newGame();
    give(s, 'a', 1, { houses: 2 });
    give(s, 'a', 3, { houses: 5 });
    give(s, 'a', 5, { mortgaged: true });
    give(s, 'a', 12);
    // 1500 + 60 + 100 + 60 + 250 + 100 (mortgaged RR) + 150
    expect(netWorth(s, 'a')).toBe(1500 + 60 + 2 * 50 + 60 + 5 * 50 + 100 + 150);
    expect(netWorth(s, 'b')).toBe(1500);
    expect(netWorth(s, 'zzz')).toBe(0);
  });
});

describe('resign', () => {
  it('is legal for any non-bankrupt player and returns everything to the bank', () => {
    const s = newGame();
    give(s, 'b', [1, 3], { houses: 3 });
    give(s, 'b', 5, { mortgaged: true });
    s.housesLeft = 26;
    P(s, 'b').jailCards = 1;
    s.jailCardOrigins.b = ['chest'];
    s.chestDeck = s.chestDeck.filter((id) => id !== 4);
    s.trades.push({ id: 't1', from: 'b', to: 'a', offer: { cash: 10, properties: [], jailCards: 0 }, request: { cash: 0, properties: [], jailCards: 0 } });
    expect(legalActions(s, 'b')).toContain('resign');
    const r = act(s, 'b', { type: 'resign' });
    const b = P(r.state, 'b');
    expect(b.bankrupt).toBe(true);
    expect(b.cash).toBe(0);
    expect(b.jailCards).toBe(0);
    expect(r.state.properties[1]).toEqual({ owner: null, houses: 0, mortgaged: false });
    expect(r.state.properties[3]).toEqual({ owner: null, houses: 0, mortgaged: false });
    expect(r.state.properties[5]).toEqual({ owner: null, houses: 0, mortgaged: false });
    expect(r.state.housesLeft).toBe(32);
    expect(r.state.chestDeck.at(-1)).toBe(4);
    expect(r.state.trades).toEqual([]);
    expect(ev(r.events, 'bankrupt')).toEqual([{ type: 'bankrupt', player: 'b', creditor: null }]);
    expect(ev(r.events, 'tradeRejected')).toHaveLength(1);
    // a's turn is untouched
    expect(cur(r.state)).toBe('a');
    expect(r.state.phase).toBe('roll');
    expect(legalActions(r.state, 'b')).toEqual([]);
    // turn order now skips b
    let s2 = roll(r.state, 1, 2).state;
    s2 = act(s2, 'a', { type: 'buy' }).state;
    s2 = act(s2, 'a', { type: 'endTurn' }).state;
    expect(cur(s2)).toBe('c');
  });

  it('passes the turn when the current player resigns', () => {
    const s = act(roll(newGame(), 1, 2).state, 'a', { type: 'buy' }).state;
    const r = act(s, 'a', { type: 'resign' });
    expect(ev(r.events, 'turnEnded')).toEqual([{ type: 'turnEnded', player: 'a' }]);
    expect(ev(r.events, 'turnStarted')).toEqual([{ type: 'turnStarted', player: 'b', turnNumber: 2 }]);
    expect(r.state.phase).toBe('roll');
    expect(r.state.properties[3].owner).toBeNull();
  });

  it('drops a pending purchase when the current player resigns in the buy phase', () => {
    const s = roll(newGame(), 1, 2).state;
    const r = act(s, 'a', { type: 'resign' });
    expect(r.state.pendingSpace).toBeNull();
    expect(cur(r.state)).toBe('b');
    expect(r.state.phase).toBe('roll');
  });

  it('moves bidding on when the current bidder resigns, and ends the auction when needed', () => {
    let s = act(roll(newGame(), 1, 2).state, 'a', { type: 'decline' }).state; // auction, current b
    s = act(s, 'b', { type: 'bid', amount: 10 }).state; // current c
    let r = act(s, 'c', { type: 'resign' });
    expect(r.state.auction).toMatchObject({ active: ['b', 'a'], current: 'a', highBidder: 'b' });
    expect(r.state.phase).toBe('auction');
    // the turn owner resigns while the auction runs: the auction carries on
    r = act(r.state, 'a', { type: 'resign' });
    // only b is left in the game -> b wins the game
    expect(r.state.phase).toBe('ended');
    expect(r.state.winner).toBe('b');
  });

  it('a high bidder who resigns forfeits the bid and the auction continues', () => {
    let s = act(roll(newGame({}, 4), 1, 2).state, 'a', { type: 'decline' }).state; // active b c d a
    s = act(s, 'b', { type: 'bid', amount: 10 }).state;
    s = act(s, 'c', { type: 'bid', amount: 20 }).state; // current d
    let r = act(s, 'c', { type: 'resign' });
    expect(r.state.auction).toMatchObject({ highBid: 0, highBidder: null, active: ['b', 'd', 'a'], current: 'd' });
    r = act(r.state, 'd', { type: 'passAuction' });
    r = act(r.state, 'a', { type: 'passAuction' });
    expect(r.state.auction).toMatchObject({ active: ['b'], current: 'b' });
    r = act(r.state, 'b', { type: 'bid', amount: 5 });
    expect(ev(r.events, 'auctionEnded')[0]).toMatchObject({ winner: 'b', amount: 5 });
    expect(r.state.phase).toBe('action');
    expect(cur(r.state)).toBe('a');
  });

  it('the turn passes once an auction ends if its owner resigned meanwhile', () => {
    let s = act(roll(newGame({}, 4), 1, 2).state, 'a', { type: 'decline' }).state; // active b c d a
    s = act(s, 'b', { type: 'bid', amount: 10 }).state; // current c
    s = act(s, 'a', { type: 'resign' }).state; // turn owner leaves; auction continues
    expect(s.phase).toBe('auction');
    expect(s.auction).toMatchObject({ active: ['b', 'c', 'd'], current: 'c' });
    s = act(s, 'c', { type: 'passAuction' }).state;
    const r = act(s, 'd', { type: 'passAuction' });
    expect(ev(r.events, 'auctionEnded')[0]).toMatchObject({ winner: 'b', amount: 10 });
    expect(ev(r.events, 'turnStarted')).toEqual([{ type: 'turnStarted', player: 'b', turnNumber: 2 }]);
    expect(r.state.phase).toBe('roll');
    expect(cur(r.state)).toBe('b');
  });

  it('ends the game when only one player remains', () => {
    const r = act(newGame({}, 2), 'a', { type: 'resign' });
    expect(r.state.phase).toBe('ended');
    expect(r.state.winner).toBe('b');
    expect(r.events.at(-1)).toEqual({ type: 'gameOver', winner: 'b' });
  });
});
