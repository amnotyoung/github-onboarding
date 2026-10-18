// An intentionally small teaching history. A–M are display IDs, not real hashes.
export const COMMITS = {
  A: { hash: 'a10e3f2', title: '동화책 시작', parents: [], lines: ['# 백설공주'] },
  B: { hash: 'b24a9c1', title: '숲속 집에 도착', parents: ['A'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.'] },
  C: { hash: 'c38f2d4', title: '일곱 난쟁이가 사는 집', parents: ['B'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.', '그 집에는 일곱 난쟁이가 살고 있었습니다.'] },
  M: { hash: 'd49b7e3', title: '본문을 GitHub 기준본에 합침', parents: ['B', 'C'], lines: ['# 백설공주', '백설공주가 숲속의 작은 집에 도착했습니다.', '그 집에는 일곱 난쟁이가 살고 있었습니다.'] },
};

export const STEPS = [
  { short: '저장소', title: 'GitHub 저장소의 기록', body: 'GitHub 저장소에 이야기 파일과 기록 A, B가 있습니다.', takeaway: '저장소는 파일과 변경 기록을 보관합니다.', command: 'our-team / snow-white', action: '저장소 복제하기', location: 'GitHub 저장소', selected: 'remote:B' },
  { short: '복제', title: '내 저장소의 기록', body: 'GitHub 저장소를 내 컴퓨터에 복제했습니다. 두 저장소에 같은 기록 A, B가 있습니다.', takeaway: '저장소를 복제하는 동작을 클론이라고 합니다.', command: 'git clone <저장소 URL>', action: '작업 공간 만들기', location: '내 저장소', selected: 'local:B' },
  { short: '작업 공간', title: '기준본과 별도의 작업 공간', body: 'story 작업 공간을 만들었습니다. 기준본 main과 작업 공간 story가 모두 기록 B를 가리킵니다.', takeaway: '브랜치는 기록을 가리키는 이름입니다. HEAD는 현재 작업 중인 브랜치를 가리킵니다.', command: 'git switch -c story', action: '본문 수정하기', location: '내 저장소', selected: 'local:B' },
  { short: '파일 저장', title: '파일과 기록의 차이', body: '본문에 일곱 난쟁이가 사는 장면을 추가했습니다. 파일은 바뀌었지만 기록 B는 그대로입니다.', takeaway: '파일을 저장해도 새 기록은 자동으로 생기지 않습니다.', command: 'snow-white.md 편집 후 저장', action: '기록할 내용 선택하기', location: '내 컴퓨터의 파일', selected: 'local:B' },
  { short: '변경 선택', title: '다음 기록에 포함할 내용', body: '수정한 파일을 다음 기록에 포함하도록 선택했습니다. 새 기록은 아직 없습니다.', takeaway: '선택한 파일 내용을 보관하는 곳을 스테이징 영역이라고 합니다.', command: 'git add snow-white.md', action: '변경 기록하기', location: '내 저장소 · 스테이징 영역', selected: 'local:B' },
  { short: '기록', title: '내 초안 기록 C', body: '내 저장소에 기록 C를 만들었습니다. story는 C를 가리킵니다. 기준본 main은 B를 가리킵니다.', takeaway: '커밋은 파일의 상태를 보관하는 기록입니다.', command: 'git commit -m "본문 초안 추가"', action: '기록 공유하기', location: '내 저장소', selected: 'local:C', quiz: '지수는 지금 GitHub에서 기록 C를 볼 수 있나요?', answer: false, feedback: 'C는 내 저장소에만 있습니다. 공유해야 지수가 GitHub에서 볼 수 있습니다.' },
  { short: '공유', title: 'GitHub에도 있는 기록 C', body: '기록 C를 GitHub 저장소에 복사했습니다. 내 저장소의 C도 남아 있습니다. GitHub 기준본 main은 아직 B입니다.', takeaway: '기록 공유는 기준본을 자동으로 바꾸지 않습니다.', command: 'git push -u origin story', action: '지수에게 검토 요청하기', location: 'GitHub 저장소', selected: 'remote:C', quiz: 'GitHub 기준본에 내 본문이 들어갔나요?', answer: false, feedback: 'GitHub 기준본은 아직 B입니다. 내 본문을 합쳐야 기준본이 바뀝니다.' },
  { short: '검토 요청', title: '지수에게 보낸 검토 요청', body: 'story의 변경을 main에 합치기 위한 검토 요청을 만들었습니다. 점선은 이 요청을 나타냅니다.', takeaway: '검토 요청을 풀 리퀘스트(PR)라고 합니다. 요청만으로 기준본은 바뀌지 않습니다.', command: 'GitHub · base: main ← compare: story', action: '승인된 본문 합치기', location: 'GitHub 저장소', selected: 'remote:C' },
  { short: '합치기', title: 'GitHub 기준본 M', body: '이 참고 화면은 지수가 승인했다고 가정합니다. 기록 B와 C를 합친 기록 M을 만들었습니다. GitHub 기준본 main은 M을 가리킵니다.', takeaway: '이 예시는 두 기록을 연결하는 병합 커밋을 만듭니다.', command: 'GitHub · Create a merge commit', action: '내 기준본 받아오기', location: 'GitHub 저장소', selected: 'remote:M', quiz: '내 기준본도 지금 M인가요?', answer: false, feedback: '내 기준본은 아직 B입니다. GitHub 기준본을 받아와야 바뀝니다.' },
  { short: '받아오기', title: '내 기준본 M', body: 'GitHub 기준본 M을 내 저장소로 받아왔습니다. 두 저장소의 main이 모두 M을 가리킵니다. 작업 공간 story는 C를 가리킵니다.', takeaway: '이 예시는 main으로 전환한 뒤 기준본을 받아오는 과정을 한 버튼으로 보여 줍니다.', command: 'git switch main\ngit pull --ff-only origin main', action: '처음으로 돌아가기', location: '내 저장소', selected: 'local:M' },
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
