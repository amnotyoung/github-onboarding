import {MODES,newWorkshop,currentStep,transitionWorkshop,fileEdit,documentLines,prStatus,observation} from './workshop-model.mjs';
import {createWorkshopUI} from './workshop-ui.mjs';
import {createWorkshopMotion,changeDescription,replayDescription} from './workshop-motion.mjs';
const $=s=>document.querySelector(s),names={mine:'내',jisu:'지수의',minsu:'민수의',remote:'GitHub'};
const sessions=new Map(Object.keys(MODES).map(mode=>[mode,newWorkshop(mode)]));
const requested=new URLSearchParams(location.search).get('mode');let mode=Object.hasOwn(MODES,requested)?requested:'mission',busy=false;
const motion=createWorkshopMotion(),state=()=>sessions.get(mode);
const ui=createWorkshopUI({getState:state,dispatch,openFile,openRecord,openInfo});
function render(){ui.render();$('#workshop').setAttribute('aria-labelledby',`mode-${mode}`);const url=new URL(location.href);url.searchParams.set('mode',mode);url.hash=`step=${currentStep(state()).id}`;history.replaceState(null,'',url);}
function focusAction(){($('#completion-title')||$('#workshop [data-action]'))?.focus({preventScroll:true});}
async function dispatch(action){
 if(busy||motion.busy)return;busy=true;const startedMode=mode;$('#error-message').hidden=true;
 try{
  if(action.type==='replay'){const description=replayDescription(state());if(description)await motion.play(motion.capture(),description);if(mode===startedMode)$('[data-replay]')?.focus({preventScroll:true});return;}
  const before=state(),layout=motion.capture(),after=transitionWorkshop(before,action);sessions.set(mode,after);render();
  if(action.type!=='restart'&&action.type!=='done')await motion.play(layout,changeDescription(before,after,action.type));
  if(mode!==startedMode)return;if(action.type==='navigate')$('#step-jump').focus({preventScroll:true});else focusAction();
 }catch(error){$('#error-message').textContent=error.message;$('#error-message').hidden=false;}finally{busy=false;}
}
const element=(tag,text,cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
function openFile(){
 const edit=fileEdit(state());if(!edit||busy)return;const dialog=$('#file-dialog'),body=$('#file-body');body.replaceChildren();$('#file-title').textContent=edit.title;
 body.append(element('p','snow-white.md · 3번째 줄','file-label'));
 function diff(label,line,cls){const box=element('section','','file-diff '+cls);box.append(element('h3',label),element('p',line));return box;}
 if(edit.base){const versions=element('div','','file-conflicts');versions.append(diff('지수의 main · M1',edit.base,'context'),diff('지수의 happy · H',edit.before,'context'));body.append(versions);}else body.append(diff('수정 전',edit.before,'before'));
 body.append(diff('저장할 문장',edit.after,'after'));$('#file-save').onclick=()=>{dialog.close();dispatch({type:currentStep(state()).id});};dialog.showModal();
}
function openRecord(repo,id){
 const s=state(),ids=repo==='remote'?s.remote.commits:s.repos[repo]?.commits;if(!ids?.includes(id)||busy)return;
 $('#record-title').textContent=`기록 ${id}의 파일 내용`;$('#record-location').textContent=`${names[repo]} 저장소`;
 $('#record-content').textContent=documentLines(s.commits[id].line).map((line,i)=>`${i+1}  ${line}`).join('\n');$('#record-parents').textContent=s.commits[id].parents.length?`이전 기록: ${s.commits[id].parents.join(' + ')}`:'처음 기록입니다.';$('#record-dialog').showModal();
}
function openInfo(kind,id){
 if(busy)return;const s=state(),body=$('#info-body');body.replaceChildren();const p=t=>body.append(element('p',t));
 if(kind==='help'){
  $('#info-title').textContent='역할과 학습 범위';p('나는 파일을 수정해 PR을 만듭니다. 이 실습에서는 지수가 모든 PR을 검토하고 병합합니다. 실제 프로젝트에서는 여러 사람이 이 역할을 나눌 수 있습니다.');p('브랜치는 기존 기록을 가리키는 이름입니다. 복제와 달리 새 폴더를 만들지 않습니다.');
  if(MODES[s.mode].issues)p('지수는 충돌이 생겼을 때 로컬 저장소를 복제해 PR 브랜치에서 해결합니다. R은 Push 전에는 지수의 컴퓨터에만 있습니다.');
  if(MODES[s.mode].expanded)p('수정 요청은 고친 뒤 다시 검토할 수 있습니다. 민수의 제안은 범위에 맞지 않아 병합 없이 닫습니다. 닫기만으로 기록이나 브랜치가 삭제되지는 않습니다.');
  p('이 실습은 실제 GitHub 저장소를 바꾸지 않습니다. 새로고침하면 실습이 초기화됩니다.');
 }else if(kind==='change'){
  const o=observation(s);$('#info-title').textContent=o.title;p(o.detail);p(`개념 이름 · ${o.concept}`);if(s.future.length)p('이전 학습 단계입니다. 새 동작을 하면 이후 진행 결과는 다시 만듭니다.');
 }else if(kind==='issue'){
  const issue=s.issues.find(i=>i.id===id);$('#info-title').textContent=`이슈 #${id}`;p(issue.title);p(`담당자: ${issue.assignee||'아직 없음'} · ${issue.status==='closed'?'닫힘':'열림'}`);if(issue.branch==='proposal'&&s.prs.proposal?.status==='closed')p('PR을 병합하지 않았으므로 이 이슈는 자동으로 닫히지 않았습니다.');
 }else if(kind==='pr'){
  const pr=s.prs[id];$('#info-title').textContent=`PR #${pr.id} · ${pr.author}`;p(`작성: ${pr.author} · 검토·병합: 지수`);p(`${pr.branch} · ${pr.head} → main · ${s.remote.main}`);p(`상태: ${{review:'검토 대기',changes:'수정 요청',approved:'승인',conflict:'충돌 해결 필요',merged:'병합 완료',excluded:'이번 범위에서 제외',closed:'병합 없이 닫힘'}[prStatus(s,id)]}`);if(pr.reason)p(pr.reason);if(pr.mergedBy)p(`지수가 병합 기록 ${pr.mergeCommit}을 만들었습니다.`);if(pr.updatedBy)p(`${pr.updatedBy}가 로컬에서 해결한 R을 이 PR에 Push했습니다.`);body.append(element('pre',documentLines(s.commits[pr.head].line).join('\n'),'info-pre'));
 }else if(kind==='file'){
  const repo=s.repos[id];$('#info-title').textContent=`${names[id]} 컴퓨터 · ${repo.active}`;p(repo.conflicted?'로컬 파일에 충돌이 있습니다.':repo.dirty?'파일을 저장했지만 아직 새 기록을 만들지 않았습니다.':'현재 파일은 기록한 내용과 같습니다.');body.append(element('pre',documentLines(repo.working).join('\n'),'info-pre'));
 }else if(kind==='history'){
  const repo=id==='remote'?s.remote:s.repos[id];$('#info-title').textContent=`${names[id]} 저장소의 기록`;p('기록을 누르면 당시 파일 내용을 볼 수 있습니다.');const records=element('div','','info-records');for(const commit of repo.commits){const b=element('button',commit,'record');b.type='button';b.onclick=()=>{$('#info-dialog').close();openRecord(id,commit);};records.append(b);}body.append(records);p(`기준본 main: ${repo.main}`);for(const [branch,head] of Object.entries(repo.branches))p(`${branch}: ${head}`);
 }
 $('#info-dialog').showModal();
}
function setMode(next){if(next===mode||(busy&&!motion.busy))return;motion.cancel();for(const d of document.querySelectorAll('dialog[open]'))d.close();mode=next;render();}
for(const id of Object.keys(MODES))$(`#mode-${id}`).onclick=()=>setMode(id);
$('.lesson-tabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const modes=Object.keys(MODES),i=modes.indexOf(mode),next=event.key==='Home'?0:event.key==='End'?modes.length-1:(i+(event.key==='ArrowRight'?1:-1)+modes.length)%modes.length;setMode(modes[next]);$(`#mode-${mode}`).focus();};
$('#help-button').onclick=()=>openInfo('help');$('#file-close').onclick=()=>$('#file-dialog').close();$('#record-close').onclick=()=>$('#record-dialog').close();$('#info-close').onclick=()=>$('#info-dialog').close();render();
