import http from 'node:http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const PLAYER_TTL_MS = 20_000;
const rooms = new Map();
const app = express();

app.disable('x-powered-by');
app.get('/health', (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ ok: true, service: 'senderos-lajuj-backend', rooms: rooms.size, now: Date.now() });
});
app.get('/', (_req, res) => res.type('text/plain').send('Senderos Lajuj realtime backend · OK'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', perMessageDeflate: false });

function safeRoomCode(value) {
  return String(value || 'FAMILIA123').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20) || 'FAMILIA123';
}
function getRoom(code) {
  const key = safeRoomCode(code);
  if (!rooms.has(key)) rooms.set(key, { code: key, players: new Map(), finished: false, finishedAt: 0, createdAt: Date.now() });
  return rooms.get(key);
}
function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function snapshot(room) {
  const players = {};
  for (const [id, p] of room.players) players[id] = p;
  return { type: 'snapshot', room: room.code, players, finished: room.finished, finishedAt: room.finishedAt };
}
function broadcast(room, payload, except = null) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client === except || client.readyState !== WebSocket.OPEN || client.roomCode !== room.code) continue;
    client.send(data);
  }
}
function normalizePlayer(raw = {}, id) {
  return {
    id,
    name: String(raw.name || 'Jugador').slice(0, 24),
    age: Math.max(5, Math.min(99, Number(raw.age || 12))),
    character: String(raw.character || 'p01').slice(0, 8),
    x: Number(raw.x || 0), y: Number(raw.y || 0), facing: Number(raw.facing || 0),
    attention: Math.max(0, Math.min(100, Number(raw.attention ?? 100))),
    imprisoned: Boolean(raw.imprisoned), status: String(raw.status || 'active').slice(0, 20),
    shadowX: raw.shadowX == null ? null : Number(raw.shadowX),
    shadowY: raw.shadowY == null ? null : Number(raw.shadowY),
    shadowFacing: Number(raw.shadowFacing || 0), reachedTemple: Boolean(raw.reachedTemple),
    joinedAt: Number(raw.joinedAt || Date.now()), signalUntil: Number(raw.signalUntil || 0),
    gatherUntil: Number(raw.gatherUntil || 0), updatedAt: Date.now()
  };
}
function leaveClient(ws) {
  if (!ws.roomCode || !ws.playerId) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;
  room.players.delete(ws.playerId);
  broadcast(room, { type: 'player_left', id: ws.playerId });
  if (!room.players.size) setTimeout(() => {
    const current = rooms.get(room.code);
    if (current && !current.players.size && Date.now() - current.createdAt > 30_000) rooms.delete(room.code);
  }, 31_000).unref?.();
  ws.roomCode = null; ws.playerId = null;
}

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  send(ws, { type: 'hello', protocol: 1, now: Date.now() });

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'join') {
      leaveClient(ws);
      const room = getRoom(msg.room);
      const id = String(msg.player?.id || msg.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      if (!id) return send(ws, { type: 'error', message: 'player id requerido' });
      ws.roomCode = room.code; ws.playerId = id;
      room.players.set(id, normalizePlayer(msg.player, id));
      send(ws, snapshot(room));
      broadcast(room, { type: 'player_update', id, player: room.players.get(id) }, ws);
      return;
    }

    const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
    if (!room || !ws.playerId) return;

    if (msg.type === 'sync') {
      const current = room.players.get(ws.playerId) || {};
      const next = normalizePlayer({ ...current, ...(msg.player || {}) }, ws.playerId);
      next.joinedAt = current.joinedAt || next.joinedAt;
      room.players.set(ws.playerId, next);
      broadcast(room, { type: 'player_update', id: ws.playerId, player: next }, ws);
    } else if (msg.type === 'rescue') {
      const targetId = String(msg.targetId || '');
      const target = room.players.get(targetId);
      if (target) {
        target.imprisoned = false; target.status = 'rescued'; target.updatedAt = Date.now();
        room.players.set(targetId, target);
        broadcast(room, { type: 'player_update', id: targetId, player: target });
      }
    } else if (msg.type === 'finish') {
      room.finished = true; room.finishedAt = Date.now();
      broadcast(room, { type: 'room_finished', finishedAt: room.finishedAt });
    } else if (msg.type === 'reset') {
      room.finished = false; room.finishedAt = 0; room.players.clear();
      broadcast(room, { type: 'room_reset' });
      rooms.delete(room.code);
    } else if (msg.type === 'leave') {
      leaveClient(ws);
    } else if (msg.type === 'ping') {
      send(ws, { type: 'pong', now: Date.now() });
    }
  });

  ws.on('close', () => leaveClient(ws));
  ws.on('error', () => leaveClient(ws));
});

const maintenance = setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const [id, p] of room.players) {
      if (now - (p.updatedAt || 0) > PLAYER_TTL_MS) {
        room.players.delete(id);
        broadcast(room, { type: 'player_left', id });
      }
    }
  }
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 7_000);
maintenance.unref?.();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Senderos Lajuj backend escuchando en http://0.0.0.0:${PORT}`);
});
