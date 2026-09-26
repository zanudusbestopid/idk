# Paper Tycoon

An online property-trading board game in a paper-craft art style, for 2 to 8 players.
One person runs the server, everyone else joins from a browser. No accounts, no install for players.

## Run it (the host)

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

## Rules

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
npm run build     # produces dist/paper-tycoon.js (single file, client embedded)
npm run e2e       # three headless browsers play 120 turns against the built server
node scripts/server-test.mjs   # raw WebSocket checks: rejoin, auto-play, kick, restart
npm start         # build and run
```

- `src/engine` – pure, deterministic rules engine (no dependencies)
- `src/shared` – board data, cards, types, wire protocol
- `src/server` – Node WebSocket server: rooms, lobby, reconnects, turn timer
- `src/client` – browser client: board, animations, dialogs, paper-craft SVG art
