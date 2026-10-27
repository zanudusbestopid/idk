// Server integration test over raw WebSockets: create/join/start, disconnect
// auto-play (short grace via PT_GRACE_MS), session rejoin, and host kick.
import { spawn } from 'node:child_process';

const PORT = 3996;
const server = spawn('node', ['dist/paper-tycoon.js'], { env: { ...process.env, PORT: String(PORT), PT_GRACE_MS: '1500' }, stdio: ['ignore', 'ignore', 'inherit'] });
await new Promise((r) => setTimeout(r, 700));
const failures = [];
const check = (cond, msg) => { if (!cond) { failures.push(msg); console.log('FAIL', msg); } else console.log('ok  ', msg); };

function client(name) {
  const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    // Keep the table moving: pass on any auction where it is our bid.
    if (msg.t === 'state' && c.playerId && msg.state.phase === 'auction' && msg.state.auction?.current === c.playerId) c.send({ t: 'action', action: { type: 'passAuction' } });
    if (msg.t === 'welcome') c.playerId = msg.playerId;
    inbox.push(msg);
    for (const w of [...waiters]) if (w.pred(msg)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
  });
  const c = {
    name, ws, inbox, playerId: null,
    send: (m) => ws.send(JSON.stringify(m)),
    next: (pred, timeout = 5000) => {
      const found = inbox.find(pred);
      if (found) { inbox.splice(inbox.indexOf(found), 1); return Promise.resolve(found); }
      return new Promise((resolve, reject) => { const w = { pred, resolve }; waiters.push(w); setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); reject(new Error(`${name}: timeout waiting for message`)); }, timeout); });
    },
    latestState: () => { const s = [...inbox].reverse().find((m) => m.t === 'state'); return s?.state; },
    open: () => new Promise((r) => ws.addEventListener('open', r)),
  };
  return c;
}

try {
  const a = client('A'); await a.open();
  a.send({ t: 'create', name: 'Ava', token: 'duck' });
  const wa = await a.next((m) => m.t === 'welcome');
  const code = wa.room.code;
  check(/^[A-Z0-9]{4}$/.test(code), `room code ${code}`);
  check(wa.room.players[0].token === 'duck', 'host token respected');

  const b = client('B'); await b.open();
  b.send({ t: 'join', code, name: 'Ben', token: 'duck' });
  const wb = await b.next((m) => m.t === 'welcome');
  check(wb.room.players.length === 2, 'second player joined');
  check(wb.room.players[1].token !== 'duck', 'duplicate token reassigned');

  b.send({ t: 'start' });
  const err = await b.next((m) => m.t === 'error');
  check(/host/i.test(err.message), 'non-host cannot start');

  a.send({ t: 'setConfig', config: { startingCash: 800, turnTimerSeconds: 0 } });
  const rm = await a.next((m) => m.t === 'room' && m.room.config.startingCash === 800);
  check(rm.room.config.startingCash === 800, 'host config applied');

  a.send({ t: 'start' });
  const s1 = await a.next((m) => m.t === 'state');
  await b.next((m) => m.t === 'state');
  check(s1.state.players.every((p) => p.cash === 800), 'starting cash from config');
  check(s1.state.phase === 'roll', 'game starts in roll phase');

  // Disconnect whoever is on turn; the game must move on by itself.
  const cur = s1.state.players[s1.state.currentPlayer];
  const curClient = cur.id === wa.playerId ? a : b;
  const other = curClient === a ? b : a;
  const curSession = curClient === a ? wa.session : wb.session;
  curClient.ws.close();
  const away = await other.next((m) => m.t === 'chat' && /is away/.test(m.message.text), 8000);
  check(!!away, 'absent player was auto-played');
  const s2 = await other.next((m) => m.t === 'state' && m.state.turnNumber > s1.state.turnNumber, 8000);
  check(s2.state.turnNumber > s1.state.turnNumber, `turn advanced to ${s2.state.turnNumber}`);
  check(s2.state.players.find((p) => p.id === cur.id).connected === false, 'absent player marked disconnected');

  // Rejoin with the session token.
  const re = client('R'); await re.open();
  re.send({ t: 'rejoin', session: curSession });
  const wr = await re.next((m) => m.t === 'welcome');
  check(wr.playerId === cur.id, 'rejoined as the same player');
  const sr = await re.next((m) => m.t === 'state');
  check(sr.state.players.find((p) => p.id === cur.id).connected === true, 'rejoined player marked connected');
  await re.next((m) => m.t === 'chatHistory');

  // Bad session
  const bad = client('X'); await bad.open();
  bad.send({ t: 'rejoin', session: 'nope' });
  const be = await bad.next((m) => m.t === 'error');
  check(/expired/i.test(be.message), 'bad session rejected');

  // Chat round trip
  re.send({ t: 'chat', text: 'hello <b>there</b>' });
  const ch = await other.next((m) => m.t === 'chat' && m.message.from === cur.id);
  check(ch.message.text === 'hello <b>there</b>', 'chat delivered verbatim');

  // Host kicks the other player mid-game → with two players, the host wins.
  // Host may have passed to the other player while the original host was away.
  const hostId = wr.room.hostId;
  const hostClient = hostId === cur.id ? re : other;
  const victimId = hostId === cur.id ? (other === a ? wa.playerId : wb.playerId) : cur.id;
  hostClient.send({ t: 'kick', playerId: victimId });
  const over = await hostClient.next((m) => m.t === 'state' && m.state.phase === 'ended', 5000);
  check(over.state.winner === hostId, 'kick ends the two-player game with the host as winner');
  const roomEnded = await hostClient.next((m) => m.t === 'room' && m.room.status === 'ended');
  check(roomEnded.room.status === 'ended', 'room status ended');

  hostClient.send({ t: 'restart' });
  const back = await hostClient.next((m) => m.t === 'room' && m.room.status === 'lobby');
  check(back.room.status === 'lobby', 'host can return to lobby');
} catch (e) {
  failures.push(String(e));
  console.log('FAIL', e);
}
server.kill();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nall server checks passed');
process.exit(failures.length ? 1 : 0);
