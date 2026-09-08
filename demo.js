/* Educational diagrams; not a recording of GitHub product UI. */
(() => {
const F='#101d14', L='#a1b61c', M='#566151', G='#d9dfda';
const text=(x,y,s,size=24,fill=F,weight=500,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${s}</text>`;
const line=(x1,y1,x2,y2,stroke=F,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
const circle=(x,y,label,active=false)=>`<circle cx="${x}" cy="${y}" r="16" fill="${active?L:'#fff'}" stroke="${F}" stroke-width="3"/>${label?text(x,y+46,label,24,F,500,'middle'):''}`;
const box=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${G}" stroke-width="2"/>`;
const svg=(content)=>`<svg viewBox="0 0 1120 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Git 변경 이력의 교육용 도식">${content}</svg>`;
const specs={
 history:{steps:['첫 안내 작성','초대 수락 절차 추가','이전 기록 다시 확인'],caption:['처음 기록한 FAQ','두 번째 commit의 추가 내용','첫 commit 선택을 통한 이전 내용 확인']},
 branch:{steps:['기준 버전','작업 브랜치','새 commit','Merge'],caption:['공동 기준 main','Main에서 분리한 작업 이력','Main 유지 · 작업 브랜치의 새 기록','리뷰 후 변경 내용을 main에 통합']},
 commit:{steps:['파일 저장','변경 선택','Commit'],caption:['파일 수정 상태 · 아직 이력 미기록','Staging: 이번 기록에 포함할 변경 선택','메시지와 함께 남긴 새 commit']},
 push:{steps:['Push 전','Push 후'],caption:['Push 전: 새 commit은 로컬에만 존재','Push 후: 원격 작업 브랜치에 반영 · main 유지']},
 sync:{steps:['Pull 전','Pull 후'],caption:['Pull 전: 원격 main에만 존재하는 새 변경','Pull 후: 현재 로컬 main에도 새 변경 반영']},
 full:{steps:['Branch','Commit','Push','PR','Review','Merge'],caption:['최신 main에서 작업 브랜치 생성','FAQ 수정 후 로컬 commit 기록','작업 브랜치 push · 원격 main 유지','Main을 대상으로 PR 등록','리뷰와 필수 조건 확인','변경을 GitHub main에 반영 · 이후 로컬 pull']}
};
function diagram(type,step,progress=1){
 if(type==='history'){
  const v=step===1?2:1;
  return svg(box(200,10,720,230)+text(232,55,'FAQ.md',24,M)+line(232,74,888,74,G)+text(232,120,'GitHub 초대 수락',32,F,650)+text(232,166,'1. 초대 메일 확인')+(v===2?`<rect x="228" y="185" width="655" height="36" fill="#f1f4e4"/>`+text(232,212,'+ 2. GitHub 로그인 및 초대 수락',24):text(232,212,'두 번째 항목 미작성',24,M))+line(270,294,850,294,G)+circle(330,294,'',v===1)+circle(790,294,'',v===2)+text(294,280,'기록 1',20)+text(754,280,'기록 2',20));
 }
 if(type==='branch'){
  let c=text(25,58,'main',28,F,650)+line(200,85,1050,85,G)+circle(220,85,'기준')+circle(400,85,'');
  if(step>=1)c+=`<path d="M400 85 L530 220 H800" fill="none" stroke="${F}" stroke-width="3"/>`+text(26,222,'작업 브랜치',28)+circle(590,220,'수정');
  if(step>=2)c+=circle(790,220,'새 commit',true);
  if(step>=3)c+=`<path d="M790 220 L970 85" fill="none" stroke="${F}" stroke-width="3"/>`+circle(970,85,'Merge',true);
  return svg(c+text(26,315,'docs/invitation-guide',24,M));
 }
 if(type==='commit'){
  let c=box(15,30,310,240)+box(402,30,310,240)+text(40,75,'작업 파일',28,F,650)+text(426,75,'Staging',28,F,650)+text(40,126,'FAQ.md',24,M)+text(40,176,'+ 초대 수락 안내',26)+text(356,158,'→',32)+text(744,158,'→',32)+text(912,75,'Commit',28,F,650,'middle');
  if(step>=1)c+=`<rect x="422" y="116" width="270" height="64" fill="#f1f4e4"/>`+text(438,156,'✓ FAQ 변경 선택',24);
  if(step>=2)c+=circle(938,157,'새 기록',true)+text(938,272,'설명 + 파일 상태',24,M,500,'middle');
  return svg(c);
 }
 const full=type==='full', sync=type==='sync', sent=full?(step>2||(step===2&&progress>=.8)):step>=1, merging=full&&step>=5;
 const localNew=sync?sent:(full?step>=1:true), remoteNew=sync?true:sent;
 let c=box(0,10,474,295)+box(644,10,476,295)+text(25,50,'내 컴퓨터',28,F,650)+text(669,50,'GitHub',28,F,650);
 const row=(x,y,label,newNode)=>text(x+20,y-28,label,24,M)+line(x+36,y,x+391,y,G)+circle(x+56,y,'')+circle(x+210,y,'')+(newNode?circle(x+390,y,'FAQ',true):'');
 if(sync){c+=row(0,165,'main',localNew)+row(644,165,'main',true)+text(541,130,'Pull',24,F,650,'middle')+text(552,177,'←',42,F,500,'middle');}
 else {
  c+=row(0,112,'main',false)+row(644,112,'main',merging)+row(0,241,'작업 브랜치',localNew);
  if(full&&step===0)c+=text(25,298,'분리된 작업 공간',20,M);
  c+=remoteNew?row(644,241,'작업 브랜치',true):text(669,213,'작업 브랜치',24,M)+line(680,241,1035,241,G,'6 6')+text(835,283,'아직 미공유',24,M);
  if(full&&step===3)c+=text(552,159,'PR',28,F,650,'middle')+`<path d="M1034 221 V134" stroke="${F}" stroke-width="3" stroke-dasharray="6 6" fill="none"/><path d="M1026 146 L1034 132 L1042 146" stroke="${F}" stroke-width="3" fill="none"/>`;
  else if(full&&step===4)c+=text(552,149,'Review',24,F,650,'middle')+text(552,194,'✓',44,F,600,'middle');
  else if(merging)c+=`<path d="M1034 225 L1034 130" stroke="${F}" stroke-width="3" fill="none"/>`+text(552,159,'Merge',24,F,650,'middle');
  else if(!full||step===2)c+=text(552,149,'Push',24,F,650,'middle')+text(552,194,'→',42,F,500,'middle');
 }
 if(full&&step===2&&progress<.8){const x=390+(1034-390)*Math.min(1,progress/.8);c+=`<circle cx="${x}" cy="241" r="18" fill="${L}" stroke="${F}" stroke-width="3"/>`;}
 return svg(c);
}
class GitDemo extends HTMLElement{
 connectedCallback(){if(this.ready)return;this.ready=true;this.type=this.dataset.type||'push';this.spec=specs[this.type];this.compare=['push','sync'].includes(this.type);this.step=0;this.timer=null;this.innerHTML='<div class="demo-view" role="region" tabindex="0" aria-label="교육용 변경 이력 도식, 좁은 화면에서 가로 스크롤"></div><div class="demo-caption" aria-live="polite"></div><div class="demo-controls"><button type="button" data-action="play">▶ 데모 재생</button><button type="button" data-action="next">다음 단계</button><button type="button" data-action="reset">처음</button><span class="demo-step"></span><span class="simulation-label">교육용 시뮬레이션</span></div>';this.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action;if(a==='play')this.timer?this.pause():this.play();if(a==='next'){this.pause();this.setStep((this.step+1)%this.spec.steps.length);}if(a==='reset'){this.pause();this.setStep(0);}});this.querySelector('[data-action=play]').textContent=this.compare?'▶ 자동 비교':'▶ 데모 재생';this.setStep(0);}
 setStep(n,p=1){this.step=Math.max(0,Math.min(this.spec.steps.length-1,n));this.querySelector('.demo-view').innerHTML=diagram(this.type,this.step,p);if(this.querySelector('.demo-caption').textContent!==this.spec.caption[this.step])this.querySelector('.demo-caption').textContent=this.spec.caption[this.step];this.querySelector('.demo-step').textContent=`${this.step+1} / ${this.spec.steps.length} · ${this.spec.steps[this.step]}`;if(this.compare)this.querySelector('[data-action=next]').textContent=this.step===0?(this.type==='push'?'Push 실행 보기':'Pull 실행 보기'):'실행 전 보기';}
 play(){this.setStep(0);this.start=performance.now();this.querySelector('[data-action=play]').textContent='Ⅱ 일시정지';this.timer=setInterval(()=>{const elapsed=performance.now()-this.start;const step=Math.floor(elapsed/2400);if(step>=this.spec.steps.length){this.pause();return;}this.setStep(step,Math.min(1,(elapsed%2400)/1800));},80);}
 pause(){if(this.timer){clearInterval(this.timer);this.timer=null;this.querySelector('[data-action=play]').textContent=this.compare?'▶ 자동 비교':'▶ 다시 재생';}}
}
customElements.define('git-demo',GitDemo);
window.GitVisuals={diagram,specs};
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('git-demo').forEach(d=>d.pause());});
window.addEventListener('beforeprint',()=>{document.querySelectorAll('git-demo').forEach(d=>{d.savedStep=d.step;d.pause();d.setStep(d.spec.steps.length-1);});});
window.addEventListener('afterprint',()=>{document.querySelectorAll('git-demo').forEach(d=>d.setStep(d.savedStep||0));});
})();
