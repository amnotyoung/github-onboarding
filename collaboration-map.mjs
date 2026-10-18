import { missionScene, missionCommits, missionInteraction } from './mission-model.mjs';

const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
const labels = { B: '시작', C: '내 초안', D: '내 보완', T: '동료 제목', P: '제목 반영', M: '두 변경 합침', X: '직접 수정' };
const owner = id => ['C','D'].includes(id) ? 'mine' : id === 'T' ? 'peer' : 'shared';
const positions = { B: [8,50], C: [35,22], D: [62,22], T: [35,78], P: [62,78], M: [89,50], X:[40,50] };

export function createCollaborationMap({ getContext, activate, selectCommit, canInteract }) {
  let previous = new Set();
  function render() {
    const root = document.querySelector('#collaboration-map');
    const { mission:m, selected } = getContext(), state=missionScene(m), commits=missionCommits(m), interaction=missionInteraction(m);
    const current = new Set(); root.replaceChildren();
    const mine = '나';
    const peer = '지수';
    let activeRepo = interaction.source?.split(':')[0];
    if (interaction.source === 'document') activeRepo='local';
    if (interaction.source === 'reviewer') activeRepo='peer';
    if (interaction.kind === 'pull') activeRepo='local';
    if (interaction.kind === 'peer-pull') activeRepo='peer';
    function record(key, compact=false) {
      const [repo,id]=key.split(':');current.add(key);
      const node=make('button', `map-record ${owner(id)}${!m.navigation&&!previous.has(key)?' just-added':''}`);node.type='button';node.dataset.record=key;
      node.setAttribute('aria-label',`${repo==='local'?mine:repo==='peer'?peer:'GitHub'} · ${labels[id]} 내용 보기`);node.setAttribute('aria-pressed',String(selected===key));
      node.append(make('span','record-id',id),make('span','record-name',labels[id]));node.onclick=()=>selectCommit(key);
      if(compact)node.classList.add('compact'); return node;
    }
    function graph(repo) {
      const graph=make('div','map-graph');graph.setAttribute('aria-label',`${repo} 기록 연결`);
      const ids=state[repo].commits.filter(id=>id!=='A');
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
      for(const id of ids)for(const parent of commits[id].parents){if(!ids.includes(parent))continue;const a=positions[parent],b=positions[id];const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',`M ${a[0]} ${a[1]} C ${(a[0]+b[0])/2} ${a[1]}, ${(a[0]+b[0])/2} ${b[1]}, ${b[0]} ${b[1]}`);line.setAttribute('class',owner(id));svg.append(line);}
      graph.append(svg);
      for(const id of ids){const node=record(`${repo}:${id}`,true);node.style.left=positions[id][0]+'%';node.style.top=positions[id][1]+'%';graph.append(node);}
      return graph;
    }
    function card(repo) {
      const data=state[repo], isRemote=repo==='remote';
      const card=make('section',`map-repo ${repo}${activeRepo===repo&&!m.experiment?' is-active':''}`);card.dataset.repo=repo;
      const head=make('div','map-repo-heading'), identity=make('div');
      identity.append(make('p','map-eyebrow',isRemote?'함께 쓰는 원격 저장소':repo==='peer'?'가상 동료의 로컬 저장소':'내 컴퓨터의 로컬 저장소'),make('h3','',isRemote?'GitHub':`${repo==='local'?mine:peer}의 컴퓨터`));
      head.append(identity,make('span','map-scope',isRemote?'공유된 기록':repo==='local'?'담당: 본문':'담당: 제목'));card.append(head);
      const standard=make('button','map-main',`지금 쓰는 기준 · ${labels[data.main]}`);standard.type='button';standard.onclick=()=>selectCommit(`${repo}:${data.main}`);standard.dataset.main=data.main;card.append(standard);
      if(isRemote){
        const contents=make('div','map-shared-content');contents.append(make('strong','',commits[data.main].lines[0].replace(/^# /,'')));
        const status=data.main==='M'?'동료의 제목 + 나의 본문이 합쳐졌어요.':data.main==='P'?'동료의 제목이 반영됐어요. 내 본문은 아직 검토 중이에요.':'각자의 변경을 확인한 뒤 이 기준에 합칩니다.';
        contents.append(make('p','',status));card.append(contents,graph(repo));
      } else {
        const row=make('div','map-local-records');for(const id of data.commits.filter(id=>id!=='A'))row.append(record(`${repo}:${id}`));card.append(row);
        const file=make('div','map-working-file');
        if(repo==='local') {
          const dirty=state.file;
          file.append(make('span','',dirty?'파일 수정됨 · 아직 기록 전':data.branch?`내 작업 기록 · ${labels[data.branch]}`:'별도 작업 전 · 같은 기준에서 시작'));
        } else {
          file.append(make('span','',m.peerStage===1?'제목을 고쳤지만 아직 기록 전':data.branch?`동료의 작업 기록 · ${labels[data.branch]}`:'별도 작업 전 · 같은 기준에서 시작'));
          if(m.peerStage>=1) file.append(make('p','peer-title-preview','제목: 백설공주와 일곱 난쟁이'));
        }
        card.append(file);
        const mainShared=state.remote.main===data.main;
        const note=make('p','map-sync-note',mainShared?'팀 기준과 같아요':`내 기준은 아직 ${labels[data.main]}입니다. 받아와야 갱신돼요.`);card.append(note);
      }
      if(activeRepo===repo&&!m.experiment){
        const action=make('button','map-primary',interaction.label);action.type='button';action.dataset.sceneAction=interaction.kind;action.disabled=!canInteract();action.onclick=activate;card.append(action);
        if(!canInteract())card.append(make('p','map-wait',interaction.role==='reviewer'?'동료가 진행할 차례입니다.':'고치는 사람이 진행할 차례입니다.'));
      }
      return card;
    }
    root.append(card('remote'));
    const routes=make('div','map-routes');routes.setAttribute('aria-label','각 로컬과 원격 사이의 공유 및 가져오기');
    for(const repo of ['local','peer']){
      const route=make('div',`map-route ${repo}`);
      const activeUp=(repo==='local'&&['push','push-revision'].includes(m.lastAction))||(repo==='peer'&&m.lastAction==='peer-push');
      const activeDown=(repo==='local'&&m.lastAction==='pull')||(repo==='peer'&&m.lastAction==='peer-pull');
      route.append(make('span',`route-up${activeUp?' active':''}`,'↑ 공유'),make('span',`route-down${activeDown?' active':''}`,'↓ 받아오기'));routes.append(route);
    }
    root.append(routes);
    const locals=make('div','map-locals');locals.append(card('local'),card('peer'));root.append(locals);
    previous=current;root.dataset.ready='true';
  }
  function select(key) {document.querySelectorAll('#collaboration-map [data-record]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.record===key)));}
  function updateAvailability(){document.querySelectorAll('#collaboration-map [data-scene-action]').forEach(node=>node.disabled=!canInteract());}
  return { render, select, updateAvailability };
}
