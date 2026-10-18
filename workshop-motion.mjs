import {observation,MODES} from './workshop-model.mjs';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
export function changeDescription(before,after,type){
 const note=observation(after),moves=[];
 const move=(from,to,token,fromName,toName)=>moves.push({from,to,token,fromName,toName});
 if(type.startsWith('clone-')){const who=type.slice(6);move('record:remote:B',`record:${who}:B`,'B','GitHub 저장소',who==='mine'?'내 .git':'지수의 .git');}
 if(type.startsWith('assign-')){const id=type.endsWith('story')?21:22;move('person:mine',`assignee:${id}`,'나','담당자 목록',`이슈 #${id}`);}
 if(type.startsWith('branch-')){const branch=type.slice(7);move('mine:main',`mine:branch:${branch}`,'B','내 기준본',`${branch} 브랜치`);}
 const records={'commit-story':'C','commit-revision':'D','commit-happy':'H'};
 if(records[type])move('mine:file',`record:mine:${records[type]}`,records[type],'저장한 파일','새 기록');
 const shared={'push-story':'C','push-revision':'D','push-happy':'H'};
 if(shared[type])move(`record:mine:${shared[type]}`,`record:remote:${shared[type]}`,shared[type],'내 저장소','GitHub 저장소');
 if(type==='merge-story')move('pr:31','remote:main',after.remote.main,'지수가 합친 PR #31','GitHub 기준본');
 if(type==='resolve'){move(`conflict:${before.resolver.base}`,'resolution:line','일곱 난쟁이','두 변경','해결 문장');move(`conflict:${before.resolver.head}`,'resolution:line','행복하게','두 변경','해결 문장');}
 if(type==='commit-resolution')move('resolution:line','record:remote:R','R','해결한 문장','GitHub happy');
 if(type==='merge-happy')move('pr:32','remote:main','M2','지수가 합친 PR #32','GitHub 기준본');
 if(type.startsWith('pull-')){const who=type.slice(5);move('remote:main',`${who}:main`,after.remote.main,'GitHub 기준본',who==='mine'?'내 기준본':'지수의 기준본');}
 if(type==='navigate')return {title:'선택한 학습 단계',detail:'선택한 단계의 상태를 다시 보여 줍니다. 실제 Git 기록을 삭제하는 동작은 아닙니다.',concept:'이전·다음 탐색',moves};
 return {...note,moves,consequence:type==='merge-story'&&MODES[after.mode].issues?'PR #32 · 합칠 수 있음 → 충돌':null,
  comparison:type==='resolve'?[before.commits[before.resolver.base].line,before.commits[before.resolver.head].line,after.resolver.line]:null};
}
export function createWorkshopMotion(){
 let pending=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function capture(){const result=new Map();for(const n of document.querySelectorAll('#workshop [data-motion-key]')){const r=n.getBoundingClientRect();if(r.width&&r.height)result.set(n.dataset.motionKey,{rect:r,text:n.textContent,clone:n.cloneNode(true)});}return result;}
 function cancel(){pending?.finish(false);}
 async function play(before,description){
  cancel();const root=document.querySelector('#workshop'),dialog=document.querySelector('#change-dialog');dialog.replaceChildren();
  const heading=el('h2','',description.title);heading.id='change-title';dialog.append(heading);
  dialog.append(el('p','change-detail',description.detail),el('p','change-concept',`개념 이름 · ${description.concept}`));
  const after=capture(),animations=[],floating=[];
  const animate=(n,frames,options={})=>{if(reduced.matches)return;const a=n.animate(frames,{duration:850,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both',...options});animations.push(a);};
  const visible=r=>r.top>=0&&r.bottom<=innerHeight;
  for(const [key,entry] of after){const old=before.get(key),target=root.querySelector(`[data-motion-key="${key}"]`);if(!target)continue;
   if(!old){target.classList.add('just-changed');animate(target,[{opacity:0,scale:'.8'},{opacity:1,scale:'1'}]);}
   else if(old.text!==entry.text){target.classList.add('just-changed');animate(target,[{boxShadow:'0 0 0 0 #90a94c00'},{boxShadow:'0 0 0 5px #90a94c55',offset:.6},{boxShadow:'0 0 0 0 #90a94c00'}]);}
  }
  if(description.moves.length){
   const track=el('div','change-track');const source=el('div','transfer-source'),destination=el('div','transfer-destination');
   const tokens=description.moves.map(m=>m.token).join(' + ');source.append(el('span','transfer-token',tokens),el('small','',description.moves[0].fromName));destination.append(el('span','transfer-token arrived',tokens),el('small','',description.moves[0].toName));
   const flight=el('span','transfer-token transfer-flight',tokens);track.append(source,el('span','transfer-arrow','→'),destination,flight);dialog.append(track);
  }
  if(description.comparison){const compare=el('div','change-comparison');description.comparison.forEach((text,i)=>{const row=el('p',i===2?'result':'');row.append(el('strong','',i===0?'기준본':i===1?'내 PR':'합친 문장'),document.createTextNode(text));compare.append(row);});dialog.append(compare);}
  if(description.consequence)dialog.append(el('p','change-consequence',description.consequence));
  dialog.append(el('p','reading-note','이 카드는 자동으로 사라지지 않습니다.'));
  const next=el('button','primary','확인하고 계속');next.type='button';next.id='change-continue';dialog.append(next);
  root.inert=true;document.body.dataset.transition='reading';dialog.showModal();
  const flight=dialog.querySelector('.transfer-flight');
  if(flight){const a=dialog.querySelector('.transfer-source .transfer-token').getBoundingClientRect(),b=dialog.querySelector('.transfer-destination .transfer-token').getBoundingClientRect(),track=dialog.querySelector('.change-track').getBoundingClientRect();
   Object.assign(flight.style,{left:a.left-track.left+'px',top:a.top-track.top+'px',width:a.width+'px'});animate(flight,[{translate:'0 0',opacity:0},{translate:'0 0',opacity:1,offset:.12},{translate:`${b.left-a.left}px ${b.top-a.top}px`,opacity:1}],{duration:1100});animate(dialog.querySelector('.arrived'),[{opacity:0},{opacity:1}],{delay:900,duration:300});}
  if(description.consequence)animate(dialog.querySelector('.change-consequence'),[{opacity:0,translate:'0 6px'},{opacity:1,translate:'0 0'}],{delay:1000,duration:300});
  // Actual-map copies accompany the persistent diagram when both endpoints fit on screen.
  for(const move of description.moves){const a=before.get(move.from),b=after.get(move.to);if(!a||!b||!visible(a.rect)||!visible(b.rect)||reduced.matches)continue;
   const dot=el('div','map-flight',move.token);dot.setAttribute('aria-hidden','true');Object.assign(dot.style,{left:a.rect.left+a.rect.width/2+'px',top:a.rect.top+a.rect.height/2+'px'});document.body.append(dot);floating.push(dot);animate(dot,[{translate:'0 0',opacity:0},{translate:'0 0',opacity:1,offset:.1},{translate:`${b.rect.left+b.rect.width/2-a.rect.left-a.rect.width/2}px ${b.rect.top+b.rect.height/2-a.rect.top-a.rect.height/2}px`,opacity:0}],{duration:1100});}
  return new Promise(resolve=>{
   function finish(complete){if(pending?.finish!==finish)return;for(const a of animations)a.cancel();for(const n of floating)n.remove();dialog.close();root.inert=false;delete document.body.dataset.transition;pending=null;resolve(complete);}
   next.onclick=()=>finish(true);dialog.oncancel=event=>{event.preventDefault();finish(true);};pending={finish,animations,floating};next.focus();
  });
 }
 reduced.addEventListener('change',()=>{if(reduced.matches&&pending){for(const a of pending.animations)a.cancel();for(const n of pending.floating)n.remove();}});
 return {capture,play,cancel,get busy(){return Boolean(pending);}};
}
