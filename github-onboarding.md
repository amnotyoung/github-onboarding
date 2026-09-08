# GitHub 온보딩: 내 작업을 팀의 결과물로 합치는 방법

슬라이드 내용 초안 · 2026-09-08

- 대상: Git과 GitHub를 처음 사용하는 팀원. 코딩 경험을 전제하지 않는다.
- 구성: 본문 17장과 강사용 정정표. `---`를 슬라이드 경계로 사용한다.
- 공통 예시: 팀 안내서 저장소 `our-team/handbook`의 FAQ 수정.
- 실습 전제: 참여자는 저장소 접근 및 작업 브랜치 push 권한을 받는다. 최종 merge는 지정 담당자가 수행하는 운영 예시를 사용한다.
- 인용과 ‘발표자 메모’는 슬라이드 제작 시 발표자 노트로 옮길 수 있다.

---

## 01. 버전관리는 파일이 어떻게 바뀌었는지 기록한다

**“누가, 언제, 무엇을 바꿨는가?”를 확인할 수 있어야 함께 작업할 수 있다.**

- `안내서_최종`, `안내서_최종수정`, `안내서_진짜최종` 대신 변경 이력을 남긴다.
- 이전 버전과 현재 버전을 비교하고, 필요하면 변경을 되돌린다.
- 여러 사람의 작업을 검토한 뒤 하나로 합친다.
- 코드뿐 아니라 안내서·연구 문서 같은 텍스트도 관리할 수 있다.

> 발표자 메모: 오늘의 목표는 FAQ 한 항목을 수정하고 팀 안내서에 반영하는 과정까지 이해하는 것이다. 예시 파일은 Markdown으로 통일한다.

근거: [About Git](https://docs.github.com/en/get-started/using-git/about-git), [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow).

---

## 02. Git은 버전관리 시스템, GitHub는 협업하는 허브다

**“GitHub는 Git의 hub다”라고 기억하면 이해하기 쉽다.**

| 구분 | 하는 일 |
| --- | --- |
| Git | 파일의 버전과 변경 이력을 관리하는 분산 버전관리 시스템 |
| GitHub | Git 저장소를 온라인에 호스팅하고, 이슈·리뷰 등 협업 기능을 제공하는 플랫폼 |

- Git은 내 컴퓨터에서도 작동하며 GitHub 없이 사용할 수 있다.
- GitHub에서는 작업을 공유하고, 변경을 논의하고, 합칠 수 있다.

> 발표자 메모: ‘Git의 hub’는 입문용 비유다. Git과 GitHub는 서로 다른 도구이며, GitHub가 Git 자체를 의미하지는 않는다.

근거: [About Git](https://docs.github.com/en/get-started/using-git/about-git).

---

## 03. GitHub에서 작업을 모으는 기본 단위는 repository다

**Repository, 줄여서 repo는 파일과 변경 이력을 담는 저장소다.**

- GitHub repo에는 파일과 이력 외에도 Issues, Pull requests 같은 협업 공간이 있다.
- 주소는 보통 `github.com/소유자/저장소이름` 형태다.
- 예: `our-team/handbook`은 `our-team`이 소유한 `handbook` 저장소다.
- `README.md`에는 저장소의 목적과 사용 방법을 적는다.

> 발표자 메모: 프로젝트 하나를 repo 하나로 시작하면 이해하기 쉽다. 실제로는 한 프로젝트가 여러 repo를 쓰거나 한 repo에 여러 구성요소를 담기도 한다. GitHub의 ‘Projects’는 별도의 업무 추적 기능 이름이기도 하다.

근거: [About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories).

---

## 04. Repo에는 소유자와 권한을 받은 참여자가 있다

**소유자가 누구인지와 내가 무엇을 할 수 있는지는 구분해서 확인한다.**

- 소유자(owner)는 개인 계정 또는 조직(organization)이다.
- 협업자(collaborator)는 저장소 접근 권한을 부여받아 참여하는 사람이다.
- 조직 저장소에서는 팀별로 권한을 부여할 수도 있다.
- 공개(public) 저장소와 비공개(private) 저장소는 접근 가능한 범위가 다르다.

| 조직 저장소의 대표 역할 | 주된 용도 |
| --- | --- |
| Read | 내용 확인과 논의 참여 |
| Triage | 이슈와 PR 분류·관리 |
| Write | 변경사항 push 등 기여 작업 |
| Maintain / Admin | 저장소 운영 / 접근 권한과 주요 설정 관리 |

> 발표자 메모: 이 표는 조직 저장소의 역할 구분이다. 개인 저장소에 똑같은 역할 체계가 적용된다고 설명하지 않는다. 공개 저장소를 볼 수 있다는 이유만으로 직접 push할 수 있는 것은 아니다.

근거: [Repository roles for an organization](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization), [About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories).

---

## 05. Issue에는 해결할 일과 완료 조건을 적는다

**Issue는 문제·제안·할 일을 기록하고 논의하는 공간이다.**

- 이슈 제목에 무엇을 해결하려는지 쓴다.
- 본문에 배경과 기대 결과를 적는다.
- 담당자와 완료 조건을 정하면 작업 범위가 분명해진다.

**예시 Issue #12**

> 제목: 팀 안내서에 GitHub 초대 수락 방법 추가
>
> 배경: 신규 팀원이 초대 메일을 받고도 다음 단계를 알기 어렵다.
>
> 완료 조건: FAQ에 초대 수락 방법과 접근 오류 시 문의 경로가 있다.

> 발표자 메모: 저장소에 접근할 수 있고 Issues가 활성화되어 있으며 참여 제한에 걸리지 않는 사용자는 이슈를 만들 수 있다. 공개 저장소에는 외부 사용자도 참여할 수 있다. 이슈 작성만으로 파일이 바뀌지는 않는다.

근거: [Creating an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue).

---

## 06. 파일은 각자의 작업 환경에서 수정하고 GitHub에 공유한다

**이번 교육은 내 컴퓨터의 로컬 저장소에서 작업하는 흐름을 따른다.**

| 위치 | 역할 |
| --- | --- |
| 로컬(local) | 내 컴퓨터에서 파일을 수정하고 Git으로 이력을 기록하는 곳 |
| 원격(remote) | GitHub처럼 다른 참여자와 변경 이력을 공유하는 저장소 |

- `clone`은 원격 저장소를 내 컴퓨터에 처음 복제하는 작업이다.
- 로컬에서 파일을 저장해도 GitHub의 파일은 자동으로 바뀌지 않는다.
- GitHub에는 완성본뿐 아니라 작업 중간의 commit도 공유할 수 있다.

> 발표자 메모: 모든 작업이 반드시 개인 컴퓨터에서 이루어지는 것은 아니다. GitHub 웹 편집기나 클라우드 작업 환경도 있다. 여기서는 로컬과 원격의 관계를 먼저 익힌다. clone은 일반적인 ZIP 다운로드와 달리 Git 이력과 원격 연결을 포함한다.

근거: [About Git](https://docs.github.com/en/get-started/using-git/about-git), [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow).

---

## 07. Branch는 변경 이력을 나누어 작업하는 방법이다

**공유 기준 버전을 유지하면서 별도 브랜치에서 수정한다.**

- `main`: 이 교육에서 팀의 기준 버전으로 사용하는 브랜치.
- `docs/invitation-guide`: 초대 안내를 추가하는 작업 브랜치.
- 작업을 시작할 때 최신 기준 버전에서 브랜치를 만든다.
- 변경을 검토한 뒤 작업 브랜치의 내용을 `main`에 합친다.

> 발표자 메모: ‘subbranch’보다는 ‘작업 브랜치’, ‘feature branch’, ‘topic branch’라고 부르는 편이 정확하다. 브랜치는 폴더처럼 상하 관계로 들어 있지 않으며 `docs/`도 이름의 일부다. `main`은 흔한 이름이고 실제 기본 브랜치 이름은 저장소마다 다를 수 있다.

근거: [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow).

---

## 08. Commit은 변경을 이력에 기록하는 단위다

**파일 수정 내용을 골라 설명과 함께 기록하면 commit이 된다.**

1. 파일을 수정하고 저장한다.
2. 이번 기록에 넣을 변경을 선택한다. 이 단계를 staging이라고 한다.
3. 무엇을 바꿨는지 메시지를 붙여 commit한다.

- 예시 메시지: `docs: GitHub 초대 수락 안내 추가`
- 하나의 commit에는 설명 가능한 하나의 목적을 담는 것이 좋다.
- 한 작업을 완료하는 동안 여러 commit을 만들 수도 있다.

> 발표자 메모: commit은 기술적으로 프로젝트의 특정 시점 상태와 관련 정보를 기록한다. ‘작업 하나 = commit 하나’는 절대 규칙이 아니다. 저장만 한 변경이나 staging만 한 변경은 아직 commit에 기록되지 않았다.

근거: [Git: Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository).

---

## 09. Push는 로컬 commit을 원격 저장소에 보낸다

**Commit으로 로컬에 기록하고, push로 GitHub에 공유한다.**

| 작업 | 결과 |
| --- | --- |
| Save | 작업 중인 파일을 저장한다 |
| Commit | 선택한 변경을 로컬 Git 이력에 기록한다 |
| Push | 원격 저장소에 필요한 commit을 전송하고 브랜치를 갱신한다 |

- 이번 교육에서는 `docs/invitation-guide` 작업 브랜치를 push한다.
- 작업 브랜치를 push해도 `main`에는 아직 반영되지 않는다.
- `main` 직접 push를 제한하고 PR을 거치는 방식은 흔한 협업 규칙이다.

> 발표자 메모: push 자체에 ‘반드시 작업 브랜치로만 보낸다’는 제한은 없다. 권한과 규칙이 허용하면 main에도 push할 수 있다. 아직 commit하지 않은 수정은 push로 전송되지 않는다.

근거: [Pushing commits to a remote repository](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository), [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

---

## 10. Pull Request는 변경사항을 합쳐 달라는 제안이다

**PR에는 변경 내용과 그 이유를 담아 검토를 요청한다.**

- Pull Request를 줄여서 PR이라고 부른다.
- 출발 브랜치와 반영할 대상 브랜치를 지정한다.
- 변경된 파일의 차이(diff)를 함께 확인할 수 있다.
- PR을 등록한 뒤에도 같은 브랜치에 commit하고 push하면 PR에 반영된다.

**예시 PR**

> 제목: 팀 안내서에 GitHub 초대 수락 방법 추가
>
> 대상: `docs/invitation-guide`의 변경을 `main`에 반영
>
> 내용: 초대 수락 절차와 접근 오류 시 문의 경로 추가
>
> 확인: 설명을 따라 절차 점검, 링크 확인
>
> 관련 이슈: #12

> 발표자 메모: 이슈는 ‘무슨 일을 할지’, PR은 ‘어떤 변경을 반영할지’를 다룬다. PR 생성에는 출발 브랜치에 변경을 올릴 수 있어야 한다. 원본 저장소에 쓰기 권한이 없으면 허용되는 경우 fork한 저장소에서 PR을 보낼 수 있다. 저장소는 PR 생성을 제한하거나 비활성화할 수도 있다.

근거: [Creating a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request), [PR 접근 설정](https://github.blog/changelog/2026-02-13-new-repository-settings-for-configuring-pull-request-access/).

---

## 11. Review는 검토이고, merge는 실제 반영이다

**리뷰 참여, 승인, 병합은 각각 다른 행동이다.**

| 행동 | 의미 | 누가 할 수 있나 |
| --- | --- | --- |
| Review / Comment | 변경을 읽고 의견을 남긴다 | 읽기 접근 권한이 있는 참여자 |
| Approve | 변경이 반영해도 될 상태라고 판단한다 | 승인 제출 및 필수 승인 인정 범위는 권한·규칙에 따름 |
| Merge | 변경을 대상 브랜치에 합친다 | 통상 Write 이상 권한과 병합 조건을 충족하는 참여자 |

- Repo 소유자 외에도 읽기 접근 권한이 있는 참여자가 PR을 리뷰할 수 있다.
- Repo 소유자만 merge할 수 있는 것도 아니다.
- 리뷰에서 승인해도 실제 merge는 별도 단계다.

> 발표자 메모: PR 작성자는 자기 PR을 승인할 수 없다. 리뷰 의견을 남길 수 있는 사람과 필수 승인 수에 포함되는 사람도 다를 수 있다. 보호 규칙은 승인이나 자동 검사 통과를 요구할 수 있다.

근거: [Pull request reviews](https://docs.github.com/en/pull-requests/reference/pull-request-reviews), [Repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization), [Merging a pull request](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request).

---

## 12. 팀의 운영 규칙으로 최종 반영 책임을 정한다

**“지정 담당자만 최종 merge”는 팀에서 선택할 수 있는 운영 방식이다.**

이번 교육에서 사용할 규칙 예시:

- 참여자는 이슈와 PR을 만들고 서로 리뷰한다.
- 파일 변경은 작업 브랜치에 올린다.
- 지정 리뷰어가 확인하고, 지정 담당자가 최종 merge한다.
- `main`은 PR을 거쳐 갱신하도록 보호 규칙을 적용한다.

> 발표자 메모: ‘소유자가 최종 merge한다’는 운영도 가능하다. 이를 GitHub의 기본 권한으로 가르치지 않는다. 리뷰 승인 의무화만으로 병합 실행자가 소유자로 제한되는 것은 아니다. 실제 제한에는 별도의 권한·브랜치 갱신 제한과 우회 권한 검토가 필요하며, 지원 범위는 요금제와 저장소 유형에 따라 다르다. 담당자 자신의 PR을 검토할 대체 리뷰어도 정한다.

근거: [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

---

## 13. Pull로 팀의 변경을 내 작업 환경에 반영한다

**GitHub에서 merge가 끝나면 로컬에도 최신 변경을 가져온다.**

| 용어 | 역할 |
| --- | --- |
| Clone | 처음에 원격 저장소를 로컬로 복제한다 |
| Fetch | 원격의 새로운 이력을 가져온다 |
| Pull | 원격 이력을 가져와 현재 브랜치에 통합한다 |
| Push | 로컬 이력을 원격에 공유한다 |

- merge 후에는 로컬 `main`으로 전환해 최신 상태를 반영한다.
- 다음 작업은 갱신된 `main`에서 새 브랜치를 만들어 시작한다.

> 발표자 메모: pull은 현재 브랜치에 작용한다. 실행 전에 브랜치와 미기록 변경을 확인한다. pull의 통합 방식은 설정에 따라 merge 또는 rebase 등이 될 수 있다. Pull Request와 git pull은 서로 다른 개념이다.

근거: [About Git](https://docs.github.com/en/get-started/using-git/about-git).

---

## 14. 충돌은 함께 반영할 내용을 결정해야 한다는 뜻이다

**Git이 자동으로 합칠 수 없는 변경은 사람이 내용을 판단한다.**

- 두 사람이 같은 부분을 다르게 수정하면 충돌이 생길 수 있다.
- 양쪽 변경의 의도를 확인하고 최종 내용을 정한다.
- 해결한 파일을 검토하고 commit·push해 PR을 갱신한다.
- 반영 완료 여부는 GitHub의 PR 상태와 `main`에서 확인한다.

> 발표자 메모: 충돌은 파일 삭제와 수정이 겹치는 경우에도 생긴다. 이번 교육은 merge 방식의 충돌 해결을 예로 든다. AI에게 양쪽 변경을 설명하게 하고, 무엇을 남길지는 내용에 따라 결정한다.

근거: [Merging a pull request](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request).

---

## 15. 주요 Git·GitHub 작업은 AI에게 자연어로 요청할 수 있다

**Claude나 ChatGPT로 절차를 안내받고, 실행 도구가 연결되면 실제 작업도 맡길 수 있다.**

- Claude Code나 Codex 같은 에이전트는 파일과 개발 도구를 사용해 작업한다.
- 브랜치 생성, 변경 검토, commit·push, PR 작성 등을 자연어로 요청할 수 있다.
- 실제 가능한 작업은 제품 기능, 도구 연결, 인증과 저장소 권한에 따라 달라진다.
- 사용자는 작업 목적과 범위를 정하고 변경 결과를 확인한다.

> 발표자 메모: ‘Claude나 ChatGPT에서 모든 기능을 쓸 수 있다’는 보장은 부정확하다. 설명만 제공하는 대화 환경과 실제 실행 도구가 연결된 환경을 구분한다. GitHub를 읽을 수 있다는 사실만으로 쓰기 권한까지 있다고 판단하지 않는다.

근거: [Claude Code overview](https://code.claude.com/docs/en/overview), [OpenAI: GitHub에서 Codex로 리뷰하고 수정하기](https://learn.chatgpt.com/docs/third-party/github).

---

## 16. 자연어 요청에도 대상과 작업 범위를 담는다

**AI에게 어느 repo에서 무엇을 바꾸고 어디까지 진행할지 알려 준다.**

아래는 실행 도구와 권한이 준비된 환경에서 사용할 실습 요청 예시다.

**작업 시작**

> `our-team/handbook` 저장소를 로컬에 준비해 줘. 이미 있으면 현재 브랜치와 저장하지 않은 변경부터 확인해 줘. 최신 main에서 `docs/invitation-guide` 브랜치를 만들고, Issue #12의 완료 조건에 맞춰 FAQ를 수정해 줘.

**변경 기록과 PR**

> 이번 작업의 diff를 보여 주고 내용과 링크를 점검해 줘. 변경을 commit한 뒤 작업 브랜치에 push하고, main을 대상으로 PR을 만들어 줘. PR에는 변경 이유, 확인 결과와 Issue #12를 적어 줘. 최종 merge는 지정 담당자가 진행해.

**작업 완료 확인**

> PR의 리뷰와 merge 상태를 확인해 줘. merge가 끝났으면 로컬 작업 상태를 확인하고 main을 최신 상태로 갱신해 줘.

> 발표자 메모: 실습에서는 실제 저장소 이름과 이슈 번호로 바꾼다. AI의 완료 설명과 함께 브랜치명, commit, PR 링크를 확인한다. 위 문장은 실습용으로 작성한 예시이며 특정 제품의 고정 명령문이 아니다.

---

## 17. 첫 기여는 FAQ 한 항목으로 끝까지 경험한다

**내 수정이 팀의 기준 버전에 들어가는 과정을 한 번 완료한다.**

1. 저장소 초대를 수락하고 README와 작업 규칙을 읽는다.
2. 이슈에서 수정할 내용과 완료 조건을 확인한다.
3. 로컬 저장소를 준비하고 최신 `main`에서 작업 브랜치를 만든다.
4. FAQ를 수정하고 확인한 뒤 commit한다.
5. 작업 브랜치를 push하고 PR을 등록한다.
6. 리뷰 의견을 반영하고 지정 담당자가 merge한다.
7. 로컬 `main`을 갱신해 반영된 내용을 확인한다.

**이해 확인**

- commit만 한 변경을 동료가 GitHub에서 볼 수 있는가? **아직 볼 수 없다. push가 필요하다.**
- 작업 브랜치를 push하면 main도 바뀌는가? **아니다. 대상 브랜치로의 merge가 필요하다.**
- PR 리뷰와 merge는 소유자만 가능한가? **아니다. 권한과 저장소 규칙에 따라 다르다.**

> 발표자 메모: 완료 조건은 PR 생성과 merge 확인, 로컬 갱신까지다. 이 단계표는 앞서 설명한 개념을 적용한 교육용 실습안이다.

---

## 강사용 부록: 최초 제안에서 바로잡은 표현

아래 표는 본문과 발표자 메모의 정정 내용을 한곳에 모은 편집 참고자료다.

| 최초 제안 | 판정 | 교육용 표현과 반영 위치 |
| --- | --- | --- |
| GitHub는 Git의 hub, Git은 버전관리 시스템 | 대체로 맞음 | 입문 비유로 유지하되 Git과 GitHub의 역할을 구분한다. 02장 |
| Claude나 ChatGPT로 모든 Git·GitHub 기능 이용 가능 | 범위 제한 필요 | 도구 연결과 권한이 갖춰진 환경에서 주요 작업을 자연어로 수행한다. 15~16장 |
| 프로젝트의 단위는 repo | 입문 설명으로 적절 | repo는 기본 저장·협업 단위이며 프로젝트와 항상 일대일은 아니다. 03장 |
| Repo에는 주인과 collaborator가 있다 | 보충 필요 | 소유자는 개인 또는 조직이다. 협업자와 팀은 부여받은 권한으로 참여한다. 04장 |
| 모든 참여자가 Issue·PR 등록 가능 | 조건부 | 접근 권한, 기능 활성화, 참여 제한과 출발 브랜치 권한 등의 조건을 확인한다. 05·10장 |
| PR review 및 merge는 주인만 가능 | 틀림 | 리뷰 참여와 merge 권한을 구분한다. 소유자만 최종 merge하는 것은 팀 운영 규칙이다. 11~12장 |
| 모든 작업은 로컬에서 이루어지고 결과를 GitHub에 올림 | 일반적 흐름이나 예외 있음 | 로컬 작업을 기본으로 설명하되 웹·클라우드 작업도 가능하다. 중간 이력도 공유한다. 06장 |
| 한 작업 단위가 commit | 개념 정밀화 필요 | commit은 변경을 이력에 기록하는 단위다. 하나의 작업에 여러 commit이 있을 수 있다. 08장 |
| 로컬 commit을 GitHub에 올리는 것이 push | 맞음 | 더 일반적으로 원격 저장소에 commit을 전송하고 브랜치를 갱신한다. 09장 |
| main 대신 subbranch에 push하는 게 보통 | 취지 맞음 | 작업 브랜치에 push하고 PR로 main에 반영하는 협업 방식으로 설명한다. 07·09장 |

추가한 내용: clone·fetch·pull, staging, Issue와 PR의 차이, 리뷰와 승인·merge의 차이, 브랜치 보호, 충돌 해결, 자연어 요청 예시와 첫 기여 실습.
