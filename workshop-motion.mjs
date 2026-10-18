import {observation,MODES} from './workshop-model.mjs';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
export function changeDescription(before,after,type){
 const note=observation(after),moves=[];
 const move=(from,to,token,fromName,toName)=>moves.push({from,to,token,fromName,toName});
 if(type.startsWith('clone-')){const who=type.slice(6),id=after.repos[who].main;move('remote:main',`${who}:main`,id,'GitHub 저장소',who==='mine'?'내 저장소':who==='jisu'?'지수의 저장소':'민수의 저장소');if(who==='jisu')move('record:remote:H','record:jisu:H','H','GitHub happy','지수의 저장소');}
 if(type.startsWith('assign-')){const id=type.endsWith('story')?21:type.endsWith('happy')?22:23,who=id===23?'minsu':'mine';move(`person:${who}`,`assignee:${id}`,who==='mine'?'나':'민수','담당자 목록',`이슈 #${id}`);}
 if(type.startsWith('branch-')){const branch=type.slice(7),who=branch==='proposal'?'minsu':'mine';move(`${who}:main`,`${who}:branch:${branch}`,branch,'같은 기록 B',`${branch} 브랜치`);}
 if(type==='checkout-jisu')move('record:jisu:H','jisu:branch:happy','happy','복제한 H','지수의 PR 브랜치');
 if(type==='inspect-conflict')move('jisu:main','jisu:file','M1','지수의 main','지수의 happy · 충돌');
 const records={'commit-story':'C','commit-revision':'D','commit-happy':'H','commit-proposal':'S'};
 if(records[type]){const who=type==='commit-proposal'?'minsu':'mine';move(`${who}:file`,`record:${who}:${records[type]}`,records[type],'저장한 파일','새 기록');}
 const shared={'push-story':'C','push-revision':'D','push-happy':'H','push-proposal':'S','push-resolution':'R'};
 if(shared[type]){const who=type==='push-proposal'?'minsu':type==='push-resolution'?'jisu':'mine';move(`record:${who}:${shared[type]}`,`record:remote:${shared[type]}`,shared[type],who==='mine'?'내 저장소':who==='jisu'?'지수의 저장소':'민수의 저장소','GitHub 저장소');}
 if(type==='merge-story')move('pr:31','remote:main',before.prs.story.head,'지수가 합친 PR #31','GitHub 기준본');
 if(type==='resolve'){move(`conflict:${before.resolver.base}`,'resolution:line','일곱 난쟁이','두 변경','해결 문장');move(`conflict:${before.resolver.head}`,'resolution:line','행복하게','두 변경','해결 문장');}
 if(type==='commit-resolution')move('jisu:file','record:jisu:R','R','지수의 해결한 파일','지수의 로컬 happy');
 if(type==='merge-happy')move('pr:32','remote:main',before.prs.happy.head,'지수가 합친 PR #32','GitHub 기준본');
 if(type.startsWith('pull-')){const who=type.slice(5);move('remote:main',`${who}:main`,after.remote.main,'GitHub 기준본',who==='mine'?'내 기준본':'지수의 기준본');}
 if(type==='navigate')return {kind:type,title:'선택한 학습 단계',detail:'선택한 단계의 상태를 다시 보여 줍니다. 실제 Git 기록을 삭제하는 동작은 아닙니다.',concept:'이전·다음 탐색',moves};
 const diagram=type.startsWith('branch-')?{kind:'branch',name:type.slice(7),record:'B'}:type==='checkout-jisu'?{kind:'branch',name:'happy',record:'H'}:records[type]?{kind:'record',from:'파일',to:records[type]}:type==='merge-story'||type==='merge-happy'?{kind:'merge',from:`${before.remote.main} + ${before.prs[type==='merge-story'?'story':'happy'].head}`,to:after.remote.main}:type==='commit-resolution'?{kind:'record',from:'해결한 문장',to:'R'}:null;
 return {...note,kind:type,moves,diagram,consequence:type==='merge-story'&&MODES[after.mode].issues?'PR #32 · 합칠 수 있음 → 충돌':null,
  comparison:type==='resolve'?[before.commits[before.resolver.base].line,before.commits[before.resolver.head].line,after.resolver.line]:null};
}
// Replaying a visited snapshot must match its visible observation, not the navigation action.
export function replayDescription(state){
 if(!state.event)return null;
 return changeDescription(state.history.at(-1)||state,state,state.event.type);
}
export function createWorkshopMotion(){
 let pending=null,userInterrupted=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function capture(){
  const result=new Map();
  for(const n of document.querySelectorAll('#workshop [data-motion-key]')){
   const r=n.getBoundingClientRect();if(!r.width||!r.height)continue;
   result.set(n.dataset.motionKey,{node:n,rect:{left:r.left+scrollX,top:r.top+scrollY,width:r.width,height:r.height},text:n.textContent,className:n.className,
    status:n.querySelector('.pr-status')?.textContent,route:n.querySelector('.pr-route')?.textContent});
  }
  return result;
 }
 function describe(description){
  const summary=document.querySelector('#last-change');summary?.querySelector('.inline-explanation')?.remove();
  if(!summary||!description||(!description.moves.length&&!description.comparison&&!description.consequence))return;
  const details=el('details','inline-explanation');details.append(el('summary','','변경 도식 보기'));
  if(description.diagram?.kind==='branch'){
   const diagram=el('div','branch-explanation'),pointers=el('div','branch-pointers');pointers.append(el('span','branch-pointer','main →'),el('span','branch-pointer new-pointer',`${description.diagram.name} →`));
   diagram.append(pointers,el('span','branch-record',description.diagram.record),el('small','','기록은 하나, 가리키는 이름은 둘입니다.'));details.append(diagram);
  }else if(description.moves.length&&!description.comparison){
   const track=el('div','change-track'),source=el('div','transfer-source'),destination=el('div','transfer-destination');
   const from=description.diagram?.from||description.moves.map(m=>m.token).join(' + '),to=description.diagram?.to||from;
   source.append(el('span','transfer-token',from),el('small','',description.diagram?.kind==='merge'?'기준본 + PR 기록':description.moves[0].fromName));
   destination.append(el('span','transfer-token',to),el('small','',description.moves[0].toName));track.append(source,el('span','transfer-arrow','→'),destination);details.append(track);
  }
  if(description.comparison){const comparison=el('div','change-comparison');description.comparison.forEach((text,i)=>{const row=el('p',i===2?'result':i===0?'source-story':'source-happy');row.append(el('strong','',i===0?'현재 기준본':i===1?'내 PR':'↓ 두 내용을 합친 문장'),document.createTextNode(text));comparison.append(row);});details.append(comparison);}
  if(description.consequence)details.append(el('p','change-consequence',description.consequence));
  summary.append(details);
 }
 function cancel(){pending?.finish(false);}
 async function play(before,description){
  cancel();userInterrupted=false;const root=document.querySelector('#workshop'),after=capture();
  const changed=[...after].filter(([id,a])=>!before.has(id)||before.get(id).text!==a.text);
  const leaves=changed.filter(([,a])=>!changed.some(([,b])=>a!==b&&a.node.contains(b.node)));
  for(const [,a] of leaves)a.node.classList.add('just-changed');
  if(reduced.matches)return true;
  const controls=new Map([...root.querySelectorAll('button,select')].map(n=>[n,n.disabled]));for(const n of controls.keys())n.disabled=true;
  const instruction=document.querySelector('#action-instruction'),nextInstruction=instruction.textContent;instruction.textContent=`${description.title} · 변화 보기`;
  root.setAttribute('aria-busy','true');document.body.dataset.transition='animating';
  const animations=[],floating=[],timers=[],restores=[];let frame=0,follow=true;
  const animate=(n,frames,options={})=>{const a=n.animate(frames,{duration:600,easing:'ease-out',fill:'both',...options});animations.push(a);};
  const schedule=(fn,ms)=>{timers.push(setTimeout(fn,ms));};
  const restoreLater=(fn,ms)=>{restores.push(fn);schedule(fn,ms);};
  const centers=entry=>({x:entry.rect.left+entry.rect.width/2,y:entry.rect.top+entry.rect.height/2});
  const moves=description.moves.flatMap(m=>{const from=after.get(m.from)||before.get(m.from),to=after.get(m.to);return from&&to?[{...m,from:centers(from),to:centers(to),target:to.node}]:[];});
  const arrival=moves.length?1150:400,landed=moves.length?1850:1100;
  const conflict=description.consequence?root.querySelector('.pr-card.conflict'):null;
  const duration=conflict?landed+850:landed;
  const scrollAt=y=>window.scrollTo({top:Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,y-innerHeight/2)),behavior:'instant'});
  let camera=false;
  if(moves.length){
   const ys=moves.flatMap(m=>[m.from.y,m.to.y]),low=Math.min(...ys)-45,high=Math.max(...ys)+45;
   camera=high-low>innerHeight-60;
   if(camera)scrollAt(moves[0].from.y);else if(low<scrollY+12||high>scrollY+innerHeight-12)scrollAt((low+high)/2);
  }else if(leaves.length){const target=leaves[0][1].node,r=target.getBoundingClientRect();if(r.top<12||r.bottom>innerHeight-12)target.scrollIntoView({block:'center',behavior:'instant'});}
  // Preserve the old baseline/status until its incoming change arrives.
  for(const [id,a] of changed){const old=before.get(id);
   if(old&&id.endsWith(':main')){const text=a.node.textContent;a.node.textContent=old.text;restoreLater(()=>{a.node.textContent=text;},arrival);}
   if(old&&id.startsWith('pr:')){
    const status=a.node.querySelector('.pr-status'),route=a.node.querySelector('.pr-route'),statusText=status?.textContent,routeText=route?.textContent,classes=a.node.className;
    if(status&&old.status)status.textContent=old.status;if(route&&old.route)route.textContent=old.route;a.node.className=old.className;
    restoreLater(()=>{if(status)status.textContent=statusText;if(route)route.textContent=routeText;a.node.className=classes;},a.node===conflict?landed:arrival);
   }
  }
  for(const [id,a] of leaves){
   const incoming=moves.some(m=>m.target===a.node),cloned=!before.has(id)&&description.kind?.startsWith('clone-'),delay=incoming||cloned?arrival:before.has(id)?350:100;
   if(!before.has(id))animate(a.node,[{opacity:0,scale:'.75'},{opacity:1,scale:'1'}],{delay,duration:400});
   animate(a.node,[{boxShadow:'0 0 0 0 #90a94c00'},{boxShadow:'0 0 0 5px #90a94c66',offset:.5},{boxShadow:'0 0 0 0 #90a94c00'}],{delay:a.node===conflict?landed:delay,duration:650});
  }
  for(const move of moves)if(!leaves.some(([,entry])=>entry.node===move.target))animate(move.target,[{boxShadow:'0 0 0 0 #90a94c00'},{boxShadow:'0 0 0 5px #90a94c66',offset:.5},{boxShadow:'0 0 0 0 #90a94c00'}],{delay:arrival,duration:650});
  for(const move of moves){const dot=el('div','map-flight',move.token);dot.dataset.flight='';dot.setAttribute('aria-hidden','true');document.body.append(dot);floating.push(dot);move.dot=dot;}
  const stopFollowing=()=>{follow=false;userInterrupted=true;};
  const onKey=event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)){follow=false;userInterrupted=true;}};
  const layoutChanged=()=>{userInterrupted=true;pending?.finish(true);};
  root.addEventListener('toggle',layoutChanged,true);addEventListener('resize',layoutChanged);
  addEventListener('wheel',stopFollowing,{passive:true});addEventListener('touchstart',stopFollowing,{passive:true});addEventListener('keydown',onKey);
  if(conflict)schedule(()=>{if(follow)conflict.scrollIntoView({block:'center',behavior:'instant'});},landed);
  const start=performance.now();
  function tick(now){
   const progress=Math.max(0,Math.min(1,(now-start-200)/950)),ease=progress*progress*(3-2*progress);
   for(const move of moves){
    const x=move.from.x+(move.to.x-move.from.x)*ease,y=move.from.y+(move.to.y-move.from.y)*ease-32*Math.sin(Math.PI*ease);
    Object.assign(move.dot.style,{left:x+'px',top:y+'px',opacity:now-start<100?'0':progress>=1?String(Math.max(0,1-(now-start-1150)/220)):'1'});
    if(camera&&follow&&move===moves[0]&&now-start<=1150)scrollAt(y);
   }
   if(now-start<duration)frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return new Promise(resolve=>{
   function finish(complete){
    if(pending?.finish!==finish)return;
    cancelAnimationFrame(frame);for(const timer of timers)clearTimeout(timer);for(const fn of restores)fn();for(const a of animations)a.cancel();for(const n of floating)n.remove();
    for(const [n,disabled] of controls)if(n.isConnected)n.disabled=disabled;
    root.removeEventListener('toggle',layoutChanged,true);removeEventListener('resize',layoutChanged);removeEventListener('wheel',stopFollowing);removeEventListener('touchstart',stopFollowing);removeEventListener('keydown',onKey);
    if(instruction.isConnected)instruction.textContent=nextInstruction;root.removeAttribute('aria-busy');delete document.body.dataset.transition;pending=null;resolve(complete);
   }
   pending={finish};schedule(()=>finish(true),duration);
  });
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)pending?.finish(true);});
 return {capture,describe,play,cancel,get interrupted(){return userInterrupted;},get busy(){return Boolean(pending);}};
}
