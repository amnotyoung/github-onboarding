import test from 'node:test';
import assert from 'node:assert/strict';
import {MODES,TEXT,newWorkshop,currentStep,lessonSteps,transitionWorkshop,workshopTimeline,prStatus,fileEdit} from '../workshop-model.mjs';
const next=s=>transitionWorkshop(s,{type:currentStep(s).id});
function reach(mode,id){let s=newWorkshop(mode);let guard=0;while(currentStep(s).id!==id){if(++guard>60)throw Error(id);s=next(s);}return s;}
test('basic lesson has only necessary local work; clones never happen implicitly',()=>{
 assert.ok(!lessonSteps('mission').some(x=>['clone-jisu','pull-jisu'].includes(x.id)));
 for(const mode of Object.keys(MODES)){
  let s=newWorkshop(mode);assert.equal(s.repos.mine,null);assert.equal(s.repos.jisu,null);assert.deepEqual(s.remote.commits,['B']);assert.throws(()=>transitionWorkshop(s,{type:'branch-story'}));
  s=reach(mode,'clone-mine');assert.equal(s.repos.mine,null);s=next(s);assert.deepEqual(s.repos.mine.commits,['B']);assert.equal(s.repos.jisu,null);
  s=next(s);assert.equal(s.repos.mine.branches.story,'B');assert.deepEqual(s.repos.mine.commits,['B']);
 }
});
test('fixed local edit and revision stay separate from records, sharing and Jisu review',()=>{
 let s=reach('mission','edit-story');assert.equal(fileEdit(s).after,TEXT.draft);s=next(s);assert.equal(s.commits.B.line,TEXT.base);assert.deepEqual(s.repos.mine.commits,['B']);s=next(s);
 assert.equal(s.commits.C.line,TEXT.draft);assert.ok(!s.remote.commits.includes('C'));s=next(s);assert.ok(s.remote.commits.includes('C'));assert.ok(s.repos.mine.commits.includes('C'));
 s=next(s);s=next(s);assert.equal(s.event.actor,'지수');assert.equal(fileEdit(s).after,TEXT.revised);s=next(s);assert.equal(s.commits.C.line,TEXT.draft);s=next(s);s=next(s);assert.equal(s.prs.story.approval,null);
 assert.throws(()=>transitionWorkshop(s,{type:'merge-story'}));s=next(s);s=next(s);assert.equal(s.prs.story.mergedBy,'지수');assert.equal(s.repos.mine.main,'B');s=next(s);assert.equal(s.repos.mine.main,'M');assert.equal(s.repos.jisu,null);assert.equal(currentStep(s).id,'done');
});
test('Jisu clones for a real local conflict task, commits locally, then pushes the same PR',()=>{
 for(const mode of ['coordination','combined']){
  let s=reach(mode,'merge-story');assert.equal(s.repos.jisu,null);assert.equal(prStatus(s,'happy'),'approved');s=next(s);assert.equal(s.remote.main,'M1');assert.equal(prStatus(s,'happy'),'conflict');
  assert.equal(currentStep(s).id,'clone-jisu');s=next(s);assert.equal(s.repos.jisu.main,'M1');assert.ok(s.repos.jisu.commits.includes('H'));assert.deepEqual(s.repos.jisu.branches,{});
  s=next(s);assert.equal(s.repos.jisu.active,'happy');assert.equal(s.repos.jisu.branches.happy,'H');s=next(s);assert.equal(s.repos.jisu.conflicted,true);assert.equal(s.resolver.owner,'jisu');
  const remoteBefore=structuredClone(s.remote);s=next(s);assert.equal(s.event.actor,'지수');assert.equal(s.repos.jisu.working,TEXT.resolved);assert.equal(s.repos.jisu.dirty,true);assert.deepEqual(s.remote,remoteBefore);
  s=next(s);assert.equal(s.repos.jisu.branches.happy,'R');assert.ok(s.repos.jisu.commits.includes('R'));assert.ok(!s.remote.commits.includes('R'));assert.equal(s.prs.happy.head,'H');assert.equal(prStatus(s,'happy'),'conflict');assert.deepEqual(s.commits.R.parents,['H','M1']);
  assert.throws(()=>transitionWorkshop(s,{type:'merge-happy'}));s=next(s);assert.equal(s.remote.branches.happy,'R');assert.equal(s.prs.happy.author,'나');assert.equal(s.prs.happy.updatedBy,'지수');assert.equal(s.prs.happy.approval,null);assert.equal(prStatus(s,'happy'),'review');
  s=next(s);s=next(s);assert.equal(s.commits.M2.line,TEXT.resolved);assert.equal(s.prs.happy.mergedBy,'지수');assert.equal(s.repos.mine.main,'B');assert.equal(s.repos.jisu.main,'M1');
  s=next(s);s=next(s);assert.equal(s.repos.mine.main,'M2');assert.equal(s.repos.jisu.main,'M2');assert.equal(s.repos.jisu.branches.happy,'R');
  for(const repo of [s.remote,...Object.values(s.repos).filter(Boolean)])for(const id of repo.commits)for(const parent of s.commits[id].parents)assert.ok(repo.commits.includes(parent));
 }
});
test('only combined mode includes Minsu; rejection closes a PR without merging or deleting its record',()=>{
 for(const mode of ['mission','coordination'])assert.ok(!lessonSteps(mode).some(x=>x.id==='pr-proposal'));
 let s=reach('combined','reject-proposal');assert.equal(s.prs.proposal.author,'민수');assert.equal(s.issues.find(i=>i.id===23).assignee,'민수');const main=s.remote.main,records=[...s.remote.commits];
 s=next(s);assert.equal(prStatus(s,'proposal'),'excluded');assert.equal(s.prs.proposal.status,'open');assert.equal(s.remote.main,main);s=next(s);
 assert.equal(prStatus(s,'proposal'),'closed');assert.equal(s.prs.proposal.closedBy,'지수');assert.equal(s.prs.proposal.mergeCommit,undefined);assert.equal(s.remote.main,main);assert.deepEqual(s.remote.commits,records);assert.ok(s.remote.commits.includes('S'));assert.equal(s.issues.find(i=>i.id===23).status,'open');
 const done=reach('combined','done');assert.equal(done.commits.M2.line,TEXT.resolved);assert.ok(!done.commits.M2.line.includes('신데렐라'));assert.equal(done.repos.minsu.branches.proposal,'S');assert.equal(done.prs.story.status,'merged');assert.equal(done.prs.proposal.status,'closed');
});
test('combined history retains review, rejection and local resolution while supporting back and forward',()=>{
 const s=reach('combined','done');assert.ok(s.commits.D&&s.commits.S&&s.commits.R);const frames=workshopTimeline(s),idx=frames.findIndex(x=>currentStep(x).id==='clone-jisu');
 const past=transitionWorkshop(s,{type:'navigate',index:idx});assert.equal(past.repos.jisu,null);const restored=transitionWorkshop(past,{type:'navigate',index:frames.length-1});assert.deepEqual(restored.remote,s.remote);assert.deepEqual(restored.prs,s.prs);
 const fresh=next(past);assert.equal(fresh.future.length,0);assert.ok(!fresh.commits.R);assert.equal(fresh.prs.proposal.status,'closed');assert.throws(()=>transitionWorkshop(fresh,{type:'navigate',index:frames.length-1}));
});
