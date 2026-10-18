import {MODES,currentStep,workshopTimeline,prStatus,observation,fileEdit} from './workshop-model.mjs';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const person={mine:'나',jisu:'지수',minsu:'민수'};
const statusText={review:'검토 대기',changes:'수정 요청',approved:'승인',conflict:'충돌',merged:'병합 완료',excluded:'반영 제외',closed:'병합 없이 닫힘'};
export function createWorkshopUI({getState,dispatch,openFile,openRecord,openInfo}){
 const button=(text,click,cls='secondary')=>{const b=el('button',cls,text);b.type='button';b.onclick=click;return b;};
 function render(){
  const s=getState(),step=currentStep(s),config=MODES[s.mode],root=document.querySelector('#workshop');root.replaceChildren();root.dataset.mode=s.mode;root.dataset.step=step.id;root.dataset.zone=step.zone;
  for(const id of Object.keys(MODES)){const b=document.querySelector(`#mode-${id}`);b.setAttribute('aria-selected',String(s.mode===id));b.tabIndex=s.mode===id?0:-1;}
  const nav=el('nav','lesson-nav');nav.setAttribute('aria-label','학습 단계 탐색');
  const back=button('←',()=>dispatch({type:'navigate',index:s.history.length-1}));back.id='step-back';back.setAttribute('aria-label','이전 단계');back.disabled=!s.history.length;
  const forward=button('→',()=>dispatch({type:'navigate',index:s.history.length+1}));forward.id='step-forward';forward.setAttribute('aria-label','다시 앞으로');forward.disabled=!s.future.length;
  const jump=el('select');jump.id='step-jump';jump.setAttribute('aria-label','지나온 단계 선택');workshopTimeline(s).forEach((f,i)=>{const o=el('option','',`${i+1} · ${currentStep(f).title}`);o.value=i;jump.append(o);});jump.value=s.history.length;jump.disabled=!s.history.length&&!s.future.length;jump.onchange=()=>dispatch({type:'navigate',index:Number(jump.value)});
  nav.append(back,jump,forward,el('span','lesson-caption',config.title));root.append(nav);
  function record(repo,id,cls=''){const b=button(id,()=>openRecord(repo,id),'record '+cls);b.dataset.record=`${repo}:${id}`;b.dataset.motionKey=`record:${repo}:${id}`;b.setAttribute('aria-label',`${repo==='remote'?'GitHub':person[repo]}의 기록 ${id} 보기`);return b;}
  function main(repo,id){const b=button(`main ${id}`,()=>openRecord(repo,id),'main-badge');b.dataset.main=id;b.dataset.motionKey=`${repo}:main`;b.setAttribute('aria-label',`${repo==='remote'?'GitHub':person[repo]}의 기준본 ${id} 보기`);return b;}
  const board=el('div','workshop-map');board.dataset.expanded=String(config.expanded);board.dataset.localConflict=String(Boolean(s.resolver)&&step.zone==='jisu');
  const remote=el('section','repo remote');remote.dataset.repo='remote';
  const head=el('header','repo-heading');head.append(el('h2','','GitHub'),main('remote',s.remote.main),el('span','reviewer','지수 · 검토/병합'),button(`기록 ${s.remote.commits.length}`,()=>openInfo('history','remote'),'text-button'));remote.append(head);
  if(s.issues.length){const list=el('div','issue-list');list.setAttribute('aria-label','할 일과 담당자');
   const pool=el('div','assignee-pool');for(const who of config.expanded?['mine','minsu']:['mine'])pool.append(el('span','avatar '+who,person[who]));list.append(pool);
   for(const issue of s.issues){const b=button('',()=>openInfo('issue',issue.id),'issue-card '+(issue.status==='closed'?'closed':''));b.dataset.issue=issue.id;b.dataset.motionKey=`issue:${issue.id}`;b.setAttribute('aria-label',`이슈 ${issue.id}: ${issue.title}, ${issue.assignee||'미할당'}`);
    b.append(el('strong','',`#${issue.id}`),el('span','issue-name',issue.branch==='story'?'이야기':issue.branch==='happy'?'결말':'새 제안'));
    const owner=el('span','assignee '+(issue.assignee?'':'empty'),issue.assignee||'미할당');owner.dataset.motionKey=`assignee:${issue.id}`;b.append(owner);if(issue.status==='closed')b.append(el('span','issue-closed','✓'));list.append(b);
   }remote.append(list);
  }
  const flow=el('div','remote-flow');
  const trail=el('div','main-trail');trail.append(el('span','flow-label','기준본'));for(const id of s.remote.commits.filter(x=>['B','M','M1','M2'].includes(x))){if(trail.children.length>1)trail.append(el('span','link-arrow','→'));trail.append(record('remote',id,id===s.remote.main?'current':''));}flow.append(trail);
  const tips=el('div','branch-tips');for(const [branch,id] of Object.entries(s.remote.branches)){const tip=el('div','remote-branch');tip.dataset.motionKey=`remote:branch:${branch}`;tip.append(el('span','',branch),record('remote',id,s.prs[branch]?.status==='closed'?'excluded':''));tips.append(tip);}flow.append(tips);remote.append(flow);
  const prs=el('div','pr-list');for(const branch of ['story','happy','proposal']){const p=s.prs[branch];if(!p)continue;const status=prStatus(s,branch),b=button('',()=>openInfo('pr',branch),`pr-card ${status}`);b.dataset.pr=p.id;b.dataset.status=status;b.dataset.motionKey=`pr:${p.id}`;
   b.append(el('strong','pr-title',`#${p.id} · ${p.author}`),el('span','pr-route',status==='merged'?`${p.head} → ${p.mergeCommit}`:`${branch} · ${p.head}`),el('span','pr-status',statusText[status]));b.setAttribute('aria-label',`PR ${p.id}, ${p.author}, ${statusText[status]}, 자세히 보기`);prs.append(b);
  }if(!prs.children.length)prs.append(el('p','empty-pr','PR을 만들면 검토 상태가 여기에 표시됩니다.'));remote.append(prs);board.append(remote);
  const locals=el('div','local-repos');const actors=config.expanded?['mine','jisu','minsu']:config.issues?['mine','jisu']:['mine'];locals.dataset.count=actors.length;
  for(const who of actors){const r=s.repos[who],card=el('section',`repo local ${who}${step.zone===who?' active':''}`);card.dataset.repo=who;card.dataset.exists=String(Boolean(r));
   const heading=el('header','repo-heading'),name=el('h2','',who==='mine'?'내 컴퓨터':`${person[who]}의 컴퓨터`);name.dataset.motionKey=`person:${who}`;heading.append(name,el('span','local-role',who==='jisu'?'로컬 충돌 해결':'파일 수정'));
   if(r){const fileButton=button(r.conflicted?'충돌':r.dirty?'수정됨':'파일',()=>openInfo('file',who),'text-button file-open'+(r.dirty||r.conflicted?' dirty':''));fileButton.dataset.motionKey=`${who}:file`;fileButton.setAttribute('aria-label',`${person[who]}의 현재 파일 보기`);heading.append(fileButton);}card.append(heading);
   if(!r){const empty=el('div','empty-repo');empty.dataset.motionKey=`${who}:empty`;empty.append(el('strong','','저장소 없음'),el('span','',who==='jisu'?'충돌 해결이 필요할 때 복제합니다.':'복제하면 폴더와 .git이 생깁니다.'));card.append(empty);}
   else{
    const folder=el('div','project-folder');folder.dataset.motionKey=`${who}:folder`;
    const git=el('div','git-folder');git.append(main(who,r.main),button(`기록 ${r.commits.length}`,()=>openInfo('history',who),'history-button'));
    const lanes=el('div','branch-lanes');for(const [branch,id] of Object.entries(r.branches)){const lane=el('div','branch-lane'+(r.active===branch?' current':''));lane.dataset.motionKey=`${who}:branch:${branch}`;lane.append(el('span','',branch));if(who==='jisu'&&s.resolver)lane.append(el('strong','',id));else lane.append(record(who,id));lanes.append(lane);}git.append(lanes);
    if(who==='jisu'&&!r.branches.happy&&r.commits.includes('H')){const fetched=el('div','fetched-branch');fetched.append(el('span','','PR'),record(who,'H'));git.append(fetched);}folder.append(git);
    if(who==='jisu'&&s.resolver&&r.active==='happy'){
     const resolver=el('div','local-conflict');resolver.dataset.motionKey='resolver';resolver.setAttribute('aria-label','지수의 컴퓨터에서 충돌 해결');
     for(const [index,id] of [s.resolver.head,s.resolver.base].entries()){const branch=index===0?'happy':'main',source=button(`${branch} ${id}`,()=>openRecord('jisu',id),'conflict-input');source.dataset.motionKey=`conflict:${id}`;source.setAttribute('aria-label',`${branch} 기록 ${id}`);if(index)resolver.append(el('span','','+'));resolver.append(source);}resolver.append(el('span','','→'));
     const result=el('span','resolution-target '+(s.resolver.line?'resolved':''));result.dataset.motionKey='resolution:line';
     if(['recorded','shared'].includes(s.resolver.status))result.append(record('jisu','R'));else result.textContent=s.resolver.line?'수정됨':'충돌';resolver.append(result);folder.append(resolver);
    }
    const file=el('div','working-file');file.dataset.motionKey=`${who}:working`;file.append(el('span','file-label',`snow-white.md · ${r.active}`),el('p','file-preview',r.working),el('small','file-state',r.conflicted?'충돌 해결 필요':r.dirty?'저장됨 · 아직 기록 전':who==='minsu'&&s.prs.proposal?.status==='closed'?'S는 남음 · 기준본에는 제외':'기록과 같은 내용'));folder.append(file);card.append(folder);
   }locals.append(card);
  }board.append(locals);root.append(board);
  const actionArea=el('footer','action-area'),summary=el('div','last-change');summary.id='last-change';const obs=observation(s);
  const title=el('div','summary-heading');title.append(el('span','concept',obs.concept),button('설명',()=>openInfo('change'),'text-button'));
  if(s.event){const replay=button('다시 보기',()=>dispatch({type:'replay'}),'text-button');replay.dataset.replay='';title.append(replay);}summary.append(title,el('p','summary-text',obs.detail));actionArea.append(summary);
  const action=el('div','action-control');const location=step.zone==='mine'?'내 컴퓨터':step.zone==='jisu'?'지수의 컴퓨터':step.zone==='minsu'?'민수의 컴퓨터':'GitHub';
  if(step.id==='done'){
   const complete=el('strong','completion-title',config.expanded?'내 PR은 병합 · 민수 PR은 병합 없이 닫힘':'실습을 마쳤습니다.');complete.id='completion-title';complete.tabIndex=-1;action.append(complete);
  }else action.append(el('span','action-location',`지금 동작하는 곳 · ${location}`));
  const next=button('',()=>fileEdit(s)?openFile():dispatch({type:step.id}),step.id==='done'?'secondary restart':'primary');next.dataset.action=step.id;const instruction=el('span','',step.label);instruction.id='action-instruction';next.append(instruction);action.append(next);actionArea.append(action);root.append(actionArea);
 }
 return {render};
}
