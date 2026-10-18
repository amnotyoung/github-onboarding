import {MODES,newWorkshop,currentStep,transitionWorkshop,fileEdit,documentLines} from './workshop-model.mjs';
import {createWorkshopUI} from './workshop-ui.mjs';
import {createWorkshopMotion,changeDescription,replayDescription} from './workshop-motion.mjs';
const $=selector=>document.querySelector(selector);
const sessions=new Map(Object.keys(MODES).map(mode=>[mode,newWorkshop(mode)]));
const requested=new URLSearchParams(location.search).get('mode');let mode=Object.hasOwn(MODES,requested)?requested:'mission',busy=false;
const motion=createWorkshopMotion();
const state=()=>sessions.get(mode);
const ui=createWorkshopUI({getState:state,dispatch,openFile,openRecord});
function render(){ui.render();$('#workshop').setAttribute('aria-labelledby',`mode-${mode}`);const url=new URL(location.href);url.searchParams.set('mode',mode);url.hash=`step=${currentStep(state()).id}`;history.replaceState(null,'',url);}
function focusAction(){
 const complete=$('#completion-title');
 if(complete){complete.focus({preventScroll:true});complete.closest('.completion').scrollIntoView({block:'start',behavior:'instant'});return;}
 const button=$('#workshop [data-action]');button?.focus({preventScroll:true});
 if(!button)return;
 const r=button.getBoundingClientRect();
 if(r.top<12||r.bottom>innerHeight-12){
  const context=button.closest('.issue-card,.pr-card,.conflict-panel,.repo'),fit=context&&context.getBoundingClientRect().height<innerHeight-24;
  (fit?context:button).scrollIntoView({block:fit?'nearest':'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
}

async function dispatch(action){
 if(busy||motion.busy)return;busy=true;$('#error-message').hidden=true;
 try{
  if(action.type==='replay'){const description=replayDescription(state());if(description)await motion.play(motion.capture(),description);$('[data-replay]')?.focus({preventScroll:true});return;}
  const before=state(),layout=motion.capture();const after=transitionWorkshop(before,action);sessions.set(mode,after);render();
  if(action.type!=='restart'&&action.type!=='done'){
   const description=changeDescription(before,after,action.type);await motion.play(layout,description);
  }
  if(action.type==='navigate')$('#step-jump').focus({preventScroll:true});else focusAction();
 }catch(error){$('#error-message').textContent=error.message;$('#error-message').hidden=false;}
 finally{busy=false;}
}
function openFile(){
 const edit=fileEdit(state());if(!edit||busy)return;
 const dialog=$('#file-dialog'),body=$('#file-body');body.replaceChildren();$('#file-title').textContent=edit.title;
 const filename=document.createElement('p');filename.className='file-name';filename.textContent='snow-white.md · 3번째 줄';body.append(filename);
 for(const [label,line,cls] of [['수정 전',edit.before,'before'],['저장할 문장',edit.after,'after']]){
  const box=document.createElement('section');box.className=`file-diff ${cls}`;const h=document.createElement('h3');h.textContent=label;const p=document.createElement('p');p.textContent=line;box.append(h,p);body.append(box);
 }
 $('#file-save').onclick=()=>{dialog.close();dispatch({type:currentStep(state()).id});};dialog.showModal();
}
function openRecord(repo,id){
 const s=state(),ids=repo==='remote'?s.remote.commits:s.repos[repo]?.commits;if(!ids?.includes(id)||busy)return;
 $('#record-title').textContent=`기록 ${id}의 파일 내용`;
 $('#record-location').textContent=repo==='remote'?'GitHub 저장소':repo==='mine'?'내 저장소':'지수의 저장소';
 $('#record-content').textContent=documentLines(s.commits[id].line).map((line,i)=>`${i+1}  ${line}`).join('\n');
 $('#record-parents').textContent=s.commits[id].parents.length?`이전 기록: ${s.commits[id].parents.join(' + ')}`:'처음 기록입니다.';$('#record-dialog').showModal();
}
function setMode(next){if(next===mode||busy)return;motion.cancel();$('#file-dialog').close();$('#record-dialog').close();mode=next;$('#error-message').hidden=true;render();}
for(const id of Object.keys(MODES))$(`#mode-${id}`).onclick=()=>setMode(id);
$('.lesson-tabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const modes=Object.keys(MODES),index=modes.indexOf(mode);const next=event.key==='Home'?0:event.key==='End'?modes.length-1:(index+(event.key==='ArrowRight'?1:-1)+modes.length)%modes.length;setMode(modes[next]);$(`#mode-${mode}`).focus();};
$('#file-close').onclick=()=>$('#file-dialog').close();$('#record-close').onclick=()=>$('#record-dialog').close();
render();
