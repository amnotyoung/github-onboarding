import test from 'node:test';
import assert from 'node:assert/strict';
import {newCoordination,transitionCoordination,coordinationScene,coordinationAction,STORY,RESOLUTIONS} from '../coordination-model.mjs';
const advance=(s)=>transitionCoordination(s,{kind:coordinationAction(s).kind});
test('assignment does not create branches; branch edits and pushes stay independent',()=>{
 let s=newCoordination();s=advance(s);s=advance(s);let v=coordinationScene(s);
 assert.deepEqual(v.issues.map(x=>x.assignee),['나','지수']);assert.equal(v.mine.branch,null);assert.equal(v.jisu.branch,null);
 s=advance(s);s=advance(s);v=coordinationScene(s);assert.equal(v.mine.branch,'O');assert.deepEqual(v.mine.commits,['O']);assert.equal(v.remote.main,'O');
 s=advance(s);v=coordinationScene(s);assert.equal(v.mine.line,STORY.A);assert.equal(v.jisu.line,STORY.O);assert.equal(v.mine.main,'O');
 s=advance(s);assert.ok(!coordinationScene(s).remote.commits.includes('A'));s=advance(s);v=coordinationScene(s);assert.ok(v.remote.commits.includes('A'));assert.ok(v.mine.commits.includes('A'));assert.ok(!v.jisu.commits.includes('A'));
});
test('either PR can merge first; the other conflicts with updated main and needs a new resolution review',()=>{
 for(const first of ['mine','jisu'])for(const choice of Object.keys(RESOLUTIONS)){
  let s=newCoordination();while(s.step<12)s=advance(s);let v=coordinationScene(s);
  assert.equal(v.prs.mine.status,'ready');assert.equal(v.prs.jisu.status,'ready');
  s=transitionCoordination(s,{kind:'first-merge',owner:first});v=coordinationScene(s);const rest=first==='mine'?'jisu':'mine';
  assert.equal(v.remote.main,'M1');assert.equal(v.prs[first].status,'merged');assert.equal(v.prs[rest].status,'conflict');
  assert.equal(v.mine.main,'O');assert.equal(v.jisu.main,'O');assert.equal(v.issues.filter(x=>x.closed).length,1);
  assert.throws(()=>transitionCoordination(s,{kind:'merge-rest'}));s=advance(s);
  assert.throws(()=>transitionCoordination(s,{kind:'resolve',choice:'__proto__'}));
  s=transitionCoordination(s,{kind:'resolve',choice});v=coordinationScene(s);
  assert.equal(v.remote.main,'M1');assert.equal(v.prs[rest].head,'R');assert.equal(v.prs[rest].status,'review');assert.equal(v.commits.R.line,RESOLUTIONS[choice][1]);
  assert.ok(!v.mine.commits.includes('R'));assert.ok(!v.jisu.commits.includes('R'));
  assert.throws(()=>transitionCoordination(s,{kind:'merge-rest'}));s=advance(s);s=advance(s);v=coordinationScene(s);
  assert.equal(v.remote.main,'M2');assert.equal(v.commits.M2.line,RESOLUTIONS[choice][1]);assert.deepEqual(v.commits.R.parents,[rest==='mine'?'A':'B','M1']);
  assert.ok(v.issues.every(x=>x.closed));s=advance(s);assert.equal(coordinationScene(s).jisu.main,'O');s=advance(s);assert.equal(coordinationScene(s).jisu.main,'M2');
  for(const repo of ['remote','mine','jisu'])for(const id of coordinationScene(s)[repo].commits)for(const parent of coordinationScene(s).commits[id].parents)assert.ok(coordinationScene(s)[repo].commits.includes(parent));
  const past=transitionCoordination(s,{kind:'navigate',index:12});const replay=transitionCoordination(past,{kind:'navigate',index:19});assert.deepEqual(coordinationScene(replay),coordinationScene(s));
  const changed=transitionCoordination(past,{kind:'first-merge',owner:rest});assert.equal(changed.future.length,0);assert.equal(changed.resolution,null);assert.equal(changed.approved,false);
  assert.throws(()=>transitionCoordination(changed,{kind:'navigate',index:19}));
 }
});
