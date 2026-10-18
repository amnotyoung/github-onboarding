import test from 'node:test';
import assert from 'node:assert/strict';
import { newMission, transitionMission, missionScene, missionCommits, DRAFTS, REVISIONS, missionNodeVisible, missionLesson, missionTimeline } from '../mission-model.mjs';
import { createLabServer } from '../server.mjs';

const author = { id: 'author', name: '민지' }, reviewer = { id: 'reviewer', name: '준호' };
test('each teammate records locally, pushes separately, and must pull the combined result', () => {
  let m={...newMission(),authorId:author.id,reviewerId:reviewer.id};
  const act=(kind,actor=author,data={})=>m=transitionMission(m,{kind,...data},actor);
  act('branch');act('save',author,{choice:'characters'});act('commit');act('push');
  assert.equal(missionNodeVisible('local:C',m),true);assert.equal(missionNodeVisible('remote:C',m),true);assert.equal(missionNodeVisible('peer:C',m),false);
  assert.throws(()=>act('open-pr'),/동료도/);
  act('peer-edit',reviewer);assert.equal(missionNodeVisible('peer:T',m),false);assert.equal(missionScene(m).peer.file,'working');
  act('peer-commit',reviewer);assert.equal(missionNodeVisible('peer:T',m),true);assert.equal(missionNodeVisible('remote:T',m),false);assert.equal(missionNodeVisible('local:T',m),false);
  act('peer-push',reviewer);assert.equal(missionNodeVisible('remote:T',m),true);assert.equal(missionScene(m).remote.main,'B');
  act('peer-merge');assert.equal(missionScene(m).remote.main,'P');assert.equal(missionScene(m).local.main,'B');assert.equal(missionScene(m).peer.main,'B');
  assert.deepEqual(missionCommits(m).P.parents,['B','T']);assert.equal(m.peerApproval.reviewerId,author.id);
});
test('experiments change real teaching state, preserve remote history, and restore the prior scene', () => {
  const original = { ...newMission(), authorId: author.id, reviewerId: reviewer.id };
  const direct = transitionMission(original, { kind: 'try-main' }, author);
  assert.equal(direct.phase, 'brief'); assert.equal(missionScene(direct).local.main, 'X');
  assert.equal(missionScene(direct).remote.main, 'B'); assert.equal(missionNodeVisible('remote:X', direct), false);
  assert.ok(missionCommits(direct).X.lines.length > missionCommits(direct).B.lines.length);
  assert.throws(() => transitionMission(direct, { kind: 'branch' }, author), /실험을 되돌린/);
  const restored = transitionMission(direct, { kind: 'undo-experiment' }, author);
  assert.deepEqual(missionScene(restored), missionScene(original)); assert.equal(restored.experiment, null);
  assert.throws(() => transitionMission(original, { kind: 'try-main' }, reviewer), /작성자/);
  let m = transitionMission(restored, { kind: 'branch' }, author);
  m = transitionMission(m, { kind: 'save', choice: 'characters' }, author); m = transitionMission(m, { kind: 'commit' }, author);
  let peek = transitionMission(m, { kind: 'inspect-peer' }, author);
  assert.deepEqual(peek.experiment, { type: 'peer', mine: 'C', theirs: 'B' });
  assert.deepEqual(missionScene(peek), missionScene(m));
  m = transitionMission(peek, { kind: 'undo-experiment' }, author); m = transitionMission(m, { kind: 'push' }, author);
  peek = transitionMission(m, { kind: 'inspect-peer' }, author);
  assert.deepEqual(peek.experiment, { type: 'peer', mine: 'C', theirs: 'C' });
  assert.equal(missionNodeVisible('local:C', peek), true); assert.equal(missionNodeVisible('remote:C', peek), true);
});
function exercise(draft = 'characters', revision = 'two') {
  let state = { ...newMission(), authorId: author.id, reviewerId: reviewer.id };
  const log = [state];
  const act = (kind, data = {}, actor = author) => { state = transitionMission(state, { kind, ...data }, actor); log.push(state); return state; };
  act('branch'); act('save', { choice: draft }); act('commit'); act('push'); act('peer-edit', {}, reviewer); act('peer-commit', {}, reviewer); act('peer-push', {}, reviewer); act('peer-merge'); act('open-pr');
  return { act, state: () => state, log, revision };
}

test('review changes the actual snapshot while preserving C and keeping main unchanged until merge', () => {
  for (const draft of Object.keys(DRAFTS)) for (const revision of Object.keys(REVISIONS)) {
    const run = exercise(draft, revision), c = structuredClone(missionCommits(run.state()).C);
    assert.throws(() => run.act('merge'), /승인/);
    assert.throws(() => run.act('approve', { commit: 'C', checks: ['seven', 'together'] }, reviewer), /지금 할 수 없는/);
    assert.throws(() => run.act('request-changes', { issue: DRAFTS[draft].issue }), /리뷰어/);
    assert.throws(() => run.act('request-changes', { issue: 'style' }, reviewer), /현재 선택/);
    run.act('request-changes', { issue: DRAFTS[draft].issue }, reviewer);
    run.act('revise', { choice: revision });
    assert.equal(missionNodeVisible('local:D', run.state()), false);
    run.act('commit-revision');
    assert.equal(missionNodeVisible('local:D', run.state()), true); assert.equal(missionNodeVisible('remote:D', run.state()), false);
    assert.deepEqual(missionCommits(run.state()).C, c);
    run.act('push-revision');
    assert.equal(missionNodeVisible('remote:D', run.state()), true);
    assert.throws(() => run.act('approve', { commit: 'D', checks: ['seven', 'together'] }), /리뷰어/);
    assert.throws(() => run.act('approve', { commit: 'C', checks: ['seven', 'together'] }, reviewer), /최신/);
    assert.throws(() => run.act('approve', { commit: 'D', checks: ['seven'] }, reviewer), /모두/);
    for (const state of run.log) {
      assert.equal(missionScene(state).local.main, 'B'); assert.equal(missionScene(state).remote.main, state.peerStage >= 4 ? 'P' : 'B');
      assert.ok(missionNodeVisible(missionLesson(state).selected, state));
    }
    run.act('approve', { commit: 'D', checks: ['seven', 'together'] }, reviewer);
    run.act('merge'); assert.equal(missionScene(run.state()).remote.main, 'M'); assert.equal(missionScene(run.state()).local.main, 'B');
    assert.deepEqual(missionCommits(run.state()).M.parents, ['P', 'D']);
    run.act('pull'); assert.equal(missionScene(run.state()).local.main, 'M');
    assert.deepEqual(missionCommits(run.state()).M.lines.slice(1), missionCommits(run.state()).D.lines.slice(1));
    assert.equal(missionCommits(run.state()).M.lines[0], '# 백설공주와 일곱 난쟁이');
    assert.equal(missionScene(run.state()).peer.main, 'B');
    run.act('peer-pull', {}, reviewer); assert.equal(missionScene(run.state()).peer.main, 'M');
    assert.ok(missionCommits(run.state()).D.lines.join(' ').includes('일곱 난쟁이'));
    assert.ok(missionCommits(run.state()).D.lines.join(' ').includes('함께 살게'));
    assert.equal(run.state().conversation.length, 4);
    assert.equal(run.state().conversation[1].name, '준호');
    for (const state of run.log) for (const repo of ['local', 'remote', 'peer']) {
      const graph = missionScene(state)[repo];
      for (const id of graph.commits) for (const parent of missionCommits(state)[id].parents) assert.ok(graph.commits.includes(parent));
    }
  }
});

test('role changes cannot let the original PR author self-approve; solo reviewer is explicitly simulated', () => {
  const run = exercise();
  assert.throws(() => run.act('claim-role', { role: 'reviewer' }), /작성자/);
  const handedOff = { ...run.state(), authorId: 'replacement', reviewerId: null };
  assert.throws(() => transitionMission(handedOff, { kind: 'claim-role', role: 'reviewer' }, author), /작성자/);
  const simulated = transitionMission(run.state(), { kind: 'request-changes', issue: 'next-scene' }, author, { solo: true });
  assert.equal(simulated.conversation.at(-1).name, '지수 · 가상 동료');
  assert.throws(() => transitionMission(newMission(), { kind: 'save', choice: '__proto__' }, author, { solo: true }));
});

test('visited scenes support back and forward without losing choices, conversation or approval', () => {
  const run = exercise(); run.act('request-changes', { issue: 'next-scene' }, reviewer); run.act('revise', { choice: 'two' }); run.act('commit-revision'); run.act('push-revision'); run.act('approve', { commit: 'D', checks: ['seven', 'together'] }, reviewer); run.act('merge'); run.act('pull'); run.act('peer-pull', {}, reviewer);
  const complete = run.state(); assert.equal(complete.history.length, 17); assert.equal(complete.future.length, 0);
  assert.equal(missionTimeline(complete).length, 18);
  const past = transitionMission(complete, { kind: 'navigate', index: 1 }, author);
  assert.equal(past.phase, 'draft'); assert.equal(past.history.length, 1); assert.equal(past.future.length, 16);
  assert.equal(past.draft, null); assert.equal(past.approval, null); assert.equal(past.authorId, author.id); assert.equal(past.reviewerId, reviewer.id);
  const replay = transitionMission(past, { kind: 'navigate', index: 17 }, author);
  assert.equal(replay.phase, 'done'); assert.deepEqual(missionScene(replay), missionScene(complete));
  assert.deepEqual(replay.conversation, complete.conversation); assert.deepEqual(replay.approval, complete.approval);
  assert.equal(replay.draft, complete.draft); assert.equal(replay.revision, complete.revision);
  assert.throws(() => transitionMission(past, { kind: 'navigate', index: 18 }, author), /방문한/);
  assert.throws(() => transitionMission(past, { kind: 'navigate', index: -1 }, author), /방문한/);
  assert.throws(() => transitionMission(past, { kind: 'navigate', index: 0 }, reviewer), /작성자/);
  const changed = transitionMission(past, { kind: 'save', choice: 'home' }, author);
  assert.equal(changed.phase, 'saved'); assert.equal(changed.future.length, 0); assert.equal(changed.navigation, null);
  assert.equal(changed.approval, null); assert.equal(changed.revision, null); assert.deepEqual(changed.conversation, []);
  assert.notEqual(missionCommits(changed).C.hash, missionCommits(complete).C.hash);
  assert.equal(missionNodeVisible('remote:D', changed), false); assert.equal(missionNodeVisible('remote:M', changed), false);
  assert.throws(() => transitionMission(changed, { kind: 'merge' }, author), /승인/);
  assert.equal(missionTimeline(changed).length, 3);
});

test('room server enforces roles, mission progression, stale actions, and current-commit approval', async t => {
  const server = createLabServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeRooms(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function post(url, data, token) {
    const response = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) });
    return { status: response.status, data: await response.json() };
  }
  const id = (await post('/api/rooms', {})).data.room;
  const a = (await post(`/api/rooms/${id}/join`, { name: '민지' })).data;
  const b = (await post(`/api/rooms/${id}/join`, { name: '준호' })).data;
  let revision = 0;
  const act = async (user, action, status = 200) => {
    const response = await post(`/api/rooms/${id}/action`, { type: 'mission', action, revision }, user.token);
    assert.equal(response.status, status, response.data.error); if (status === 200) revision++; return response;
  };
  await act(b, { kind: 'branch' }, 403);
  await act(a, { kind: 'claim-role', role: 'reviewer' }, 403);
  await act(b, { kind: 'claim-role', role: 'reviewer' });
  await act(a, { kind: 'branch' }); await act(a, { kind: 'save', choice: 'characters' });
  const stale = await post(`/api/rooms/${id}/action`, { type: 'mission', action: { kind: 'commit' }, revision: 0 }, a.token); assert.equal(stale.status, 409);
  const skip = await post(`/api/rooms/${id}/action`, { type: 'step', step: 8, revision }, a.token); assert.equal(skip.status, 409);
  await act(a, { kind: 'commit' }); await act(a, { kind: 'push' });
  await act(a, { kind: 'peer-edit' }, 403); await act(b, { kind: 'peer-edit' }); await act(b, { kind: 'peer-commit' }); await act(b, { kind: 'peer-push' }); await act(b, { kind: 'peer-merge' }, 403); await act(a, { kind: 'peer-merge' }); await act(a, { kind: 'open-pr' });
  await act(a, { kind: 'merge' }, 409);
  await act(b, { kind: 'request-changes', issue: 'next-scene' });
  await act(b, { kind: 'revise', choice: 'two' }, 403);
  await act(a, { kind: 'revise', choice: 'two' }); await act(a, { kind: 'commit-revision' }); await act(a, { kind: 'push-revision' });
  await act(a, { kind: 'approve', commit: 'D', checks: ['seven', 'together'] }, 403);
  await act(b, { kind: 'approve', commit: 'C', checks: ['seven', 'together'] }, 409);
  await act(b, { kind: 'approve', commit: 'D', checks: ['seven', 'together'] }); await act(a, { kind: 'merge' }); await act(a, { kind: 'pull' }); await act(b, { kind: 'peer-pull' });
  const resumed = (await post(`/api/rooms/${id}/join`, { name: '민지', resumeToken: a.token })).data;
  assert.equal(resumed.state.mission.phase, 'done'); assert.equal(resumed.state.mission.approval.reviewerId, b.userId);
  assert.equal(resumed.state.mission.conversation[1].name, '준호');
});
