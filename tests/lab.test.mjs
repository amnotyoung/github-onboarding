import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabServer } from '../server.mjs';

test('static server serves the practice without room APIs or private files', async t => {
  const server = createLabServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const file of ['/.git/config', '/server.mjs', '/package.json', '/.build/pages-config.json', '/api/config', '/api/rooms', '/assets/%2e%2e%2fserver.mjs']) {
    assert.equal((await fetch(base + file)).status, 404, file);
  }
  for (const file of ['/lab.html?v=guided-workshop&mode=mission', '/lab.js', '/workshop-model.mjs', '/workshop-ui.mjs', '/workshop-motion.mjs', '/lab.css']) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200, file);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const extension = new URL(file, base).pathname.split('.').pop();
    assert.match(response.headers.get('content-type'), extension === 'html' ? /text\/html/ : extension === 'css' ? /text\/css/ : /javascript/);
    assert.ok((await response.text()).length > 0);
  }
  const module = await fetch(base + '/workshop-model.mjs', { method: 'HEAD' });
  assert.match(module.headers.get('content-type'), /javascript/);
  assert.ok(Number(module.headers.get('content-length')) > 0);
  assert.equal(await module.text(), '');
  assert.equal((await fetch(base + '/api/rooms', { method: 'POST' })).status, 404);
  const write = await fetch(base + '/lab.html', { method: 'POST', body: '{}' });
  assert.equal(write.status, 405);
  assert.equal(write.headers.get('allow'), 'GET, HEAD');
  assert.equal((await fetch(base + '/%zz')).status, 400);
});
