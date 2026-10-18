import {MODES,newWorkshop,currentStep,transitionWorkshop,fileEdit,documentLines} from './workshop-model.mjs';
import {createWorkshopUI} from './workshop-ui.mjs';
import {createWorkshopMotion,changeDescription} from './workshop-motion.mjs';
const $=selector=>document.querySelector(selector);
const sessions=new Map(Object.keys(MODES).map(mode=>[mode,newWorkshop(mode)])),changes=new Map();
const requested=new URLSearchParams(location.search).get('mode');let mode=Object.hasOwn(MODES,requested)?requested:'mission',busy=false;
const motion=createWorkshopMotion();
const state=()=>sessions.get(mode);
const ui=createWorkshopUI({getState:state,dispatch,openFile,openRecord});
function render(){ui.render();$('#workshop').setAttribute('aria-labelledby',`mode-${mode}`);const url=new URL(location.href);url.searchParams.set('mode',mode);url.hash=`step=${currentStep(state()).id}`;history.replaceState(null,'',url);}
function focusAction(){const button=$('#workshop [data-action]');button?.focus({preventScroll:true});if(button){const r=button.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)button.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
async function dispatch(action){
 if(busy||motion.busy)return;busy=true;
 try{
  if(action.type==='replay'){const description=changes.get(mode);if(description)await motion.play(motion.capture(),description);return;}
  const before=state(),layout=motion.capture();const after=transitionWorkshop(before,action);sessions.set(mode,after);render();
  if(action.type!=='restart'&&action.type!=='done'){
   const description=changeDescription(before,after,action.type);changes.set(mode,description);await motion.play(layout,description);
  }else changes.delete(mode);
  if(action.type!=='navigate')focusAction();
 }catch(error){$('#error-message').textContent=error.message;$('#error-message').hidden=false;}
 finally{busy=false;}
}
function openFile(){
 const edit=fileEdit(state());if(!edit||busy)return;
 const dialog=$('#file-dialog'),body=$('#file-body');body.replaceChildren();$('#file-title').textContent=edit.title;
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
