import { missionScene, missionCommits, missionInteraction } from './mission-model.mjs';

const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
const labels = { B: '시작', C: '내 초안', D: '내 수정', T: '지수 제목', P: '제목 합침', M: '모두 합침', X: '직접 수정' };
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
      const node=make('button', `map-record ${owner(id)}${previous.size>0&&!m.navigation&&!previous.has(key)?' just-added':''}`);node.type='button';node.dataset.record=key;
      node.setAttribute('aria-label',`${repo==='local'?mine:repo==='peer'?peer:'GitHub'} · ${labels[id]} 내용 보기`);node.setAttribute('aria-pressed',String(selected===key));
      node.append(make('span','record-id',id),make('span','record-name',labels[id]));node.onclick=()=>selectCommit(key);
      if(compact)node.classList.add('compact'); return node;
    }
    function graph(repo) {
      const graph=make('div','map-graph');graph.setAttribute('aria-label',`${repo==='remote'?'GitHub 저장소':repo==='local'?'내 저장소':'지수의 저장소'}의 기록 연결`);
      const ids=state[repo].commits.filter(id=>id!=='A');
      graph.classList.toggle('single-record',ids.length===1);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
      for(const id of ids)for(const parent of commits[id].parents){if(!ids.includes(parent))continue;const a=positions[parent],b=positions[id];const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',`M ${a[0]} ${a[1]} C ${(a[0]+b[0])/2} ${a[1]}, ${(a[0]+b[0])/2} ${b[1]}, ${b[0]} ${b[1]}`);line.setAttribute('class',owner(id));line.dataset.edge=`${repo}:${parent}-${id}`;svg.append(line);}
      graph.append(svg);
      for(const id of ids){const node=record(`${repo}:${id}`,true);node.style.left=positions[id][0]+'%';node.style.top=positions[id][1]+'%';graph.append(node);}
      return graph;
    }
    function route(repo) {
      const node=make('div',`map-route ${repo}`);
      const kinds=repo==='local'?{up:['push','push-revision'],down:['pull']}:{up:['peer-push'],down:['peer-pull']};
      for(const [direction,text] of [['up','↑ 기록 공유'],['down','↓ 기준본 받아오기']]) {
        const next=kinds[direction].includes(interaction.kind), recent=kinds[direction].includes(m.lastAction);
        const item=make('span',`route-${direction}${next?' is-next':recent?' active':''}`,text);
        item.title=next?'다음에 할 동작':recent?'방금 한 동작':'';
        if(next)item.setAttribute('aria-label',`다음 동작: ${text}`);
        node.append(item);
      }
      return node;
    }
    function card(repo) {
      const data=state[repo], isRemote=repo==='remote';
      const card=make('section',`map-repo ${repo}${activeRepo===repo&&!m.experiment?' is-active':''}`);card.dataset.repo=repo;
      const head=make('div','map-repo-heading'), identity=make('div');
      identity.append(make('p','map-eyebrow',isRemote?'나와 지수가 공유하는 저장소':repo==='peer'?'지수의 저장소':'내 저장소'),make('h3','',isRemote?'GitHub 저장소':`${repo==='local'?mine:peer}의 컴퓨터`));
      if(!isRemote)card.append(route(repo));
      head.append(identity,make('span','map-scope',isRemote?'공유된 기록':repo==='local'?'담당: 본문':'담당: 제목'));card.append(head);
      const standard=make('button','map-main',`기준본${m.phase==='brief'?'':' main'} · ${labels[data.main]}`);standard.type='button';standard.onclick=()=>selectCommit(`${repo}:${data.main}`);standard.dataset.main=data.main;card.append(standard);
      if(!isRemote&&data.branch){const branch=make('div','map-branch-pointer',`↳ 작업 공간 ${repo==='local'?'story':'title'} → ${data.branch}`);branch.dataset.branch=repo;card.append(branch);}
      if(isRemote){
        const contents=make('div','map-shared-content');contents.append(make('strong','',commits[data.main].lines[0].replace(/^# /,'')));
        const status=data.main==='M'?'기준본 M에는 지수의 제목과 내 본문이 있습니다.':data.main==='P'?'기준본 P에는 지수의 제목이 있습니다. 내 본문은 아직 합치지 않았습니다.':'기준본 B에는 처음 이야기가 있습니다.';
        contents.append(make('p','',status));card.append(contents,graph(repo));
      } else {
        const row=make('div','map-local-records');for(const id of data.commits.filter(id=>id!=='A'))row.append(record(`${repo}:${id}`));card.append(row);
        const file=make('div','map-working-file');
        file.hidden=repo==='local'?!data.branch&&!state.file:!m.peerStage;
        if(repo==='local') {
          const dirty=state.file;
          file.append(make('span','',dirty?'파일 저장 완료 · 새 기록 없음':data.branch?`내 작업 기록 · ${labels[data.branch]}`:'작업 공간을 만들기 전입니다.'));
        } else {
          file.append(make('span','',m.peerStage===1?'제목 저장 완료 · 새 기록 없음':data.branch?`지수의 작업 기록 · ${labels[data.branch]}`:'작업 공간을 만들기 전입니다.'));
          if(m.peerStage>=1) file.append(make('p','peer-title-preview','제목: 백설공주와 일곱 난쟁이'));
        }
        card.append(file);
        const mainShared=state.remote.main===data.main;
        card.dataset.sync=mainShared?'current':'behind';
        const note=make('p','map-sync-note',mainShared?'GitHub 기준본과 같습니다.':`${repo==='local'?'내':'지수의'} 기준본은 아직 ${data.main}입니다. GitHub 기준본은 ${state.remote.main}입니다.`);card.append(note);
      }
      if(activeRepo===repo&&!m.experiment){
        const action=make('button','map-primary',interaction.label);action.type='button';action.dataset.sceneAction=interaction.kind;action.disabled=!canInteract();action.onclick=activate;card.append(action);
        if(!canInteract())card.append(make('p','map-wait',interaction.role==='reviewer'?'지수의 작업 단계입니다.':'내 작업 단계입니다.'));
      }
      return card;
    }
    root.append(card('remote'));
    const routes=make('div','map-routes');routes.setAttribute('aria-label','내 저장소와 지수의 저장소에서 GitHub 저장소로 공유하거나 기준본을 받아오는 경로');
    for(const repo of ['local','peer'])routes.append(route(repo));
    root.append(routes);
    const locals=make('div','map-locals');locals.append(card('local'),card('peer'));root.append(locals);
    previous=current;root.dataset.ready='true';
  }
  function select(key) {document.querySelectorAll('#collaboration-map [data-record]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.record===key)));}
  function updateAvailability(){document.querySelectorAll('#collaboration-map [data-scene-action]').forEach(node=>node.disabled=!canInteract());}
  return { render, select, updateAvailability };
}
