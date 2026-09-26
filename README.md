# Paper Tycoon

A property-trading board game in a paper-craft art style: a paper board on a wooden table in 3D,
with flat paper-cutout tokens that hop and flip like a paper diorama. The camera follows whoever is
on turn, watches the dice being thrown (a real rigid-body simulation whose result matches the roll),
and tracks the token to its landing space. Drag to look around freely, use Follow / Overview / Top,
or switch to the flat 2D board with the button in the log panel. Two ways to play:

- **Single player** against 1 to 5 computer opponents: open `release/paper-tycoon-solo.html`
  in any browser. Nothing to install. Your game is saved in the browser so you can resume later.
- **Online** for 2 to 8 friends: one person runs `release/paper-tycoon.js` with Node,
  everyone else joins from a browser. No accounts, no install for players.

## Single player

Download `release/paper-tycoon-solo.html` and double-click it. The title screen is the live 3D board
with a slow cinematic camera; the tokens you pick appear on it, and Start flies the camera into the
game. Pick your token, choose how many
computer players you face and their skill (Easy, Normal, Hard), set the house rules, and start.
The computer players plan color sets, keep a cash reserve sized to the rents ahead of them,
bid in auctions up to what a street is worth to them (and to block your sets), build three
houses a street before going higher, raise cash sensibly when they owe money, and propose
trades that complete sets. Press Esc in a game for the pause menu: sound, animation speed,
camera mode, a recap of the house rules, and quit.

## Online

### Run it (the host)

You need [Node.js](https://nodejs.org) 18 or newer. The whole game is one file:
`release/paper-tycoon.js` (server and client bundled together). Download it, then:

```
node paper-tycoon.js
```

It prints the addresses to share:

- `http://localhost:3000` for you
- `http://<your LAN IP>:3000` for friends on the same Wi-Fi
- For friends over the internet, either forward TCP port 3000 on your router, or run a tunnel
  such as `ngrok http 3000`, playit.gg, or Tailscale, and share the address it gives you.

Set a different port with `PORT=8080 node paper-tycoon.js`.

Create a room, send the 4-letter code (or the invite link), and start when everyone is in.

## Rules (both modes)

Classic rules by default: auctions when a player declines to buy, even-build rule, mortgages,
trades, three ways out of jail, bankruptcy to a player or the bank, and the full 16 + 16 card decks.
The host can toggle house rules in the lobby: Free Parking jackpot, double salary on Go,
starting cash, jail fine, and a turn timer. Players who disconnect are auto-played after
45 seconds and can rejoin from the same browser at any time.

## Development

```
npm install
npm test          # rules engine tests
npm run typecheck
npm run build     # dist/paper-tycoon.js (server + client), dist/paper-tycoon-solo.html (single player)
npm run e2e       # three headless browsers play 120 turns against the built server
node scripts/server-test.mjs   # raw WebSocket checks: rejoin, auto-play, kick, restart
node scripts/solo-test.mjs 40  # single-player smoke test against the computer players
npm start         # build and run
```

- `src/engine` – pure, deterministic rules engine (no dependencies)
- `src/shared` – board data, cards, types, wire protocol
- `src/server` – Node WebSocket server: rooms, lobby, reconnects, turn timer
- `src/client` – browser client: 3D board and camera director (Three.js, `ui/board3d.ts`), dice physics (cannon-es, `ui/dicephysics.ts`), flat board, dialogs, paper-craft SVG art
- `src/engine/bot.ts` – the computer player
- `src/client/single.ts` + `local.ts` – single-player entry point and in-browser game loop
