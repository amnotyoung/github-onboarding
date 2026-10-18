import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkshop,currentStep,transitionWorkshop,observation} from '../workshop-model.mjs';
import {changeDescription,replayDescription} from '../workshop-motion.mjs';
function reach(id){let s=newWorkshop('combined');while(currentStep(s).id!==id)s=transitionWorkshop(s,{type:currentStep(s).id});return s;}
test('branch, commit and merge diagrams distinguish pointers, files and new record IDs',()=>{
 for(const kind of ['branch-story','commit-story','merge-story']){
  const before=reach(kind),after=transitionWorkshop(before,{type:kind}),change=changeDescription(before,after,kind);
  if(kind==='branch-story')assert.deepEqual(change.diagram,{kind:'branch',name:'story',record:'B'});
  if(kind==='commit-story')assert.deepEqual(change.diagram,{kind:'record',from:'파일',to:'C'});
  if(kind==='merge-story')assert.deepEqual(change.diagram,{kind:'merge',from:'B + D',to:'M1'});
 }
});
test('replay after navigating matches the observation in the selected snapshot',()=>{
 const done=reach('done');
 for(let index=1;index<done.history.length;index++){
  const selected=transitionWorkshop(done,{type:'navigate',index});
  const replay=replayDescription(selected);assert.equal(replay.detail,observation(selected).detail);assert.equal(replay.title,observation(selected).title);
 }
 assert.equal(replayDescription(newWorkshop()),null);
});
