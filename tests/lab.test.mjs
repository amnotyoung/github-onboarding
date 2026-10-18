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

test('static server serves the practice without room APIs or private files', async t => {
  const server = createLabServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const file of ['/.git/config', '/server.mjs', '/package.json', '/.build/pages-config.json', '/api/config', '/api/rooms', '/assets/%2e%2e%2fserver.mjs']) {
    assert.equal((await fetch(base + file)).status, 404, file);
  }
  for (const file of ['/lab.html', '/collaboration-map.mjs', '/mission-ui.mjs', '/lab.css']) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200, file);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok((await response.text()).length > 0);
  }
  const module = await fetch(base + '/collaboration-map.mjs', { method: 'HEAD' });
  assert.match(module.headers.get('content-type'), /javascript/);
  assert.ok(Number(module.headers.get('content-length')) > 0);
  assert.equal(await module.text(), '');
  assert.equal((await fetch(base + '/api/rooms', { method: 'POST' })).status, 404);
  const write = await fetch(base + '/lab.html', { method: 'POST', body: '{}' });
  assert.equal(write.status, 405);
  assert.equal(write.headers.get('allow'), 'GET, HEAD');
  assert.equal((await fetch(base + '/%zz')).status, 400);
});
