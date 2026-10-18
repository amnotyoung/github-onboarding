import { COMMITS } from './lab-model.mjs';

export const PHASES = ['brief', 'draft', 'saved', 'committed', 'pushed', 'review', 'changes', 'revised', 'recommitted', 'reposted', 'approved', 'merged', 'done'];
export const MILESTONES = ['작업 분리', '이야기 보태기', '공유', '동료 리뷰', '재수정', '승인·병합', '내 PC 갱신'];
export const DRAFTS = {
  characters: { label: '누가 사는지 보태기', line: '그 집에는 일곱 난쟁이가 살고 있었습니다.', issue: 'next-scene', review: '일곱 난쟁이를 만났군요. 이어서 백설공주가 함께 살게 되는 장면도 넣어볼까요?' },
  home: { label: '함께 사는 장면 보태기', line: '백설공주는 그 집의 난쟁이들과 함께 살게 되었습니다.', issue: 'seven', review: '우리가 아는 일곱 난쟁이 이야기네요. “일곱”이라는 말도 넣으면 장면이 더 잘 떠오르겠어요.' },
};
export const REVISIONS = {
  two: { label: '두 문장으로 이어쓰기', lines: ['그 집에는 일곱 난쟁이가 살고 있었습니다.', '백설공주는 그들과 함께 살게 되었습니다.'] },
  one: { label: '한 문장으로 이어쓰기', lines: ['백설공주는 일곱 난쟁이를 만나 그들의 집에서 함께 살게 되었습니다.'] },
};
const error = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
export const newMission = () => ({ phase: 'brief', draft: null, revision: null, peerStage: 0, peerAuthorId: null, peerApproval: null, authorId: null, reviewerId: null, prAuthorId: null, approval: null, conversation: [], experiment: null, lastAction: null, history: [], future: [], navigation: null });
export const phaseIndex = mission => PHASES.indexOf(mission.phase);
export function missionGroup(mission) { const i = phaseIndex(mission); return i < 1 ? 0 : i < 3 ? 1 : i < 5 ? 2 : i < 7 ? 3 : i < 10 ? 4 : i < 12 ? 5 : 6; }
export const PHASE_LABELS = { brief: '준비', draft: '내용 고치기', saved: '파일에 저장됨', committed: '내 기록 만들기', pushed: '동료와 공유', review: '확인 요청', changes: '동료 의견 도착', revised: '의견 반영', recommitted: '고친 내용 기록', reposted: '다시 공유', approved: '동료 확인 완료', merged: '팀 기준에 반영', done: '내 기준 갱신' };
export const PEER_LABELS = { 'peer-edit': '동료의 제목 수정', 'peer-commit': '동료의 로컬 기록', 'peer-push': '동료도 공유', 'peer-merge': '동료의 변경 반영', 'peer-pull': '동료의 기준 갱신' };
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
  const at = phase => { if (m.phase !== phase) error('이미 진행되었거나 지금 할 수 없는 동작입니다. 현재 미션을 확인하세요.'); };
  const say = (who, text, commit = null) => m.conversation.push({ who, name: who === 'reviewer' && solo ? '지수 · 가상 동료' : actor.name, text, commit });
  if (m.experiment && !['undo-experiment', 'claim-role', 'restart'].includes(action.kind)) error('실험을 되돌린 뒤 이어서 해보세요.');
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
      role('author'); if (![3, 4, 8, 9].includes(index)) error('내 기록을 만든 뒤 동료의 화면을 확인할 수 있습니다.');
      const scene = missionScene(m); m.experiment = { type: 'peer', mine: scene.local.branch, theirs: scene.remote.branch || scene.remote.main }; m.lastAction = action.kind; return m;
    }
    case 'undo-experiment':
      role('author'); if (!m.experiment) error('되돌릴 실험이 없습니다.'); m.experiment = null; m.lastAction = action.kind; return m;
    case 'claim-role': {
      if (!['author', 'reviewer'].includes(action.role)) error('알 수 없는 역할입니다.', 400);
      if (action.role === 'reviewer' && [m.authorId, m.prAuthorId].includes(actor.id)) error('작성자는 리뷰어를 겸할 수 없습니다. 다른 참여자에게 부탁하세요.', 403);
      if (action.role === 'author' && m.reviewerId === actor.id) error('리뷰어는 작성자를 겸할 수 없습니다.', 403);
      const owner = m[`${action.role}Id`];
      if (owner && owner !== actor.id && users.some(u => u.id === owner && u.connected)) error('다른 참여자가 이미 맡은 역할입니다.');
      m[`${action.role}Id`] = actor.id; return m;
    }
    case 'restart': role('author'); return { ...newMission(), authorId: m.authorId, reviewerId: m.reviewerId };
    case 'branch': at('brief'); role('author'); m.phase = 'draft'; break;
    case 'save':
      at('draft'); role('author'); if (!Object.hasOwn(DRAFTS, action.choice)) error('초안 문구를 선택하세요.', 400);
      m.draft = action.choice; m.phase = 'saved'; break;
    case 'commit': at('saved'); role('author'); m.phase = 'committed'; break;
    case 'push': at('committed'); role('author'); m.phase = 'pushed'; break;
    case 'peer-edit':
      at('pushed'); role('reviewer'); if (m.peerStage !== 0) error('동료의 현재 작업 단계를 확인하세요.'); m.peerAuthorId = solo ? 'simulated-reviewer' : actor.id; m.peerStage = 1; break;
    case 'peer-commit':
      at('pushed'); role('reviewer'); if (m.peerStage !== 1) error('동료의 파일을 먼저 수정하세요.'); m.peerStage = 2; break;
    case 'peer-push':
      at('pushed'); role('reviewer'); if (m.peerStage !== 2) error('동료의 로컬 기록을 먼저 만드세요.'); m.peerStage = 3; break;
    case 'peer-merge':
      at('pushed'); role('author'); if (m.peerStage !== 3) error('공유된 동료의 변경을 먼저 확인하세요.');
      if (!solo && actor.id === m.peerAuthorId) error('자신의 변경은 다른 사람이 확인해야 합니다.', 403);
      m.peerApproval = { commit: 'T', reviewerId: actor.id, name: actor.name }; m.peerStage = 4; break;
    case 'open-pr':
      at('pushed'); role('author'); if (m.peerStage < 4) error('동료도 자기 로컬에서 작업해 공유하는 과정을 먼저 해보세요.'); m.prAuthorId = actor.id; m.phase = 'review'; say('author', '백설공주가 숲속 집에 도착한 뒤의 이야기를 한 문장 보탰어요. 함께 읽어주세요.', 'C'); break;
    case 'request-changes':
      at('review'); role('reviewer');
      if (action.issue !== DRAFTS[m.draft].issue) error('현재 선택한 장면에 맞는 의견을 확인해 주세요.', 400);
      say('reviewer', DRAFTS[m.draft].review, 'C'); m.phase = 'changes'; break;
    case 'revise':
      at('changes'); role('author'); if (!Object.hasOwn(REVISIONS, action.choice)) error('수정할 문구를 선택하세요.', 400);
      m.revision = action.choice; m.phase = 'revised'; break;
    case 'commit-revision': at('revised'); role('author'); m.phase = 'recommitted'; break;
    case 'push-revision':
      at('recommitted'); role('author'); m.phase = 'reposted';
      say('author', '일곱 난쟁이를 만나 함께 살게 되는 장면으로 이어 썼어요. 고친 문장을 다시 봐주세요.', 'D'); break;
    case 'approve':
      at('reposted'); role('reviewer');
      if (action.commit !== 'D' || !Array.isArray(action.checks) || !['seven', 'together'].every(check => action.checks.includes(check))) error('최신 수정 D에서 등장인물과 이어지는 장면을 모두 확인해 주세요.');
      m.approval = { commit: 'D', reviewerId: solo ? 'simulated-reviewer' : actor.id, name: solo ? '지수 · 가상 동료' : actor.name };
      say('reviewer', '일곱 난쟁이를 만나 함께 살게 되는 장면이 이어졌네요. 고친 문장을 확인했어요. 이 내용으로 함께 써요.', 'D'); m.phase = 'approved'; break;
    case 'merge':
      role('author'); if (m.phase !== 'approved' || m.approval?.commit !== 'D' || [m.authorId, m.prAuthorId].includes(m.approval.reviewerId)) error('수정 D를 동료가 승인한 뒤에 병합할 수 있습니다.');
      m.phase = 'merged'; break;
    case 'pull': at('merged'); role('author'); m.phase = 'done'; break;
    case 'peer-pull':
      at('done'); role('reviewer'); if (m.peerStage !== 4) error('동료의 현재 기준을 확인하세요.'); m.peerStage = 5; break;
    default: error('알 수 없는 미션 동작입니다.', 400);
  }
  if (phaseIndex(m) < index) error('미션을 거꾸로 진행할 수 없습니다.');
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
    X: { hash: 'f30c7e1', title: '내 기준본에 바로 이야기를 보탠 기록', parents: ['B'], lines: [...COMMITS.B.lines, DRAFTS.characters.line] },
    C: { hash: mission.draft === 'characters' ? 'c10a2f4' : 'c20b3f5', title: '숲속 집의 다음 장면 추가', parents: ['B'], lines: cLines },
    D: { hash: `${mission.draft === 'characters' ? 'd1' : 'd2'}${mission.revision === 'one' ? '8e74a' : '9f85b'}`, title: '일곱 난쟁이와 함께 살게 된 백설공주', parents: ['C'], lines: dLines },
    T: { hash: 'f51d7a3', title: '동료가 제목을 구체적으로 수정', parents: ['B'], lines: titleLines },
    P: { hash: 'f62e8b4', title: '동료의 제목을 팀 기준에 반영', parents: ['B', 'T'], lines: titleLines },
    M: { hash: `${mission.draft === 'characters' ? 'e1' : 'e2'}${mission.revision === 'one' ? 'a6703' : 'b7814'}`, title: '동료의 제목 + 나의 본문', parents: ['P', 'D'], lines: [titleLines[0], ...dLines.slice(1)] },
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

// Instructions describe actions first; vocabulary is disclosed only after the action.
export function missionInteraction(m) {
  if (m.experiment) return { label: '실험 되돌리기', instruction: m.experiment.type === 'direct-main' ? '내 기준만 달라졌어요. 팀의 이야기와 비교해 보세요.' : '나와 동료에게 보이는 이야기를 비교해 보세요.', kind: 'undo-experiment', source: 'local:X', role: 'author', experiment: true };
  if (m.phase === 'pushed' && (m.peerStage || 0) < 4) {
    const views = [
      ['이번에는 동료가 자기 컴퓨터에서 제목을 고쳐봅니다.', '동료의 제목 고치기', 'peer-edit', 'peer:B', 'reviewer'],
      ['동료가 고친 제목도 아직 파일일 뿐입니다. 동료의 로컬 기록을 만드세요.', '동료의 현재 상태 기록하기', 'peer-commit', 'peer:B', 'reviewer'],
      ['동료의 기록도 GitHub에 공유해야 다른 사람이 볼 수 있습니다.', '동료의 기록 공유하기', 'peer-push', 'peer:T', 'reviewer'],
      ['공유된 동료의 제목 변경을 확인하고 팀 기준에 반영하세요.', '동료의 제목을 확인하고 반영', 'peer-merge', 'remote:T', 'author'],
    ];
    const [instruction, label, kind, source, role] = views[m.peerStage || 0]; return { instruction, label, kind, source, role };
  }
  if (m.phase === 'done' && m.peerStage < 5) return { instruction: '내 컴퓨터는 갱신됐지만 동료의 기준은 아직 예전입니다. 동료도 받아오게 하세요.', label: '동료의 기준도 갱신하기', kind: 'peer-pull', source: 'peer:B', role: 'reviewer' };

  const views = {
    brief: ['팀 원본은 두고, 내 컴퓨터에 작업 공간을 만드세요.', '내 작업 공간 만들기', 'branch', 'document'],
    draft: ['내 컴퓨터에서 동화책에 한 문장을 보태세요.', '내 동화책 고치기', 'edit', 'document'],
    saved: ['고친 동화책을 눌러, 현재 상태를 기록하세요.', '현재 상태 기록하기', 'commit', 'document'],
    committed: ['내 로컬 기록을 GitHub에 공유하세요. 동료의 로컬은 자동으로 바뀌지 않습니다.', '내 기록을 GitHub에 공유', 'push', 'local:C'],
    pushed: ['공유된 기록을 눌러, 동료에게 확인을 부탁하세요.', '동료에게 확인 부탁하기', 'open-pr', 'remote:C'],
    review: ['동료 표시를 눌러, 답변을 확인하세요.', '동료의 답변 열기', 'review', 'reviewer'],
    changes: ['내 동화책을 눌러, 동료의 의견을 반영해 장면을 이어 쓰세요.', '의견을 반영해 고치기', 'edit', 'document'],
    revised: ['고친 상태를 한 번 더 기록하고, 이전 기록과 비교하세요.', '고친 상태 기록하기', 'commit-revision', 'document'],
    recommitted: ['고친 기록을 GitHub에 다시 공유해 확인받으세요.', '고친 기록 공유하기', 'push-revision', 'local:D', [2.2, -2.7]],
    reposted: ['동료 표시를 눌러, 고친 내용을 함께 확인하세요.', '고친 내용 확인하기', 'review', 'reviewer'],
    approved: ['동료의 제목이 있는 팀 기준에, 확인받은 내 본문을 합치세요.', '두 사람의 변경 합치기', 'merge', 'remote:D'],
    merged: ['GitHub에는 두 사람의 변경이 합쳐졌습니다. 먼저 내 컴퓨터로 받아오세요.', '내 기준 갱신하기', 'pull', 'remote:M'],
    done: ['각자 작업한 제목과 본문이 합쳐져, 세 저장소에서 같은 결과를 볼 수 있어요.', '합쳐진 동화책 확인하기', 'compare', 'document'],
  };
  const [instruction, label, kind, source, drop] = views[m.phase];
  return { instruction, label, kind, source, drop, role: ['review', 'reposted'].includes(m.phase) ? 'reviewer' : 'author' };
}

export function missionObservation(m) {
  if (m.navigation) return [(m.future || []).length ? '이전 장면을 보고 있어요. 여기서 조작하거나 선택을 바꾸면 이후 과정은 다시 진행합니다.' : '다시 앞의 진행 지점으로 돌아왔어요. 선택과 동료의 답변이 그대로 보존됐어요.', '학습 장면 탐색'];
  const notes = {
    branch: ['원래 이야기는 그대로 두고, 따로 작업할 흐름을 만들었어요.', '브랜치 · branch'],
    save: ['파일 내용만 바뀌었어요. 아직 새 기록은 없어요.', '파일 저장'],
    commit: ['새 기록이 생기고 이전 기록과 연결되었어요.', '커밋 · commit'],
    push: ['내 기록은 남아 있고, 팀 쪽에도 같은 기록이 생겼어요.', '푸시 · push'],
    'peer-edit': ['동료의 파일 제목만 바뀌었어요. 나와 GitHub에는 아직 이 변경이 없어요.', '각자의 작업 파일'],
    'peer-commit': ['제목 변경 T는 동료의 로컬 저장소에만 기록됐어요.', '동료의 커밋 · commit'],
    'peer-push': ['동료의 기록 T도 GitHub에 복사됐어요. 내 로컬에는 아직 없어요.', '동료의 푸시 · push'],
    'peer-merge': ['동료의 제목을 확인해 GitHub의 팀 기준에 반영했어요. 두 로컬의 기준은 아직 예전이에요.', '동료의 변경 병합'],
    'open-pr': ['동료에게 확인을 부탁했어요. 팀의 기준은 아직 그대로예요.', '풀 리퀘스트 · Pull request'],
    'request-changes': ['동료가 이어 쓸 장면을 제안했어요.', '리뷰 · review'],
    revise: ['설명을 고쳤어요. 이전에 만든 기록의 내용은 바뀌지 않아요.', '파일 저장'],
    'commit-revision': ['고친 내용이 새 기록이 되었어요. 이전 설명도 남아 있어요.', '커밋 · commit'],
    'push-revision': ['같은 확인 요청에 새 기록이 도착했어요. 내 기록도 그대로예요.', '푸시 · push'],
    approve: ['동료가 최신 내용을 확인하고 반영에 동의했어요.', '승인 · approval'],
    merge: ['GitHub의 팀 기준에 동료의 제목과 나의 본문이 함께 들어갔어요.', '병합 · merge'],
    pull: ['내 기준도 팀과 같아졌어요.', '풀 · pull'],
    'peer-pull': ['동료도 받아왔어요. 각자의 로컬과 GitHub가 같은 결과를 가리킵니다.', '동료의 풀 · pull'],
    'try-main': ['내 기준에 바로 수정 기록을 만들었어요. 공유하지 않아 팀 쪽은 원래대로예요.', '원본에서 작업하는 실험'],
    'inspect-peer': [m.experiment?.mine === m.experiment?.theirs ? '동료도 GitHub에서 이 기록을 볼 수 있어요. 동료의 로컬 갱신은 별도입니다.' : '내게는 새 설명이 있지만, GitHub에는 아직 없어요.', '보이는 범위 실험'],
    'undo-experiment': ['실험 전 상태로 돌아왔어요. 다른 방법을 시도할 수 있어요.', '실험 되돌리기'],
  };
  return notes[m.lastAction] || null;
}

export function missionLesson(mission) {
  const lessons = {
    brief: ['팀 동화책을 안전하게 고치기', '백설공주가 숲속 집에 도착했습니다. 함께 쓰는 원래 장면을 유지하면서 다음 문장을 보태보세요.', 'main은 팀의 기준본, story는 검토받기 위한 작업 공간으로 사용합니다.', 'git switch -c story', 'local:B'],
    draft: ['어떤 설명을 추가할까요?', '첫 초안을 골라 저장하세요. 완벽한 문장을 혼자 완성할 필요는 없습니다. 다음에는 동료의 눈으로 확인합니다.', '아직 팀의 동화책 main은 바뀌지 않습니다.', 'snow-white.md 편집 후 저장', 'local:B'],
    saved: ['저장과 기록은 다릅니다', '아래 초안은 파일에 저장됐지만, 3D 공간에는 아직 새 커밋이 없습니다. 변경을 하나의 기록으로 남겨보세요.', '이번 동작은 변경 선택(git add)과 커밋을 함께 연습합니다.', 'git add snow-white.md\ngit commit -m "이야기 초안 추가"', 'local:B'],
    committed: ['C는 아직 내 컴퓨터에만', '초안 C가 생겼습니다. GitHub 쪽에 C가 있는지 직접 확인한 뒤 동료에게 공유하세요.', '내 컴퓨터의 기록을 공유하려면 Push가 필요합니다.', 'git push -u origin story', 'local:C'],
    pushed: ['공유했지만 팀 기준본은 그대로', 'GitHub의 story에도 C가 있습니다. main은 여전히 B입니다. 동료에게 검토할 내용과 이유를 알려주세요.', 'PR은 변경을 함께 검토하고 합치자고 요청하는 공간입니다.', 'GitHub · story의 변경을 main에 반영하는 PR 열기', 'remote:C'],
    review: ['처음 읽는 동료의 눈으로', 'PR #12에 초안과 요청이 올라왔습니다. 동료와 함께 다음 장면을 읽어봅니다.', '지금은 동료가 변경된 줄을 읽고 수정 의견을 보낼 차례입니다.', 'GitHub · Review changes → Request changes', 'remote:C'],
    changes: ['리뷰 때문에 작업이 달라집니다', '동료가 헷갈리는 부분을 짚었습니다. 아래 대화를 읽고, 일곱 난쟁이를 만나는 장면을 이어 써보세요.', '리뷰는 승인 도장을 받는 절차에 그치지 않습니다. 동료의 질문이 결과물을 바꿉니다.', 'snow-white.md 재수정 후 저장', 'local:C'],
    revised: ['수정했지만 C는 바뀌지 않습니다', '파일의 새 문구를 저장했습니다. 3D의 C를 클릭하면 이전 초안이 그대로 남아 있습니다. 보완한 내용을 새 기록으로 남기세요.', '이미 만든 커밋 C의 내용은 그대로 보존합니다.', 'git add snow-white.md\ngit commit -m "리뷰 의견 반영"', 'local:C'],
    recommitted: ['보완 기록 D가 생겼습니다', 'C 뒤에 D가 이어졌습니다. C와 D를 각각 눌러 문구를 비교해 보세요. 동료에게 D를 보내야 다시 검토할 수 있습니다.', '재수정도 Commit 후 Push해야 동료에게 전달됩니다.', 'git push origin story', 'local:D'],
    reposted: ['같은 PR에서 다시 확인', 'PR #12가 D까지 갱신되었습니다. 리뷰어가 새 문구를 읽고, 자신이 요청한 내용이 들어갔는지 확인합니다.', '새 PR을 만들지 않아도 같은 작업 브랜치에 Push하면 기존 PR이 갱신됩니다.', 'GitHub · 수정 D 확인 → Approve', 'remote:D'],
    approved: ['승인된 D를 팀에 반영하기', '동료가 수정 D를 승인했습니다. 이제 준비된 변경을 main에 합칠 차례입니다.', '이 실습은 동료의 최신 수정 승인이 있어야 병합할 수 있도록 설정했습니다.', 'GitHub · Create a merge commit', 'remote:D'],
    merged: ['팀은 새 동화책을 보고 있습니다', 'GitHub main이 M으로 이동했습니다. M은 동료의 제목이 반영된 P와 내 본문 D를 연결합니다. 내 컴퓨터 main은 아직 B입니다.', '병합은 GitHub에서 일어났습니다. 내 컴퓨터의 기준본도 갱신해야 합니다.', 'git switch main\ngit pull --ff-only origin main', 'remote:M'],
    done: ['동료와 함께 바꾼 동화책', '초안 C → 리뷰 의견 → 보완 D → 동료 승인 → 팀 main 반영까지 마쳤습니다. 동료도 받아오면 세 저장소의 기준이 같은 M을 가리킵니다.', '브랜치에서 준비하고, 동료가 확인하고, 준비된 변경을 함께 씁니다.', '이 예시는 로컬 main에 추가 변경이 없어 fast-forward로 갱신했습니다.', 'local:M'],
  };
  const [title, body, takeaway, command, selected] = lessons[mission.phase];
  const quiz = mission.phase === 'committed' ? ['동료도 지금 GitHub에서 초안 C를 볼 수 있을까요?', '아직 내 컴퓨터에만 있습니다. Push해야 공유됩니다.'] : mission.phase === 'pushed' ? ['팀의 main에도 초안이 반영됐을까요?', '공유된 story는 C이고 main은 B입니다. 검토와 병합은 아직 남아 있습니다.'] : mission.phase === 'merged' ? ['내 컴퓨터의 main도 이미 갱신됐을까요?', 'GitHub만 바뀌었습니다. 내 main으로 전환한 뒤 Pull해야 합니다.'] : null;
  return { title, body, takeaway, command, selected, location: MILESTONES[missionGroup(mission)], quiz: quiz?.[0], feedback: quiz?.[1], answer: false };
}
