import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import { randomInt } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientMessage, ServerMessage } from '../shared/protocol.js';
import { getAssets } from './assets.js';
import { Room, RoomError, type Member } from './room.js';
import { isTokenId } from '../shared/tokens.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOM_IDLE_MS = 30 * 60 * 1000; // delete rooms with nobody connected for this long
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

const rooms = new Map<string, Room>();
const sessions = new Map<string, { room: Room; playerId: string }>();

function newCode(): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
}

// ---------- HTTP ----------

const assets = getAssets();

function serve(req: IncomingMessage, res: ServerResponse): void {
  const url = (req.url ?? '/').split('?')[0];
  const headers = { 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
  if (url === '/' || url === '/index.html' || /^\/[A-Z0-9]{4}$/i.test(url)) {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(assets.html);
  } else if (url === '/client.js') {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(assets.js);
  } else if (url === '/client.css') {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/css; charset=utf-8' });
    res.end(assets.css);
  } else if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = createServer(serve);
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

// ---------- WebSocket ----------

interface Conn { socket: WebSocket; room: Room | null; member: Member | null; alive: boolean }
const conns = new Map<WebSocket, Conn>();

function reply(socket: WebSocket, msg: ServerMessage): void {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(msg));
}

function parse(data: unknown): ClientMessage | null {
  try {
    const obj = JSON.parse(String(data));
    if (obj && typeof obj === 'object' && typeof obj.t === 'string') return obj as ClientMessage;
  } catch { /* fallthrough */ }
  return null;
}

function handle(conn: Conn, msg: ClientMessage): void {
  const { socket } = conn;
  switch (msg.t) {
    case 'ping':
      reply(socket, { t: 'pong' });
      return;
    case 'create': {
      if (conn.member) throw new RoomError('Already in a room');
      const code = newCode();
      const host = Room.createMember(msg.name, isTokenId(msg.token) ? msg.token : 'hat', socket);
      const room = new Room(code, host);
      rooms.set(code, room);
      room.addHost(host);
      sessions.set(host.session, { room, playerId: host.id });
      conn.room = room;
      conn.member = host;
      console.log(`[room ${code}] created by ${host.name}`);
      return;
    }
    case 'join': {
      if (conn.member) throw new RoomError('Already in a room');
      const code = String(msg.code ?? '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) throw new RoomError('No room with that code');
      const m = room.join(msg.name, String(msg.token ?? ''), socket);
      sessions.set(m.session, { room, playerId: m.id });
      conn.room = room;
      conn.member = m;
      console.log(`[room ${code}] ${m.name} joined`);
      return;
    }
    case 'rejoin': {
      if (conn.member) throw new RoomError('Already in a room');
      const hit = sessions.get(String(msg.session ?? ''));
      if (!hit) throw new RoomError('That session has expired');
      const m = hit.room.members.get(hit.playerId);
      if (!m || m.session !== msg.session) { sessions.delete(String(msg.session)); throw new RoomError('That session has expired'); }
      hit.room.reconnect(m, socket);
      conn.room = hit.room;
      conn.member = m;
      return;
    }
  }
  const room = conn.room;
  const member = conn.member;
  if (!room || !member) throw new RoomError('Join a room first');
  switch (msg.t) {
    case 'setToken': room.setToken(member, String(msg.token)); return;
    case 'setName': room.setName(member, String(msg.name)); return;
    case 'setConfig': room.setConfig(member, msg.config); return;
    case 'kick': room.kick(member.id, String(msg.playerId)); return;
    case 'start': room.start(member); return;
    case 'restart': room.restart(member); return;
    case 'action':
      if (!msg.action || typeof msg.action !== 'object' || typeof msg.action.type !== 'string') throw new RoomError('Bad action');
      room.action(member, msg.action);
      return;
    case 'chat': room.chatMessage(member, String(msg.text ?? '')); return;
    case 'leave':
      sessions.delete(member.session);
      room.leave(member);
      conn.room = null;
      conn.member = null;
      return;
    default:
      throw new RoomError('Unknown message');
  }
}

wss.on('connection', (socket) => {
  const conn: Conn = { socket, room: null, member: null, alive: true };
  conns.set(socket, conn);
  socket.on('pong', () => { conn.alive = true; });
  socket.on('message', (data) => {
    const msg = parse(data);
    if (!msg) { reply(socket, { t: 'error', message: 'Malformed message' }); return; }
    try {
      handle(conn, msg);
    } catch (e) {
      if (e instanceof RoomError) reply(socket, { t: 'error', message: e.message });
      else { console.error(e); reply(socket, { t: 'error', message: 'Server error' }); }
    }
  });
  socket.on('close', () => {
    conns.delete(socket);
    if (conn.room && conn.member) conn.room.disconnect(conn.member, socket);
  });
  socket.on('error', () => { /* close follows */ });
});

// Heartbeat: drop dead sockets so disconnects are noticed behind NATs/tunnels.
const heartbeat = setInterval(() => {
  for (const [socket, conn] of conns) {
    if (!conn.alive) { socket.terminate(); continue; }
    conn.alive = false;
    socket.ping();
  }
}, 30_000);

// Room garbage collection.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.connectedCount === 0 && now - room.lastActivity > ROOM_IDLE_MS) {
      for (const m of room.members.values()) sessions.delete(m.session);
      room.destroy();
      rooms.delete(code);
      console.log(`[room ${code}] closed (idle)`);
    }
  }
}, 60_000);

server.listen(PORT, HOST, () => {
  const addrs: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list ?? []) if (ni.family === 'IPv4' && !ni.internal) addrs.push(ni.address);
  }
  console.log('');
  console.log('  Paper Tycoon is running!');
  console.log('');
  console.log(`  You:            http://localhost:${PORT}`);
  for (const a of addrs) console.log(`  Same network:   http://${a}:${PORT}`);
  console.log(`  Over internet:  forward TCP port ${PORT} or use a tunnel (ngrok, playit.gg, Tailscale), then share that address.`);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
});

function shutdown(): void {
  clearInterval(heartbeat);
  clearInterval(sweeper);
  for (const room of rooms.values()) room.destroy();
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
