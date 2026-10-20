import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkshop,currentStep,transitionWorkshop,observation,fileEdit,documentLines} from '../workshop-model.mjs';
import {resolveLanguage,setLanguage,translate} from '../workshop-i18n.mjs';
import {EN} from '../workshop-en.mjs';

test('language links override saved preference; unsupported values fall back safely',()=>{
 assert.equal(resolveLanguage('?lang=en','ko'),'en');
 assert.equal(resolveLanguage('?lang=ko','en'),'ko');
 assert.equal(resolveLanguage('?lang=fr','en'),'en');
 assert.equal(resolveLanguage('','invalid'),'ko');
});
test('every scenario has English instructions, observations, and file content without mutating its state',()=>{
 setLanguage('en');
 const check=text=>assert.doesNotMatch(translate(text),/[가-힣]/,text);
 for(const mode of ['mission','coordination','combined']){
  let state=newWorkshop(mode);
  while(true){
   const before=JSON.stringify(state),step=currentStep(state);
   [step.label,step.title,step.concept,`${state.step+1} · ${step.title}`,...Object.values(observation(state))].forEach(check);
   const edit=fileEdit(state);if(edit)Object.values(edit).forEach(check);
   for(const commit of Object.values(state.commits))check(documentLines(commit.line).map((line,i)=>`${i+1}  ${line}`).join('\n'));
   for(const issue of state.issues)check(`이슈 ${issue.id}: ${issue.title}, ${issue.assignee||'미할당'}`);
   assert.equal(JSON.stringify(state),before);
   if(step.id==='done')break;
   state=transitionWorkshop(state,{type:step.id});
  }
 }
 for(const value of Object.values(EN))assert.doesNotMatch(value,/[가-힣]/);
 setLanguage('ko');assert.equal(translate('협업 기초'),'협업 기초');
});
test('dynamic details and names keep commit IDs and translate their meaning',()=>{
 setLanguage('en');
 assert.equal(translate('지수'),'Emma');
 assert.equal(translate('민수'),'Noah');
 assert.equal(translate('지수의 기록 R 보기'),"View Emma's commit R");
 assert.equal(translate('기록 R의 파일 내용'),'File at commit R');
 assert.equal(translate('작성: 민수 · 검토·병합: 지수'),'Author: Noah · Review and merge: Emma');
 assert.equal(translate('이전 기록: H + M1'),'Parent commits: H + M1');
 assert.equal(translate('#33 · 민수'),'#33 · Noah');
 assert.equal(translate('상태: 병합 없이 닫힘'),'Status: Closed without merging');
 setLanguage('ko');
 assert.equal(translate('지수'),'지수');
 assert.equal(translate('민수'),'민수');
});
