import { COMMITS } from './lab-model.mjs';

export const PHASES = ['brief', 'draft', 'saved', 'committed', 'pushed', 'review', 'changes', 'revised', 'recommitted', 'reposted', 'approved', 'merged', 'done'];
export const MILESTONES = ['작업 공간', '본문 수정', '기록 공유', '지수의 검토', '본문 재수정', '승인·합치기', '기준본 받아오기'];
export const DRAFTS = {
  characters: { label: '누가 사는지 보태기', line: '그 집에는 일곱 난쟁이가 살고 있었습니다.', issue: 'next-scene', review: '일곱 난쟁이가 등장하네요. 백설공주가 난쟁이들과 함께 사는 장면을 추가해 주세요.' },
  home: { label: '함께 사는 장면 보태기', line: '백설공주는 그 집의 난쟁이들과 함께 살게 되었습니다.', issue: 'seven', review: '함께 사는 장면이 있네요. 난쟁이의 수를 알 수 있도록 “일곱”을 넣어 주세요.' },
};
export const REVISIONS = {
  two: { label: '두 문장으로 이어쓰기', lines: ['그 집에는 일곱 난쟁이가 살고 있었습니다.', '백설공주는 그들과 함께 살게 되었습니다.'] },
  one: { label: '한 문장으로 이어쓰기', lines: ['백설공주는 일곱 난쟁이를 만나 그들의 집에서 함께 살게 되었습니다.'] },
};
const error = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
export const newMission = () => ({ phase: 'brief', draft: null, revision: null, peerStage: 0, peerAuthorId: null, peerApproval: null, authorId: null, reviewerId: null, prAuthorId: null, approval: null, conversation: [], experiment: null, lastAction: null, history: [], future: [], navigation: null });
export const phaseIndex = mission => PHASES.indexOf(mission.phase);
export function missionGroup(mission) { const i = phaseIndex(mission); return i < 1 ? 0 : i < 3 ? 1 : i < 5 ? 2 : i < 7 ? 3 : i < 10 ? 4 : i < 12 ? 5 : 6; }
export const PHASE_LABELS = { brief: '준비', draft: '내용 고치기', saved: '파일에 저장됨', committed: '내 기록 만들기', pushed: '내 기록 공유', review: '지수에게 검토 요청', changes: '지수의 의견', revised: '의견 반영', recommitted: '고친 내용 기록', reposted: '다시 공유', approved: '지수의 승인', merged: 'GitHub 기준본에 합침', done: '내 기준본 받아옴' };
export const PEER_LABELS = { 'peer-edit': '지수의 제목 수정', 'peer-commit': '지수의 변경 기록', 'peer-push': '지수의 기록 공유', 'peer-merge': '지수의 제목 합침', 'peer-pull': '지수의 기준본 받아옴' };
export const checkpointLabel = m => PEER_LABELS[m.lastAction] || PHASE_LABELS[m.phase];
function checkpoint(m) {
  return structuredClone({ phase: m.phase, draft: m.draft, revision: m.revision, peerStage: m.peerStage || 0, peerAuthorId: m.peerAuthorId || null, peerApproval: m.peerApproval || null, prAuthorId: m.prAuthorId, approval: m.approval, conversation: m.conversation, experiment: m.experiment, lastAction: m.lastAction });
}
export const missionTimeline = m => [...(m.history || []), checkpoint(m), ...(m.future || [])];

// Repository state and review ownership stay separate from the simulated user interface.
export function transitionMission(current, action, actor, { solo = false, users = [] } = {}) {
  const m = structuredClone(current), index = phaseIndex(m);
  const role = requested => {
    if (solo) return;
    if (m[`${requested}Id`] !== actor.id) error(requested === 'reviewer' ? '리뷰어가 확인해야 합니다. 작성자는 자기 변경을 승인할 수 없습니다.' : '작성자가 진행할 차례입니다.', 403);
    if (requested === 'reviewer' && [m.authorId, m.prAuthorId].includes(actor.id)) error('작성자는 자기 변경을 승인할 수 없습니다.', 403);
  };
  const at = phase => { if (m.phase !== phase) error('지금은 이 동작을 할 수 없습니다. 현재 안내된 버튼을 누르세요.'); };
  const say = (who, text, commit = null) => m.conversation.push({ who, name: who === 'reviewer' && solo ? '지수' : actor.name, text, commit });
  if (m.experiment && !['undo-experiment', 'claim-role', 'restart'].includes(action.kind)) error('먼저 “실험 되돌리기”를 누르세요.');
  switch (action.kind) {
    case 'navigate': {
      role('author');
      const visited = missionTimeline(m), currentIndex = (m.history || []).length;
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= visited.length) error('이미 방문한 장면으로만 이동할 수 있습니다.', 400);
      if (action.index === currentIndex) return m;
      return { ...m, ...visited[action.index], history: visited.slice(0, action.index), future: visited.slice(action.index + 1), navigation: { direction: action.index < currentIndex ? 'back' : 'forward' } };
    }
    case 'try-main':
      at('brief'); role('author'); m.experiment = { type: 'direct-main' }; m.lastAction = action.kind; return m;
    case 'inspect-peer': {
      role('author'); if (![3, 4, 8, 9].includes(index)) error('기록을 만든 뒤 공유한 내용을 비교할 수 있습니다.');
      const scene = missionScene(m); m.experiment = { type: 'peer', mine: scene.local.branch, theirs: scene.remote.branch || scene.remote.main }; m.lastAction = action.kind; return m;
    }
    case 'undo-experiment':
      role('author'); if (!m.experiment) error('되돌릴 실험이 없습니다.'); m.experiment = null; m.lastAction = action.kind; return m;
    case 'claim-role': {
      if (!['author', 'reviewer'].includes(action.role)) error('알 수 없는 역할입니다.', 400);
      if (action.role === 'reviewer' && [m.authorId, m.prAuthorId].includes(actor.id)) error('작성자는 자신의 변경을 승인할 수 없습니다.', 403);
      if (action.role === 'author' && m.reviewerId === actor.id) error('리뷰어는 작성자를 겸할 수 없습니다.', 403);
      const owner = m[`${action.role}Id`];
      if (owner && owner !== actor.id && users.some(u => u.id === owner && u.connected)) error('다른 참여자가 이미 맡은 역할입니다.');
      m[`${action.role}Id`] = actor.id; return m;
    }
    case 'restart': role('author'); return { ...newMission(), authorId: m.authorId, reviewerId: m.reviewerId };
    case 'branch': at('brief'); role('author'); m.phase = 'draft'; break;
    case 'save':
      at('draft'); role('author'); if (!Object.hasOwn(DRAFTS, action.choice)) error('저장할 문장을 선택하세요.', 400);
      m.draft = action.choice; m.phase = 'saved'; break;
    case 'commit': at('saved'); role('author'); m.phase = 'committed'; break;
    case 'push': at('committed'); role('author'); m.phase = 'pushed'; break;
    case 'peer-edit':
      at('pushed'); role('reviewer'); if (m.peerStage !== 0) error('지수의 현재 단계에 표시된 버튼을 누르세요.'); m.peerAuthorId = solo ? 'simulated-reviewer' : actor.id; m.peerStage = 1; break;
    case 'peer-commit':
      at('pushed'); role('reviewer'); if (m.peerStage !== 1) error('먼저 “지수의 제목 수정하기”를 누르세요.'); m.peerStage = 2; break;
    case 'peer-push':
      at('pushed'); role('reviewer'); if (m.peerStage !== 2) error('먼저 “지수의 변경 기록하기”를 누르세요.'); m.peerStage = 3; break;
    case 'peer-merge':
      at('pushed'); role('author'); if (m.peerStage !== 3) error('먼저 “지수의 기록 공유하기”를 누르세요.');
      if (!solo && actor.id === m.peerAuthorId) error('자신의 변경은 다른 사람이 확인해야 합니다.', 403);
      m.peerApproval = { commit: 'T', reviewerId: actor.id, name: actor.name }; m.peerStage = 4; break;
    case 'open-pr':
      at('pushed'); role('author'); if (m.peerStage < 4) error('먼저 지수의 작업 단계를 완료하세요.'); m.prAuthorId = actor.id; m.phase = 'review'; say('author', '지수야, 본문에 한 문장을 추가했어. 추가한 문장을 검토해 줘.', 'C'); break;
    case 'request-changes':
      at('review'); role('reviewer');
      if (action.issue !== DRAFTS[m.draft].issue) error('선택한 문장과 검토 의견이 맞지 않습니다.', 400);
      say('reviewer', DRAFTS[m.draft].review, 'C'); m.phase = 'changes'; break;
    case 'revise':
      at('changes'); role('author'); if (!Object.hasOwn(REVISIONS, action.choice)) error('저장할 수정 문장을 선택하세요.', 400);
      m.revision = action.choice; m.phase = 'revised'; break;
    case 'commit-revision': at('revised'); role('author'); m.phase = 'recommitted'; break;
    case 'push-revision':
      at('recommitted'); role('author'); m.phase = 'reposted';
      say('author', '지수야, 일곱 난쟁이와 함께 사는 장면으로 본문을 고쳤어. 수정 기록 D를 검토해 줘.', 'D'); break;
    case 'approve':
      at('reposted'); role('reviewer');
      if (action.commit !== 'D' || !Array.isArray(action.checks) || !['seven', 'together'].every(check => action.checks.includes(check))) error('수정 기록 D의 검토 항목을 표시하세요.');
      m.approval = { commit: 'D', reviewerId: solo ? 'simulated-reviewer' : actor.id, name: solo ? '지수' : actor.name };
      say('reviewer', '수정 기록 D를 확인했어요. 일곱 난쟁이와 함께 사는 장면이 모두 있어요. 이 변경을 승인해요.', 'D'); m.phase = 'approved'; break;
    case 'merge':
      role('author'); if (m.phase !== 'approved' || m.approval?.commit !== 'D' || [m.authorId, m.prAuthorId].includes(m.approval.reviewerId)) error('지수가 수정 기록 D를 승인해야 합칠 수 있습니다.');
      m.phase = 'merged'; break;
    case 'pull': at('merged'); role('author'); m.phase = 'done'; break;
    case 'peer-pull':
      at('done'); role('reviewer'); if (m.peerStage !== 4) error('지수는 아직 기준본을 받아올 수 없습니다.'); m.peerStage = 5; break;
    default: error('알 수 없는 미션 동작입니다.', 400);
  }
  if (phaseIndex(m) < index) error('이 동작으로 이전 단계에 갈 수 없습니다. “이전 단계”를 누르세요.');
  if (m.phase !== current.phase || m.peerStage !== current.peerStage) { m.history = [...(current.history || []), checkpoint(current)]; m.future = []; m.navigation = null; }
  m.lastAction = action.kind;
  return m;
}

export function missionCommits(mission) {
  const initial = DRAFTS[mission.draft || 'characters'], revised = REVISIONS[mission.revision || 'two'];
  const cLines = [...COMMITS.B.lines, initial.line], dLines = [...COMMITS.B.lines, ...revised.lines];
  const titleLines = ['# 백설공주와 일곱 난쟁이', ...COMMITS.B.lines.slice(1)];
  return {
    A: COMMITS.A, B: COMMITS.B,
    X: { hash: 'f30c7e1', title: '내 기준본을 직접 수정한 기록', parents: ['B'], lines: [...COMMITS.B.lines, DRAFTS.characters.line] },
    C: { hash: mission.draft === 'characters' ? 'c10a2f4' : 'c20b3f5', title: '숲속 집의 다음 장면 추가', parents: ['B'], lines: cLines },
    D: { hash: `${mission.draft === 'characters' ? 'd1' : 'd2'}${mission.revision === 'one' ? '8e74a' : '9f85b'}`, title: '일곱 난쟁이와 함께 살게 된 백설공주', parents: ['C'], lines: dLines },
    T: { hash: 'f51d7a3', title: '지수의 제목 수정', parents: ['B'], lines: titleLines },
    P: { hash: 'f62e8b4', title: '지수의 제목을 GitHub 기준본에 합침', parents: ['B', 'T'], lines: titleLines },
    M: { hash: `${mission.draft === 'characters' ? 'e1' : 'e2'}${mission.revision === 'one' ? 'a6703' : 'b7814'}`, title: '지수의 제목 + 내 본문', parents: ['P', 'D'], lines: [titleLines[0], ...dLines.slice(1)] },
  };
}
export function missionScene(mission) {
  const i = phaseIndex(mission), stage = mission.peerStage || 0, local = ['A', 'B'], remote = ['A', 'B'], peer = ['A', 'B'];
  if (i >= 3) local.push('C'); if (i >= 8) local.push('D'); if (i >= 12) local.push('T', 'P', 'M');
  if (i >= 4) remote.push('C'); if (stage >= 3) remote.push('T'); if (stage >= 4) remote.push('P'); if (i >= 9) remote.push('D'); if (i >= 11) remote.push('M');
  if (stage >= 2) peer.push('T'); if (stage >= 5) peer.push('C', 'D', 'P', 'M');
  if (mission.experiment?.type === 'direct-main') local.push('X');
  return {
    local: { commits: local, main: mission.experiment?.type === 'direct-main' ? 'X' : i >= 12 ? 'M' : 'B', branch: i < 1 ? null : i < 3 ? 'B' : i < 8 ? 'C' : 'D', head: i < 1 || i >= 12 ? 'main' : 'story' },
    remote: { commits: remote, main: i >= 11 ? 'M' : stage >= 4 ? 'P' : 'B', branch: i < 4 ? null : i < 9 ? 'C' : 'D', peerBranch: stage >= 3 ? 'T' : null },
    peer: { commits: peer, main: stage >= 5 ? 'M' : 'B', branch: stage >= 2 ? 'T' : stage >= 1 ? 'B' : null, file: stage === 1 ? 'working' : null },
    file: [2, 7].includes(i) ? 'working' : null, pr: i >= 11 ? 'merged' : i >= 5 ? 'open' : null,
  };
}
export const missionNodeVisible = (key, mission) => typeof key === 'string' && /^(local|remote|peer):[ABCDMXTP]$/.test(key) && missionScene(mission)[key.split(':')[0]].commits.includes(key.split(':')[1]);

// A single label supplies both the button and its instruction to prevent copy drift.
export function missionInteraction(m) {
  const action = (label, kind, source, role = 'author', context = '') => ({
    label, instruction: `“${label}” 버튼을 누르세요.`, kind, source, role, context,
  });
  if (m.experiment) return {
    ...action('실험 되돌리기', 'undo-experiment', 'local:X', 'author', m.experiment.type === 'direct-main'
      ? '내 기준본만 바뀌었습니다. GitHub 기준본은 그대로입니다.'
      : '이 비교는 지수가 GitHub에서 볼 수 있는 기록을 보여 줍니다.'), experiment: true,
  };
  if (m.phase === 'pushed' && (m.peerStage || 0) < 4) {
    const actions = [
      ['지수의 제목 수정하기', 'peer-edit', 'peer:B', 'reviewer', '이번에는 지수의 컴퓨터에서 제목을 수정합니다.'],
      ['지수의 변경 기록하기', 'peer-commit', 'peer:B', 'reviewer', '지수의 파일은 바뀌었지만 새 기록은 아직 없습니다.'],
      ['지수의 기록 공유하기', 'peer-push', 'peer:T', 'reviewer', '제목 기록 T는 지수의 저장소에만 있습니다.'],
      ['지수의 제목 합치기', 'peer-merge', 'remote:T', 'author', '제목 기록 T는 GitHub 저장소에 있습니다. GitHub 기준본은 아직 B입니다.'],
    ];
    return action(...actions[m.peerStage || 0]);
  }
  if (m.phase === 'done' && m.peerStage < 5) return action('지수의 기준본 받아오기', 'peer-pull', 'peer:B', 'reviewer', '내 기준본은 M입니다. 지수의 기준본은 아직 B입니다.');
  const actions = {
    brief: ['내 작업 공간 만들기', 'branch', 'document', 'author', '기준본은 그대로 두고 별도의 작업 공간을 만듭니다.'],
    draft: ['본문 수정 창 열기', 'edit', 'document', 'author', '내 작업 공간에서 본문을 수정합니다.'],
    saved: ['내 변경 기록하기', 'commit', 'document', 'author', '파일은 저장했습니다. 아직 새 기록은 없습니다.'],
    committed: ['내 기록 공유하기', 'push', 'local:C', 'author', '초안 기록 C는 내 저장소에만 있습니다.'],
    pushed: ['지수에게 검토 요청하기', 'open-pr', 'remote:C', 'author', '내 초안 기록 C는 GitHub 저장소에 있습니다.'],
    review: ['지수의 의견 보기', 'review', 'reviewer', 'reviewer', '지수가 내 초안 기록 C를 검토했습니다.'],
    changes: ['본문 수정 창 열기', 'edit', 'document', 'author', '지수의 의견에 따라 본문을 수정합니다.'],
    revised: ['내 수정 기록하기', 'commit-revision', 'document', 'author', '파일을 다시 저장했습니다. 초안 기록 C는 그대로입니다.'],
    recommitted: ['내 수정 기록 공유하기', 'push-revision', 'local:D', 'author', '수정 기록 D는 내 저장소에만 있습니다.'],
    reposted: ['수정 내용 검토 창 열기', 'review', 'reviewer', 'reviewer', '지수는 GitHub 저장소에서 수정 기록 D를 볼 수 있습니다.'],
    approved: ['내 본문 합치기', 'merge', 'remote:D', 'author', '지수가 수정 기록 D를 승인했습니다.'],
    merged: ['내 기준본 받아오기', 'pull', 'remote:M', 'author', 'GitHub 기준본은 M입니다. 내 기준본은 아직 B입니다.'],
    done: ['합친 내용 보기', 'compare', 'document', 'author', '내 저장소, 지수의 저장소, GitHub 저장소의 기준본이 모두 M입니다.'],
  };
  return action(...actions[m.phase]);
}

export function missionObservation(m) {
  if (m.navigation) return [(m.future || []).length
    ? '이전 단계를 보고 있습니다. 여기서 새 동작을 하면 이후 진행 결과는 사라집니다.'
    : '마지막으로 진행한 단계로 돌아왔습니다. 선택과 검토 결과는 그대로입니다.', '단계 탐색'];
  const notes = {
    branch: ['내 작업 공간을 만들었습니다. 내 기준본은 그대로입니다.', '브랜치 · branch'],
    save: ['본문을 파일에 저장했습니다. 새 기록은 아직 없습니다.', '파일 저장'],
    commit: ['내 저장소에 초안 기록 C를 만들었습니다. C는 이전 기록 B와 연결됩니다.', '커밋 · commit'],
    push: ['초안 기록 C를 GitHub 저장소에 복사했습니다. 내 저장소의 C도 그대로입니다.', '푸시 · push'],
    'peer-edit': ['지수가 자기 컴퓨터에서 제목을 수정했습니다. 내 파일과 GitHub 기준본은 그대로입니다.', '지수의 파일 수정'],
    'peer-commit': ['지수의 저장소에 제목 기록 T를 만들었습니다.', '지수의 커밋 · commit'],
    'peer-push': ['제목 기록 T를 GitHub 저장소에 복사했습니다. 내 저장소에는 아직 T가 없습니다.', '지수의 푸시 · push'],
    'peer-merge': ['지수의 제목을 GitHub 기준본에 합쳤습니다. 내 기준본과 지수의 기준본은 아직 B입니다.', '지수의 변경 병합 · merge'],
    'open-pr': ['지수에게 초안 기록 C의 검토를 요청했습니다. GitHub 기준본은 그대로입니다.', '풀 리퀘스트 · pull request'],
    'request-changes': ['지수가 본문에 대한 수정 의견을 남겼습니다.', '검토 · review'],
    revise: ['본문을 수정한 파일을 저장했습니다. 초안 기록 C는 그대로입니다.', '파일 저장'],
    'commit-revision': ['내 저장소에 수정 기록 D를 만들었습니다. 초안 기록 C도 남아 있습니다.', '커밋 · commit'],
    'push-revision': ['수정 기록 D를 GitHub 저장소에 복사했습니다. 기존 검토 요청에도 D를 추가했습니다.', '푸시 · push'],
    approve: ['지수가 수정 기록 D를 승인했습니다.', '승인 · approval'],
    merge: ['내 본문을 GitHub 기준본에 합쳤습니다. 기준본 M에는 지수의 제목도 있습니다.', '병합 · merge'],
    pull: ['GitHub 기준본 M을 내 저장소로 받아왔습니다. 지수의 기준본은 아직 B입니다.', '풀 · pull'],
    'peer-pull': ['지수도 GitHub 기준본 M을 받아왔습니다. 세 저장소의 기준본이 모두 M입니다.', '지수의 풀 · pull'],
    'try-main': ['내 기준본에 수정 기록 X를 만들었습니다. GitHub 기준본은 B입니다.', '기준본 직접 수정 실험'],
    'inspect-peer': [m.experiment?.mine === m.experiment?.theirs
      ? '지수는 GitHub에서 이 기록을 볼 수 있습니다. 지수의 저장소에는 자동으로 복사되지 않습니다.'
      : '내 저장소에만 새 기록이 있습니다. 지수는 GitHub에서 이 기록을 볼 수 없습니다.', '공유 전후 비교'],
    'undo-experiment': ['실험 전 상태로 돌아왔습니다.', '실험 되돌리기'],
  };
  return notes[m.lastAction] || null;
}

export function missionLesson(mission) {
  const lessons = {
    brief: ['내 작업 공간', '내 기준본은 처음 이야기입니다.', '별도의 작업 공간을 브랜치라고 합니다.', 'git switch -c story', 'local:B'],
    draft: ['본문 수정', '작업 공간에서 본문에 한 문장을 추가합니다.', '파일 수정은 기준본을 바꾸지 않습니다.', 'snow-white.md 편집 후 저장', 'local:B'],
    saved: ['파일 저장', '파일은 바뀌었지만 새 기록은 아직 없습니다.', '이 실습의 기록 버튼은 변경 선택과 커밋을 한 번에 실행합니다.', 'git add snow-white.md\ngit commit -m "본문 초안 추가"', 'local:B'],
    committed: ['내 초안 기록 C', '초안 기록 C는 내 저장소에만 있습니다.', '기록을 GitHub 저장소에 공유하는 동작을 푸시라고 합니다.', 'git push -u origin story', 'local:C'],
    pushed: ['GitHub에 공유한 기록', '내 초안 기록 C를 GitHub 저장소에 복사했습니다.', '작업 기록을 공유해도 GitHub 기준본은 자동으로 바뀌지 않습니다.', 'git push -u origin story', 'remote:C'],
    review: ['지수에게 검토 요청', '초안 기록 C에 대한 검토 요청을 만들었습니다.', '변경 검토와 병합을 요청하는 기능을 풀 리퀘스트라고 합니다.', 'GitHub · Open a pull request', 'remote:C'],
    changes: ['지수의 수정 의견', '지수가 초안 기록 C에 의견을 남겼습니다.', '검토 의견은 파일 내용을 자동으로 바꾸지 않습니다.', 'snow-white.md 편집 후 저장', 'local:C'],
    revised: ['수정한 파일', '본문을 다시 저장했습니다. 초안 기록 C는 그대로입니다.', '수정한 파일을 보존하려면 새 기록이 필요합니다.', 'git add snow-white.md\ngit commit -m "검토 의견 반영"', 'local:C'],
    recommitted: ['내 수정 기록 D', '수정 기록 D는 초안 기록 C와 연결됩니다.', '지수가 D를 검토하려면 D를 GitHub 저장소에 공유해야 합니다.', 'git push origin story', 'local:D'],
    reposted: ['수정 기록 D 공유', '기존 검토 요청에 수정 기록 D를 추가했습니다.', '같은 작업 공간의 새 기록을 공유하면 기존 검토 요청도 갱신됩니다.', 'GitHub · Review changes', 'remote:D'],
    approved: ['지수의 승인', '지수가 수정 기록 D를 승인했습니다.', '이 실습에서는 최신 수정 기록에 대한 승인이 있어야 합칠 수 있습니다.', 'GitHub · Approve', 'remote:D'],
    merged: ['GitHub 기준본 M', '지수의 제목과 내 본문을 합친 기록이 M입니다.', 'GitHub에서 합쳐도 각 컴퓨터의 기준본은 자동으로 바뀌지 않습니다.', 'git switch main\ngit pull --ff-only origin main', 'remote:M'],
    done: ['각 저장소의 기준본', '내 저장소는 GitHub 기준본 M을 받아왔습니다.', '지수의 저장소도 별도로 기준본을 받아와야 합니다.', 'git pull --ff-only origin main', 'local:M'],
  };
  const [title, body, takeaway, command, selected] = lessons[mission.phase];
  return { title, body, takeaway, command, selected, location: MILESTONES[missionGroup(mission)], quiz: null, answer: false };
}
