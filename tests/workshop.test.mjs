import test from 'node:test';
import assert from 'node:assert/strict';
import {MODES,TEXT,newWorkshop,currentStep,transitionWorkshop,workshopTimeline,prStatus,fileEdit} from '../workshop-model.mjs';
const next=s=>transitionWorkshop(s,{type:currentStep(s).id});
function reach(mode,id){let s=newWorkshop(mode);while(currentStep(s).id!==id)s=next(s);return s;}
test('each mode starts without local repositories; assignment and branching never clone implicitly',()=>{
 for(const mode of Object.keys(MODES)){
  let s=newWorkshop(mode);assert.equal(s.repos.mine,null);assert.equal(s.repos.jisu,null);assert.deepEqual(s.remote.commits,['B']);
  assert.throws(()=>transitionWorkshop(s,{type:'branch-story'}));
  s=reach(mode,'clone-mine');assert.equal(s.repos.mine,null);assert.equal(s.repos.jisu,null);
  s=next(s);assert.deepEqual(s.repos.mine.commits,['B']);assert.equal(s.repos.jisu,null);s=next(s);
  assert.notEqual(s.repos.mine,s.repos.jisu);s=next(s);assert.deepEqual(s.repos.mine.commits,['B']);assert.equal(s.repos.mine.branches.story,'B');
 }
});
test('one fixed edit and one fixed revision; save, record, share, review and merge stay distinct',()=>{
 let s=reach('mission','edit-story');assert.deepEqual(fileEdit(s),{before:TEXT.base,after:TEXT.draft,title:'파일에 저장할 본문'});s=next(s);
 assert.equal(s.repos.mine.working,TEXT.draft);assert.equal(s.commits.B.line,TEXT.base);assert.deepEqual(s.repos.mine.commits,['B']);s=next(s);
 assert.equal(s.commits.C.line,TEXT.draft);assert.ok(!s.remote.commits.includes('C'));s=next(s);assert.ok(s.remote.commits.includes('C'));assert.ok(s.repos.mine.commits.includes('C'));assert.ok(!s.repos.jisu.commits.includes('C'));
 s=next(s);s=next(s);assert.equal(s.event.actor,'지수');assert.equal(currentStep(s).id,'revise-story');assert.equal(fileEdit(s).after,TEXT.revised);
 s=next(s);assert.equal(s.commits.C.line,TEXT.draft);s=next(s);s=next(s);assert.equal(s.prs.story.approval,null);
 assert.throws(()=>transitionWorkshop(s,{type:'merge-story'}));s=next(s);assert.equal(s.prs.story.approval.by,'지수');s=next(s);
 assert.equal(s.prs.story.mergedBy,'지수');assert.equal(s.repos.mine.main,'B');assert.equal(s.repos.jisu.main,'B');s=next(s);assert.equal(s.repos.jisu.main,'B');s=next(s);assert.equal(s.repos.jisu.main,'M');
});
test('all PRs are authored by me and reviewed/merged only by Jisu, including conflict resolution',()=>{
 for(const mode of ['coordination','combined']){
  let s=reach(mode,'merge-story');assert.ok(s.issues.every(i=>i.assignee==='나'));
  for(const p of Object.values(s.prs)){assert.equal(p.author,'나');assert.equal(p.approval.by,'지수');assert.equal(p.reviewer,'지수');}
  assert.equal(prStatus(s,'happy'),'approved');s=next(s);assert.equal(s.remote.main,'M1');assert.equal(prStatus(s,'happy'),'conflict');
  assert.equal(s.issues[0].status,'closed');assert.equal(s.issues[1].status,'open');assert.throws(()=>transitionWorkshop(s,{type:'merge-happy'}));
  s=next(s);s=next(s);assert.equal(s.resolver.status,'edited');assert.ok(!s.commits.R);assert.equal(prStatus(s,'happy'),'conflict');
  s=next(s);assert.equal(s.remote.main,'M1');assert.equal(s.remote.branches.happy,'R');assert.equal(s.prs.happy.approval,null);assert.equal(prStatus(s,'happy'),'review');assert.equal(s.repos.mine.branches.happy,'H');
  assert.deepEqual(s.commits.R.parents,['H','M1']);assert.throws(()=>transitionWorkshop(s,{type:'merge-happy'}));s=next(s);s=next(s);
  assert.equal(s.commits.M2.line,TEXT.resolved);assert.equal(s.prs.happy.mergedBy,'지수');assert.ok(s.issues.every(i=>i.status==='closed'));s=next(s);s=next(s);
  for(const repo of [s.remote,s.repos.mine,s.repos.jisu])for(const id of repo.commits)for(const parent of s.commits[id].parents)assert.ok(repo.commits.includes(parent));
 }
});
test('combined mode retains the same repository through review, second PR and conflict; history restores snapshots',()=>{
 let s=reach('combined','done');assert.ok(s.commits.D);assert.ok(s.commits.H);assert.ok(s.commits.R);assert.equal(s.commits.C.line,TEXT.draft);
 const frames=workshopTimeline(s),cloneIndex=frames.findIndex(x=>currentStep(x).id==='clone-mine');
 const past=transitionWorkshop(s,{type:'navigate',index:cloneIndex});assert.equal(past.repos.mine,null);
 const restored=transitionWorkshop(past,{type:'navigate',index:frames.length-1});assert.deepEqual(restored.remote,s.remote);assert.deepEqual(restored.prs,s.prs);
 const fresh=next(past);assert.equal(fresh.future.length,0);assert.deepEqual(fresh.prs,{});assert.ok(!fresh.commits.R);
 assert.throws(()=>transitionWorkshop(fresh,{type:'navigate',index:frames.length-1}));
});
