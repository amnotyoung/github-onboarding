import {MODES,ROLE_NOTE,TEXT,currentStep,workshopTimeline,prStatus,observation,documentLines,fileEdit} from './workshop-model.mjs';
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const names={B:'처음',C:'초안',D:'수정',H:'결말',M:'합침',M1:'이야기 합침',R:'해결',M2:'모두 합침'};
const coords={B:[7,48],C:[25,18],D:[46,18],H:[29,78],M1:[67,18],R:[74,78],M2:[93,48],M:[86,48]};
export function createWorkshopUI({getState,dispatch,openFile,openRecord}){
 function button(text,click,cls='primary'){const b=node('button',cls,text);b.type='button';b.onclick=click;return b;}
 function render(){
  const s=getState(),step=currentStep(s),root=document.querySelector('#workshop');root.replaceChildren();root.dataset.mode=s.mode;root.dataset.step=step.id;
  document.querySelector('#lesson-title').textContent=MODES[s.mode].title;
  document.querySelector('#role-note').textContent=ROLE_NOTE;
  for(const [id,mode] of Object.entries(MODES)){const b=document.querySelector(`#mode-${id}`);b.setAttribute('aria-selected',String(s.mode===id));b.tabIndex=s.mode===id?0:-1;}
  const nav=node('nav','lesson-nav');nav.setAttribute('aria-label','학습 단계 탐색');
  const back=button('← 이전 단계',()=>dispatch({type:'navigate',index:s.history.length-1}),'secondary');back.id='step-back';back.setAttribute('aria-label','이전 단계');back.textContent='←';back.append(node('span','nav-word',' 이전 단계'));back.disabled=!s.history.length;
  const forward=button('다시 앞으로 →',()=>dispatch({type:'navigate',index:s.history.length+1}),'secondary');forward.id='step-forward';forward.setAttribute('aria-label','다시 앞으로');forward.replaceChildren(node('span','nav-word','다시 앞으로 '),document.createTextNode('→'));forward.disabled=!s.future.length;
  const jump=node('select');jump.id='step-jump';jump.setAttribute('aria-label','지나온 단계 선택');
  workshopTimeline(s).forEach((frame,i)=>{const o=node('option','',`${i+1} · ${currentStep(frame).title}`);o.value=i;jump.append(o);});jump.value=s.history.length;jump.disabled=workshopTimeline(s).length===1;jump.onchange=()=>dispatch({type:'navigate',index:Number(jump.value)});nav.append(back,jump,forward);root.append(nav);
  if(s.future.length)root.append(node('p','history-note','이전 단계입니다. 새 동작을 하면 이후 진행 결과는 다시 만듭니다.'));
  const instruction=node('h2','instruction',step.id==='done'?'실습을 마쳤습니다.':`“${step.label}” 버튼을 누르세요.`);instruction.id='action-instruction';root.append(instruction);
  const intro=observation(s),summary=node('div','last-change');summary.id='last-change';summary.append(node('p','',intro.detail),node('small','',intro.concept));
  if(s.event){const replay=button('변화 다시 보기',()=>dispatch({type:'replay'}),'secondary');replay.dataset.replay='';summary.append(replay);}root.append(summary);
  if(step.id==='done'){
   const complete=node('section','completion');complete.setAttribute('aria-labelledby','completion-title');
   const title=node('h3','',`세 저장소의 기준본이 ${s.remote.main}으로 같아졌습니다.`);title.id='completion-title';title.tabIndex=-1;complete.append(title,node('p','completion-file',s.commits[s.remote.main].line));
   const points=node('ul','completion-points');
   const facts=MODES[s.mode].issues?['이슈를 담당자에게 할당했습니다.','두 브랜치의 충돌을 해결하고 지수가 다시 검토했습니다.','합친 기준본을 각 컴퓨터에서 받아왔습니다.']:['파일 저장, 기록, 공유를 구분했습니다.','지수의 수정 의견을 반영한 뒤 승인을 받았습니다.','지수가 합친 기준본을 각 컴퓨터에서 받아왔습니다.'];
   for(const fact of facts)points.append(node('li','',fact));complete.append(points);
   const restart=button('처음부터 다시 시작하기',()=>dispatch({type:'done'}),'secondary');restart.dataset.action='done';complete.append(restart);root.append(complete);
  }
  function primary(parent){if(step.id==='done')return;const b=button(step.label,()=>fileEdit(s)?openFile():dispatch({type:step.id}));b.dataset.action=step.id;parent.append(b);}
  function record(repo,id,compact=false){const b=button('',()=>openRecord(repo,id),'record'+(compact?' compact':''));b.dataset.record=`${repo}:${id}`;b.dataset.motionKey=`record:${repo}:${id}`;b.setAttribute('aria-label',`${repo==='remote'?'GitHub':repo==='mine'?'내':'지수의'} 기록 ${id} 내용 보기`);b.append(node('span','record-id',id),node('span','record-label',names[id]));return b;}
  function main(repo,id){const b=button(`기준본 main · ${id}`,()=>openRecord(repo,id),'main-badge');b.dataset.main=id;b.dataset.motionKey=`${repo}:main`;return b;}
  const map=node('div','workshop-map');
  const remote=node('section','repo remote');remote.dataset.repo='remote';
  const heading=node('div','repo-heading');heading.append(node('div','',null),node('span','scope','공유한 기록'));
  heading.firstChild.append(node('p','eyebrow','나와 지수가 함께 보는 곳'),node('h3','','GitHub 저장소'));remote.append(heading);
  if(s.issues.length){
   const board=node('section','issue-board');board.setAttribute('aria-label','이슈와 담당자');
   const pool=node('div','assignee-pool');pool.append(node('span','', '할 일의 담당자'),node('span','avatar','나'));pool.lastChild.dataset.motionKey='person:mine';board.append(pool);
   const issues=node('div','issue-list');
   for(const issue of s.issues){const card=node('article','issue-card '+(issue.status==='closed'?'closed':''));card.dataset.issue=issue.id;card.dataset.motionKey=`issue:${issue.id}`;
    card.append(node('p','issue-number',`이슈 #${issue.id} · ${issue.status==='closed'?'닫힘':'열림'}`),node('h4','',issue.title));
    const owner=node('div','assignee');owner.dataset.motionKey=`assignee:${issue.id}`;owner.append(node('span','avatar '+(!issue.assignee?'empty':''),issue.assignee||'?'),node('span','',issue.assignee?'담당자 · 나':'아직 담당자 없음'));card.append(owner);
    if(step.id===`assign-${issue.branch}`)primary(card);issues.append(card);
   }board.append(issues);remote.append(board);
  }
  const remoteTop=node('div','remote-state');const baseline=node('div','baseline');baseline.append(main('remote',s.remote.main),node('p','file-name','snow-white.md · 기록한 3번째 줄'),node('p','story-line',s.commits[s.remote.main].line));remoteTop.append(baseline);
  const graph=node('div','record-graph'+(s.remote.commits.length===1?' one':''));graph.setAttribute('aria-label','GitHub의 기록 연결');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  for(const id of s.remote.commits)for(const parent of s.commits[id].parents){const a=coords[parent],b=coords[id];const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',`M${a[0]},${a[1]} C${(a[0]+b[0])/2},${a[1]} ${(a[0]+b[0])/2},${b[1]} ${b[0]},${b[1]}`);line.dataset.edge=`${parent}-${id}`;svg.append(line);}graph.append(svg);
  for(const id of s.remote.commits){const b=record('remote',id,true);b.style.left=coords[id][0]+'%';b.style.top=coords[id][1]+'%';graph.append(b);}remoteTop.append(graph);remote.append(remoteTop);
  if(Object.keys(s.remote.branches).length){const branches=node('div','shared-branches');for(const [name,id] of Object.entries(s.remote.branches)){const branch=node('span','branch-chip',`${name} → ${id}`);branch.dataset.motionKey=`remote:branch:${name}`;branches.append(branch);}remote.append(branches);}
  const prs=node('div','pr-list');
  for(const branch of ['story','happy']){const p=s.prs[branch];if(!p)continue;const status=prStatus(s,branch),card=node('article',`pr-card ${status}`);card.dataset.pr=p.id;card.dataset.status=status;card.dataset.motionKey=`pr:${p.id}`;
   card.append(node('div','pr-title',`PR #${p.id} · ${branch==='story'?'이야기':'결말'} 수정`),node('p','pr-route',`${branch} · ${p.head} → main · ${s.remote.main}`),node('p','pr-people','작성 · 나　검토·병합 · 지수'));
   const statuses={review:'지수의 검토 대기',changes:'지수가 수정 요청',approved:'지수 승인 · 합칠 수 있음',conflict:'충돌 · 지금은 합칠 수 없음',merged:'지수가 합침 완료'};
   card.append(node('strong','pr-status',statuses[status]));
   if(p.issue)card.append(node('p','issue-link',`이슈 #${p.issue}와 연결 · Closes #${p.issue}`));
   if(status==='changes')card.append(node('blockquote','review-comment','지수: “일곱”을 넣어 주세요.'));
   if(status==='conflict'){const blocked=button('지수가 결말 PR 합치기',()=>{});blocked.disabled=true;blocked.setAttribute('aria-describedby','conflict-reason');card.append(node('p','conflict-reason','새 기준본과 같은 줄을 다르게 수정했습니다.'),blocked);card.querySelector('.conflict-reason').id='conflict-reason';}
   if(step.zone===`pr-${branch}`)primary(card);prs.append(card);
  }
  if(prs.children.length)remote.append(prs);
  if(s.resolver){
   const panel=node('section','conflict-panel');panel.dataset.motionKey='resolver';panel.setAttribute('aria-label','충돌한 줄과 해결 결과');panel.append(node('h4','','snow-white.md · 같은 3번째 줄'),node('p','common-base',`공통 시작 B: ${TEXT.base}`));
   const compare=node('div','conflict-compare');
   for(const [id,title] of [[s.resolver.base,'현재 GitHub 기준본'],[s.resolver.head,'내 결말 PR']]){const box=node('div','conflict-side');box.dataset.motionKey=`conflict:${id}`;box.append(node('strong','',`${title} · ${id}`),node('p','',s.commits[id].line));compare.append(box);}panel.append(compare);
   const joining=node('div','resolution-arrows','↘　　　　　　　　　↙');joining.setAttribute('aria-hidden','true');panel.append(joining);
   const result=node('div','resolution-target '+(s.resolver.line?'resolved':''));result.dataset.motionKey='resolution:line';
   result.append(node('strong','',s.resolver.line?'✓ 합친 문장':'두 내용을 합칠 자리'));
   if(s.resolver.line){const line=node('p');line.append(document.createTextNode('백설공주는 '),node('mark','story-mark','일곱 난쟁이'),document.createTextNode('와 그 집에서 '),node('mark','happy-mark','행복하게'),document.createTextNode(' 살았습니다.'));result.append(line,node('small','',s.resolver.status==='recorded'?'해결 기록 R을 GitHub의 happy 브랜치에 저장했습니다.':'문장을 수정했습니다. 아직 기록 전입니다.'));}
   else result.append(node('p','',TEXT.resolved),node('small','','이번 실습은 이 문장으로 해결합니다.'));
   panel.append(result);if(step.zone==='resolver')primary(panel);remote.append(panel);
  }
  if(step.zone==='remote')primary(remote);map.append(remote);
  const routes=node('div','repository-routes');routes.append(node('span','','↑ 기록 공유　↓ 복제·받아오기'),node('span','','↓ 지수도 별도로 복제·받아오기'));map.append(routes);
  const locals=node('div','local-repos');
  for(const who of ['mine','jisu']){const r=s.repos[who],card=node('section',`repo local ${who}${step.zone===who?' active':''}`);card.dataset.repo=who;card.dataset.exists=String(Boolean(r));
   card.append(node('p','eyebrow',who==='mine'?'수정·충돌 해결':'검토·승인·병합 담당'),node('h3','',who==='mine'?'내 컴퓨터':'지수의 컴퓨터'));
   if(!r){if(step.zone===who)primary(card);const empty=node('div','empty-repo');empty.dataset.motionKey=`${who}:empty`;empty.append(node('span','folder-icon','▱'),node('strong','','로컬 저장소 없음'),node('p','','아직 프로젝트 폴더와 .git 폴더가 없습니다.'));card.append(empty);}
   else{
    const folder=node('div','project-folder');folder.dataset.motionKey=`${who}:folder`;folder.append(node('h4','folder-title','▱ snow-white/'));
    const git=node('div','git-folder');git.append(node('p','file-name','.git/ · Git 관리 정보'),main(who,r.main));
    const records=node('div','local-records');for(const id of r.commits)records.append(record(who,id));git.append(records);
    const lanes=node('div','branch-lanes');for(const [branch,id] of Object.entries(r.branches)){const lane=node('div','branch-lane'+(r.active===branch?' current':''));lane.dataset.motionKey=`${who}:branch:${branch}`;lane.append(node('strong','',`↳ ${branch} → ${id}`),node('small','',r.active===branch?'현재 작업 공간':'기록을 가리키는 별도 이름'));lanes.append(lane);}git.append(lanes);folder.append(git);
    const file=node('div','working-file');file.dataset.motionKey=`${who}:file`;file.append(node('p','file-name',`snow-white.md · 3번째 줄 · 현재 ${r.active}`),node('p','story-line',r.working),node('small','file-state',r.dirty?'파일 저장됨 · 새 기록은 아직 없음':'기록한 내용과 같음'));folder.append(file);card.append(folder);
    card.append(node('p','sync-note',r.main===s.remote.main?'GitHub 기준본과 같습니다.':`${who==='mine'?'내':'지수의'} 기준본은 ${r.main}, GitHub 기준본은 ${s.remote.main}입니다.`));
   }
   if(r&&step.zone===who)primary(card);locals.append(card);
  }map.append(locals);root.append(map);
  const reference=node('details','reference');reference.append(node('summary','','개념과 실습 범위 보기'));
  for(const text of ['B, C, D 등은 파일 이름이 아니라 기록 이름입니다. 각 기록은 그때의 파일 내용을 보관합니다.','복제는 프로젝트 폴더와 .git을 만듭니다. 브랜치는 별도 폴더를 만들지 않고 기존 기록을 가리킵니다.',MODES[s.mode].issues?'지수는 모든 PR을 검토하고 합칩니다. 두 PR은 내가 서로 다른 작업 브랜치에서 작성합니다.':'PR의 작성자는 나입니다. 지수는 수정 내용을 검토하고 기준본에 합칩니다.','이슈 할당은 담당자를 정하는 일입니다. 파일이나 브랜치를 자동으로 만들지 않습니다.','충돌은 PR의 개수 때문에 생기는 것이 아닙니다. 이 실습에서는 같은 줄의 서로 다른 변경을 합칠 때 충돌합니다.','충돌 해결은 GitHub 편집기에서 진행하는 사례입니다. 해결 기록 R은 GitHub의 happy 브랜치에 생깁니다.','실습은 실제 GitHub 저장소를 바꾸지 않습니다. 탭별 진행 상태는 별도로 유지되며 새로고침하면 초기화됩니다.'])reference.append(node('p','',text));root.append(reference);
 }
 return {render};
}
