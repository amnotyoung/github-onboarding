import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { STEPS, visibleNode } from './lab-model.mjs';
import { newMission, transitionMission, missionNodeVisible } from './mission-model.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const COLORS = ['#39776a', '#a16b31', '#7561a2', '#477da3', '#a75262', '#748735'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const ENTRY_FILES = new Set(['index.html', 'lab.html', 'lab.js', 'lab-model.mjs', 'mission-model.mjs', 'mission-ui.mjs', 'collaboration-map.mjs', 'lab.css', 'slides.css', 'slides.js', 'demo.css', 'demo.js', 'github-onboarding.md']);
const token = () => randomBytes(18).toString('base64url');
const fail = (status, message) => Object.assign(new Error(message), { status });

export function createLabServer({ roomLimit = 50, participantLimit = 12 } = {}) {
  const rooms = new Map();
  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  function snapshot(room) {
    return { room: room.id, mode: room.mode, mission: room.mission, step: room.step, revision: room.revision, positions: room.positions,
      users: [...room.users.values()].map(u => ({ id: u.id, name: u.name, color: u.color, connected: Boolean(u.stream) })),
      locks: Object.fromEntries([...room.locks].map(([key, lock]) => [key, lock.userId])) };
  }
  function emit(user, event, data) {
    if (!user.stream || user.stream.destroyed) return;
    if (user.stream.writableLength > 1024 * 1024) { user.stream.destroy(); return; }
    user.stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
  function broadcast(room, event = 'state', data = snapshot(room)) {
    for (const user of room.users.values()) emit(user, event, data);
  }
  function release(room, userId) {
    for (const [key, lock] of room.locks) if (lock.userId === userId) room.locks.delete(key);
  }
  function removeUser(room, user) {
    release(room, user.id);
    if (room.mission.authorId === user.id) room.mission.authorId = null;
    if (room.mission.reviewerId === user.id) room.mission.reviewerId = null;
    room.users.delete(user.id);
    user.stream?.end();
    room.touched = Date.now();
    broadcast(room);
  }
  function authenticate(room, value) {
    const user = [...room.users.values()].find(u => u.token === value);
    if (!user) throw fail(401, '참여 정보가 만료되었습니다. 방에 다시 들어와 주세요.');
    return user;
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'JSON 요청이 필요합니다.');
    let input = '';
    for await (const chunk of req) {
      input += chunk;
      if (Buffer.byteLength(input) > 8192) throw fail(413, '요청이 너무 큽니다.');
    }
    try {
      const value = JSON.parse(input);
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Object required');
      return value;
    } catch { throw fail(400, '요청 형식이 올바르지 않습니다.'); }
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    const origin = req.headers.origin;
    // Reject cross-origin writes, including opaque origins; no CORS permission is granted.
    if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) {
      json(res, 403, { error: '같은 서버에서 열린 화면만 참여할 수 있습니다.' }); return;
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/config' && req.method === 'GET') {
        const port = server.address().port;
        const lan = Object.values(networkInterfaces()).flat().find(n => n.family === 'IPv4' && !n.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address));
        json(res, 200, { multiplayer: true, lanOrigin: lan ? `http://${lan.address}:${port}` : null, maxParticipants: participantLimit }); return;
      }
      if (url.pathname === '/api/rooms' && req.method === 'POST') {
        const data = await body(req);
        if (rooms.size >= roomLimit) throw fail(503, '사용 중인 방이 많습니다. 잠시 후 다시 시도하세요.');
        const id = randomBytes(8).toString('base64url');
        const step = Number.isInteger(data.step) && data.step >= 0 && data.step < STEPS.length ? data.step : 0;
        rooms.set(id, { id, mode: data.mode === 'flow' ? 'flow' : 'mission', mission: newMission(), step, revision: 0, positions: {}, users: new Map(), locks: new Map(), touched: Date.now() });
        json(res, 201, { room: id }); return;
      }
      const match = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{11})\/(join|events|action)$/);
      if (match) {
        const room = rooms.get(match[1]);
        if (!room) throw fail(404, '방을 찾을 수 없습니다. 서버를 재시작했다면 새 방을 만들어 주세요.');
        if (match[2] === 'join' && req.method === 'POST') {
          const data = await body(req);
          const existing = data.resumeToken && [...room.users.values()].find(user => user.token === data.resumeToken);
          if (existing) {
            existing.disconnected = existing.stream ? null : Date.now(); room.touched = Date.now();
            json(res, 200, { userId: existing.id, token: existing.token, state: snapshot(room) }); return;
          }
          if (room.users.size >= participantLimit) throw fail(409, `한 방에는 최대 ${participantLimit}명까지 참여할 수 있습니다.`);
          const name = String(data.name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
          if (!name) throw fail(400, '이름을 입력해 주세요.');
          const id = token(), secret = token();
          const user = { id, token: secret, name, color: COLORS[room.users.size % COLORS.length], stream: null, disconnected: Date.now(), windowStart: Date.now(), count: 0 };
          room.users.set(id, user); room.touched = Date.now();
          if (!room.mission.authorId && room.mission.phase === 'brief') room.mission.authorId = id;
          json(res, 201, { userId: id, token: secret, state: snapshot(room) }); broadcast(room); return;
        }
        if (match[2] === 'events' && req.method === 'GET') {
          const user = authenticate(room, url.searchParams.get('token'));
          user.stream?.end();
          res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
          res.write('retry: 1500\n\n'); user.stream = res; user.disconnected = null;
          broadcast(room);
          req.on('close', () => {
            if (user.stream !== res) return;
            user.stream = null; user.disconnected = Date.now(); release(room, user.id); broadcast(room);
          }); return;
        }
        if (match[2] === 'action' && req.method === 'POST') {
          const user = authenticate(room, req.headers.authorization?.replace(/^Bearer /, ''));
          const data = await body(req), now = Date.now();
          if (now - user.windowStart > 1000) { user.windowStart = now; user.count = 0; }
          if (++user.count > 90) throw fail(429, '조작이 너무 빠릅니다. 잠시 후 다시 시도하세요.');
          room.touched = now;
          if (data.type === 'mission' || data.type === 'mode') {
            if (data.revision !== room.revision) { json(res, 409, { error: '다른 참여자가 먼저 진행했습니다. 현재 상태를 확인하세요.', state: snapshot(room) }); return; }
            if (data.type === 'mode') {
              if (!['mission', 'flow'].includes(data.mode)) throw fail(400, '알 수 없는 화면입니다.');
              if (room.mission.authorId && room.mission.authorId !== user.id) throw fail(403, '작성자가 함께 보는 화면을 바꿀 수 있습니다.');
              room.mode = data.mode; room.positions = {};
            } else {
              if (room.mode !== 'mission') throw fail(409, '협업 미션 화면에서 진행하세요.');
              room.mission = transitionMission(room.mission, data.action || {}, user, { users: snapshot(room).users });
              if (['restart', 'navigate'].includes(data.action?.kind)) room.positions = {};
            }
            room.revision++; room.locks.clear();
          } else if (data.type === 'step') {
            if (room.mode !== 'flow') throw fail(409, '미션은 실제 선택과 리뷰를 통해 진행해야 합니다.');
            if (!Number.isInteger(data.step) || data.step < 0 || data.step >= STEPS.length) throw fail(400, '올바르지 않은 단계입니다.');
            if (data.revision !== room.revision) { json(res, 409, { error: '다른 참여자가 단계를 변경했습니다.', state: snapshot(room) }); return; }
            room.step = data.step; room.revision++; room.locks.clear();
            broadcast(room, 'notice', { userId: user.id, text: `${user.name} 님이 ${STEPS[room.step].short} 단계로 이동했습니다.` });
          } else if (data.type === 'grab') {
            if (!(room.mode === 'mission' ? missionNodeVisible(data.key, room.mission) : visibleNode(data.key, room.step))) throw fail(400, '현재 단계에 없는 커밋입니다.');
            const lock = room.locks.get(data.key);
            if (lock && lock.userId !== user.id && lock.until > now) throw fail(409, '다른 참여자가 움직이고 있습니다. 다른 구슬을 잡아보세요.');
            release(room, user.id); room.locks.set(data.key, { userId: user.id, until: now + 5000 });
          } else if (data.type === 'move') {
            const lock = room.locks.get(data.key);
            if (!lock || lock.userId !== user.id || lock.until < now) throw fail(409, '구슬을 다시 잡아 주세요.');
            if (!(room.mode === 'mission' ? missionNodeVisible(data.key, room.mission) : visibleNode(data.key, room.step))) throw fail(400, '현재 단계에 없는 커밋입니다.');
            const p = data.position;
            if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) throw fail(400, '올바르지 않은 위치입니다.');
            const local = data.key.startsWith('local:');
            room.positions[data.key] = { x: Math.max(-5.2, Math.min(5.2, p.x)), z: Math.max(local ? 1.4 : -6.2, Math.min(local ? 6.2 : -1.4, p.z)) };
            lock.until = now + 5000;
          } else if (data.type === 'release') {
            release(room, user.id);
          } else if (data.type === 'reset-layout') {
            room.positions = {}; room.locks.clear();
          } else if (data.type === 'cursor') {
            const p = data.position;
            if (p === null || (p && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.abs(p.x) <= 30 && Math.abs(p.z) <= 30)) {
              broadcast(room, 'cursor', { userId: user.id, position: p }); json(res, 200, { ok: true }); return;
            }
            throw fail(400, '올바르지 않은 위치입니다.');
          } else if (data.type === 'leave') {
            removeUser(room, user); json(res, 200, { ok: true }); return;
          } else throw fail(400, '알 수 없는 동작입니다.');
          broadcast(room); json(res, 200, { ok: true }); return;
        }
        throw fail(405, '지원하지 않는 요청입니다.');
      }
      if (url.pathname.startsWith('/api/')) throw fail(404, '지원하지 않는 API입니다.');
      if (!['GET', 'HEAD'].includes(req.method)) throw fail(405, '지원하지 않는 요청입니다.');
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      const full = path.resolve(ROOT, relative);
      if ((!ENTRY_FILES.has(relative) && !relative.startsWith('assets/')) || !full.startsWith(ROOT + path.sep) || relative.split('/').some(p => p.startsWith('.'))) throw fail(404, '파일을 찾을 수 없습니다.');
      const info = await stat(full).catch(() => null);
      if (!info?.isFile()) throw fail(404, '파일을 찾을 수 없습니다.');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(full));
    } catch (error) {
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : '서버 요청을 처리하지 못했습니다.' });
      else res.end();
    }
  });
  const maintenance = setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      let changed = false;
      for (const [key, lock] of room.locks) if (lock.until < now) { room.locks.delete(key); changed = true; }
      for (const user of room.users.values()) {
        if (user.disconnected && now - user.disconnected > 30000) { removeUser(room, user); changed = true; }
        else if (user.stream) user.stream.write(': heartbeat\n\n');
      }
      if (changed) broadcast(room);
      if (!room.users.size && now - room.touched > 2 * 60 * 60 * 1000) rooms.delete(id);
    }
  }, 3000);
  maintenance.unref();
  server.on('close', () => clearInterval(maintenance));
  server.closeRooms = () => { for (const room of rooms.values()) for (const user of room.users.values()) user.stream?.end(); };
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createLabServer();
  const port = Number(process.env.PORT || 4173);
  server.listen(port, process.env.HOST || '0.0.0.0', () => {
    console.log(`GitHub 협업 실습실: http://localhost:${server.address().port}/lab.html`);
    for (const item of Object.values(networkInterfaces()).flat()) if (item.family === 'IPv4' && !item.internal) console.log(`같은 네트워크 참여: http://${item.address}:${server.address().port}/lab.html`);
  });
  const shutdown = () => { server.closeRooms(); server.close(); };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
}
