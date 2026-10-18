import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, STEPS, COMMITS, visibleNode } from '../lab-model.mjs';
import { createLabServer } from '../server.mjs';

test('teaching history preserves branch pointers, snapshots, and parent relationships', () => {
  assert.equal(STEPS.length, 10);
  for (let step = 0; step < STEPS.length; step++) {
    const state = getState(step);
    for (const repo of [state.local, state.remote]) {
      for (const pointer of [repo.main, repo.branch]) if (pointer) assert.ok(repo.commits.includes(pointer));
      for (const id of repo.commits) for (const parent of COMMITS[id].parents) assert.ok(repo.commits.includes(parent));
    }
    assert.ok(visibleNode(STEPS[step].selected, step));
  }
  assert.deepEqual(getState(2).local.commits, ['A', 'B']);
  assert.equal(getState(2).local.branch, 'B');
  assert.deepEqual(getState(4).local.commits, ['A', 'B']);
  assert.equal(getState(5).local.branch, 'C');
  assert.ok(!getState(5).remote.commits.includes('C'));
  assert.equal(getState(6).remote.main, 'B');
  assert.deepEqual(getState(7).remote.commits, getState(6).remote.commits);
  assert.equal(getState(8).remote.main, 'M'); assert.equal(getState(8).local.main, 'B');
  assert.equal(getState(9).local.main, 'M'); assert.equal(getState(9).local.branch, 'C');
  assert.deepEqual(COMMITS.M.parents, ['B', 'C']);
  assert.equal(COMMITS.B.lines.length, 2); assert.equal(COMMITS.C.lines.length, 3);
});

test('real-time rooms synchronize participants and reject conflicting or unauthorized actions', async t => {
  const server = createLabServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const streams = [];
  t.after(async () => { for (const stream of streams) stream.abort(); server.closeRooms(); await new Promise(resolve => server.close(resolve)); });
  async function request(url, data, auth) {
    const response = await fetch(base + url, { method: data === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
    return { status: response.status, body: await response.json() };
  }
  async function connect(id, secret) {
    const controller = new AbortController(); streams.push(controller);
    const response = await fetch(`${base}/api/rooms/${id}/events?token=${secret}`, { signal: controller.signal });
    assert.equal(response.status, 200);
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    return {
      controller,
      async until(predicate) {
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          while (true) {
            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
              const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
              const event = frame.match(/^event: (.+)$/m)?.[1]; const raw = frame.match(/^data: (.+)$/m)?.[1];
              if (event && raw) { const data = JSON.parse(raw); if (predicate(event, data)) return data; }
            }
            const chunk = await reader.read(); if (chunk.done) throw new Error('Stream ended too soon'); buffer += decoder.decode(chunk.value, { stream: true });
          }
        } finally { clearTimeout(timeout); }
      },
    };
  }
  assert.equal((await request('/api/config')).body.multiplayer, true);
  for (const file of ['/.git/config', '/server.mjs', '/package.json', '/.build/pages-config.json']) assert.equal((await fetch(base + file)).status, 404);
  assert.equal((await fetch(base + '/lab.html')).status, 200);
  const made = await request('/api/rooms', { step: 6, mode: 'flow' }); assert.equal(made.status, 201); const id = made.body.room;
  const a = (await request(`/api/rooms/${id}/join`, { name: '민지' })).body;
  const b = (await request(`/api/rooms/${id}/join`, { name: '준호' })).body;
  const ea = await connect(id, a.token), eb = await connect(id, b.token);
  const initial = await eb.until((event, data) => event === 'state' && data.users.filter(u => u.connected).length === 2);
  assert.equal(initial.step, 6); assert.ok(!JSON.stringify(initial).includes(a.token));
  const resumed = await request(`/api/rooms/${id}/join`, { name: '민지', resumeToken: a.token });
  assert.equal(resumed.body.userId, a.userId); assert.equal(resumed.body.state.users.length, 2);
  assert.equal((await request('/api/rooms', null)).status, 400);
  const action = (user, data) => request(`/api/rooms/${id}/action`, data, user.token);
  const advances = await Promise.all([action(a, { type: 'step', step: 7, revision: 0 }), action(b, { type: 'step', step: 7, revision: 0 })]);
  assert.deepEqual(advances.map(r => r.status).sort(), [200, 409]);
  await ea.until((event, data) => event === 'state' && data.step === 7);
  await eb.until((event, data) => event === 'state' && data.step === 7);
  assert.equal((await action(a, { type: 'grab', key: 'local:C' })).status, 200);
  assert.equal((await action(b, { type: 'grab', key: 'local:C' })).status, 409);
  assert.equal((await action(b, { type: 'grab', key: 'remote:C' })).status, 200);
  const moves = await Promise.all([action(a, { type: 'move', key: 'local:C', position: { x: 2.5, z: 5.5 } }), action(b, { type: 'move', key: 'remote:C', position: { x: -2.2, z: -5.7 } })]);
  assert.ok(moves.every(r => r.status === 200));
  const moved = await ea.until((event, data) => event === 'state' && data.positions['local:C']?.x === 2.5 && data.positions['remote:C']?.x === -2.2);
  assert.equal(moved.locks['local:C'], a.userId); assert.equal(moved.locks['remote:C'], b.userId);
  assert.equal((await action(b, { type: 'move', key: 'local:C', position: { x: 0, z: 0 } })).status, 409);
  assert.equal((await action(a, { type: 'grab', key: 'remote:M' })).status, 400);
  assert.equal((await action(a, { type: 'move', key: 'local:C', position: { x: 'bad', z: 4 } })).status, 400);
  await action(a, { type: 'release' });
  assert.equal((await action(b, { type: 'grab', key: 'local:C' })).status, 200);
  await action(b, { type: 'move', key: 'local:C', position: { x: 100, z: -100 } });
  const bounded = await ea.until((event, data) => event === 'state' && data.positions['local:C']?.x === 5.2);
  assert.equal(bounded.positions['local:C'].z, 1.4);
  await action(b, { type: 'cursor', position: { x: 1, z: 4 } });
  const cursor = await ea.until((event, data) => event === 'cursor'); assert.equal(cursor.userId, b.userId);
  const other = (await request('/api/rooms', { step: 0 })).body.room;
  assert.equal((await request(`/api/rooms/${other}/action`, { type: 'reset-layout' }, a.token)).status, 401);
  const crossOrigin = await fetch(base + '/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' }, body: '{}' }); assert.equal(crossOrigin.status, 403);
  await action(a, { type: 'reset-layout' });
  const reset = await eb.until((event, data) => event === 'state' && Object.keys(data.positions).length === 0 && Object.keys(data.locks).length === 0); assert.equal(reset.step, 7);
  await action(b, { type: 'leave' });
  const remaining = await ea.until((event, data) => event === 'state' && data.users.length === 1); assert.equal(remaining.users[0].name, '민지');
});
