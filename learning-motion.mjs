const pick='[data-motion-key],[data-record],.map-main,[data-branch],.map-working-file,[data-issue],[data-pr],.coord-main,.coord-baseline,.coord-local-branch';
function key(n){
 if(n.dataset.motionKey)return n.dataset.motionKey;
 if(n.dataset.record)return n.dataset.record;
 if(n.matches('.map-main'))return `main:${n.closest('[data-repo]').dataset.repo}`;
 if(n.dataset.branch)return `branch:${n.dataset.branch}`;
 if(n.matches('.map-working-file'))return `file:${n.closest('[data-repo]')?.dataset.repo||n.closest('[data-coord-repo]')?.dataset.coordRepo}`;
 if(n.dataset.issue)return `issue:${n.dataset.issue}`;
 if(n.dataset.pr)return `pr:${n.dataset.pr}`;
 if(n.matches('.coord-main'))return 'coord:main';
 const owner=n.closest('[data-coord-repo]')?.dataset.coordRepo;
 if(n.matches('.coord-baseline'))return `coord:main:${owner}`;
 return `coord:branch:${owner}`;
}
export function createLearningMotion(getRoot,getSummary){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let running=null;
 function capture(){
  const root=getRoot(), entries=new Map();
  for(const n of root.querySelectorAll(pick)){
   const r=n.getBoundingClientRect();if(!r.width||!r.height)continue;
   entries.set(key(n),{node:n,rect:r,text:n.textContent,clone:n.cloneNode(true)});
  }
  return {entries,edges:new Set([...root.querySelectorAll('[data-edge]')].map(n=>n.dataset.edge))};
 }
 function cancel(){running?.finish(false);}
 async function play(before,change){
  cancel();const root=getRoot(),after=capture(),summary=getSummary();
  if(summary){
   summary.replaceChildren();summary.hidden=false;
   const text=document.createElement('p');text.textContent=root.id==='collaboration-map'?change.detail:'방금 바뀐 위치를 다시 볼 수 있습니다.';
   if(root.id==='collaboration-map'){const observation=document.querySelector('#mission-observation');if(observation)observation.hidden=true;
    if(change.concept){const concept=document.createElement('small');concept.textContent=`개념 이름 · ${change.concept}`;text.append(concept);}}
   const replay=document.createElement('button');replay.type='button';replay.textContent='변화 다시 보기';replay.dataset.motionReplay='';
   replay.onclick=()=>play(capture(),{...change,replay:true});summary.append(text,replay);
  }
  const changed=[...after.entries].filter(([id,a])=>change.replay?change.focusKeys?.includes(id):!before.entries.has(id)||before.entries.get(id).text!==a.text);
  change={...change,focusKeys:changed.map(([id])=>id)};
  for(const [,a] of changed)a.node.classList.add('change-landed');
  if(reduced.matches)return true;
  const duration=change.kind==='first-merge'?1700:change.moves?.length?1350:1050, animations=[], overlays=[],hidden=[], disabled=new Map();
  const controls=[...new Set([...root.querySelectorAll('button,input,select'),...document.querySelectorAll('#scene-back,#scene-forward,#scene-jump,#coord-back,#coord-forward,#coord-jump,[data-motion-replay]')])];
  for(const n of controls){disabled.set(n,n.disabled);n.disabled=true;}
  document.body.dataset.learningTransition='true';root.setAttribute('aria-busy','true');
  const instruction=root.id==='collaboration-map'?document.querySelector('#action-instruction'):root.querySelector('#coord-instruction');
  const nextInstruction=instruction?.textContent;if(instruction)instruction.textContent=change.title;
  const hint=root.id==='collaboration-map'?document.querySelector('#action-hint'):null;const nextHint=hint?.textContent;if(hint)hint.textContent=change.detail;
  const animate=(n,frames,options={})=>{const a=n.animate(frames,{duration:700,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both',...options});animations.push(a);return a;};
  const visible=r=>r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;
  if(!change.replay){
   for(const [id,b] of before.entries)if(!after.entries.has(id)&&visible(b.rect)){
    const old=b.clone;old.classList.add('learning-old');old.setAttribute('aria-hidden','true');old.inert=true;
    for(const n of [old,...old.querySelectorAll('*')])for(const attr of [...n.attributes])if(attr.name==='id'||attr.name.startsWith('data-'))n.removeAttribute(attr.name);
    Object.assign(old.style,{position:'fixed',left:b.rect.left+'px',top:b.rect.top+'px',width:b.rect.width+'px',height:b.rect.height+'px',margin:'0',transform:'none',zIndex:60,pointerEvents:'none'});
    document.body.append(old);overlays.push(old);animate(old,[{opacity:1,scale:'1'},{opacity:0,scale:'.9'}],{duration:400});
   }
   for(const [id,a] of after.entries){
    const b=before.entries.get(id);
    if(!b){animate(a.node,[{opacity:0,scale:'.65'},{opacity:1,scale:'1'}],{delay:change.moves?.length?650:100,duration:550});continue;}
    const dx=b.rect.left-a.rect.left,dy=b.rect.top-a.rect.top;
    if(Math.abs(dx)+Math.abs(dy)>2&&visible(a.rect))animate(a.node,[{translate:`${dx}px ${dy}px`},{translate:'0px 0px'}]);
    if(a.text!==b.text&&visible(a.rect)&&!id.startsWith('file:')){
     const old=b.clone;old.classList.add('learning-old');old.setAttribute('aria-hidden','true');old.inert=true;
     for(const n of [old,...old.querySelectorAll('*')])for(const attr of [...n.attributes])if(attr.name==='id'||attr.name.startsWith('data-'))n.removeAttribute(attr.name);
     Object.assign(old.style,{position:'fixed',left:a.rect.left+'px',top:a.rect.top+'px',width:a.rect.width+'px',height:a.rect.height+'px',margin:'0',transform:'none',zIndex:60,pointerEvents:'none'});
     document.body.append(old);overlays.push(old);
     const delay=change.kind==='first-merge'&&a.node.matches('.conflict')?750:250;
     animate(old,[{opacity:1},{opacity:0}],{duration:500,delay});animate(a.node,[{opacity:0},{opacity:1}],{duration:500,delay:delay+100});
    }
   }
   for(const edge of root.querySelectorAll('[data-edge]'))if(!before.edges.has(edge.dataset.edge)){
    animate(edge,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:800,delay:200});
   }
  }
  for(const [,a] of changed)animate(a.node,[{boxShadow:'0 0 0 0px #92af4800'},{boxShadow:'0 0 0 5px #92af4855',offset:.55},{boxShadow:'0 0 0 0px #92af4800'}],{duration:900,delay:200});
  const dock=document.createElement('aside');dock.className='learning-change';dock.setAttribute('aria-hidden','true');dock.dataset.motionKind=change.kind;
  const title=document.createElement('strong');title.textContent=change.title;dock.append(title);
  const detail=document.createElement('p');detail.textContent=change.detail;dock.append(detail);
  const moves=change.moves||[];
  if(moves.length){
   const stage=document.createElement('div');stage.className='learning-transfer';
   const source=document.createElement('span');source.className='transfer-origin';source.textContent=moves.map(m=>m.token).join(' + ');
   const destination=document.createElement('span');destination.className='transfer-destination';destination.textContent=source.textContent;
   const sourceName=document.createElement('small');sourceName.className='transfer-origin-name';sourceName.textContent=moves[0].fromName;
   const destinationName=document.createElement('small');destinationName.className='transfer-destination-name';destinationName.textContent=moves[0].toName;
   const traveling=source.cloneNode(true);traveling.className='transfer-copy';stage.append(source,destination,sourceName,destinationName,traveling);dock.append(stage);
   document.body.append(dock);overlays.push(dock);
   const left=source.getBoundingClientRect(),right=destination.getBoundingClientRect();
   animate(traveling,[{translate:'0 0',opacity:0},{translate:'0 0',opacity:1,offset:.15},{translate:`${right.left-left.left}px 0`,opacity:1}],{duration:850,delay:80});
   animate(destination,[{opacity:0},{opacity:1}],{duration:250,delay:900});
  }else{document.body.append(dock);overlays.push(dock);}
  if(change.consequence){const consequence=document.createElement('p');consequence.className='transfer-consequence';consequence.textContent=change.consequence;dock.append(consequence);animate(consequence,[{opacity:0,translate:'0 6px'},{opacity:1,translate:'0 0'}],{delay:900,duration:250});}
  animate(dock,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:180});
  for(const move of moves){
   const from=before.entries.get(move.from),to=after.entries.get(move.to);if(!from||!to||!visible(from.rect)||!visible(to.rect))continue;
   const token=document.createElement('div');token.className='learning-token';token.textContent=move.token;token.setAttribute('aria-hidden','true');
   const x=from.rect.left+from.rect.width/2,y=from.rect.top+from.rect.height/2,dx=to.rect.left+to.rect.width/2-x,dy=to.rect.top+to.rect.height/2-y;
   Object.assign(token.style,{left:x+'px',top:y+'px'});document.body.append(token);overlays.push(token);
   animate(token,[{translate:'0 0',opacity:0},{translate:'0 0',opacity:1,offset:.1},{translate:`${dx*.5}px ${dy*.5-45}px`,opacity:1,offset:.6},{translate:`${dx}px ${dy}px`,opacity:0}],{duration:1000});
  }
  return new Promise(resolve=>{
   const timer=setTimeout(()=>finish(true),duration);
   function finish(complete){
    if(running?.finish!==finish)return;
    clearTimeout(timer);for(const a of animations)a.cancel();for(const n of overlays)n.remove();for(const n of hidden)n.style.visibility='';
    for(const [n,value] of disabled)if(n.isConnected)n.disabled=value;
    if(instruction?.isConnected)instruction.textContent=nextInstruction;if(hint?.isConnected)hint.textContent=nextHint;root.removeAttribute('aria-busy');delete document.body.dataset.learningTransition;running=null;resolve(complete);
   }
   running={finish};
  });
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)cancel();});
 return {capture,play,cancel,get busy(){return Boolean(running);}};
}

export function missionChange(kind,before,after,observation){
 if(kind==='navigate')return {kind,title:'선택한 단계의 상태로 바뀝니다',detail:'Git 기록을 삭제하지 않습니다. 선택한 학습 단계의 상태를 다시 보여 줍니다.',concept:'단계 탐색',moves:[]};
 const move=(from,to,token,fromName,toName)=>({from,to,token,fromName,toName});
 const transfers={
  branch:[move('main:local','branch:local','B','내 기준본','내 작업 공간')],
  commit:[move('file:local','local:C','C','저장한 파일','새 기록')],
  'commit-revision':[move('file:local','local:D','D','수정한 파일','새 기록')],
  'peer-commit':[move('file:peer','peer:T','T','지수의 파일','새 기록')],
  push:[move('local:C','remote:C','C','내 저장소','GitHub 저장소')],
  'push-revision':[move('local:D','remote:D','D','내 저장소','GitHub 저장소')],
  'peer-push':[move('peer:T','remote:T','T','지수의 저장소','GitHub 저장소')],
  'peer-merge':[move('remote:T','main:remote','T','지수의 제목','GitHub 기준본 P')],
  merge:[move('remote:P','main:remote','P','두 기록','GitHub 기준본 M'),move('remote:D','main:remote','D','두 기록','GitHub 기준본 M')],
  pull:[move('remote:M','main:local','M','GitHub 저장소','내 기준본')],
  'peer-pull':[move('remote:M','main:peer','M','GitHub 저장소','지수의 기준본')],
 };
 const titles={branch:'같은 기록에서 작업 공간이 갈라집니다',save:'파일 내용이 바뀝니다',commit:'파일 상태를 새 기록으로 남깁니다',push:'원래 기록을 남기고 복사합니다','peer-edit':'지수의 파일만 바뀝니다','peer-commit':'지수의 새 기록이 생깁니다','peer-push':'지수의 기록을 복사합니다','peer-merge':'GitHub 기준본이 B에서 P로 바뀝니다','open-pr':'검토 요청이 생깁니다','request-changes':'지수의 수정 의견이 도착했습니다',revise:'수정한 파일을 저장합니다','commit-revision':'이전 기록 뒤에 D가 생깁니다','push-revision':'수정 기록 D를 복사합니다',approve:'지수의 승인 상태가 바뀝니다',merge:'두 변경을 연결해 기준본 M을 만듭니다',pull:'내 기준본이 B에서 M으로 바뀝니다','peer-pull':'지수의 기준본이 B에서 M으로 바뀝니다'};
 return {kind,title:titles[kind]||'실습 상태가 바뀝니다',detail:observation?.[0]||'',concept:observation?.[1],moves:transfers[kind]||[]};
}
export function coordinationChange(kind,before,after,observation){
 if(kind==='navigate')return {kind,title:'선택한 단계의 상태로 바뀝니다',detail:'Git 기록을 삭제하지 않습니다. 선택한 학습 단계의 상태를 다시 보여 줍니다.',moves:[]};
 const remaining=after.first==='mine'?'jisu':'mine';
 const pr=owner=>owner==='mine'?'pr:31':'pr:32';
 const move=(from,to,token,fromName,toName)=>({from,to,token,fromName,toName});
 const transfers={
  'branch-mine':[move('coord:main:mine','coord:branch:mine','O','내 기준본','ending 작업 공간')],
  'branch-jisu':[move('coord:main:jisu','coord:branch:jisu','O','지수의 기준본','seven 작업 공간')],
  'commit-mine':[move('coord:branch:mine','coord:branch:mine','A','내 파일','새 기록')],
  'commit-jisu':[move('coord:branch:jisu','coord:branch:jisu','B','지수의 파일','새 기록')],
  'push-mine':[move('coord:branch:mine','coord:remote:mine','A','내 저장소','GitHub 작업 공간')],
  'push-jisu':[move('coord:branch:jisu','coord:remote:jisu','B','지수의 저장소','GitHub 작업 공간')],
  'first-merge':[move(pr(after.first),'coord:main',after.first==='mine'?'A':'B','먼저 합친 PR','GitHub 기준본 M1')],
  resolve:[move('coord:resolver',pr(remaining),'R','선택한 해결 내용','남은 PR의 새 기록')],
  'merge-rest':[move(pr(remaining),'coord:main','R','남은 PR','GitHub 기준본 M2')],
  'pull-mine':[move('coord:main','coord:main:mine','M2','GitHub 저장소','내 기준본')],
  'pull-jisu':[move('coord:main','coord:main:jisu','M2','GitHub 저장소','지수의 기준본')],
 };
 const title=kind==='first-merge'?'기준본이 바뀌면서 남은 PR에 충돌이 생깁니다':kind.startsWith('assign')?'이슈의 담당자만 바뀝니다':kind.startsWith('push')?'원래 기록을 남기고 GitHub에 복사합니다':kind.startsWith('branch')?'같은 기록에서 작업 공간이 갈라집니다':kind==='resolve'?'남은 PR에 해결 기록 R이 생깁니다':'변경한 위치를 확인하세요';
 return {kind,title,detail:observation[0],moves:transfers[kind]||[],consequence:kind==='first-merge'?`남은 PR #${remaining==='mine'?31:32} · 합칠 수 있음 → 충돌`:null};
}
