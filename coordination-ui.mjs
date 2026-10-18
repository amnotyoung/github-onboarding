import {newCoordination,transitionCoordination,coordinationScene,coordinationAction,coordinationTimeline,coordinationObservation,COORD_STEPS,STORY,RESOLUTIONS} from './coordination-model.mjs';
import {createLearningMotion,coordinationChange} from './learning-motion.mjs';
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
export function createCoordinationUI(){
 let state=newCoordination(), choice=null;
 const root=()=>document.querySelector('#coordination-lab');
 function button(text,action,cls='map-primary'){const b=node('button',cls,text);b.type='button';b.onclick=action;return b;}
 const motion=createLearningMotion(root,()=>root().querySelector('#coord-motion-summary'));
 async function dispatch(action){
  if(motion.busy)return;
  const before=state,layout=motion.capture();state=transitionCoordination(state,action);choice=null;render();
  if(!['restart','done'].includes(action.kind))await motion.play(layout,coordinationChange(action.kind,before,state,coordinationObservation(state)));
  if(root().hidden)return;
  if(action.kind!=='navigate'){
   const active=root().querySelector('[data-coord-primary]');active?.focus({preventScroll:true});
   if(active){const box=active.getBoundingClientRect();if(box.top<0||box.bottom>innerHeight)active.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  }
 }
 function render(){
  const host=root(),view=coordinationScene(state),action=coordinationAction(state),observation=coordinationObservation(state);host.replaceChildren();host.dataset.step=state.step;
  const intro=node('div','coord-heading');intro.append(node('p','map-eyebrow','이슈 → 브랜치 → PR → 충돌 해결'),node('h2','','같은 결말을 다르게 고치면?'));host.append(intro);
  const navigation=node('nav','navigation-controls');navigation.setAttribute('aria-label','이슈·충돌 단계 탐색');
  const back=button('← 이전 단계',()=>dispatch({kind:'navigate',index:state.history.length-1}),'');back.disabled=!state.history.length;back.id='coord-back';
  const forward=button('다시 앞으로 →',()=>dispatch({kind:'navigate',index:state.history.length+1}),'');forward.disabled=!state.future.length;forward.id='coord-forward';
  const jump=node('select');jump.id='coord-jump';jump.setAttribute('aria-label','방문한 이슈·충돌 단계');
  coordinationTimeline(state).forEach((s,i)=>{const o=node('option','',`${i+1} · ${COORD_STEPS[s.step][1]}`);o.value=i;jump.append(o);});jump.value=state.history.length;jump.onchange=()=>dispatch({kind:'navigate',index:Number(jump.value)});navigation.append(back,jump,forward);host.append(navigation);
  if(state.future.length)host.append(node('p','coord-history-note','이전 단계입니다. 새 동작을 하면 이후 진행 결과는 사라집니다.'));
  const instruction=node('h3','coord-instruction',action.instruction);instruction.id='coord-instruction';host.append(instruction);
  const observationBox=node('div','coord-observation');observationBox.setAttribute('role','status');observationBox.append(node('p','',observation[0]),node('span','',`개념 이름 · ${observation[1]}`));host.append(observationBox);
  const summary=node('div','motion-summary');summary.id='coord-motion-summary';summary.hidden=true;host.append(summary);
  function primary(parent){
   const b=button(action.label,()=>dispatch({kind:action.kind}));b.dataset.coordPrimary=action.kind;parent.append(b);return b;
  }
  const remote=node('section','map-repo remote coord-remote');remote.dataset.coordRepo='remote';
  const heading=node('div','map-repo-heading');heading.append(node('h3','','GitHub 저장소'),node('span','map-scope','나와 지수가 공유하는 저장소'));remote.append(heading);
  const issues=node('div','coord-issues');
  for(const issue of view.issues){const card=node('section','coord-issue');card.dataset.issue=issue.id;card.append(node('h4','',`이슈 #${issue.id} · ${issue.title}`),node('p','',`담당자: ${issue.assignee||'미할당'} · ${issue.closed?'닫힘':'열림'}`));
   if((action.kind==='assign-mine'&&issue.id===21)||(action.kind==='assign-jisu'&&issue.id===22))primary(card);issues.append(card);
  }
  remote.append(issues);
  const main=node('div','coord-main');main.dataset.coordRecord=`remote:${view.remote.main}`;main.append(node('strong','',`기준본 main · ${view.remote.main}`),node('p','coord-line',view.commits[view.remote.main].line));remote.append(main);
  const shared=node('div','coord-shared-branches');
  for(const owner of ['mine','jisu'])if(view.remote.commits.includes(owner==='mine'?'A':'B')){const chip=node('div','coord-shared-branch',`공유한 작업 공간 ${owner==='mine'?'ending':'seven'} · ${view.prs[owner].head}`);chip.dataset.motionKey=`coord:remote:${owner}`;shared.append(chip);}remote.append(shared);
  const prs=node('div','coord-prs');
  for(const owner of ['mine','jisu']){
   const pr=view.prs[owner];if(!pr.exists)continue;
   const card=node('section',`coord-pr ${pr.status}`);card.dataset.pr=pr.number;card.dataset.status=pr.status;card.dataset.coordRecord=`remote:${pr.head}`;
   card.append(node('h4','',`PR #${pr.number} · ${owner==='mine'?'내':'지수의'} 결말 수정`));
   card.append(node('p','coord-branch-name',`${owner==='mine'?'ending':'seven'} · ${pr.head} → main · ${view.remote.main}`));
   card.append(node('p','coord-line',view.commits[pr.head].line));
   const status={ready:'합칠 수 있음',conflict:'충돌 · 합치기 불가',review:'해결 기록 R · 재검토 필요',merged:'합침 완료'};
   card.append(node('strong','coord-pr-state',status[pr.status]),node('p','coord-link-note',`연결한 이슈 #${pr.issue} · Closes #${pr.issue}`));
   if(action.kind==='first-merge'){const b=button(owner==='mine'?'내 PR 먼저 합치기':'지수의 PR 먼저 합치기',()=>dispatch({kind:'first-merge',owner}));b.dataset.coordFirst=owner;card.append(b);}
   if(pr.status==='conflict'){const b=button('남은 PR 합치기',()=>{});b.disabled=true;card.append(b);}
   prs.append(card);
  }
  if(prs.children.length)remote.append(prs);
  if(state.step===12)remote.append(node('p','coord-assumption','두 PR의 최초 검토는 끝났다고 가정합니다. 각 PR은 현재 기준본 O와 비교합니다.'));
  if(state.step>=14&&state.step<=16){
   const resolver=node('section','coord-resolver');resolver.dataset.motionKey='coord:resolver';resolver.append(node('h4','','같은 파일의 같은 줄 · snow-white.md, 2행'),node('p','coord-original',`공통 시작 O: ${STORY.O}`));
   const versions=node('div','coord-versions');
   for(const [title,id] of [['현재 GitHub 기준본','M1'],['남은 PR의 수정',view.remaining==='mine'?'A':'B']]){
    const c=node('div');c.append(node('strong','',`${title} · ${id}`),node('p','coord-line',view.commits[id].line));versions.append(c);
   }
   resolver.append(versions);
   if(action.kind==='resolve'){
    const field=node('fieldset','coord-resolutions');field.append(node('legend','','남길 문장'));
    const apply=button(action.label,()=>dispatch({kind:'resolve',choice}));apply.dataset.coordPrimary='resolve';apply.disabled=!choice;
    for(const [id,[label,text]] of Object.entries(RESOLUTIONS)){
     const item=node('label'),radio=node('input');radio.type='radio';radio.name='resolution';radio.value=id;radio.checked=choice===id;
     radio.onchange=()=>{choice=id;apply.disabled=false;instruction.textContent=`“${action.label}” 버튼을 누르세요.`;};
     const copy=node('span');copy.append(node('strong','',label),node('span','',text));item.append(radio,copy);field.append(item);
    }
    resolver.append(field,apply);
   }else resolver.append(node('p','coord-resolution-result',`해결 기록 R: ${view.commits.R.line}`));
   remote.append(resolver);
  }
  if(action.zone==='remote'&&!['first-merge','resolve','done'].includes(action.kind))primary(remote);
  if(action.kind==='done'){
   remote.append(node('p','coord-assumption','두 PR을 합쳐 연결한 이슈를 닫았습니다. 이슈가 닫혀도 요청 내용의 적절성은 사람이 확인해야 합니다.'));
   primary(remote);
  }
  host.append(remote);
  const locals=node('div','map-locals coord-locals');
  for(const owner of ['mine','jisu']){
   const data=view[owner],card=node('section',`map-repo ${owner==='mine'?'local':'peer'}${action.zone===owner?' is-active':''}`);card.dataset.coordRepo=owner;
   card.append(node('p','map-eyebrow',owner==='mine'?'내 저장소':'지수의 저장소'),node('h3','',owner==='mine'?'내 컴퓨터':'지수의 컴퓨터'));
   const baseline=node('div','coord-baseline');baseline.dataset.coordRecord=`${owner}:${data.main}`;baseline.append(node('strong','',`기준본 main · ${data.main}`),node('p','coord-line',view.commits[data.main].line));card.append(baseline);
   if(data.branch){
    const branch=node('div','coord-local-branch');branch.dataset.coordRecord=`${owner}:${data.branch}`;
    branch.append(node('strong','',`↳ 작업 공간 ${data.branchName} · ${data.branch}`));
    branch.append(node('p','coord-line',data.dirty?data.line:view.commits[data.branch].line),node('span','',data.dirty?'파일 저장 완료 · 새 기록 없음':`보관한 기록: ${data.commits.join(' · ')}`));card.append(branch);
   }else card.append(node('p','map-working-file','아직 작업 공간이 없습니다.'));
   if(action.zone===owner)primary(card);locals.append(card);
  }
  host.append(locals);
  const help=node('details','guide');help.append(node('summary','','이 실습에서 구분할 개념'));
  for(const text of ['이슈는 해야 할 일을 적는 곳입니다. 담당자를 지정해도 브랜치나 파일은 바뀌지 않습니다.','브랜치는 기록을 가리키는 이름입니다. 같은 기록에서 시작해도 각 브랜치의 변경은 따로 기록합니다.','PR은 작업 브랜치의 변경을 기준 브랜치에 합치도록 요청합니다. PR이 여러 개라는 이유만으로 충돌하지는 않습니다.','이 실습에서는 같은 줄을 다르게 수정합니다. 먼저 합친 PR이 기준본을 바꾸면 남은 PR과 새 기준본이 충돌합니다.','충돌 해결은 GitHub의 편집기에서 진행한다고 가정합니다. 해결 기록은 남은 PR 브랜치에 생깁니다. 각 컴퓨터에는 자동으로 복사되지 않습니다.','지수는 정해진 동작을 보여 주는 가상 인물입니다. 이 실습은 실제 GitHub 저장소를 변경하지 않습니다.'])help.append(node('p','',text));host.append(help);
 }
 return {render,cancel:motion.cancel};
}
