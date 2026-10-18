export const STORY = {
  O: '백설공주는 성으로 돌아갔습니다.',
  A: '백설공주는 성에서 행복하게 살았습니다.',
  B: '백설공주는 일곱 난쟁이와 성으로 돌아갔습니다.',
  both: '백설공주는 일곱 난쟁이와 성에서 행복하게 살았습니다.',
};
export const RESOLUTIONS = { mine: ['내 문장 유지', STORY.A], jisu: ['지수의 문장 유지', STORY.B], both: ['두 내용 합치기', STORY.both] };
export const COORD_STEPS = [
  ['assign-mine', '내 이슈 할당', '이슈 #21을 내게 할당하기', 'issues'],
  ['assign-jisu', '지수의 이슈 할당', '이슈 #22를 지수에게 할당하기', 'issues'],
  ['branch-mine', '내 브랜치 만들기', '내 작업 공간 만들기', 'mine'],
  ['branch-jisu', '지수의 브랜치 만들기', '지수의 작업 공간 만들기', 'jisu'],
  ['edit-mine', '내 파일 수정', '내 결말 수정하기', 'mine'],
  ['commit-mine', '내 변경 기록', '내 변경 기록하기', 'mine'],
  ['push-mine', '내 기록 공유', '내 기록 공유하기', 'mine'],
  ['pr-mine', '내 PR 만들기', '내 PR 만들기', 'remote'],
  ['edit-jisu', '지수의 파일 수정', '지수의 결말 수정하기', 'jisu'],
  ['commit-jisu', '지수의 변경 기록', '지수의 변경 기록하기', 'jisu'],
  ['push-jisu', '지수의 기록 공유', '지수의 기록 공유하기', 'jisu'],
  ['pr-jisu', '지수의 PR 만들기', '지수의 PR 만들기', 'remote'],
  ['first-merge', '먼저 합칠 PR 선택', null, 'remote'],
  ['inspect', '충돌 발생', '충돌 내용 보기', 'remote'],
  ['resolve', '충돌 해결', '해결 내용 기록하기', 'remote'],
  ['approve', '해결 내용 검토', null, 'remote'],
  ['merge-rest', '남은 PR 합치기', '남은 PR 합치기', 'remote'],
  ['pull-mine', '내 기준본 받아오기', '내 기준본 받아오기', 'mine'],
  ['pull-jisu', '지수의 기준본 받아오기', '지수의 기준본 받아오기', 'jisu'],
  ['done', '완료', '처음부터 다시 시작하기', 'remote'],
];
export const newCoordination = () => ({step:0, first:null, resolution:null, approved:false, history:[], future:[], last:null});
const snapshot = s => ({step:s.step, first:s.first, resolution:s.resolution, approved:s.approved, last:s.last});
export const coordinationTimeline = s => [...s.history,snapshot(s),...s.future];
export function coordinationAction(s) {
  const [kind,title,defaultLabel,zone] = COORD_STEPS[s.step];
  const label = kind==='approve' ? s.first==='mine'?'내가 해결 내용 승인하기':'지수의 승인 받기' : defaultLabel;
  return {kind,title,label,zone,instruction:kind==='first-merge'?'먼저 합칠 PR을 선택하세요.':kind==='resolve'?'남길 문장을 선택하세요.':`“${label}” 버튼을 누르세요.`};
}
export function transitionCoordination(current, action) {
  const s=structuredClone(current), expected=coordinationAction(s).kind;
  if(action.kind==='navigate') {
    const timeline=coordinationTimeline(s);
    if(!Number.isInteger(action.index)||action.index<0||action.index>=timeline.length)throw Error('이미 방문한 단계만 선택할 수 있습니다.');
    return {...timeline[action.index],history:timeline.slice(0,action.index),future:timeline.slice(action.index+1)};
  }
  if(action.kind==='restart')return newCoordination();
  if(action.kind!==expected)throw Error('현재 안내된 버튼을 누르세요.');
  if(expected==='first-merge') {
    if(!['mine','jisu'].includes(action.owner))throw Error('먼저 합칠 PR을 선택하세요.');
    s.first=action.owner;
  }
  if(expected==='resolve') {
    if(!Object.hasOwn(RESOLUTIONS,action.choice))throw Error('남길 문장을 선택하세요.');
    s.resolution=action.choice; s.approved=false;
  }
  if(expected==='approve')s.approved=true;
  if(expected==='merge-rest'&&!s.approved)throw Error('해결 내용을 승인해야 합칠 수 있습니다.');
  if(expected==='done')return newCoordination();
  s.history=[...current.history,snapshot(current)];s.future=[];s.step++;s.last=action.kind;
  return s;
}
export function coordinationScene(s) {
  const i=s.step, remaining=s.first==='mine'?'jisu':'mine';
  const commits={O:{line:STORY.O,parents:[]},A:{line:STORY.A,parents:['O']},B:{line:STORY.B,parents:['O']}};
  if(i>=13)commits.M1={line:STORY[s.first==='mine'?'A':'B'],parents:['O',s.first==='mine'?'A':'B']};
  if(i>=15)commits.R={line:RESOLUTIONS[s.resolution][1],parents:[remaining==='mine'?'A':'B','M1']};
  if(i>=17)commits.M2={line:commits.R.line,parents:['M1','R']};
  const main=i>=17?'M2':i>=13?'M1':'O';
  const remote=['O',...(i>=7?['A']:[]),...(i>=11?['B']:[]),...(i>=13?['M1']:[]),...(i>=15?['R']:[]),...(i>=17?['M2']:[])];
  const local = owner => {
    const mine=owner==='mine', head=mine?'A':'B', branched=i>=(mine?3:4), edited=i>=(mine?5:9), recorded=i>=(mine?6:10), pulled=i>=(mine?18:19);
    return {main:pulled?'M2':'O',branch:branched?(recorded?head:'O'):null,branchName:mine?'ending':'seven',dirty:edited&&!recorded,
      line:pulled?commits.M2.line:edited?STORY[head]:STORY.O,commits:pulled?[...remote]:['O',...(recorded?[head]:[])]};
  };
  const pr=owner=>{
    const exists=i>=(owner==='mine'?8:12), merged=i>=17||(i>=13&&s.first===owner);
    return {exists,owner,number:owner==='mine'?31:32,issue:owner==='mine'?21:22,
      head:i>=15&&remaining===owner?'R':owner==='mine'?'A':'B',base:main,
      status:!exists?'none':merged?'merged':i>=13&&i<15?'conflict':i>=15&&!s.approved?'review':'ready'};
  };
  return {commits,remote:{main,commits:remote},mine:local('mine'),jisu:local('jisu'),prs:{mine:pr('mine'),jisu:pr('jisu')},
    issues:[{id:21,title:'결말에 행복한 삶을 추가하기',assignee:i>=1?'나':null,closed:pr('mine').status==='merged'},
      {id:22,title:'결말에 일곱 난쟁이를 추가하기',assignee:i>=2?'지수':null,closed:pr('jisu').status==='merged'}],remaining};
}
export function coordinationObservation(s) {
  const first=s.first==='mine'?'내 PR #31':'지수의 PR #32';
  const notes={
    'assign-mine':['이슈 #21의 담당자는 나입니다. 파일과 브랜치는 그대로입니다.','이슈 할당 · assignee'],
    'assign-jisu':['이슈 #22의 담당자는 지수입니다. 담당자 지정은 작업 파일을 잠그지 않습니다.','이슈 할당 · assignee'],
    'branch-mine':['내 작업 공간 ending을 만들었습니다. 기준본 main과 같은 기록 O에서 시작합니다.','브랜치 · branch'],
    'branch-jisu':['지수의 작업 공간 seven도 기록 O에서 시작합니다. 두 사람은 별도 브랜치에서 작업합니다.','브랜치 · branch'],
    'edit-mine':['내 작업 파일의 결말만 바뀌었습니다. 기준본과 지수의 파일은 그대로입니다.','파일 수정'],
    'edit-jisu':['지수도 같은 결말 문장을 다르게 수정했습니다. 내 작업 파일은 그대로입니다.','같은 줄의 서로 다른 수정'],
    'commit-mine':['내 저장소에 기록 A를 만들었습니다. 기준본 main은 아직 O입니다.','커밋 · commit'],
    'commit-jisu':['지수의 저장소에 기록 B를 만들었습니다. 기준본 main은 아직 O입니다.','커밋 · commit'],
    'push-mine':['기록 A를 GitHub 저장소에 복사했습니다. 내 저장소의 A도 남아 있습니다.','푸시 · push'],
    'push-jisu':['기록 B를 GitHub 저장소에 복사했습니다. 지수의 저장소에 있는 B도 남아 있습니다.','푸시 · push'],
    'pr-mine':['내 PR #31은 ending의 변경을 main에 합치도록 요청합니다. 이슈 #21과 연결했습니다.','풀 리퀘스트 · PR'],
    'pr-jisu':['두 PR은 각각 현재 기준본 O와 비교하면 합칠 수 있습니다. 두 PR의 변경 내용은 서로 다릅니다.','PR의 기준 브랜치 · base'],
    'first-merge': [first+'을 합쳐 GitHub 기준본이 M1이 됐습니다. 남은 PR은 M1과 같은 줄을 다르게 수정해 충돌합니다.','병합 충돌 · merge conflict'],
    inspect:['Git은 두 문장 중 어느 것을 남길지 결정할 수 없습니다. 남은 PR의 합치기는 막혀 있습니다.','충돌 해결 준비'],
    resolve:['GitHub의 남은 PR 브랜치에 해결 기록 R을 만들었습니다. GitHub 기준본은 아직 M1입니다.','충돌 해결 기록'],
    approve:['해결 기록 R의 검토가 끝났습니다. 남은 PR을 합칠 수 있습니다.','해결 후 재검토'],
    'merge-rest':['GitHub 기준본은 M2입니다. 각 컴퓨터의 기준본은 아직 O입니다.','병합 · merge'],
    'pull-mine':['내 기준본을 M2로 바꿨습니다. 지수의 기준본은 아직 O입니다.','풀 · pull'],
    'pull-jisu':['지수도 M2를 받아왔습니다. 세 저장소의 기준본이 모두 M2입니다.','풀 · pull'],
  };return notes[s.last]||['두 사람에게 할 일을 나눕니다. 아직 담당자와 작업 공간은 없습니다.','할 일 → 브랜치 → PR'];
}
