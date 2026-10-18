// An intentionally small teaching history. A–M are display IDs, not real hashes.
export const COMMITS = {
  A: { hash: 'a10e3f2', title: '동화책 시작', parents: [], lines: ['# 백설공주'] },
  B: { hash: 'b24a9c1', title: '숲속 집에 도착', parents: ['A'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.'] },
  C: { hash: 'c38f2d4', title: '일곱 난쟁이가 사는 집', parents: ['B'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.', '그 집에는 일곱 난쟁이가 살고 있었습니다.'] },
  M: { hash: 'd49b7e3', title: '이야기를 팀 기준에 반영', parents: ['B', 'C'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.', '그 집에는 일곱 난쟁이가 살고 있었습니다.'] },
};

export const STEPS = [
  { short: 'Repo', title: '기록이 모이는 저장소', body: '팀 동화책의 파일과 변경 이력이 GitHub에 있습니다. 구슬 A와 B를 눌러 서로 다른 시점의 이야기를 열어보세요.', takeaway: '저장소(repo)는 파일과 그 변경 이력을 함께 보관합니다.', command: 'our-team / handbook', action: '내 컴퓨터로 Clone', location: 'GitHub', selected: 'remote:B' },
  { short: 'Clone', title: '내 컴퓨터에도 같은 이력', body: 'GitHub 저장소를 복제했습니다. 앞쪽과 뒤쪽에 있는 A·B는 같은 커밋입니다. 이제 내 컴퓨터에서 작업할 수 있습니다.', takeaway: 'Git은 내 컴퓨터에서도 이력을 관리합니다. GitHub는 함께 공유하는 공간입니다.', command: 'git clone <저장소 URL>', action: '작업 브랜치 만들기', location: 'GitHub → 내 컴퓨터', selected: 'local:B' },
  { short: 'Branch', title: '같은 기록에서 출발하기', body: 'story 브랜치를 만들고 전환했습니다. 아직 파일도 커밋도 늘지 않았습니다. main과 story라는 두 이름이 같은 B를 가리킵니다.', takeaway: '브랜치는 커밋을 가리키는 이름표입니다. HEAD는 지금 작업 중인 브랜치를 가리킵니다.', command: 'git switch -c story', action: '이야기 한 줄 수정하기', location: '내 컴퓨터', selected: 'local:B' },
  { short: 'Edit', title: '저장했지만 기록은 아직', body: '동화책에 일곱 난쟁이를 만나는 장면을 한 줄 추가했습니다. 종이 모양은 작업 폴더의 변경입니다. B를 열어보면 기록된 내용은 여전히 그대로입니다.', takeaway: '파일 저장과 Git 커밋은 서로 다른 동작입니다.', command: 'snow-white.md 편집 후 저장', action: 'Staging에 담기', location: '내 컴퓨터 · 작업 폴더', selected: 'local:B' },
  { short: 'Stage', title: '다음 기록에 넣을 내용 선택', body: '변경한 이야기를 staging 영역에 담았습니다. 어떤 변경을 다음 커밋에 포함할지 정하는 단계입니다. 새 커밋은 아직 없습니다.', takeaway: 'git add는 현재 파일 내용을 staging에 담습니다.', command: 'git add snow-white.md', action: 'Commit으로 기록하기', location: '내 컴퓨터 · staging', selected: 'local:B' },
  { short: 'Commit', title: '새 기록 C가 태어났습니다', body: 'staging의 내용으로 커밋 C를 만들었습니다. story 이름표가 C로 이동했습니다. main은 B에 있고, GitHub에는 아직 C가 없습니다.', takeaway: '커밋은 프로젝트의 스냅샷입니다. 아래에서는 그중 snow-white.md만 보여줍니다.', command: 'git commit -m "다음 장면 추가"', action: 'GitHub에 Push', location: '내 컴퓨터', selected: 'local:C', quiz: '지금 동료도 GitHub에서 C를 볼 수 있을까요?', answer: false, feedback: '아직 내 컴퓨터에만 있습니다. push해야 GitHub에 공유됩니다.' },
  { short: 'Push', title: '같은 기록을 GitHub로', body: 'story 브랜치와 커밋 C를 GitHub에 보냈습니다. 두 C는 같은 기록입니다. GitHub의 main 이름표는 여전히 B를 가리킵니다.', takeaway: '작업 브랜치를 push해도 main에 자동으로 합쳐지지는 않습니다.', command: 'git push -u origin story', action: 'Pull Request 열기', location: '내 컴퓨터 → GitHub', selected: 'remote:C', quiz: 'GitHub의 main에도 이야기 수정이 반영됐을까요?', answer: false, feedback: 'main은 아직 B입니다. story의 변경을 main에 반영하려면 병합이 필요합니다.' },
  { short: 'PR', title: '합치기 전에 함께 검토', body: 'story → main으로 Pull Request를 열었습니다. 점선은 변경을 합치자는 제안입니다. 리뷰와 검사를 진행하는 동안 커밋 이력은 그대로입니다.', takeaway: 'PR은 GitHub의 검토·논의 공간입니다. PR을 여는 것만으로 병합되지는 않습니다.', command: 'GitHub · base: main ← compare: story', action: '리뷰 완료 후 Merge', location: 'GitHub', selected: 'remote:C' },
  { short: 'Merge', title: '두 이력을 잇는 기록 M', body: '리뷰·검사가 충족되었다고 가정하고 merge commit 방식으로 병합했습니다. M의 부모는 B와 C이며, GitHub main이 M으로 이동합니다.', takeaway: '이 예시는 merge commit 방식입니다. squash·rebase 방식은 다른 이력을 만듭니다.', command: 'GitHub · Create a merge commit', action: '로컬 main으로 전환 후 Pull', location: 'GitHub', selected: 'remote:M', quiz: '내 컴퓨터의 main도 바로 M으로 바뀔까요?', answer: false, feedback: '내 컴퓨터의 main은 아직 B입니다. main으로 전환한 뒤 pull해 갱신합니다.' },
  { short: 'Pull', title: '내 main도 같은 위치에', body: '내 컴퓨터에서 main으로 전환하고 최신 이력을 받아 반영했습니다. 두 main이 모두 M을 가리킵니다. story는 C에 남아 있으며 삭제는 별도 동작입니다.', takeaway: '이 예시는 로컬 main에 추가 변경이 없어 fast-forward가 가능합니다.', command: 'git switch main\ngit pull --ff-only origin main', action: '처음부터 다시 탐색', location: 'GitHub → 내 컴퓨터', selected: 'local:M' },
];

export function getState(step) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Number.isInteger(step) ? step : 0));
  return {
    step: s,
    local: { commits: s < 1 ? [] : s < 5 ? ['A', 'B'] : s < 9 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'M'], main: s < 1 ? null : s < 9 ? 'B' : 'M', branch: s < 2 ? null : s < 5 ? 'B' : 'C', head: s < 1 ? null : s < 2 || s === 9 ? 'main' : 'story' },
    remote: { commits: s < 6 ? ['A', 'B'] : s < 8 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'M'], main: s < 8 ? 'B' : 'M', branch: s < 6 ? null : 'C' },
    file: s === 3 ? 'working' : s === 4 ? 'staged' : null,
    pr: s === 7 ? 'open' : s >= 8 ? 'merged' : null,
  };
}

export const validNode = key => /^(local|remote):[ABCM]$/.test(key);
export const visibleNode = (key, step) => validNode(key) && getState(step)[key.split(':')[0]].commits.includes(key.split(':')[1]);
